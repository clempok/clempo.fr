import type { Config } from '@netlify/functions'
import { readCrm, writeCrm } from './_crm'
import type { ContactLanguage, CrmStatus } from './_crm'
import {
  buildEmailHtml,
  buildResourcesHtml,
  buildVideoHtml,
  readEmailTemplates,
  renderTemplate,
  sendNurtureEmail,
  unsubscribeUrl,
} from './_email-templates'

const ONE_DAY_MS = 24 * 60 * 60 * 1000
const SITE_URL = 'https://www.clempo.fr'

/** Send windows: a step fires once the contact's first download is old enough,
 *  and is abandoned past the TTL (no point nurturing a month-old download as
 *  if it were fresh). Windows overlap deliberately so a backlog drains. */
const STEP3_MIN_DAYS = 3
const STEP3_MAX_DAYS = 10
const STEP7_MIN_DAYS = 7
const STEP7_MAX_DAYS = 14

/** Shares the Resend free-tier quota (100/day) with the NPS cron (capped at
 *  80) and transactional sends. Keep the combined ceiling well under 100. */
const MAX_SENDS_PER_RUN = 30

/** Companies already engaged (or dead) are excluded: someone in Opportunité
 *  or Client doesn't need a "here is what I offer" email, and Lost means stop. */
const SKIPPED_STATUSES: CrmStatus[] = ['Opportunité', 'Client', 'Lost']

/**
 * Daily nurture cron — the J+3 / J+7 follow-up sequence after a download.
 * (J+1 NPS is handled by scheduled-nps-ask.) Reads editable templates from
 * the email-templates blob (admin "Emails" tab), keyed on each contact's
 * FIRST download:
 *
 *   J+3  → the other available resources, excluding those already downloaded
 *   J+7  → what Clément offers (Advisory / Part-Time CMO / transition)
 *
 * SAFETY: runs in DRY-RUN (all emails to owner, once per contact/step) unless
 * NURTURE_LIVE=1 is set. The live cron re-sends entries previously marked as
 * dry-run, so a rehearsal never makes a contact miss the real sequence.
 */
export default async () => {
  const start = Date.now()
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[scheduled-nurture] RESEND_API_KEY not set')
    return new Response('Missing RESEND_API_KEY', { status: 500 })
  }
  if (!process.env.NPS_SIGNING_SECRET) {
    console.error('[scheduled-nurture] NPS_SIGNING_SECRET not set (needed for unsubscribe tokens)')
    return new Response('Missing NPS_SIGNING_SECRET', { status: 500 })
  }

  const isDryRun = process.env.NURTURE_LIVE !== '1'

  let sent = 0
  let skipped = 0
  let errors = 0
  let dirty = false

  try {
    const [data, templates] = await Promise.all([readCrm(), readEmailTemplates()])
    const now = Date.now()
    const nowIso = new Date().toISOString()

    outer: for (const co of data.companies) {
      if (SKIPPED_STATUSES.includes(co.status)) continue

      for (const contact of co.contacts) {
        if (!contact.email || contact.emailOptOut) continue
        const downloads = contact.npsResponses || []
        if (downloads.length === 0) continue

        const firstDownload = downloads
          .map(r => Date.parse(r.downloadedAt))
          .filter(t => !Number.isNaN(t))
          .sort((a, b) => a - b)[0]
        if (firstDownload === undefined) { skipped += 1; continue }
        const ageDays = (now - firstDownload) / ONE_DAY_MS

        const language: ContactLanguage = contact.language === 'EN' ? 'EN' : 'FR'
        const firstEntry = downloads.find(r => Date.parse(r.downloadedAt) === firstDownload)
        const resourceLabel = firstEntry?.resourceLabel || firstEntry?.resource || ''
        const downloadedSlugs = downloads.map(r => r.resource)

        type Step = {
          key: 'nurture-j3' | 'nurture-j7'
          state: 'step3' | 'step7'
          inWindow: boolean
        }
        const steps: Step[] = [
          { key: 'nurture-j3', state: 'step3', inWindow: ageDays >= STEP3_MIN_DAYS && ageDays <= STEP3_MAX_DAYS },
          { key: 'nurture-j7', state: 'step7', inWindow: ageDays >= STEP7_MIN_DAYS && ageDays <= STEP7_MAX_DAYS },
        ]

        let sentThisRunForContact = false
        for (const step of steps) {
          if (!step.inWindow) continue
          // Max one nurture email per contact per day — if J+3 and J+7 are
          // both due (late entry into the window), space them out.
          if (sentThisRunForContact) continue

          const nurture = contact.nurture || {}
          const sentAt = step.state === 'step3' ? nurture.step3SentAt : nurture.step7SentAt
          const wasDryRun = step.state === 'step3' ? nurture.step3DryRun : nurture.step7DryRun
          // Already handled — unless it was only ever a dry-run and we are
          // live now: then the contact still deserves the real email.
          if (sentAt && !(wasDryRun && !isDryRun)) continue

          if (sent >= MAX_SENDS_PER_RUN) break outer

          const vars: Record<string, string> = {
            firstName: contact.firstName || '',
            hello: language === 'EN'
              ? (contact.firstName ? `Hi ${contact.firstName},` : 'Hi,')
              : (contact.firstName ? `Bonjour ${contact.firstName},` : 'Bonjour,'),
            resourceLabel,
            bookingUrl: `${SITE_URL}/booking?src=nurture-j7`,
            siteUrl: SITE_URL,
            videoHtml: buildVideoHtml(language),
          }

          if (step.key === 'nurture-j3') {
            const resourcesHtml = buildResourcesHtml(downloadedSlugs, language)
            // Nothing new to offer (they took everything): skip J+3, J+7
            // will still fire.
            if (!resourcesHtml) { skipped += 1; continue }
            vars.resourcesHtml = resourcesHtml
          }

          const tpl = templates[step.key][language]
          const subject = renderTemplate(tpl.subject, vars)
          const unsubUrl = unsubscribeUrl(contact.email)
          const html = buildEmailHtml({
            bodyHtml: renderTemplate(tpl.body, vars),
            subject,
            language,
            unsubUrl,
            isDryRun,
            realRecipient: contact.email,
          })

          const result = await sendNurtureEmail({ apiKey, to: contact.email, subject, html, unsubUrl, isDryRun })
          if (!result.ok) {
            console.error(`[scheduled-nurture] send error (${contact.email}, ${step.key}):`, result.error)
            errors += 1
            continue
          }

          contact.nurture = {
            ...nurture,
            ...(step.state === 'step3'
              ? { step3SentAt: nowIso, step3DryRun: isDryRun }
              : { step7SentAt: nowIso, step7DryRun: isDryRun }),
          }
          contact.updatedAt = nowIso
          co.updatedAt = nowIso
          dirty = true
          sent += 1
          sentThisRunForContact = true
        }
      }
    }

    if (dirty) await writeCrm(data)

    console.log(
      `[scheduled-nurture] ok · sent=${sent} skipped=${skipped} errors=${errors} dryRun=${isDryRun} · ${Date.now() - start}ms`
    )
    return new Response(JSON.stringify({ sent, skipped, errors, dryRun: isDryRun }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[scheduled-nurture] fatal:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const config: Config = {
  schedule: '30 9 * * *', // every day at 09:30 UTC — before the 10:00 NPS cron so caps compose predictably
}
