import type { Handler } from '@netlify/functions'
import { checkAuth } from './_analytics'
import { readCrm, writeCrm } from './_crm'
import { sendNpsEmailFor } from './_nps'

const ONE_DAY_MS = 24 * 60 * 60 * 1000
const DEFAULT_LOOKBACK_DAYS = 15
const MAX_PER_BATCH = 50
const PACE_MS = 200

type Eligible = {
  companyId: string
  contactId: string
  email: string
  fullName: string
  resource: string
  resourceLabel: string
  downloadedAt: string
  hasExistingEntry: boolean
  /** 'fresh' = jamais sollicité ; 'test-resend' = sollicité en DRY-RUN
   *  (ou avant tracking) → sera renvoyé en prod après nettoyage. */
  kind: 'fresh' | 'test-resend'
}

/**
 * Detect a resource worth surveying from the contact's free-text `source`.
 * The NPS-eligible sources today are:
 *   - "Journalistes" / "Journalistes (...)"
 *   - "Data <specialty>" (set by handleDataDownload in submission-created.ts)
 *   - "Décideurs hospitaliers" / "Décideurs hospitaliers (...)"
 *   - "Influenceurs santé" / "Influenceurs santé (...)"
 * Brochure downloads are intentionally excluded.
 */
function detectResource(source: string | undefined): { slug: string; label: string } | null {
  if (!source) return null
  const lower = source.toLowerCase()
  if (lower.includes('journalistes')) {
    return { slug: 'journalistes', label: 'Liste journalistes santé' }
  }
  if (lower.includes('décideurs') || lower.includes('decideurs')) {
    return { slug: 'decideurs-hospitaliers', label: 'Base décideurs hospitaliers' }
  }
  if (lower.includes('influenceurs')) {
    return { slug: 'influenceurs-sante', label: 'Base influenceurs santé' }
  }
  const dataMatch = source.match(/(Data\s+[^,]+)/i)
  if (dataMatch) {
    const label = dataMatch[1].trim()
    const slug = label.replace(/^Data\s+/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    return { slug: slug || 'data-download', label }
  }
  return null
}

function makeNpsId(): string {
  return globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `nps-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * One-shot backlog campaign: emails the NPS prompt to contacts who downloaded
 * a data or journalistes resource in the last N days (default 15) and haven't
 * been asked yet. Uses the "récemment téléchargé" copy variant.
 *
 * Two modes:
 *   POST { mode: 'preview' } → returns the eligibles list without sending
 *   POST { mode: 'send' }    → sends up to MAX_PER_BATCH and persists CRM
 *
 * Respects NPS_DRY_RUN exactly like the daily cron.
 */
const handler: Handler = async (event) => {
  if (!checkAuth(event.headers as Record<string, string | undefined>)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: 'RESEND_API_KEY not configured' }) }
  if (!process.env.NPS_SIGNING_SECRET) {
    return { statusCode: 500, body: JSON.stringify({ error: 'NPS_SIGNING_SECRET not configured' }) }
  }

  let body: { mode?: 'preview' | 'send'; days?: number }
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'bad-json' }) }
  }

  const mode = body.mode === 'send' ? 'send' : 'preview'
  const days = body.days && body.days > 0 && body.days <= 365 ? body.days : DEFAULT_LOOKBACK_DAYS

  try {
    const data = await readCrm()
    const now = Date.now()
    const cutoff = now - days * ONE_DAY_MS

    const eligibles: Eligible[] = []

    for (const co of data.companies) {
      for (const c of co.contacts) {
        if (!c.email) continue
        const createdAtMs = Date.parse(c.createdAt)
        if (Number.isNaN(createdAtMs) || createdAtMs < cutoff) continue
        const resource = detectResource(c.source)
        if (!resource) continue

        const existing = c.npsResponses?.find(r => r.resource === resource.slug)
        // Never re-ask a contact who has already responded — a recorded
        // score wins over any DRY-RUN ambiguity on askedDryRun.
        if (existing?.score !== undefined) continue
        // Skip only if the entry was sent for real (askedDryRun === false).
        // DRY-RUN entries (askedDryRun === true) and pre-tracking entries
        // (undefined) are treated as testable — they get re-sent in prod.
        if (existing?.askedAt && existing.askedDryRun === false) continue

        const kind: 'fresh' | 'test-resend' = existing?.askedAt ? 'test-resend' : 'fresh'

        eligibles.push({
          companyId: co.id,
          contactId: c.id,
          email: c.email,
          fullName: [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email,
          resource: resource.slug,
          resourceLabel: existing?.resourceLabel || resource.label,
          downloadedAt: existing?.downloadedAt || c.createdAt,
          hasExistingEntry: !!existing,
          kind,
        })
      }
    }

    eligibles.sort((a, b) => (a.downloadedAt < b.downloadedAt ? 1 : -1))

    if (mode === 'preview') {
      return {
        statusCode: 200,
        body: JSON.stringify({
          mode,
          days,
          count: eligibles.length,
          dryRun: process.env.NPS_DRY_RUN === '1',
          eligibles,
        }),
      }
    }

    // mode === 'send'
    const isDryRun = process.env.NPS_DRY_RUN === '1'
    const batch = eligibles.slice(0, MAX_PER_BATCH)
    let sent = 0
    let errors = 0
    const failures: { email: string; error: string }[] = []

    for (const e of batch) {
      const company = data.companies.find(co => co.id === e.companyId)
      const contact = company?.contacts.find(c => c.id === e.contactId)
      if (!company || !contact) {
        errors += 1
        failures.push({ email: e.email, error: 'not-found' })
        continue
      }

      let np = contact.npsResponses?.find(r => r.resource === e.resource)
      if (!np) {
        if (!contact.npsResponses) contact.npsResponses = []
        np = {
          id: makeNpsId(),
          resource: e.resource,
          resourceLabel: e.resourceLabel,
          downloadedAt: e.downloadedAt,
        }
        contact.npsResponses.push(np)
      }
      // Safety: never resend over a real prod send.
      if (np.askedAt && np.askedDryRun === false) continue
      // Safety: never resend (or wipe) an entry that has a recorded score —
      // the contact already responded. Defense in depth on top of the
      // eligibility filter above.
      if (np.score !== undefined) continue
      // Wipe DRY-RUN traces (askedAt + fake scores/comments from owner-side
      // clicks) so the prod send starts from a clean slate.
      if (np.askedAt) {
        delete np.askedAt
        delete np.askedToken
        delete np.askedDryRun
        delete np.score
        delete np.scoredAt
        delete np.comment
        delete np.commentAt
      }

      const result = await sendNpsEmailFor(contact, np, { apiKey, isDryRun, isBacklog: true })
      if (!result.ok) {
        errors += 1
        failures.push({ email: e.email, error: result.error })
        continue
      }
      contact.updatedAt = np.askedAt!
      company.updatedAt = np.askedAt!
      sent += 1
      await new Promise(r => setTimeout(r, PACE_MS))
    }

    await writeCrm(data)

    return {
      statusCode: 200,
      body: JSON.stringify({
        mode,
        days,
        dryRun: isDryRun,
        eligibleCount: eligibles.length,
        processed: batch.length,
        remaining: Math.max(0, eligibles.length - batch.length),
        sent,
        errors,
        failures: failures.slice(0, 20),
      }),
    }
  } catch (err) {
    console.error('admin-nps-backlog error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) }
  }
}

export { handler }
