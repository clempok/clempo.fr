import type { Handler } from '@netlify/functions'
import { checkAuth, readData } from './_analytics'
import { readCrm } from './_crm'
import type { CrmStatus } from './_crm'
import { buildResourcesHtml, resourceLabelFor } from './_email-templates'

/**
 * Admin API for the "Emails → Programmés" view.
 *   GET → { generatedAt, live, caps, counts, upcoming: ScheduledEmail[] }
 *
 * The scheduled emails are NOT a stored queue — the J+1 NPS / J+3 / J+7 crons
 * recompute eligibility from each contact's download timestamps on every run.
 * This endpoint REPLAYS that exact selection logic to project, for each contact,
 * the next email that will go out and its earliest theoretical send date.
 *
 * ⚠️ The windows + cron times below MIRROR the crons and MUST stay in sync:
 *   - J+1 NPS    → scheduled-nps-ask.ts   (TTL 7d, cron 0 10 * * *)
 *   - J+3 / J+7  → scheduled-nurture.ts   (windows 3–10 / 7–14d, cron 30 9 * * *)
 *
 * Dates are THEORETICAL: when a cron hits its per-run Resend cap, the surplus is
 * deferred to the next day's run, so the real send may slip 24h (or more) later.
 */

const ONE_DAY_MS = 24 * 60 * 60 * 1000

// J+1 NPS — scheduled-nps-ask.ts
const NPS_MIN_DAYS = 1
const NPS_MAX_DAYS = 7
const NPS_CRON_H = 10
const NPS_CRON_M = 0

// J+3 / J+7 nurture — scheduled-nurture.ts
const STEP3_MIN_DAYS = 3
const STEP3_MAX_DAYS = 10
const STEP7_MIN_DAYS = 7
const STEP7_MAX_DAYS = 14
const NURTURE_CRON_H = 9
const NURTURE_CRON_M = 30

const SKIPPED_STATUSES: CrmStatus[] = ['Opportunité', 'Client', 'Lost']

function envCap(name: string, fallback: number): number {
  const n = Number(process.env[name])
  return Number.isInteger(n) && n >= 1 && n <= 95 ? n : fallback
}

/** Next occurrence of HH:MM UTC at or after `afterMs`. */
function nextCronUTC(afterMs: number, h: number, m: number): string {
  const d = new Date(afterMs)
  const c = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), h, m, 0, 0))
  if (c.getTime() < afterMs) c.setUTCDate(c.getUTCDate() + 1)
  return c.toISOString()
}

export type ScheduledEmail = {
  /** Stable key: contactId + step. */
  id: string
  templateKey: 'nps-ask' | 'nurture-j3' | 'nurture-j7' | 'appointment-reminder'
  language: 'FR' | 'EN'
  to: string
  recipientName?: string
  company?: string
  resourceLabel?: string
  /** Download timestamp that anchors the schedule (ISO). */
  anchorAt: string
  /** Earliest theoretical send (ISO) — next cron run once eligible; may slip if capped. */
  plannedSendAt: string
  /** scheduled = not due yet · pending = in window now, awaiting the next run (cap-gated). */
  status: 'scheduled' | 'pending'
}

