import type { Handler } from '@netlify/functions'
import { getAnalyticsStore } from './_analytics'

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  try {
    const { date } = JSON.parse(event.body || '{}')
    const key = /^\d{4}-\d{2}-\d{2}$/.test(date || '')
      ? date
      : new Date().toISOString().slice(0, 10)

    const store = getAnalyticsStore()
    const existing = (await store.get('data', { type: 'json' })) as
      | { events: unknown[]; visits: Record<string, number> }
      | null
    const data = existing || { events: [], visits: {} }
    data.visits[key] = (data.visits[key] || 0) + 1
    await store.setJSON('data', data)

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, date: key, count: data.visits[key] }),
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
