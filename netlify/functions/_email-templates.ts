import crypto from 'node:crypto'
import { getStore } from '@netlify/blobs'

/**
 * Editable email templates for the nurture sequence, stored in Netlify Blobs
 * (store "email-templates") so they can be edited from the admin "Emails" tab
 * without a redeploy. The cron reads them at send time; defaults below are
 * the fallback for any key that has never been saved.
 *
 * Placeholders ({{key}}) available in subject and body:
 *   {{firstName}}          — first name, or empty (use {{hello}} for a safe greeting)
 *   {{hello}}              — "Bonjour Marie," / "Bonjour," depending on data
 *   {{resourceLabel}}      — label of the first resource downloaded
 *   {{resourcesHtml}}      — <ul> of the OTHER available resources (J+3)
 *   {{resourceLinksHtml}}  — download button(s) of the resource (resource-delivery)
 *   {{videoHtml}}          — clickable YouTube thumbnail of the intro video
 *   {{bookingUrl}}         — absolute booking URL with src tracking
 *   {{siteUrl}}            — https://www.clempo.fr
 */

const SITE_URL = 'https://www.clempo.fr'
const SITE_ID = '266ec893-0de7-4f86-9559-e80fa4a1e3d7'
export const OWNER_EMAIL = 'clement.pougetosmont@gmail.com'

export type EmailTemplate = {
  subject: string
  /** Inner HTML of the email body. Wrapped by buildEmailHtml (chrome, footer,
   *  unsubscribe link) at send time. */
  body: string
}

export type TemplateLangPair = { FR: EmailTemplate; EN: EmailTemplate }

export type EmailTemplatesData = {
  'resource-delivery': TemplateLangPair
  'nurture-j3': TemplateLangPair
  'nurture-j7': TemplateLangPair
  updatedAt?: string
}

export const TEMPLATE_KEYS = ['resource-delivery', 'nurture-j3', 'nurture-j7'] as const
export type TemplateKey = (typeof TEMPLATE_KEYS)[number]

export const DEFAULT_TEMPLATES: EmailTemplatesData = {
  'resource-delivery': {
    FR: {
      subject: 'Votre ressource — {{resourceLabel}}',
      body: `<p>{{hello}}</p>
<p>Merci pour votre téléchargement. Comme promis, voici votre accès direct à <strong>{{resourceLabel}}</strong> :</p>
{{resourceLinksHtml}}
<p>Gardez cet email : le lien reste valable si vous perdez la page.</p>
<p>Une question sur ces données ou sur votre marketing santé ? Répondez simplement à cet email.</p>`,
    },
    EN: {
      subject: 'Your resource — {{resourceLabel}}',
      body: `<p>{{hello}}</p>
<p>Thanks for your download. As promised, here is your direct access to <strong>{{resourceLabel}}</strong>:</p>
{{resourceLinksHtml}}
<p>Keep this email: the link stays valid if you lose the page.</p>
<p>Any question about this data or your healthcare marketing? Just reply to this email.</p>`,
    },
  },
  'nurture-j3': {
    FR: {
      subject: 'Les autres ressources clempo.fr (gratuites aussi)',
      body: `<p>{{hello}}</p>
<p>Vous avez téléchargé <strong>{{resourceLabel}}</strong> il y a quelques jours. Si elle vous a été utile, ces autres ressources devraient vous intéresser — même logique : des données et des listes actionnables, sans blabla.</p>
{{resourcesHtml}}
<p>Tout est gratuit, sans formulaire supplémentaire pour vous.</p>
<p>Et si vous préférez les analyses de fond, le blog couvre les systèmes de santé du monde entier et le marketing santé appliqué : <a href="{{siteUrl}}/articles">clempo.fr/articles</a>.</p>`,
    },
    EN: {
      subject: 'The other clempo.fr resources (also free)',
      body: `<p>{{hello}}</p>
<p>You downloaded <strong>{{resourceLabel}}</strong> a few days ago. If it was useful, these other resources should interest you — same logic: actionable data and lists, no fluff.</p>
{{resourcesHtml}}
<p>Everything is free, with no extra form for you.</p>
<p>And if you prefer in-depth analyses, the blog covers healthcare systems worldwide and applied healthcare marketing: <a href="{{siteUrl}}/articles">clempo.fr/articles</a>.</p>`,
    },
  },
  'nurture-j7': {
    FR: {
      subject: 'Ce que je fais quand je ne compile pas des données',
      body: `<p>{{hello}}</p>
<p>Une semaine que vous avez téléchargé {{resourceLabel}} — j'espère qu'elle travaille pour vous.</p>
<p>Un mot sur ce que je fais le reste du temps : j'accompagne des entreprises santé (HealthTech, MedTech, éditeurs de logiciels médicaux) sur leur marketing. 12 ans dans le secteur, dont 5 chez Doctolib. Trois formats :</p>
<ul>
<li><strong>Advisory</strong> — 1 session stratégique par mois + WhatsApp, 900&nbsp;€/mois. Pour challenger vos décisions sans externaliser l'exécution.</li>
<li><strong>Part-Time CMO</strong> — 2-3 jours par semaine. Je prends la direction marketing : stratégie, exécution, équipe.</li>
<li><strong>Management de transition</strong> — temps plein, 6-12 mois, quand votre CMO part ou que le recrutement traîne.</li>
</ul>
<p>Pour mettre un visage et des exemples concrets sur tout ça, 2 minutes en vidéo :</p>
{{videoHtml}}
<p>Si un sujet marketing vous occupe en ce moment, le plus simple est un brief de 30 minutes, gratuit et sans suite obligée : <a href="{{bookingUrl}}">réserver un créneau</a>.</p>
<p>Et si ce n'est pas le moment, aucun souci — les ressources restent gratuites et je continue d'en publier.</p>`,
    },
    EN: {
      subject: "What I do when I'm not compiling data",
      body: `<p>{{hello}}</p>
<p>It's been a week since you downloaded {{resourceLabel}} — I hope it's working for you.</p>
<p>A word about what I do the rest of the time: I help healthcare companies (HealthTech, MedTech, medical software vendors) with their marketing. 12 years in the sector, including 5 at Doctolib. Three formats:</p>
<ul>
<li><strong>Advisory</strong> — 1 strategy session per month + WhatsApp, €900/month. To challenge your decisions without outsourcing execution.</li>
<li><strong>Part-Time CMO</strong> — 2-3 days a week. I run marketing: strategy, execution, team.</li>
<li><strong>Interim management</strong> — full-time, 6-12 months, when your CMO leaves or the hire is slow.</li>
</ul>
<p>To put a face and concrete examples on all this, 2 minutes on video:</p>
{{videoHtml}}
<p>If a marketing topic is on your mind right now, the simplest step is a free 30-minute brief with no strings attached: <a href="{{bookingUrl}}">book a slot</a>.</p>
<p>And if now is not the time, no worries — the resources stay free and I keep publishing more.</p>`,
    },
  },
}

