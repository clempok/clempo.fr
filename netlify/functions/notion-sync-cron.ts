import { schedule } from '@netlify/functions'

/**
 * Scheduled trigger (every 15 min) that invokes the background sync function.
 * This indirection is needed because scheduled functions have a short timeout
 * (10-26s), while the actual sync can take several minutes — the background
 * function gets up to 15 min.
 */
export const handler = schedule('*/15 * * * *', async () => {
  const base = process.env.URL || 'https://www.clempo.fr'
  const pw = process.env.ADMIN_PASSWORD || 'Ch4!pitron'
  // Drain the backlog by hitting notion-sync-now twice (each call does ~8s of
  // work). On a stable CRM there's nothing to push and both calls are fast.
  // On free tier we can't run for >10s, so chaining is the workaround.
  for (let i = 0; i < 2; i++) {
    try {
      const res = await fetch(`${base}/.netlify/functions/notion-sync-now`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${pw}` },
      })
      const body = await res.text()
      console.log(`notion-sync-cron iter ${i + 1}: HTTP ${res.status} ${body.slice(0, 200)}`)
    } catch (err) {
      console.error(`notion-sync-cron iter ${i + 1} failed:`, err)
    }
  }
  return { statusCode: 200 }
})
