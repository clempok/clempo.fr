import type { Config } from '@netlify/functions'
import { readData, type LeadEvent } from './_analytics'
import { readCrm } from './_crm'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const TO_EMAIL = 'clement.pougetosmont@gmail.com'
const WINDOW_HOURS = 24
/** Lignes affichées par section. Au-delà, un pied de tableau renvoie au CRM —
 *  un jour de pic (93 téléchargements le 16/07) rendait l'email illisible. */
const MAX_ROWS_PER_SECTION = 25

/** Une visite d'un contact connu, agrégée par contact sur la fenêtre. */
type VisitRow = {
  name: string
  email: string
  company: string
  status: string
  paths: string[]
  count: number
  lastTs: string
}

/** Une réponse NPS (note et/ou commentaire) reçue sur la fenêtre. */
type NpsRow = {
  name: string
  email: string
  company: string
  resourceLabel: string
  score?: number
  comment?: string
  ts: string
}

type DigestType = 'decideurs-hospitaliers' | 'influenceurs-sante' | 'data-download' | 'journalistes' | 'brochure' | 'hiring'

const SECTION_META: Record<DigestType, { emoji: string; label: string }> = {
  'decideurs-hospitaliers': { emoji: '🏥', label: 'Base décideurs hospitaliers' },
  'influenceurs-sante':     { emoji: '📱', label: 'Base influenceurs santé' },
  'data-download':          { emoji: '📊', label: 'Data santé' },
  'journalistes':           { emoji: '📋', label: 'Liste journalistes' },
  'brochure':               { emoji: '📥', label: 'Brochure services' },
  'hiring':                 { emoji: '🎓', label: 'Candidatures stage' },
}
const SECTION_ORDER: DigestType[] = ['decideurs-hospitaliers', 'influenceurs-sante', 'data-download', 'journalistes', 'brochure', 'hiring']

/**
 * Récap quotidien unique — l'email qui remplace toutes les alertes unitaires.
 * Regroupe sur 24h : les téléchargements de lead magnets, les visites des
 * contacts connus du CRM (cookie CID) et les réponses NPS.
 *
 * Seule la prise de RDV reste notifiée en temps réel (book-meeting.ts) : c'est
 * la seule chose qui demande une réaction dans l'heure. Tout le reste passe ici,
 * ce qui libère le quota Resend (100 emails/jour, partagé avec l'envoi des
 * ressources aux leads et les crons NPS / nurture).
 */