function getTemplatesStore() {
  const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_API_TOKEN
  const siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID || SITE_ID
  if (token) {
    return getStore({ name: 'email-templates', siteID, token })
  }
  return getStore({ name: 'email-templates' })
}

/** Read templates, merging stored overrides over code defaults so new keys
 *  added in code appear even if the blob predates them. */
export async function readEmailTemplates(): Promise<EmailTemplatesData> {
  const store = getTemplatesStore()
  const raw = (await store.get('templates', { type: 'json' })) as Partial<EmailTemplatesData> | null
  if (!raw) return structuredClone(DEFAULT_TEMPLATES)
  const merged = structuredClone(DEFAULT_TEMPLATES)
  for (const key of TEMPLATE_KEYS) {
    const stored = raw[key]
    if (!stored) continue
    for (const lang of ['FR', 'EN'] as const) {
      const tpl = stored[lang]
      if (tpl && typeof tpl.subject === 'string' && typeof tpl.body === 'string') {
        merged[key][lang] = { subject: tpl.subject, body: tpl.body }
      }
    }
  }
  merged.updatedAt = raw.updatedAt
  return merged
}

export async function writeEmailTemplates(data: EmailTemplatesData): Promise<void> {
  const store = getTemplatesStore()
  data.updatedAt = new Date().toISOString()
  await store.setJSON('templates', data)
}

/** Naive {{key}} substitution — enough for our placeholders, no logic. */
export function renderTemplate(input: string, vars: Record<string, string>): string {
  return input.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, key) => (key in vars ? vars[key] : m))
}

/* ── Unsubscribe ──
 * Token = HMAC over the contact email, signed with NPS_SIGNING_SECRET (same
 * secret as NPS tokens — one secret to rotate, same trust level). */

function getSecret(): string {
  const s = process.env.NPS_SIGNING_SECRET
  if (!s) throw new Error('NPS_SIGNING_SECRET not set')
  return s
}

function b64url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function signUnsubToken(email: string): string {
  const body = b64url(JSON.stringify({ e: email.toLowerCase(), p: 'unsub' }))
  const sig = b64url(crypto.createHmac('sha256', getSecret()).update(body).digest())
  return `${body}.${sig}`
}

