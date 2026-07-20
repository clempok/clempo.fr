import type { Config } from '@netlify/functions'
import { readCrm, writeCrm } from './_crm'
import type { CrmContact, CrmNpsResponse } from './_crm'
import { sendNpsEmailFor } from './_nps'

const ONE_DAY_MS = 24 * 60 * 60 * 1000
const TTL_DAYS = 7
/**
 * Hard cap on real Resend sends per run. Keeps a buffer in the Resend
 * free-tier quota (100/day) for the daily digest, per-download alerts,
 * and other transactional emails. Anything above the cap stays pending and
 * gets picked up by the next day's cron — the 7-day TTL leaves margin to
 * drain a spike over a week. Overridable via NPS_MAX_SENDS, to rebalance
 * the quota when the nurture cron (NURTURE_MAX_SENDS) needs more room.
 */
const MAX_SENDS_PER_RUN = (() => {
  const n = Number(process.env.NPS_MAX_SENDS)
  return Number.isInteger(n) && n >= 1 && n <= 95 ? n : 80
})()

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
  let pendingByCap = 0
  let dirty = false

  try {
    const data = await readCrm()
    const now = Date.now()

    // Email-level dedup guard: a contact duplicated across records (same email)
    // would otherwise be asked once per copy for the same resource. Seed from
    // entries already asked, then mark as we send. Keyed on email+resource.
    const askedByEmailResource = new Set<string>()
    for (const co of data.companies) {
      for (const c of co.contacts) {
        const e = c.email?.toLowerCase()
        if (!e || !c.npsResponses) continue
        for (const r of c.npsResponses) {
          if (r.askedAt && !r.askedDryRun) askedByEmailResource.add(`${e}|${r.resource}`)
        }
      }
    }

    // ── Pass 1 : collecter tous les envois éligibles ──
    type Candidate = { co: typeof data.companies[number]; contact: CrmContact; np: CrmNpsResponse; downloadedAt: number }
    const candidates: Candidate[] = []

    for (const co of data.companies) {
      for (const contact of co.contacts) {
        if (!contact.npsResponses || contact.npsResponses.length === 0) continue
        for (const np of contact.npsResponses) {
          if (np.askedAt) continue
          // Defensive dedup: if a sibling entry for the same resource has
          // already been asked or scored (e.g. legacy duplicates from before
          // addPendingNps dedup was added), do not email again. The backlog
          // campaign relies on .find() which already collapses to one entry
          // per resource — this brings the cron in line.
          if (contact.npsResponses.some(r => r !== np && r.resource === np.resource && (r.askedAt || r.score !== undefined))) {
            skipped += 1
            continue
          }
          const downloadedAt = Date.parse(np.downloadedAt)
          if (Number.isNaN(downloadedAt)) { skipped += 1; continue }
          const ageMs = now - downloadedAt
          if (ageMs < ONE_DAY_MS) { skipped += 1; continue }
          if (ageMs > TTL_DAYS * ONE_DAY_MS) { skipped += 1; continue }
          if (!contact.email) { skipped += 1; continue }
          candidates.push({ co, contact, np, downloadedAt })
        }
      }
    }

    // ── Pass 2 : les plus anciens d'abord, puis envoi jusqu'au plafond ──
    // Sans ce tri, l'ordre d'envoi suivait l'ordre du blob : sur un pic de
    // téléchargements, le plafond quotidien pouvait servir des entrées récentes
    // pendant que les plus vieilles atteignaient le TTL de 7 jours sans jamais
    // être envoyées.
    candidates.sort((a, b) => a.downloadedAt - b.downloadedAt)

    for (const { co, contact, np } of candidates) {
      const emailKey = contact.email.toLowerCase()
      if (askedByEmailResource.has(`${emailKey}|${np.resource}`)) { skipped += 1; continue }

      if (sent >= MAX_SENDS_PER_RUN) {
        pendingByCap += 1
        continue
      }

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
      if (!isDryRun) askedByEmailResource.add(`${emailKey}|${np.resource}`)
    }

    if (dirty) await writeCrm(data)

    console.log(
      `[scheduled-nps-ask] ok · sent=${sent} skipped=${skipped} pendingByCap=${pendingByCap} errors=${errors} dryRun=${isDryRun} · ${Date.now() - start}ms`
    )
    return new Response(JSON.stringify({ sent, skipped, pendingByCap, errors, dryRun: isDryRun }), {
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
