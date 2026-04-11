import type { Handler } from '@netlify/functions'
import { recordVisit } from './_analytics'

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  try {
    const { date } = JSON.parse(event.body || '{}')
    const key = /^\d{4}-\d{2}-\d{2}$/.test(date || '')
      ? date
      : new Date().toISOString().slice(0, 10)
    await recordVisit(key)
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: true }),
    }
  } catch (err) {
    console.error('track-visit error:', err)
    return { statusCode: 500, body: String(err) }
  }
}

export { handler }
