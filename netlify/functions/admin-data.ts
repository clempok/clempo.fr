import type { Handler } from '@netlify/functions'
import { readData, checkAuth } from './_analytics'

const handler: Handler = async (event) => {
  if (!checkAuth(event.headers as Record<string, string | undefined>)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  try {
    const data = await readData()
    // Sort events by most recent first
    const events = [...data.events].sort((a, b) => (a.ts < b.ts ? 1 : -1))
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events, visits: data.visits }),
    }
  } catch (err) {
    console.error('admin-data error:', err)
    return { statusCode: 500, body: String(err) }
  }
}

export { handler }
