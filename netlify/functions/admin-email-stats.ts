import type { Handler } from '@netlify/functions'
import { checkAuth } from './_analytics'
import { listEmailTracking } from './_email-tracking'

export type EmailSendStats = {
  id: string
  templateKey: string
  language: 'FR' | 'EN'
  to: string
  recipientName?: string
  company?: string
  subject: string
  sentAt: string
  opens: number
  firstOpenAt?: string
  lastOpenAt?: string
  totalClicks: number
  /** Per-link click detail, only links that were clicked at least once. */
  clicks: { url: string; count: number; lastAt: string }[]
}

export type EmailTemplateTotals = {
  sent: number
  /** Sends with at least one open / one click (unique, not event counts). */
  opened: number
  clicked: number
}

/**
 * Admin API for the "Emails → Statistiques" view.
 *   GET → { totals: { [templateKey]: EmailTemplateTotals }, sends: EmailSendStats[] }
 * Aggregated from the email-tracking blob store (live sends only — dry-runs
 * and admin tests are never tracked). Sends sorted most recent first.
 */
const handler: Handler = async (event) => {
  if (!checkAuth(event.headers as Record<string, string | undefined>)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const { sends, events } = await listEmailTracking()

    const bySend = new Map<string, typeof events>()
    for (const evt of events) {
      const list = bySend.get(evt.sendId)
      if (list) list.push(evt)
      else bySend.set(evt.sendId, [evt])
    }

    const totals: Record<string, EmailTemplateTotals> = {}
    const result: EmailSendStats[] = []

    for (const send of sends) {
      const sendEvents = bySend.get(send.id) || []
      const opens = sendEvents.filter(e => e.type === 'open').map(e => e.ts).sort((a, b) => a - b)
      const clickEvents = sendEvents.filter(e => e.type === 'click')

      const clicksByLink = new Map<number, { count: number; lastAt: number }>()
      for (const evt of clickEvents) {
        const entry = clicksByLink.get(evt.linkIndex)
        if (entry) {
          entry.count += 1
          entry.lastAt = Math.max(entry.lastAt, evt.ts)
        } else {
          clicksByLink.set(evt.linkIndex, { count: 1, lastAt: evt.ts })
        }
      }

      result.push({
        id: send.id,
        templateKey: send.templateKey,
        language: send.language,
        to: send.to,
        recipientName: send.recipientName,
        company: send.company,
        subject: send.subject,
        sentAt: send.sentAt,
        opens: opens.length,
        firstOpenAt: opens.length ? new Date(opens[0]).toISOString() : undefined,
        lastOpenAt: opens.length ? new Date(opens[opens.length - 1]).toISOString() : undefined,
        totalClicks: clickEvents.length,
        clicks: [...clicksByLink.entries()]
          .filter(([idx]) => send.links[idx] !== undefined)
          .map(([idx, c]) => ({ url: send.links[idx], count: c.count, lastAt: new Date(c.lastAt).toISOString() }))
          .sort((a, b) => b.count - a.count),
      })

      const t = totals[send.templateKey] || (totals[send.templateKey] = { sent: 0, opened: 0, clicked: 0 })
      t.sent += 1
      if (opens.length) t.opened += 1
      if (clickEvents.length) t.clicked += 1
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ totals, sends: result }),
    }
  } catch (err) {
    console.error('[admin-email-stats] error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) }
  }
}

export { handler }
