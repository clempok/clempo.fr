import type { Config } from '@netlify/functions'
import { readCrm, writeCrm, detectLanguage } from './_crm'
import { buildNpsEmailHtml, npsRespondUrl, signNpsToken } from './_nps'

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
  const ownerEmail = 'clement.pougetosmont@gmail.com'

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

          const language = contact.language || detectLanguage({
            email: contact.email,
            firstName: contact.firstName,
          })
          const token = signNpsToken({
            contactEmail: contact.email.toLowerCase(),
            responseId: np.id,
          })
          const { subject, html } = buildNpsEmailHtml({
            firstName: contact.firstName || '',
            language,
            resourceLabel: np.resourceLabel,
            scoreUrlFor: (score) => npsRespondUrl(token, score),
            isDryRun,
            realRecipient: contact.email,
          })

          const recipient = isDryRun ? ownerEmail : contact.email
          try {
            const res = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: 'Clément Pouget-Osmont <noreply@clempo.fr>',
                to: [recipient],
                reply_to: ownerEmail,
                subject: isDryRun ? `[TEST] ${subject}` : subject,
                html,
              }),
            })
            if (!res.ok) {
              const errText = await res.text()
              console.error('[scheduled-nps-ask] Resend error:', errText)
              errors += 1
              continue
            }
            np.askedAt = new Date().toISOString()
            np.askedToken = token
            contact.updatedAt = np.askedAt
            co.updatedAt = np.askedAt
            dirty = true
            sent += 1
          } catch (err) {
            console.error('[scheduled-nps-ask] send error:', err)
            errors += 1
          }
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
