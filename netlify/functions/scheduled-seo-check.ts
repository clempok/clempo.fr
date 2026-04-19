import type { Config } from '@netlify/functions'
import { runSeoCheck } from './_seo-check'

/**
 * Automatic weekly SEO scan. Runs every Monday at 06:00 UTC (08:00 Paris).
 * No auth: Netlify only invokes scheduled functions from their own
 * infrastructure, not from public HTTP traffic.
 *
 * Schedule syntax: standard cron (minute hour day-of-month month day-of-week).
 * Change the cadence here if weekly feels wrong.
 *
 * Manual trigger still available via the "Vérifier positions" button in Admin,
 * which hits check-seo-rankings.
 */
export default async () => {
  const start = Date.now()
  try {
    const result = await runSeoCheck()
    console.log(
      `[scheduled-seo-check] ok · checked=${result.checked} · top3=${result.summary?.inTop3 ?? 0} · top10=${result.summary?.inTop10 ?? 0} · ${Date.now() - start}ms`
    )
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[scheduled-seo-check] error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const config: Config = {
  schedule: '0 6 * * 1', // Every Monday at 06:00 UTC (08:00 Paris)
}
