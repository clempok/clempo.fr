import type { Config } from '@netlify/functions'
import { readData, type LeadEvent } from './_analytics'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const TO_EMAIL = 'clement.pougetosmont@gmail.com'
const WINDOW_HOURS = 24

type DigestType = 'decideurs-hospitaliers' | 'data-download' | 'journalistes' | 'brochure' | 'hiring'

const SECTION_META: Record<DigestType, { emoji: string; label: string }> = {
  'decideurs-hospitaliers': { emoji: '🏥', label: 'Base décideurs hospitaliers' },
  'data-download':          { emoji: '📊', label: 'Data santé' },
  'journalistes':           { emoji: '📋', label: 'Liste journalistes' },
  'brochure':               { emoji: '📥', label: 'Brochure services' },
  'hiring':                 { emoji: '🎓', label: 'Candidatures stage' },
}
const SECTION_ORDER: DigestType[] = ['decideurs-hospitaliers', 'data-download', 'journalistes', 'brochure', 'hiring']

/**
 * Daily recap of all lead-magnet submissions from the last 24h, sent in a single
 * email. Acts as a safety net when per-download alerts (sent from
 * submission-created.ts) are dropped because the Resend daily quota is hit —
 * the digest still summarizes everything via the same shared quota budget.
 */
export default async () => {
  if (!RESEND_API_KEY) {
    console.error('[scheduled-leads-digest] RESEND_API_KEY not set')
    return new Response('Missing RESEND_API_KEY', { status: 500 })
  }

  try {
    const data = await readData()
    const now = Date.now()
    const cutoff = now - WINDOW_HOURS * 60 * 60 * 1000

    const buckets = new Map<DigestType, LeadEvent[]>()
    for (const ev of data.events) {
      const t = Date.parse(ev.ts)
      if (Number.isNaN(t) || t < cutoff) continue
      const type = ev.type as DigestType
      if (!SECTION_ORDER.includes(type)) continue
      const list = buckets.get(type) || []
      list.push(ev)
      buckets.set(type, list)
    }

    const total = Array.from(buckets.values()).reduce((s, l) => s + l.length, 0)
    if (total === 0) {
      console.log('[scheduled-leads-digest] no leads in last 24h, skipping')
      return new Response(JSON.stringify({ ok: true, sent: false, total: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const sections = SECTION_ORDER
      .map(type => ({ type, events: (buckets.get(type) || []).sort((a, b) => (a.ts < b.ts ? 1 : -1)) }))
      .filter(s => s.events.length > 0)

    const subject = `📥 Récap leads · ${total} en 24h${buckets.get('decideurs-hospitaliers')?.length ? ` · ${buckets.get('decideurs-hospitaliers')!.length} décideurs` : ''}`
    const html = renderDigest(sections, total)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Clempo.fr <noreply@clempo.fr>',
        to: [TO_EMAIL],
        subject,
        html,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error('[scheduled-leads-digest] Resend error:', res.status, body)
      return new Response(JSON.stringify({ error: `Resend ${res.status}: ${body}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({
        ok: true,
        sent: true,
        total,
        byType: Object.fromEntries(sections.map(s => [s.type, s.events.length])),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('[scheduled-leads-digest] fatal:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

function renderDigest(sections: { type: DigestType; events: LeadEvent[] }[], total: number): string {
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const leadRow = (ev: LeadEvent) => {
    const name = [ev.firstName, ev.lastName].filter(Boolean).join(' ') || '—'
    const email = ev.email || '—'
    const company = ev.company || ''
    const source = ev.source || ev.slug || ''
    const hour = new Date(ev.ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    return `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#111;font-size:13px;font-weight:600;white-space:nowrap;">${esc(name)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;"><a href="mailto:${esc(email)}" style="color:#0066cc;text-decoration:none;">${esc(email)}</a></td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#555;font-size:12px;">${esc(company)}${source ? `<div style="color:#999;font-size:11px;margin-top:2px;">${esc(source)}</div>` : ''}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#999;font-size:11px;white-space:nowrap;">${hour}</td>
      </tr>`
  }

  const sectionBlock = (s: { type: DigestType; events: LeadEvent[] }) => {
    const meta = SECTION_META[s.type]
    return `
      <h2 style="margin:24px 0 10px;font-size:14px;font-weight:700;color:#1A1A6B;text-transform:uppercase;letter-spacing:0.06em;">
        ${meta.emoji} ${meta.label} (${s.events.length})
      </h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:10px;overflow:hidden;">
        <thead>
          <tr style="background:#fafafa;">
            <th style="padding:7px 12px;text-align:left;font-size:10px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">Nom</th>
            <th style="padding:7px 12px;text-align:left;font-size:10px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">Email</th>
            <th style="padding:7px 12px;text-align:left;font-size:10px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">Entreprise / Source</th>
            <th style="padding:7px 12px;text-align:left;font-size:10px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">Heure</th>
          </tr>
        </thead>
        <tbody>${s.events.map(leadRow).join('')}</tbody>
      </table>`
  }

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8f8f6;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f6;padding:40px 20px;">
    <tr><td align="center">
      <table width="640" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
        <tr>
          <td style="background:#1A1A6B;padding:28px 32px;">
            <p style="margin:0;color:#fff;font-size:13px;opacity:0.7;text-transform:uppercase;letter-spacing:0.08em;">Récap leads · clempo.fr</p>
            <h1 style="margin:6px 0 0;color:#fff;font-size:22px;font-weight:700;">
              ${total} nouveau${total > 1 ? 'x' : ''} lead${total > 1 ? 's' : ''} en 24h
            </h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">${today}</p>
          </td>
        </tr>
        <tr><td style="padding:24px 32px 32px;">
          ${sections.map(sectionBlock).join('')}
          <p style="margin:28px 0 0;text-align:center;">
            <a href="https://www.clempo.fr/admin" style="display:inline-block;padding:12px 24px;background:#1A1A6B;color:#fff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:600;">
              Ouvrir le CRM →
            </a>
          </p>
        </td></tr>
        <tr>
          <td style="padding:20px 32px;background:#fafafa;border-top:1px solid #eee;text-align:center;">
            <p style="margin:0;font-size:11px;color:#bbb;">
              clempo.fr · Digest envoyé chaque matin · <a href="https://www.clempo.fr/admin" style="color:#bbb;">Voir tous les leads</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export const config: Config = {
  schedule: '0 7 * * *', // every day at 07:00 UTC (≈09:00 Paris in summer, 08:00 in winter)
}