export function verifyUnsubToken(token: string | undefined | null): string | null {
  if (!token || !token.includes('.')) return null
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
    const pad = body.length % 4 === 0 ? '' : '='.repeat(4 - (body.length % 4))
    const parsed = JSON.parse(Buffer.from(body.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64').toString('utf8'))
    if (parsed?.p !== 'unsub' || typeof parsed?.e !== 'string') return null
    return parsed.e
  } catch {
    return null
  }
}

export function unsubscribeUrl(email: string): string {
  return `${SITE_URL}/.netlify/functions/unsubscribe?t=${encodeURIComponent(signUnsubToken(email))}`
}

/* ── Email chrome + send ── */

export function buildEmailHtml(opts: {
  bodyHtml: string
  subject: string
  language: 'FR' | 'EN'
  unsubUrl: string
  isDryRun: boolean
  realRecipient: string
}): string {
  const dryRunBanner = opts.isDryRun
    ? `<div style="margin:0 0 24px;padding:12px 16px;background:#fee2e2;border:1px solid #dc2626;border-radius:8px;color:#7f1d1d;font-size:13px;font-family:Arial,Helvetica,sans-serif;">
        <strong>TEST DRY-RUN</strong> · destinataire réel : <code>${opts.realRecipient}</code>
      </div>`
    : ''
  const unsubLabel = opts.language === 'EN'
    ? 'Unsubscribe from these emails'
    : 'Ne plus recevoir ces emails'

  return `<!doctype html>
<html lang="${opts.language.toLowerCase()}">
<head><meta charset="utf-8"><title>${opts.subject}</title></head>
<body style="margin:0;padding:0;background:#f8f8f6;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;font-family:Arial,Helvetica,sans-serif;color:#0a0a0a;font-size:16px;line-height:1.55;">
    ${dryRunBanner}
    ${opts.bodyHtml}
    <p style="font-size:14px;margin:24px 0 0;">Clément Pouget-Osmont<br><a href="${SITE_URL}" style="color:#1A1A6B;">clempo.fr</a></p>
    <p style="font-size:12px;color:#a1a1aa;margin:32px 0 0;border-top:1px solid #e4e4e7;padding-top:16px;">
      <a href="${opts.unsubUrl}" style="color:#a1a1aa;">${unsubLabel}</a>
    </p>
  </div>
</body>
</html>`
}

/** Send a rendered nurture email via Resend, with List-Unsubscribe headers. */
export async function sendNurtureEmail(opts: {
  apiKey: string
  to: string
  subject: string
  html: string
  unsubUrl: string
  isDryRun: boolean
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const recipient = opts.isDryRun ? OWNER_EMAIL : opts.to
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
        subject: opts.isDryRun ? `[TEST] ${opts.subject}` : opts.subject,
        html: opts.html,
        headers: {
          'List-Unsubscribe': `<${opts.unsubUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }),
    })
    if (!res.ok) {
      return { ok: false, error: await res.text() }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}

/* ── Resource catalog for the J+3 email ──
 * Maps download slugs to public lead-magnet pages. `slugs` lists every CRM
 * resource slug that counts as "already has this one" (the data downloads
 * use one slug per specialty). */

export type ResourceCatalogEntry = {
  id: string
  slugs: (slug: string) => boolean
  label: { FR: string; EN: string }
  url: string
}

export const RESOURCE_CATALOG: ResourceCatalogEntry[] = [
  {
    id: 'decideurs-hospitaliers',
    slugs: s => s === 'decideurs-hospitaliers',
    label: {
      FR: 'La base des décideurs hospitaliers (DG, DSI, présidents de CME)',
      EN: 'The hospital decision-makers database (CEOs, CIOs, CME presidents)',
    },
    url: `${SITE_URL}/decideurs-hospitaliers`,
  },
  {
    id: 'journalistes',
    slugs: s => s === 'journalistes',
    label: {
      FR: 'La liste des journalistes santé français et américains (pour vos RP)',
      EN: 'The list of French and US healthcare journalists (for your PR)',
    },
    url: `${SITE_URL}/#journalistes`,
  },
  {
    id: 'data-specialites',
    slugs: s => s === 'data-download' || !['decideurs-hospitaliers', 'journalistes'].includes(s),
    label: {
      FR: 'Les parts de marché des logiciels médicaux, spécialité par spécialité',
      EN: 'Medical software market shares, specialty by specialty',
    },
    url: `${SITE_URL}/parts-de-marche-logiciels-medicaux`,
  },
  {
    id: 'blog-articles',
    // Not a gated download: never counts as "already taken", always offered.
    slugs: () => false,
    label: {
      FR: 'Mes articles de blog dédiés aux acteurs de la santé',
      EN: 'My blog articles for healthcare players',
    },
    url: `${SITE_URL}/articles`,
  },
]

/* ── Intro video (same video as the Home booking block) ── */

const VIDEO_URL = 'https://www.youtube.com/watch?v=rdwcJ7gAyv0'
const VIDEO_THUMB = 'https://img.youtube.com/vi/rdwcJ7gAyv0/maxresdefault.jpg'

/** Build the {{videoHtml}} block: clickable thumbnail linking to YouTube,
 *  with a text fallback link (images are often blocked by default). */
export function buildVideoHtml(language: 'FR' | 'EN'): string {
  const alt = language === 'EN'
    ? 'Video introduction — Clément Pouget-Osmont'
    : 'Présentation en vidéo — Clément Pouget-Osmont'
  const caption = language === 'EN' ? '▶ Watch the intro video' : '▶ Regarder la vidéo de présentation'
  return `<p style="margin:24px 0 8px;"><a href="${VIDEO_URL}"><img src="${VIDEO_THUMB}" alt="${alt}" width="520" style="width:100%;max-width:520px;border-radius:8px;border:1px solid rgba(10,10,11,0.08);display:block;" /></a></p>
<p style="margin:0 0 24px;font-size:14px;"><a href="${VIDEO_URL}" style="color:#1A1A6B;">${caption}</a></p>`
}

/* ── Resource delivery (transactional, sent at form submission) ── */

export type ResourceLink = { label: string; url: string }

/** Build the {{resourceLinksHtml}} block: one button-style link per file. */
export function buildResourceLinksHtml(links: ResourceLink[]): string {
  return links
    .map(l => `<div style="margin:20px 0;"><a href="${l.url}" style="display:inline-block;padding:13px 24px;background:#1A1A6B;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">${l.label} →</a></div>`)
    .join('\n')
}

/**
 * Send the lead its resource by email right after a form submission, using
 * the editable "resource-delivery" template. Never throws: lead-magnet
 * delivery must not break the notification/CRM flow of submission-created.
 */
export async function sendResourceDeliveryEmail(opts: {
  apiKey: string
  to: string
  firstName?: string
  language?: 'FR' | 'EN'
  resourceLabel: string
  links: ResourceLink[]
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const language = opts.language === 'EN' ? 'EN' : 'FR'
    const templates = await readEmailTemplates()
    const tpl = templates['resource-delivery'][language]

    const vars: Record<string, string> = {
      firstName: opts.firstName || '',
      hello: language === 'EN'
        ? (opts.firstName ? `Hi ${opts.firstName},` : 'Hi,')
        : (opts.firstName ? `Bonjour ${opts.firstName},` : 'Bonjour,'),
      resourceLabel: opts.resourceLabel,
      resourceLinksHtml: buildResourceLinksHtml(opts.links),
      bookingUrl: `${SITE_URL}/booking?src=resource-delivery`,
      siteUrl: SITE_URL,
    }

    const subject = renderTemplate(tpl.subject, vars)
    // unsubscribeUrl needs NPS_SIGNING_SECRET; fall back to the site URL so a
    // missing secret degrades the footer link instead of dropping the email.
    let unsubUrl = SITE_URL
    try { unsubUrl = unsubscribeUrl(opts.to) } catch { /* secret not set */ }
    const html = buildEmailHtml({
      bodyHtml: renderTemplate(tpl.body, vars),
      subject,
      language,
      unsubUrl,
      isDryRun: false,
      realRecipient: opts.to,
    })
    return await sendNurtureEmail({ apiKey: opts.apiKey, to: opts.to, subject, html, unsubUrl, isDryRun: false })
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}

/** Build the {{resourcesHtml}} list: catalog entries the contact has NOT
 *  downloaded yet. Returns null when there is nothing new to offer. */
export function buildResourcesHtml(downloadedSlugs: string[], language: 'FR' | 'EN'): string | null {
  const remaining = RESOURCE_CATALOG.filter(entry => !downloadedSlugs.some(s => entry.slugs(s)))
  if (remaining.length === 0) return null
  const items = remaining
    .map(e => `<li style="margin:0 0 10px;"><a href="${e.url}" style="color:#1A1A6B;">${e.label[language]}</a></li>`)
    .join('\n')
  return `<ul style="padding-left:20px;margin:16px 0;">\n${items}\n</ul>`
}
