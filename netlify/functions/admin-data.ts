import type { Handler } from '@netlify/functions'
import { checkAuth, getAnalyticsStore } from './_analytics'

const handler: Handler = async (event) => {
  if (!checkAuth(event.headers as Record<string, string | undefined>)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  const debug = event.queryStringParameters?.debug === '1'
  const testWrite = event.queryStringParameters?.testwrite === '1'

  // Attempt a direct read (let errors surface so we can see them)
  let store: ReturnType<typeof getAnalyticsStore> | null = null
  const diag: Record<string, unknown> = {
    hasToken: !!(process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_API_TOKEN),
    hasSiteEnv: !!(process.env.SITE_ID || process.env.NETLIFY_SITE_ID),
  }

  try {
    store = getAnalyticsStore()
    diag.storeCreated = true
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'getStore failed',
        message: String(err),
        stack: (err as Error)?.stack,
      }),
    }
  }

  // Optional test write
  if (testWrite) {
    try {
      const existing = (await store.get('data', { type: 'json' })) as
        | { events: unknown[]; visits: Record<string, number> }
        | null
      const data = existing || { events: [], visits: {} }
      const today = new Date().toISOString().slice(0, 10)
      data.visits[today] = (data.visits[today] || 0) + 1
      await store.setJSON('data', data)
      diag.testWriteOk = true
      diag.testWriteDate = today
    } catch (err) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'testWrite failed',
          message: String(err),
          stack: (err as Error)?.stack,
        }),
      }
    }
  }

  // Read
  try {
    const raw = await store.get('data', { type: 'json' })
    const data = (raw as { events?: unknown[]; visits?: Record<string, number> } | null) || {}
    const events = Array.isArray(data.events) ? (data.events as { ts?: string }[]) : []
    const visits = data.visits || {}
    const sorted = [...events].sort((a, b) => ((a.ts || '') < (b.ts || '') ? 1 : -1))
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        events: sorted,
        visits,
        ...(debug || testWrite ? { diag } : {}),
      }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'read failed',
        message: String(err),
        stack: (err as Error)?.stack,
      }),
    }
  }
}

export { handler }
