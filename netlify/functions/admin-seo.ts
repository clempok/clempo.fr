import type { Handler } from '@netlify/functions'
import { checkAuth } from './_analytics'
import { readSeo, writeSeo, type KeywordRanking, type RankingEntry, type SeoData } from './_seo'

const handler: Handler = async (event) => {
  if (!checkAuth(event.headers as Record<string, string | undefined>)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  try {
    if (event.httpMethod === 'GET') {
      const data = await readSeo()
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}')
      const { action } = body
      const data = await readSeo()

      if (action === 'add-keyword') {
        const { keyword, targetPage, volume } = body as {
          keyword: string; targetPage: string; volume?: number
        }
        if (!keyword?.trim()) {
          return { statusCode: 400, body: JSON.stringify({ error: 'Keyword required' }) }
        }
        if (data.keywords.some(k => k.keyword.toLowerCase() === keyword.trim().toLowerCase())) {
          return { statusCode: 409, body: JSON.stringify({ error: 'Keyword already tracked' }) }
        }
        const entry: KeywordRanking = {
          keyword: keyword.trim(),
          targetPage: targetPage?.trim() || '/',
          volume: volume || 0,
          history: [],
        }
        data.keywords.push(entry)
        await writeSeo(data)
        return { statusCode: 200, body: JSON.stringify({ ok: true, keyword: entry }) }
      }

      if (action === 'remove-keyword') {
        const { keyword } = body as { keyword: string }
        const before = data.keywords.length
        data.keywords = data.keywords.filter(k => k.keyword.toLowerCase() !== keyword.toLowerCase())
        if (data.keywords.length === before) {
          return { statusCode: 404, body: JSON.stringify({ error: 'Keyword not found' }) }
        }
        await writeSeo(data)
        return { statusCode: 200, body: JSON.stringify({ ok: true }) }
      }

      if (action === 'update-keyword') {
        const { keyword, targetPage, volume } = body as {
          keyword: string; targetPage?: string; volume?: number
        }
        const kw = data.keywords.find(k => k.keyword.toLowerCase() === keyword.toLowerCase())
        if (!kw) {
          return { statusCode: 404, body: JSON.stringify({ error: 'Keyword not found' }) }
        }
        if (targetPage !== undefined) kw.targetPage = targetPage
        if (volume !== undefined) kw.volume = volume
        await writeSeo(data)
        return { statusCode: 200, body: JSON.stringify({ ok: true, keyword: kw }) }
      }

      if (action === 'record-rankings') {
        const { rankings, date } = body as {
          rankings: { keyword: string; position: number | null; url?: string }[]
          date?: string
        }
        const d = date || new Date().toISOString().slice(0, 10)
        for (const r of rankings) {
          const kw = data.keywords.find(k => k.keyword.toLowerCase() === r.keyword.toLowerCase())
          if (!kw) continue
          // Remove existing entry for same date
          kw.history = kw.history.filter(h => h.date !== d)
          const entry: RankingEntry = { date: d, position: r.position }
          if (r.url) entry.url = r.url
          kw.history.push(entry)
          // Keep last 52 entries (1 year of weekly data)
          if (kw.history.length > 52) {
            kw.history = kw.history.slice(-52)
          }
        }
        data.lastChecked = new Date().toISOString()
        await writeSeo(data)
        return { statusCode: 200, body: JSON.stringify({ ok: true, lastChecked: data.lastChecked }) }
      }

      if (action === 'bulk-init') {
        const { keywords } = body as {
          keywords: { keyword: string; targetPage: string; volume: number }[]
        }
        const added: string[] = []
        for (const k of keywords) {
          if (data.keywords.some(existing => existing.keyword.toLowerCase() === k.keyword.toLowerCase())) {
            continue
          }
          data.keywords.push({
            keyword: k.keyword,
            targetPage: k.targetPage,
            volume: k.volume,
            history: [],
          })
          added.push(k.keyword)
        }
        await writeSeo(data)
        return { statusCode: 200, body: JSON.stringify({ ok: true, added }) }
      }

      return { statusCode: 400, body: JSON.stringify({ error: 'Unknown action' }) }
    }

    return { statusCode: 405, body: 'Method not allowed' }
  } catch (err) {
    console.error('admin-seo error:', err)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: String(err), stack: (err as Error)?.stack }),
    }
  }
}

export { handler }