const handler: Handler = async (event) => {
  if (!checkAuth(event.headers as Record<string, string | undefined>)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const data = await readCrm()
    const now = Date.now()
    const nurtureLive = process.env.NURTURE_LIVE === '1'
    const npsLive = process.env.NPS_DRY_RUN !== '1'
    const appointmentLive = process.env.APPOINTMENT_REMINDER_LIVE === '1'

    const upcoming: ScheduledEmail[] = []

    /** Classify by age vs window. Returns null if outside the sendable window. */
    const classify = (anchorMs: number, minDays: number, maxDays: number, cronH: number, cronM: number) => {
      const ageDays = (now - anchorMs) / ONE_DAY_MS
      if (ageDays > maxDays) return null // expired — the cron abandons it
      const eligibleAtMs = anchorMs + minDays * ONE_DAY_MS
      if (ageDays < minDays) {
        return { status: 'scheduled' as const, plannedSendAt: nextCronUTC(eligibleAtMs, cronH, cronM) }
      }
      // In window, not sent yet → goes at the next cron run (subject to the cap).
      return { status: 'pending' as const, plannedSendAt: nextCronUTC(now, cronH, cronM) }
    }

    for (const co of data.companies) {
      const nurtureBlocked = SKIPPED_STATUSES.includes(co.status)

      for (const contact of co.contacts) {
        if (!contact.email) continue
        const language: 'FR' | 'EN' = contact.language === 'EN' ? 'EN' : 'FR'
        const recipientName = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || undefined
        const downloads = contact.npsResponses || []

        // ── J+1 NPS — one per download, not status-gated (mirrors scheduled-nps-ask) ──
        for (const np of downloads) {
          if (np.askedAt) continue
          // Defensive dedup: skip if a sibling entry for the same resource was already asked/scored.
          if (downloads.some(r => r !== np && r.resource === np.resource && (r.askedAt || r.score !== undefined))) continue
          const anchorMs = Date.parse(np.downloadedAt)
          if (Number.isNaN(anchorMs)) continue
          const c = classify(anchorMs, NPS_MIN_DAYS, NPS_MAX_DAYS, NPS_CRON_H, NPS_CRON_M)
          if (!c) continue
          upcoming.push({
            id: `${contact.id}:nps:${np.id}`,
            templateKey: 'nps-ask',
            language,
            to: contact.email,
            recipientName,
            company: co.name,
            resourceLabel: np.resourceLabel || np.resource,
            anchorAt: np.downloadedAt,
            ...c,
          })
        }

        // ── J+3 / J+7 nurture — anchored on the FIRST download, status-gated, opt-out aware ──
        if (nurtureBlocked || contact.emailOptOut || downloads.length === 0) continue
        const firstMs = downloads
          .map(r => Date.parse(r.downloadedAt))
          .filter(t => !Number.isNaN(t))
          .sort((a, b) => a - b)[0]
        if (firstMs === undefined) continue
        const firstEntry = downloads.find(r => Date.parse(r.downloadedAt) === firstMs)
        const resourceLabel = resourceLabelFor(
          firstEntry?.resource || '', firstEntry?.resourceLabel || firstEntry?.resource || '', language,
        )
        const downloadedSlugs = downloads.map(r => r.resource)
        const nurture = contact.nurture || {}

        // J+3 — skipped when there is nothing new left to offer.
        const j3Done = nurture.step3SentAt && !(nurture.step3DryRun && nurtureLive)
        const hasNewResources = buildResourcesHtml(downloadedSlugs, language) !== null
        if (!j3Done && hasNewResources) {
          const c = classify(firstMs, STEP3_MIN_DAYS, STEP3_MAX_DAYS, NURTURE_CRON_H, NURTURE_CRON_M)
          if (c) {
            upcoming.push({
              id: `${contact.id}:nurture-j3`,
              templateKey: 'nurture-j3', language, to: contact.email, recipientName,
              company: co.name, resourceLabel, anchorAt: new Date(firstMs).toISOString(), ...c,
            })
          }
        }

        // J+7
        const j7Done = nurture.step7SentAt && !(nurture.step7DryRun && nurtureLive)
        if (!j7Done) {
          const c = classify(firstMs, STEP7_MIN_DAYS, STEP7_MAX_DAYS, NURTURE_CRON_H, NURTURE_CRON_M)
          if (c) {
            upcoming.push({
              id: `${contact.id}:nurture-j7`,
              templateKey: 'nurture-j7', language, to: contact.email, recipientName,
              company: co.name, resourceLabel, anchorAt: new Date(firstMs).toISOString(), ...c,
            })
          }
        }
      }
    }

    // ── J-1 appointment reminders — projected from booking events (mirrors
    //    scheduled-appointment-reminders.ts: target = day before, cron 0 8 * * *) ──
    const pad = (n: number) => n.toString().padStart(2, '0')
    const todayParis = new Date(now).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' })
    try {
      const analytics = await readData()
      for (const ev of analytics.events) {
        if (ev.type !== 'booking' || ev.bookingStatus !== 'success') continue
        if (!ev.email || !ev.date || ev.hour === undefined || ev.minute === undefined) continue
        if (ev.date <= todayParis) continue // past or same-day: no J-1 reminder
        // Already reminded for real (a prior dry-run is re-sent once live flips on).
        if (ev.reminderSentAt && !(ev.reminderDryRun && appointmentLive)) continue

        // Cron sends at 08:00 UTC the day before the appointment.
        const dayBefore = new Date(`${ev.date}T12:00:00Z`)
        dayBefore.setUTCDate(dayBefore.getUTCDate() - 1)
        const plannedSendAt = `${dayBefore.toISOString().slice(0, 10)}T08:00:00Z`
        const status: 'scheduled' | 'pending' = Date.parse(plannedSendAt) > now ? 'scheduled' : 'pending'
        const language: 'FR' | 'EN' = ev.lang === 'en' ? 'EN' : 'FR'

        upcoming.push({
          id: `booking:${ev.id}:reminder`,
          templateKey: 'appointment-reminder',
          language,
          to: ev.email,
          recipientName: [ev.firstName, ev.lastName].filter(Boolean).join(' ') || undefined,
          company: ev.company,
          resourceLabel: `RDV ${pad(ev.hour)}:${pad(ev.minute)}`,
          anchorAt: `${ev.date}T${pad(ev.hour)}:${pad(ev.minute)}:00`,
          plannedSendAt,
          status,
        })
      }
    } catch (err) {
      console.error('[admin-scheduled-emails] reminders projection failed:', err)
    }

    upcoming.sort((a, b) => a.plannedSendAt.localeCompare(b.plannedSendAt))

    const counts = {
      total: upcoming.length,
      scheduled: upcoming.filter(u => u.status === 'scheduled').length,
      pending: upcoming.filter(u => u.status === 'pending').length,
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        generatedAt: new Date(now).toISOString(),
        live: { nurture: nurtureLive, nps: npsLive, appointment: appointmentLive },
        caps: { nurture: envCap('NURTURE_MAX_SENDS', 30), nps: envCap('NPS_MAX_SENDS', 80) },
        counts,
        upcoming,
      }),
    }
  } catch (err) {
    console.error('[admin-scheduled-emails] error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) }
  }
}

export { handler }
