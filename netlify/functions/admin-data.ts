import type { Handler } from '@netlify/functions'
import { checkAuth, getAnalyticsStore } from './_analytics'

const handler: Handler = async (event) => {
  if (!checkAuth(event.headers as Record<string, string | undefined>)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  const debug = event.queryStringParameters?.debug === '1'
  const testWrite = event.queryStringParameters?.testwrite === '1'
  const isWrite = event.httpMethod === 'POST' || event.httpMethod === 'PUT'

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

  // Write path: POST/PUT { action: 'set_linkedin_impressions', dateKey, value }
  // Used by the morning linkedin-sync skill to push the rolling 7-day impressions.
  if (isWrite) {
    try {
      const body = event.body ? JSON.parse(event.body) : {}
      const action = body.action

      if (action === 'set_linkedin_impressions') {
        const dateKey = typeof body.dateKey === 'string' ? body.dateKey : ''
        const value = Number(body.value)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || !Number.isFinite(value) || value < 0) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Invalid payload. Expect { action, dateKey: YYYY-MM-DD, value: number>=0 }' }),
          }
        }
        const existing = ((await store.get('data', { type: 'json' })) as {
          events?: unknown[]
          visits?: Record<string, number>
          visits_by_path?: Record<string, Record<string, number>>
          visits_by_src?: Record<string, Record<string, number>>
          visits_by_ref?: Record<string, Record<string, number>>
          linkedin_impressions?: Record<string, number>
        } | null) || {}
        const linkedin_impressions = existing.linkedin_impressions || {}
        linkedin_impressions[dateKey] = Math.round(value)
        await store.setJSON('data', { ...existing, linkedin_impressions })
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ok: true, dateKey, value: Math.round(value) }),
        }
      }

      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `Unknown action: ${String(action)}` }),
      }
    } catch (err) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'write failed', message: String(err) }),
      }
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
    const data = (raw as {
      events?: unknown[]
      visits?: Record<string, number>
      visits_by_path?: Record<string, Record<string, number>>
      visits_by_src?: Record<string, Record<string, number>>
      visits_by_ref?: Record<string, Record<string, number>>
      linkedin_impressions?: Record<string, number>
    } | null) || {}
    const events = Array.isArray(data.events) ? (data.events as { ts?: string }[]) : []
    const visits = data.visits || {}
    const visits_by_path = data.visits_by_path || {}
    const visits_by_src = data.visits_by_src || {}
    const visits_by_ref = data.visits_by_ref || {}
    const linkedin_impressions = data.linkedin_impressions || {}
    const sorted = [...events].sort((a, b) => ((a.ts || '') < (b.ts || '') ? 1 : -1))
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        events: sorted,
        visits,
        visits_by_path,
        visits_by_src,
        visits_by_ref,
        linkedin_impressions,
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