export default async () => {
  if (!RESEND_API_KEY) {
    console.error('[scheduled-leads-digest] RESEND_API_KEY not set')
    return new Response('Missing RESEND_API_KEY', { status: 500 })
  }

  try {
    const [data, crm] = await Promise.all([readData(), readCrm()])
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

    // ── Visites CRM + réponses NPS sur la même fenêtre ──
    const visits: VisitRow[] = []
    const npsRows: NpsRow[] = []
    for (const co of crm.companies) {
      for (const c of co.contacts) {
        const name = [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email
        const recent = (c.visits || []).filter(v => {
          const t = Date.parse(v.ts)
          return !Number.isNaN(t) && t >= cutoff
        })
        if (recent.length > 0) {
          visits.push({
            name,
            email: c.email,
            company: co.name,
            status: co.status,
            paths: Array.from(new Set(recent.map(v => v.path))),
            count: recent.length,
            lastTs: recent.reduce((a, v) => (v.ts > a ? v.ts : a), recent[0].ts),
          })
        }
        for (const r of c.npsResponses || []) {
          // Une entrée peut être notée puis commentée : on garde la plus
          // récente des deux dates pour décider si elle entre dans la fenêtre.
          const ts = [r.scoredAt, r.commentAt].filter(Boolean).sort().pop()
          if (!ts) continue
          const t = Date.parse(ts)
          if (Number.isNaN(t) || t < cutoff) continue
          npsRows.push({
            name, email: c.email, company: co.name,
            resourceLabel: r.resourceLabel || r.resource,
            score: r.score, comment: r.comment, ts,
          })
        }
      }
    }
    visits.sort((a, b) => (a.lastTs < b.lastTs ? 1 : -1))
    // Détracteurs en tête : c'est ce qui mérite une réponse.
    npsRows.sort((a, b) => (a.score ?? 99) - (b.score ?? 99))

    const totalLeads = Array.from(buckets.values()).reduce((s, l) => s + l.length, 0)
    const total = totalLeads + visits.length + npsRows.length
    if (total === 0) {
      console.log('[scheduled-leads-digest] nothing in last 24h, skipping')
      return new Response(JSON.stringify({ ok: true, sent: false, total: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const sections = SECTION_ORDER
      .map(type => ({ type, events: (buckets.get(type) || []).sort((a, b) => (a.ts < b.ts ? 1 : -1)) }))
      .filter(s => s.events.length > 0)

    const subjectBits = [
      totalLeads > 0 ? `${totalLeads} lead${totalLeads > 1 ? 's' : ''}` : '',
      visits.length > 0 ? `${visits.length} visite${visits.length > 1 ? 's' : ''}` : '',
      npsRows.length > 0 ? `${npsRows.length} NPS` : '',
    ].filter(Boolean)
    const subject = `📥 Récap 24h · ${subjectBits.join(' · ')}`
    const html = renderDigest(sections, totalLeads, visits, npsRows)

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
        leads: totalLeads,
        visits: visits.length,
        nps: npsRows.length,
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

function renderDigest(
  sections: { type: DigestType; events: LeadEvent[] }[],
  total: number,
  visits: VisitRow[],
  npsRows: NpsRow[],
): string {
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const hhmm = (ts: string) => new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })

  const sectionTitle = (emoji: string, label: string, n: number) => `
      <h2 style="margin:24px 0 10px;font-size:14px;font-weight:700;color:#1A1A6B;text-transform:uppercase;letter-spacing:0.06em;">
        ${emoji} ${label} (${n})
      </h2>`

  const th = (label: string) =>
    `<th style="padding:7px 12px;text-align:left;font-size:10px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">${label}</th>`

  /** Rend au plus MAX_ROWS_PER_SECTION lignes, puis annonce le reste. */
  const rows = <T,>(items: T[], render: (item: T) => string, cols: number) => {
    const shown = items.slice(0, MAX_ROWS_PER_SECTION).map(render).join('')
    const rest = items.length - MAX_ROWS_PER_SECTION
    if (rest <= 0) return shown
    return `${shown}<tr><td colspan="${cols}" style="padding:10px 12px;background:#fafafa;color:#888;font-size:12px;text-align:center;">
      + ${rest} autre${rest > 1 ? 's' : ''} — <a href="https://www.clempo.fr/admin" style="color:#1A1A6B;">voir dans le CRM</a>
    </td></tr>`
  }

  // ── 👀 Visites CRM ──
  const visitRow = (v: VisitRow) => {
    const pages = v.paths.slice(0, 4).map(p => (p === '/' ? 'Accueil' : p)).join(' · ')
    const more = v.paths.length > 4 ? ` +${v.paths.length - 4}` : ''
    return `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#111;font-size:13px;font-weight:600;white-space:nowrap;">${esc(v.name)}
          <div style="font-weight:400;font-size:11px;margin-top:2px;"><a href="mailto:${esc(v.email)}" style="color:#0066cc;text-decoration:none;">${esc(v.email)}</a></div>
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#555;font-size:12px;">${esc(v.company)}
          <div style="color:#999;font-size:11px;margin-top:2px;">${esc(v.status)}</div>
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#555;font-size:12px;">${esc(pages)}${more}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#999;font-size:11px;white-space:nowrap;">${v.count} vue${v.count > 1 ? 's' : ''}<div style="margin-top:2px;">${hhmm(v.lastTs)}</div></td>
      </tr>`
  }
  const visitsBlock = visits.length === 0 ? '' : `
    ${sectionTitle('👀', 'Visites de contacts connus', visits.length)}
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:10px;overflow:hidden;">
      <thead><tr style="background:#fafafa;">${th('Contact')}${th('Entreprise / Statut')}${th('Pages')}${th('Dernière')}</tr></thead>
      <tbody>${rows(visits, visitRow, 4)}</tbody>
    </table>`

  // ── ⭐ Réponses NPS ──
  const npsRow = (r: NpsRow) => {
    const s = r.score
    const color = s === undefined ? '#999' : s <= 6 ? '#dc2626' : s <= 8 ? '#f59e0b' : '#16a34a'
    const label = s === undefined ? '—' : s <= 6 ? 'Détracteur' : s <= 8 ? 'Passif' : 'Promoteur'
    return `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;white-space:nowrap;">
          <span style="font-size:18px;font-weight:700;color:${color};">${s ?? '—'}${s === undefined ? '' : '/10'}</span>
          <div style="font-size:10px;color:${color};font-weight:600;margin-top:2px;">${label}</div>
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#111;font-size:13px;font-weight:600;">${esc(r.name)}
          <div style="font-weight:400;font-size:11px;margin-top:2px;"><a href="mailto:${esc(r.email)}" style="color:#0066cc;text-decoration:none;">${esc(r.email)}</a></div>
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#555;font-size:12px;">${esc(r.resourceLabel)}
          ${r.comment ? `<blockquote style="margin:6px 0 0;padding:8px 10px;background:#f9f9f9;border-left:3px solid #1A1A6B;border-radius:4px;font-size:12px;color:#333;white-space:pre-wrap;">${esc(r.comment)}</blockquote>` : ''}
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#999;font-size:11px;white-space:nowrap;">${hhmm(r.ts)}</td>
      </tr>`
  }
  const npsBlock = npsRows.length === 0 ? '' : `
    ${sectionTitle('⭐', 'Réponses NPS', npsRows.length)}
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:10px;overflow:hidden;">
      <thead><tr style="background:#fafafa;">${th('Note')}${th('Contact')}${th('Ressource / Commentaire')}${th('Heure')}</tr></thead>
      <tbody>${rows(npsRows, npsRow, 4)}</tbody>
    </table>`

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
      ${sectionTitle(meta.emoji, meta.label, s.events.length)}
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:10px;overflow:hidden;">
        <thead><tr style="background:#fafafa;">${th('Nom')}${th('Email')}${th('Entreprise / Source')}${th('Heure')}</tr></thead>
        <tbody>${rows(s.events, leadRow, 4)}</tbody>
      </table>`
  }

  const headline = [
    total > 0 ? `${total} nouveau${total > 1 ? 'x' : ''} lead${total > 1 ? 's' : ''}` : '',
    visits.length > 0 ? `${visits.length} visite${visits.length > 1 ? 's' : ''}` : '',
    npsRows.length > 0 ? `${npsRows.length} réponse${npsRows.length > 1 ? 's' : ''} NPS` : '',
  ].filter(Boolean).join(' · ')

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8f8f6;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f6;padding:40px 20px;">
    <tr><td align="center">
      <table width="640" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
        <tr>
          <td style="background:#1A1A6B;padding:28px 32px;">
            <p style="margin:0;color:#fff;font-size:13px;opacity:0.7;text-transform:uppercase;letter-spacing:0.08em;">Récap 24h · clempo.fr</p>
            <h1 style="margin:6px 0 0;color:#fff;font-size:22px;font-weight:700;">${headline}</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">${today}</p>
          </td>
        </tr>
        <tr><td style="padding:24px 32px 32px;">
          ${sections.map(sectionBlock).join('')}
          ${visitsBlock}
          ${npsBlock}
          <p style="margin:28px 0 0;text-align:center;">
            <a href="https://www.clempo.fr/admin" style="display:inline-block;padding:12px 24px;background:#1A1A6B;color:#fff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:600;">
              Ouvrir le CRM →
            </a>
          </p>
        </td></tr>
        <tr>
          <td style="padding:20px 32px;background:#fafafa;border-top:1px solid #eee;text-align:center;">
            <p style="margin:0;font-size:11px;color:#bbb;">
              clempo.fr · Récap envoyé chaque matin · seules les prises de RDV sont notifiées en direct
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
