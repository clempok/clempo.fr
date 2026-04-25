import type { Handler } from '@netlify/functions'
import { checkAuth } from './_analytics'
import { runSync } from './_notion-sync'

/**
 * Synchronous Notion sync trigger. Bounded by 8s budget so it returns
 * within the Netlify free-tier function timeout. Idempotent — call
 * repeatedly to drain the backlog of unsynced records.
 *
 * Auth: Bearer ADMIN_PASSWORD.
 */
export const handler: Handler = async (event) => {
  if (!checkAuth(event.headers as Record<string, string | undefined>)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }
  const result = await runSync({ budgetMs: 8000 })
  return {
    statusCode: result.error ? 500 : 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result),
  }
}
