import type { Handler } from '@netlify/functions'
import { createSign } from 'crypto'
import { checkAuth } from './_analytics'
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

async function queryKeywordPosition(
  accessToken: string,
  keyword: string,
  startDate: string,
  endDate: string
): Promise<{ position: number | null; clicks: number; impressions: number }> {
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`

  const body = {
    startDate,
    endDate,
    dimensions: ['query'],
    dimensionFilterGroups: [{
      filters: [{
        dimension: 'query',
        operator: 'equals',
        expression: keyword,
      }],
    }],
    rowLimit: 1,
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errBody = await res.text()
    console.error(`GSC query failed for "${keyword}": ${res.status} ${errBody}`)
    return { position: null, clicks: 0, impressions: 0 }
  }

  const data = await res.json() as {
    rows?: { keys: string[]; position: number; clicks: number; impressions: number }[]
  }

  if (!data.rows || data.rows.length === 0) {
    return { position: null, clicks: 0, impressions: 0 }
  }

  const row = data.rows[0]
  return {
    position: Math.round(row.position),
    clicks: row.clicks,
    impressions: row.impressions,
  }
}

const handler: Handler = async (event) => {
  if (!checkAuth(event.headers as Record<string, string | undefined>)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  try {
    const seoData = await readSeo()
    if (seoData.keywords.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ ok: true, checked: 0, message: 'No keywords to check' }) }
    }

    const accessToken = await getAccessToken()

    // Use last 7 days for position data
    const endDate = new Date()
    endDate.setDate(endDate.getDate() - 3) // GSC has ~3 day lag
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - 6)

    const dateStr = endDate.toISOString().slice(0, 10)
    const startStr = startDate.toISOString().slice(0, 10)
    const endStr = endDate.toISOString().slice(0, 10)

    const results: { keyword: string; position: number | null; clicks: number; impressions: number }[] = []

    for (const kw of seoData.keywords) {
      const result = await queryKeywordPosition(accessToken, kw.keyword, startStr, endStr)
      results.push({ keyword: kw.keyword, ...result })

      // Remove existing entry for this date and add new one
      kw.history = kw.history.filter(h => h.date !== dateStr)
      kw.history.push({
        date: dateStr,
        position: result.position,
      })
      // Keep last 52 weeks
      if (kw.history.length > 52) {
        kw.history = kw.history.slice(-52)
      }
    }

    seoData.lastChecked = new Date().toISOString()
    await writeSeo(seoData)

    const inTop10 = results.filter(r => r.position !== null && r.position <= 10).length
    const inTop3 = results.filter(r => r.position !== null && r.position <= 3).length

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: true,
        checked: results.length,
        lastChecked: seoData.lastChecked,
        summary: { inTop3, inTop10, total: results.length },
        results,
      }),
    }
  } catch (err) {
    console.error('check-seo-rankings error:', err)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: String(err), stack: (err as Error)?.stack }),
    }
  }
}

export { handler }
