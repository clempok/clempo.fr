import crypto from 'node:crypto'
import type { ContactLanguage, CrmContact, CrmNpsResponse } from './_crm'
import { detectLanguage } from './_crm'

const SITE_URL = 'https://www.clempo.fr'

function getSecret(): string {
  const s = process.env.NPS_SIGNING_SECRET
  if (!s) throw new Error('NPS_SIGNING_SECRET not set')
  return s
}

function b64url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecode(input: string): Buffer {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4))
  const normal = input.replace(/-/g, '+').replace(/_/g, '/') + pad
  return Buffer.from(normal, 'base64')
}

export type NpsTokenPayload = { contactEmail: string; responseId: string }

export function signNpsToken(payload: NpsTokenPayload): string {
  const json = JSON.stringify(payload)
  const body = b64url(json)
  const sig = b64url(crypto.createHmac('sha256', getSecret()).update(body).digest())
  return `${body}.${sig}`
}

export function verifyNpsToken(token: string | undefined | null): NpsTokenPayload | null {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  let expected: string
  try {
    expected = b64url(crypto.createHmac('sha256', getSecret()).update(body).digest())
  } catch {
    return null
  }
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  try {
    const parsed = JSON.parse(b64urlDecode(body).toString('utf8'))
    if (typeof parsed?.contactEmail !== 'string' || typeof parsed?.responseId !== 'string') {
      return null
    }
    return parsed as NpsTokenPayload
  } catch {
    return null
  }
}

export function isValidScore(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 10
}

export function parseScoreParam(s: string | undefined | null): number | null {
  if (s === undefined || s === null) return null
  const n = Number.parseInt(String(s), 10)
  return isValidScore(n) ? n : null
}

/** Diverging color palette 0 (red) → 10 (green). */
function scoreColor(n: number): string {
  // Anchors: 0=#dc2626 red, 6=#f59e0b amber, 8=#84cc16 lime, 10=#16a34a green
  const palette = [
    '#dc2626', '#dc2626', '#ea580c', '#ea580c', '#f59e0b', '#f59e0b',
    '#facc15', '#a3e635', '#84cc16', '#22c55e', '#16a34a',
  ]
  return palette[n] || '#71717a'
}

const COPY = {
  FR: {
    subject: (label: string) => `Une question sur "${label}" 🙏`,
    hello: (name: string) => name ? `Bonjour ${name},` : 'Bonjour,',
    body: (label: string) =>
      `Vous avez téléchargé hier <strong>${label}</strong>. J'aimerais savoir si le contenu vous a été utile.`,
    question: 'Sur une échelle de 0 à 10, quelle est la probabilité que vous recommandiez cette ressource à un collègue ?',
    legendLow: '0 — Pas du tout',
    legendHigh: '10 — Très probablement',
    footer: 'Cliquez sur une note ci-dessus, vous pourrez ajouter un commentaire ensuite. Merci !',
    signature: 'Clément Pouget-Osmont',
  },
  EN: {
    subject: (label: string) => `Quick question about "${label}" 🙏`,
    hello: (name: string) => name ? `Hi ${name},` : 'Hi,',
    body: (label: string) =>
      `Yesterday you downloaded <strong>${label}</strong>. I'd love to know whether it was useful to you.`,
    question: 'On a scale from 0 to 10, how likely are you to recommend this resource to a colleague?',
    legendLow: '0 — Not at all',
    legendHigh: '10 — Very likely',
    footer: 'Click a score above — you can add a comment afterward. Thanks!',
    signature: 'Clément Pouget-Osmont',
  },
} as const

