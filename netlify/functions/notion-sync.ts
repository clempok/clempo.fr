import type { Handler } from '@netlify/functions'
import { checkAuth } from './_analytics'
import { runSync } from './_notion-sync'

/**
 * Manual trigger for the Notion ↔ CRM sync.
 * Auth: same Bearer token as admin endpoints (ADMIN_PASSWORD).
 * The scheduled (cron) counterpart lives in notion-sync-cron.ts.
 */
export const handler: Handler = async (event) => {
  if (!checkAuth(event.headers as Record<string, string | undefined>)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }
  const result = await runSync()
  const statusCode = result.error ? 500 : 200
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result),
  }
}
