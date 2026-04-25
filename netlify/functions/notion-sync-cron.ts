import { schedule } from '@netlify/functions'

/**
 * Scheduled trigger (every 15 min) that invokes the background sync function.
 * This indirection is needed because scheduled functions have a short timeout
 * (10-26s), while the actual sync can take several minutes — the background
 * function gets up to 15 min.
 */
export const handler = schedule('*/15 * * * *', async () => {
  const url = `${process.env.URL || 'https://www.clempo.fr'}/.netlify/functions/notion-sync-background`
  const pw = process.env.ADMIN_PASSWORD || 'Ch4!pitron'
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${pw}` },
    })
    console.log(`notion-sync-cron triggered background: ${res.status}`)
  } catch (err) {
    console.error('notion-sync-cron failed to trigger background:', err)
  }
  return { statusCode: 200 }
})
