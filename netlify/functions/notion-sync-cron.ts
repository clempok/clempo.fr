import { schedule } from '@netlify/functions'
import { runSync } from './_notion-sync'

/**
 * Scheduled (every 15 min) Notion ↔ CRM sync.
 * Not accessible via HTTP. For manual trigger use /notion-sync (HTTP with Bearer auth).
 */
export const handler = schedule('*/15 * * * *', async () => {
  const result = await runSync()
  if (result.error) {
    console.error('notion-sync-cron result:', result)
  } else {
    console.log('notion-sync-cron result:', result)
  }
  return { statusCode: 200 }
})
