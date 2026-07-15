import type { Handler } from '@netlify/functions'
import { getAnalyticsStore } from './_analytics'
import { screenRequest, clientIp, underRateLimit, recordBlocked } from './_bot-filter'

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  try {
    const body = JSON.parse(event.body || '{}') as {
      date?: string
      path?: string
      src?: string | null
      ref?: string | null
    }
    const key = /^\d{4}-\d{2}-\d{2}$/.test(body.date || '')
      ? (body.date as string)
      : new Date().toISOString().slice(0, 10)

    // Screen before any blob I/O — see _bot-filter.ts. A rejected request must
    // never reach the `analytics` blob, which also holds the lead events.
    const headers = event.headers as Record<string, string | undefined>
    const verdict = screenRequest(headers)
    if (!verdict.ok) {
      await recordBlocked(key, verdict.reason, headers['user-agent'] || '')
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, counted: false, reason: verdict.reason }),
      }
    }

    if (!(await underRateLimit(clientIp(headers), key))) {
      await recordBlocked(key, 'rate-limit', headers['user-agent'] || '')
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, counted: false, reason: 'rate-limit' }),
      }
    }

    // Sanitize optional fields. Keep the function backward-compatible with old
    // clients that only send { date }.
    const path =
      typeof body.path === 'string' && body.path.startsWith('/')
        ? body.path.slice(0, 128)
        : null
    const src =
      typeof body.src === 'string' && body.src.length > 0
        ? body.src.slice(0, 64)
        : null
    const ref =
      typeof body.ref === 'string' && body.ref.length > 0
        ? body.ref.slice(0, 64)
        : null

    const store = getAnalyticsStore()
    const existing = (await store.get('data', { type: 'json' })) as
      | {
          events: unknown[]
          visits: Record<string, number>
          visits_by_path?: Record<string, Record<string, number>>
          visits_by_src?: Record<string, Record<string, number>>
          visits_by_ref?: Record<string, Record<string, number>>
        }
      | null
    const data = existing || { events: [], visits: {} }
    data.visits[key] = (data.visits[key] || 0) + 1

    if (path) {
      data.visits_by_path = data.visits_by_path || {}
      data.visits_by_path[key] = data.visits_by_path[key] || {}
      data.visits_by_path[key][path] = (data.visits_by_path[key][path] || 0) + 1
    }
    if (src) {
      data.visits_by_src = data.visits_by_src || {}
      data.visits_by_src[key] = data.visits_by_src[key] || {}
      data.visits_by_src[key][src] = (data.visits_by_src[key][src] || 0) + 1
    }
    if (ref) {
      data.visits_by_ref = data.visits_by_ref || {}
      data.visits_by_ref[key] = data.visits_by_ref[key] || {}
      data.visits_by_ref[key][ref] = (data.visits_by_ref[key][ref] || 0) + 1
    }

    await store.setJSON('data', data)

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, date: key, count: data.visits[key], path, src, ref }),
    }
  } catch (err) {
    console.error('track-visit error:', err)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: String(err), stack: (err as Error)?.stack }),
    }
  }
}

export { handler }
