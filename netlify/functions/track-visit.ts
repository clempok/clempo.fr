import type { Handler } from '@netlify/functions'
import { getAnalyticsStore } from './_analytics'

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  try {
    const body = JSON.parse(event.body || '{}') as {
      date?: string
      path?: string
      src?: string | null
    }
    const key = /^\d{4}-\d{2}-\d{2}$/.test(body.date || '')
      ? (body.date as string)
      : new Date().toISOString().slice(0, 10)

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

    const store = getAnalyticsStore()
    const existing = (await store.get('data', { type: 'json' })) as
      | {
          events: unknown[]
          visits: Record<string, number>
          visits_by_path?: Record<string, Record<string, number>>
          visits_by_src?: Record<string, Record<string, number>>
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

    await store.setJSON('data', data)

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, date: key, count: data.visits[key], path, src }),
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