export function buildNpsEmailHtml(opts: {
  firstName: string
  language: ContactLanguage
  resourceLabel: string
  scoreUrlFor: (score: number) => string
  isDryRun: boolean
  realRecipient: string
}): { subject: string; html: string } {
  const lang = opts.language === 'EN' ? 'EN' : 'FR'
  const t = COPY[lang]
  const subject = t.subject(opts.resourceLabel)

  const buttonsHtml = Array.from({ length: 11 }, (_, n) => {
    const color = scoreColor(n)
    const url = opts.scoreUrlFor(n)
    return `<td style="padding:4px;text-align:center;">
      <a href="${url}" style="display:inline-block;min-width:32px;padding:10px 0;background:${color};color:#fff;text-decoration:none;font-weight:700;font-size:16px;border-radius:8px;font-family:Arial,Helvetica,sans-serif;">${n}</a>
    </td>`
  }).join('')

  const dryRunBanner = opts.isDryRun
    ? `<div style="margin:0 0 24px;padding:12px 16px;background:#fee2e2;border:1px solid #dc2626;border-radius:8px;color:#7f1d1d;font-size:13px;font-family:Arial,Helvetica,sans-serif;">
        <strong>TEST DRY-RUN</strong> · destinataire réel : <code>${opts.realRecipient}</code>
      </div>`
    : ''

  const html = `<!doctype html>
<html lang="${lang.toLowerCase()}">
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f8f8f6;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;font-family:Arial,Helvetica,sans-serif;color:#0a0a0a;">
    ${dryRunBanner}
    <p style="font-size:16px;margin:0 0 16px;">${t.hello(opts.firstName)}</p>
    <p style="font-size:16px;line-height:1.55;margin:0 0 16px;">${t.body(opts.resourceLabel)}</p>
    <p style="font-size:16px;line-height:1.55;margin:0 0 24px;">${t.question}</p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;margin:0 auto;">
      <tr>${buttonsHtml}</tr>
    </table>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin-top:8px;font-size:12px;color:#71717a;">
      <tr>
        <td style="text-align:left;">${t.legendLow}</td>
        <td style="text-align:right;">${t.legendHigh}</td>
      </tr>
    </table>
    <p style="font-size:13px;line-height:1.55;color:#71717a;margin:32px 0 0;">${t.footer}</p>
    <p style="font-size:14px;margin:24px 0 0;">${t.signature}<br><a href="${SITE_URL}" style="color:#1A1A6B;">clempo.fr</a></p>
  </div>
</body>
</html>`

  return { subject, html }
}

export function npsRespondUrl(token: string, score: number): string {
  return `${SITE_URL}/.netlify/functions/nps-respond?t=${encodeURIComponent(token)}&s=${score}`
}

export function npsThanksUrl(token: string, score: number): string {
  return `${SITE_URL}/merci-nps?t=${encodeURIComponent(token)}&s=${score}`
}

export function npsThanksErrorUrl(): string {
  return `${SITE_URL}/merci-nps?err=invalid`
}

const OWNER_EMAIL = 'clement.pougetosmont@gmail.com'

/**
 * Send a single NPS email for a pending response. Shared by the daily cron
 * and the admin "Envoyer maintenant" button so dry-run, copy, and token
 * generation stay identical. Mutates `np` in place on success (askedAt,
 * askedToken) — caller is responsible for persisting the CRM.
 */
export async function sendNpsEmailFor(
  contact: CrmContact,
  np: CrmNpsResponse,
  opts: { apiKey: string; isDryRun: boolean },
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!contact.email) return { ok: false, error: 'no-email' }

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
    isDryRun: opts.isDryRun,
    realRecipient: contact.email,
  })

  const recipient = opts.isDryRun ? OWNER_EMAIL : contact.email
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Clément Pouget-Osmont <noreply@clempo.fr>',
        to: [recipient],
        reply_to: OWNER_EMAIL,
        subject: opts.isDryRun ? `[TEST] ${subject}` : subject,
        html,
      }),
    })
    if (!res.ok) {
      const errText = await res.text()
      return { ok: false, error: errText }
    }
    np.askedAt = new Date().toISOString()
    np.askedToken = token
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}
