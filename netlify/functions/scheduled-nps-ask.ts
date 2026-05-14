import type { Config } from '@netlify/functions'
import { readCrm, writeCrm } from './_crm'
import { sendNpsEmailFor } from './_nps'

const ONE_DAY_MS = 24 * 60 * 60 * 1000
const TTL_DAYS = 7

/**
 * Daily NPS solicitation cron. Scans every contact's npsResponses, picks
 * entries that are 24h–7d old and not yet asked, and sends one email per
 * entry via Resend. Sets askedAt + askedToken on success.
 *
 * DRY-RUN: when NPS_DRY_RUN=1, all emails are routed to the owner with a
 * banner showing the real recipient — used to validate copy before going live.
 */
export default async () => {
  const start = Date.now()
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[scheduled-nps-ask] RESEND_API_KEY not set')
    return new Response('Missing RESEND_API_KEY', { status: 500 })
  }
  if (!process.env.NPS_SIGNING_SECRET) {
    console.error('[scheduled-nps-ask] NPS_SIGNING_SECRET not set')
    return new Response('Missing NPS_SIGNING_SECRET', { status: 500 })
  }

  const isDryRun = process.env.NPS_DRY_RUN === '1'

  let sent = 0
  let skipped = 0
  let errors = 0
  let dirty = false

  try {
    const data = await readCrm()
    const now = Date.now()

    for (const co of data.companies) {
      for (const contact of co.contacts) {
        if (!contact.npsResponses || contact.npsResponses.length === 0) continue
        for (const np of contact.npsResponses) {
          if (np.askedAt) continue
          const downloadedAt = Date.parse(np.downloadedAt)
          if (Number.isNaN(downloadedAt)) { skipped += 1; continue }
          const ageMs = now - downloadedAt
          if (ageMs < ONE_DAY_MS) { skipped += 1; continue }
          if (ageMs > TTL_DAYS * ONE_DAY_MS) { skipped += 1; continue }
          if (!contact.email) { skipped += 1; continue }

          const result = await sendNpsEmailFor(contact, np, { apiKey, isDryRun })
          if (!result.ok) {
            console.error('[scheduled-nps-ask] send error:', result.error)
            errors += 1
            continue
          }
          contact.updatedAt = np.askedAt!
          co.updatedAt = np.askedAt!
          dirty = true
          sent += 1
        }
      }
    }

    if (dirty) await writeCrm(data)

    console.log(
      `[scheduled-nps-ask] ok · sent=${sent} skipped=${skipped} errors=${errors} dryRun=${isDryRun} · ${Date.now() - start}ms`
    )
    return new Response(JSON.stringify({ sent, skipped, errors, dryRun: isDryRun }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[scheduled-nps-ask] fatal:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const config: Config = {
  schedule: '0 10 * * *', // every day at 10:00 UTC (≈12:00 Paris in summer)
}
