import type { Config } from '@netlify/functions'
import { readData, writeData } from './_analytics'
import { sendAppointmentReminderEmail } from './_email-templates'

/**
 * Hard cap on real Resend sends per run — keeps a buffer in the free-tier
 * quota (100/day) shared with nurture, NPS and per-download alerts. Bookings
 * are low-volume so the default is generous; overridable via env to rebalance.
 */
const MAX_SENDS_PER_RUN = (() => {
  const n = Number(process.env.APPOINTMENT_REMINDER_MAX_SENDS)
  return Number.isInteger(n) && n >= 1 && n <= 95 ? n : 20
})()

/** YYYY-MM-DD for the given instant in Paris time. */
function parisDate(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' })
}

/**
 * Daily J-1 appointment reminder cron. Scans booking events, finds the ones
 * happening TOMORROW (Paris time) that succeeded and haven't been reminded
 * yet, and sends one reminder per booking via Resend — re-sharing the booking
 * link so the contact can reschedule. Sets reminderSentAt on each event.
 *
 * Last-minute bookings (made after today's run, for tomorrow) are caught by
 * the next run; same-day bookings get no J-1 reminder by design — Google
 * Calendar already sends its own invite + default reminders.
 *
 * DRY-RUN: stays dry-run (routed to the owner, [TEST] banner) until
 * APPOINTMENT_REMINDER_LIVE=1 is set — mirrors NURTURE_LIVE / NPS_DRY_RUN.
 */
export default async () => {
  const start = Date.now()
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[scheduled-appointment-reminders] RESEND_API_KEY not set')
    return new Response('Missing RESEND_API_KEY', { status: 500 })
  }

  const isDryRun = process.env.APPOINTMENT_REMINDER_LIVE !== '1'

  let sent = 0
  let skipped = 0
  let errors = 0
  let pendingByCap = 0
  let dirty = false

  try {
    const data = await readData()

    // Target = tomorrow in Paris time.
    const today = new Date(`${parisDate(new Date())}T12:00:00Z`)
    today.setUTCDate(today.getUTCDate() + 1)
    const targetDate = today.toISOString().slice(0, 10)

    for (const ev of data.events) {
      if (ev.type !== 'booking' || ev.bookingStatus !== 'success') continue
      if (!ev.email || !ev.date) continue
      if (ev.date !== targetDate) continue
      if (ev.hour === undefined || ev.minute === undefined) continue
      // Idempotent: skip if already sent live. A prior dry-run send is re-sent
      // once for real when the live flag flips on (same pattern as nurture).
      if (ev.reminderSentAt && !(ev.reminderDryRun && !isDryRun)) { skipped += 1; continue }

      if (sent >= MAX_SENDS_PER_RUN) { pendingByCap += 1; continue }

      const language = ev.lang === 'en' ? 'EN' : 'FR'
      const result = await sendAppointmentReminderEmail({
        apiKey,
        to: ev.email,
        firstName: ev.firstName,
        language,
        date: ev.date,
        hour: ev.hour,
        minute: ev.minute,
        isDryRun,
      })
      if (!result.ok) {
        console.error('[scheduled-appointment-reminders] send error:', result.error)
        errors += 1
        continue
      }
      ev.reminderSentAt = new Date().toISOString()
      ev.reminderDryRun = isDryRun
      dirty = true
      sent += 1
    }

    if (dirty) await writeData(data)

    console.log(
      `[scheduled-appointment-reminders] ok · target=${targetDate} sent=${sent} skipped=${skipped} pendingByCap=${pendingByCap} errors=${errors} dryRun=${isDryRun} · ${Date.now() - start}ms`
    )
    return new Response(JSON.stringify({ target: targetDate, sent, skipped, pendingByCap, errors, dryRun: isDryRun }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[scheduled-appointment-reminders] fatal:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const config: Config = {
  schedule: '0 8 * * *', // every day at 08:00 UTC (≈10:00 Paris in summer) — the day before
}
