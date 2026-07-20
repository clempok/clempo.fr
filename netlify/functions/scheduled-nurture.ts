import type { Config } from '@netlify/functions'
import { readCrm, writeCrm } from './_crm'
import type { ContactLanguage, CrmStatus } from './_crm'
import {
  buildEmailHtml,
  buildResourcesHtml,
  buildVideoHtml,
  readEmailTemplates,
  resourceAccessUrl,
  resourceLabelFor,
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

/** Shares the Resend free-tier quota (100/day) with the NPS cron and
 *  transactional sends — keep NURTURE_MAX_SENDS + NPS_MAX_SENDS well under
 *  100. Overridable via env (no redeploy of code needed, just env + deploy)
 *  to drain a download spike faster, e.g. NURTURE_MAX_SENDS=70. */
const MAX_SENDS_PER_RUN = envCap('NURTURE_MAX_SENDS', 30)

function envCap(name: string, fallback: number): number {
  const n = Number(process.env[name])
  return Number.isInteger(n) && n >= 1 && n <= 95 ? n : fallback
}

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

    // Email-level dedup guard. The per-contact nurture state lives on each
    // contact OBJECT, so a contact duplicated across records (same email) would
    // otherwise get each step once per copy. Seed from existing REAL sends, then
    // mark as we go, so no email receives the same step twice — across this run
    // or any prior one — regardless of how the blob is shaped.
    const sentByEmail = { step3: new Set<string>(), step7: new Set<string>() }
    for (const co of data.companies) {
      for (const c of co.contacts) {
        const e = c.email?.toLowerCase()
        if (!e) continue
        if (c.nurture?.step3SentAt && !c.nurture.step3DryRun) sentByEmail.step3.add(e)
        if (c.nurture?.step7SentAt && !c.nurture.step7DryRun) sentByEmail.step7.add(e)
      }
    }

    // ── Pass 1 : au plus UN email par contact, le premier palier dû ──
    type StepKey = 'nurture-j3' | 'nurture-j7'
    type Candidate = {
      co: typeof data.companies[number]
      contact: typeof data.companies[number]['contacts'][number]
      stepKey: StepKey
      state: 'step3' | 'step7'
      language: ContactLanguage
      vars: Record<string, string>
      firstDownload: number
    }
    const candidates: Candidate[] = []

    for (const co of data.companies) {
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

        const steps: { key: StepKey; state: 'step3' | 'step7'; inWindow: boolean }[] = [
          { key: 'nurture-j3', state: 'step3', inWindow: ageDays >= STEP3_MIN_DAYS && ageDays <= STEP3_MAX_DAYS },
          { key: 'nurture-j7', state: 'step7', inWindow: ageDays >= STEP7_MIN_DAYS && ageDays <= STEP7_MAX_DAYS },
        ]

        for (const step of steps) {
          if (!step.inWindow) continue

          const nurture = contact.nurture || {}
          const sentAt = step.state === 'step3' ? nurture.step3SentAt : nurture.step7SentAt
          const wasDryRun = step.state === 'step3' ? nurture.step3DryRun : nurture.step7DryRun
          // Already handled — unless it was only ever a dry-run and we are
          // live now: then the contact still deserves the real email.
          if (sentAt && !(wasDryRun && !isDryRun)) continue

          // A duplicate of this contact (same email) already got this step.
          if (sentByEmail[step.state].has(contact.email.toLowerCase())) { skipped += 1; continue }

          const vars: Record<string, string> = {
            firstName: contact.firstName || '',
            hello: language === 'EN'
              ? (contact.firstName ? `Hi ${contact.firstName},` : 'Hi,')
              : (contact.firstName ? `Bonjour ${contact.firstName},` : 'Bonjour,'),
            // Labels are stored in FR at download time — translate for EN contacts.
            resourceLabel: resourceLabelFor(firstEntry?.resource || '', resourceLabel, language),
            resourceUrl: resourceAccessUrl(firstEntry?.resource || ''),
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

          candidates.push({ co, contact, stepKey: step.key, state: step.state, language, vars, firstDownload })
          // Max one nurture email per contact per day — if J+3 and J+7 are
          // both due (late entry into the window), space them out.
          break
        }
      }
    }

    // ── Pass 2 : les plus anciens téléchargements d'abord ──
    // Le plafond quotidien doit servir en priorité les contacts proches de la
    // fin de fenêtre (10 j pour J+3, 14 j pour J+7), sinon un pic de
    // téléchargements laisse expirer les plus vieux sans jamais les envoyer.
    candidates.sort((a, b) => a.firstDownload - b.firstDownload)

    for (const { co, contact, stepKey, state, language, vars } of candidates) {
      if (sent >= MAX_SENDS_PER_RUN) break

      const emailKey = contact.email.toLowerCase()
      if (sentByEmail[state].has(emailKey)) { skipped += 1; continue }

      const tpl = templates[stepKey][language]
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

      const result = await sendNurtureEmail({
        apiKey,
        to: contact.email,
        subject,
        html,
        unsubUrl,
        isDryRun,
        tracking: {
          templateKey: stepKey,
          language,
          recipientName: [contact.firstName, contact.lastName].filter(Boolean).join(' ') || undefined,
          company: co.name,
        },
      })
      if (!result.ok) {
        console.error(`[scheduled-nurture] send error (${contact.email}, ${stepKey}):`, result.error)
        errors += 1
        continue
      }

      contact.nurture = {
        ...(contact.nurture || {}),
        ...(state === 'step3'
          ? { step3SentAt: nowIso, step3DryRun: isDryRun }
          : { step7SentAt: nowIso, step7DryRun: isDryRun }),
      }
      contact.updatedAt = nowIso
      co.updatedAt = nowIso
      dirty = true
      sent += 1
      sentByEmail[state].add(emailKey)
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
