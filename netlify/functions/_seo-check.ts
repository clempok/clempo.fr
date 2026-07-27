/**
 * Shared SEO scan logic.
 *
 * Extracted so both the manual HTTP trigger (check-seo-rankings) and the
 * Netlify scheduled function (scheduled-seo-check) call the exact same code
 * path. Do not duplicate Google Search Console logic anywhere else.
 */

import { createSign } from 'crypto'
import { readSeo, writeSeo } from './_seo'

const SITE_URL = 'sc-domain:clempo.fr'

function base64url(input: string | Buffer): string {
  const b64 = Buffer.isBuffer(input)
    ? input.toString('base64')
    : Buffer.from(input).toString('base64')
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function getAccessToken(): Promise<string> {
  const clientEmail = process.env.GSC_CLIENT_EMAIL
  const privateKey = (process.env.GSC_PRIVATE_KEY || '').replace(/\\n/g, '\n')

  if (!clientEmail || !privateKey) {
    throw new Error('GSC_CLIENT_EMAIL or GSC_PRIVATE_KEY not set')
  }

  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }

  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`
  const sign = createSign('RSA-SHA256')
  sign.update(signingInput)
  const signature = sign.sign(privateKey, 'base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  const jwt = `${signingInput}.${signature}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Token exchange failed: ${res.status} ${body}`)
  }

  const data = await res.json() as { access_token: string }
  return data.access_token
}

const ROW_LIMIT = 25000 // plafond GSC par requête
const MAX_PAGES = 5

type QueryRow = { position: number; clicks: number; impressions: number }

/**
 * Récupère TOUTES les requêtes de la fenêtre en un appel (paginé au besoin),
 * indexées en minuscules.
 *
 * Avant, on interrogeait GSC une fois par mot-clé suivi (filtre `equals`). À 14
 * mots-clés ça passait ; à 47 les appels séquentiels dépassaient le timeout de
 * 10 s des fonctions Netlify. Un scan complet renvoie de toute façon un
 * sur-ensemble : GSC ne sert que les requêtes non anonymisées, filtre ou pas.
 */
async function fetchAllQueries(
  accessToken: string,
  startDate: string,
  endDate: string
): Promise<Map<string, QueryRow>> {
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`
  const map = new Map<string, QueryRow>()

  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: ROW_LIMIT,
        startRow: page * ROW_LIMIT,
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      throw new Error(`GSC query failed: ${res.status} ${errBody}`)
    }

    const data = await res.json() as {
      rows?: { keys: string[]; position: number; clicks: number; impressions: number }[]
    }
    const rows = data.rows || []
    for (const row of rows) {
      map.set(row.keys[0].toLowerCase(), {
        position: row.position,
        clicks: row.clicks,
        impressions: row.impressions,
      })
    }
    if (rows.length < ROW_LIMIT) break
  }

  return map
}

export type ScanResult = {
  ok: boolean
  checked: number
  lastChecked: string | null
  summary?: { inTop3: number; inTop10: number; total: number }
  results?: { keyword: string; position: number | null; clicks: number; impressions: number }[]
  message?: string
}

export async function runSeoCheck(): Promise<ScanResult> {
  const seoData = await readSeo()
  if (seoData.keywords.length === 0) {
    return { ok: true, checked: 0, lastChecked: seoData.lastChecked, message: 'No keywords to check' }
  }

  const accessToken = await getAccessToken()

  // Fenêtre de 28 jours glissants, décalée de 3 jours (latence GSC).
  //
  // C'était 7 jours. Trop court depuis l'ajout des mots-clés logiciels métiers :
  // la longue traîne ("logiciel orthophoniste", "logiciel centre de santé") ne
  // génère que quelques impressions par semaine, donc GSC ne renvoyait aucune
  // ligne et le mot-clé tombait en "non classé" alors qu'il rankait. 28 jours,
  // c'est la fenêtre standard : assez de volume pour que la position moyenne
  // soit stable.
  const endDate = new Date()
  endDate.setDate(endDate.getDate() - 3)
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - 27)

  const dateStr = endDate.toISOString().slice(0, 10)
  const startStr = startDate.toISOString().slice(0, 10)
  const endStr = endDate.toISOString().slice(0, 10)

  const queries = await fetchAllQueries(accessToken, startStr, endStr)
  const results: ScanResult['results'] = []

  for (const kw of seoData.keywords) {
    const row = queries.get(kw.keyword.toLowerCase())
    const result = {
      position: row ? Math.round(row.position) : null,
      clicks: row?.clicks ?? 0,
      impressions: row?.impressions ?? 0,
    }
    results!.push({ keyword: kw.keyword, ...result })

    // Upsert today's entry
    kw.history = kw.history.filter(h => h.date !== dateStr)
    kw.history.push({
      date: dateStr,
      position: result.position,
      impressions: result.impressions,
      clicks: result.clicks,
    })
    if (kw.history.length > 52) {
      kw.history = kw.history.slice(-52)
    }
  }

  seoData.lastChecked = new Date().toISOString()
  await writeSeo(seoData)

  const inTop10 = results!.filter(r => r.position !== null && r.position <= 10).length
  const inTop3 = results!.filter(r => r.position !== null && r.position <= 3).length

  return {
    ok: true,
    checked: results!.length,
    lastChecked: seoData.lastChecked,
    summary: { inTop3, inTop10, total: results!.length },
    results,
  }
}
