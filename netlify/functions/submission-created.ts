import type { Handler } from '@netlify/functions'
import { recordEvent } from './_analytics'
import { upsertContact, addPendingNps } from './_crm'
import { JOURNALISTES_SHEET_URL } from './_journalistes'
import { DECIDEURS_HOSPITALIERS_SHEET_URL } from './_decideurs-hospitaliers'
import { sendResourceDeliveryEmail } from './_email-templates'
import type { ResourceLink } from './_email-templates'

const SITE_URL = 'https://www.clempo.fr'

/**
 * Netlify Forms event handler. Dispatches by form name (brochure | journalistes).
 * Always sends a lead-notification email to Clément. The journalistes branch
 * also upserts the lead into the CRM with status "Lead".
 *
 * Every lead-magnet branch also emails the resource to the lead itself
 * (editable "resource-delivery" template, admin Emails tab) — people kept
 * losing the file when they only had it on the success screen.
 */
const handler: Handler = async (event) => {
  try {
    const raw = JSON.parse(event.body || '{}')
    // Function trigger sends `{ payload: {...}, site: {...} }`; outgoing
    // webhook sends the fields flat at root. Unwrap whichever shape we got.
    const payload = raw.payload && typeof raw.payload === 'object' ? raw.payload : raw
    const formName = payload.form_name || payload.formName || ''
    const data = payload.data || {}

    const firstName = data['first-name'] || data.firstName || payload.first_name || ''
    const lastName = data['last-name'] || data.lastName || payload.last_name || ''
    const company = data.company || payload.company || ''
    const email = data.email || payload.email || ''
    const phone = data.phone || payload.phone || ''
    const source = data.source || ''
    const slug = data.slug || ''
    const lang: 'FR' | 'EN' = String(data.lang || '').toUpperCase() === 'EN' ? 'EN' : 'FR'

    // Hiring-only fields
    const school = data.school || ''
    const startDate = data['start-date'] || ''
    const durationMonths = data['duration-months'] || ''
    const linkedin = data.linkedin || ''
    const contentLinks = data['content-links'] || ''
    const healthLink = data['health-link'] || ''
    const aiLinks = data['ai-links'] || ''
    const message = data.message || ''
    // Netlify Forms stores uploaded files as URLs in the payload data.
    // For files, it can be either a plain URL string or an object {url, filename, size, type}.
    const hiringFiles = collectHiringFiles(data)

    console.log('submission-created:', { formName, firstName, lastName, email, source, slug })

    if (!formName) {
      console.warn('submission-created: missing form_name, ignoring')
      return { statusCode: 200, body: 'OK (no form_name)' }
    }

    if (formName === 'journalistes') {
      return handleJournalistes({ firstName, lastName, email, source })
    }
    if (formName === 'decideurs-hospitaliers') {
      return handleDecideursHospitaliers({ firstName, lastName, email, company, source })
    }
    if (formName === 'brochure') {
      return handleBrochure({ firstName, lastName, email, company, phone, lang })
    }
    if (formName === 'data-download') {
      return handleDataDownload({ firstName, lastName, email, phone, company, source, slug })
    }
    if (formName === 'hiring') {
      return handleHiring({
        firstName, lastName, email, phone,
        school, startDate, durationMonths, linkedin,
        contentLinks, healthLink, aiLinks, message,
        files: hiringFiles,
      })
    }

    console.warn('submission-created: unknown form_name', formName)
    return { statusCode: 200, body: `OK (unknown form: ${formName})` }
  } catch (err) {
    console.error('submission-created error:', err)
    return { statusCode: 500, body: String(err) }
  }
}

/** Email the resource to the lead. Failures are logged, never propagated:
 *  the success screen tells people to check their inbox, but the on-page
 *  link remains the primary delivery path. */
async function deliverResource(opts: {
  formName: string
  email: string
  firstName: string
  language?: 'FR' | 'EN'
  resourceLabel: string
  links: ResourceLink[]
}) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || !opts.email) return
  const result = await sendResourceDeliveryEmail({
    apiKey,
    to: opts.email,
    firstName: opts.firstName,
    language: opts.language,
    resourceLabel: opts.resourceLabel,
    links: opts.links,
  })
  if (!result.ok) {
    console.error(`resource-delivery error (${opts.formName}, ${opts.email}):`, result.error)
  }
}

async function handleBrochure(d: {
  firstName: string; lastName: string; email: string; company: string; phone: string; lang: 'FR' | 'EN'
}) {
  await recordEvent({ type: 'brochure', firstName: d.firstName, lastName: d.lastName, email: d.email, company: d.company, phone: d.phone })

  await deliverResource({
    formName: 'brochure',
    email: d.email,
    firstName: d.firstName,
    language: d.lang,
    resourceLabel: d.lang === 'EN' ? 'the services brochure (PDF)' : 'la brochure des services (PDF)',
    links: [{
      label: d.lang === 'EN' ? 'Download the brochure' : 'Télécharger la brochure',
      url: `${SITE_URL}/CPO-Services-2026.pdf`,
    }],
  })

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('RESEND_API_KEY not set')
    return { statusCode: 500, body: 'Missing API key' }
  }

  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #09090b; margin-bottom: 24px;">🔔 Nouveau lead — clempo.fr</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666; width: 140px;">Prénom</td><td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600;">${d.firstName}</td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Nom</td><td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600;">${d.lastName}</td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Entreprise</td><td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600;">${d.company}</td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Email</td><td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600;"><a href="mailto:${d.email}" style="color: #0066cc;">${d.email}</a></td></tr>
        <tr><td style="padding: 10px 0; color: #666;">Téléphone</td><td style="padding: 10px 0; font-weight: 600;">${d.phone}</td></tr>
      </table>
      <div style="margin-top: 28px; padding: 16px; background: #f9f9f9; border-radius: 8px; font-size: 13px; color: #888;">
        Soumis via le formulaire brochure de clempo.fr
      </div>
    </div>
  `

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Clempo.fr <noreply@clempo.fr>',
      to: ['clement.pougetosmont@gmail.com'],
      subject: 'Nouveau lead',
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Resend error (brochure):', err)
    return { statusCode: 500, body: err }
  }
  return { statusCode: 200, body: 'OK' }
}

async function handleJournalistes(d: {
  firstName: string; lastName: string; email: string; source: string
}) {
  if (!d.email) return { statusCode: 400, body: 'Missing email' }

  await Promise.all([
    recordEvent({
      type: 'journalistes',
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email,
      company: '',
    }),
    upsertContact({
      email: d.email,
      firstName: d.firstName,
      lastName: d.lastName,
      source: d.source ? `Journalistes (${d.source})` : 'Journalistes',
      status: 'Lead',
    }, 'Lead'),
  ])
  await addPendingNps(d.email, 'journalistes', 'Liste journalistes santé')

  await deliverResource({
    formName: 'journalistes',
    email: d.email,
    firstName: d.firstName,
    resourceLabel: 'la liste des journalistes santé français',
    links: [{ label: 'Ouvrir la liste', url: JOURNALISTES_SHEET_URL }],
  })

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('RESEND_API_KEY not set')
    return { statusCode: 500, body: 'Missing API key' }
  }

  const fullName = [d.firstName, d.lastName].filter(Boolean).join(' ') || d.email
  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #09090b; margin-bottom: 24px;">📋 Nouveau lead — Liste journalistes santé</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666; width: 140px;">Prénom</td><td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600;">${d.firstName}</td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Nom</td><td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600;">${d.lastName}</td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Email</td><td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600;"><a href="mailto:${d.email}" style="color: #0066cc;">${d.email}</a></td></tr>
        <tr><td style="padding: 10px 0; color: #666;">Source</td><td style="padding: 10px 0; font-weight: 600;">${d.source || '—'}</td></tr>
      </table>
      <p style="margin-top: 24px; font-size: 13px; color: #555;">
        Ressource partagée :
        <a href="${JOURNALISTES_SHEET_URL}" style="color: #0066cc;">${JOURNALISTES_SHEET_URL}</a>
      </p>
      <div style="margin-top: 24px; padding: 16px; background: #f9f9f9; border-radius: 8px; font-size: 13px; color: #888;">
        Ajouté au CRM avec statut "Lead". La visite suivante déclenchera une alerte tracking.
      </div>
    </div>
  `

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Clempo.fr <noreply@clempo.fr>',
      to: ['clement.pougetosmont@gmail.com'],
      subject: `📋 Nouveau lead journalistes — ${fullName}`,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Resend error (journalistes):', err)
    return { statusCode: 500, body: err }
  }
  return { statusCode: 200, body: 'OK' }
}

async function handleDecideursHospitaliers(d: {
  firstName: string; lastName: string; email: string; company: string; source: string
}) {
  if (!d.email) return { statusCode: 400, body: 'Missing email' }

  await Promise.all([
    recordEvent({
      type: 'decideurs-hospitaliers',
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email,
      company: d.company,
    }),
    upsertContact({
      email: d.email,
      firstName: d.firstName,
      lastName: d.lastName,
      company: d.company,
      source: d.source ? `Décideurs hospitaliers (${d.source})` : 'Décideurs hospitaliers',
      status: 'Lead',
    }, 'Lead'),
  ])
  await addPendingNps(d.email, 'decideurs-hospitaliers', 'Base décideurs hospitaliers')

  await deliverResource({
    formName: 'decideurs-hospitaliers',
    email: d.email,
    firstName: d.firstName,
    resourceLabel: 'la base des décideurs hospitaliers',
    links: [{ label: 'Ouvrir la base', url: DECIDEURS_HOSPITALIERS_SHEET_URL }],
  })

  // No per-download alert — high-volume lead magnet. The morning recap from
  // scheduled-leads-digest.ts covers visibility without burning Resend quota.
  return { statusCode: 200, body: 'OK' }
}

async function handleDataDownload(d: {
  firstName: string; lastName: string; email: string; phone: string; company: string; source: string; slug: string
}) {
  if (!d.email) return { statusCode: 400, body: 'Missing email' }

  const sourceLabel = d.source || (d.slug ? `Data ${d.slug}` : 'Data download')
  const notes = d.phone ? `Téléphone: ${d.phone}` : ''

  await Promise.all([
    recordEvent({
      type: 'data-download',
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email,
      company: d.company,
      phone: d.phone,
      source: sourceLabel,
      slug: d.slug,
    }),
    upsertContact({
      email: d.email,
      firstName: d.firstName,
      lastName: d.lastName,
      company: d.company,
      source: sourceLabel,
      notes,
      status: 'Lead',
    }, 'Lead'),
  ])
  await addPendingNps(d.email, d.slug || 'data-download', sourceLabel)

  if (d.slug) {
    await deliverResource({
      formName: 'data-download',
      email: d.email,
      firstName: d.firstName,
      // d.source is "Data Médecins Généralistes" — reword for the email body.
      resourceLabel: d.source.startsWith('Data ')
        ? `les données ${d.source.slice(5)}`
        : (d.source || `les données ${d.slug}`),
      links: [
        { label: 'Télécharger le CSV', url: `${SITE_URL}/data/specialites/${d.slug}.csv` },
        { label: 'Télécharger le XLSX', url: `${SITE_URL}/data/specialites/${d.slug}.xlsx` },
      ],
    })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('RESEND_API_KEY not set')
    return { statusCode: 200, body: 'OK (no email key)' }
  }

  const fullName = [d.firstName, d.lastName].filter(Boolean).join(' ') || d.email
  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #09090b; margin-bottom: 24px;">📊 Nouveau lead — Data ${d.slug || ''}</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666; width: 140px;">Prénom</td><td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600;">${d.firstName}</td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Nom</td><td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600;">${d.lastName}</td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Email</td><td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600;"><a href="mailto:${d.email}" style="color: #0066cc;">${d.email}</a></td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Téléphone</td><td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600;">${d.phone || '—'}</td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Entreprise</td><td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600;">${d.company || '—'}</td></tr>
        <tr><td style="padding: 10px 0; color: #666;">Spécialité</td><td style="padding: 10px 0; font-weight: 600;">${d.slug || '—'}</td></tr>
      </table>
      <div style="margin-top: 24px; padding: 16px; background: #f9f9f9; border-radius: 8px; font-size: 13px; color: #888;">
        Ajouté au CRM avec statut "Lead". Tracking actif : la prochaine visite déclenchera une alerte.
      </div>
    </div>
  `

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Clempo.fr <noreply@clempo.fr>',
      to: ['clement.pougetosmont@gmail.com'],
      subject: `📊 Nouveau lead data — ${fullName}`,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Resend error (data-download):', err)
    return { statusCode: 200, body: 'OK (email failed)' }
  }
  return { statusCode: 200, body: 'OK' }
}

type HiringFile = { label: string; url: string; filename: string; size?: number }

function collectHiringFiles(data: Record<string, unknown>): HiringFile[] {
  const out: HiringFile[] = []
  for (const key of ['cv', 'portfolio'] as const) {
    const raw = data[key]
    if (!raw) continue
    // Netlify Forms file payload can be a URL string or an object with metadata.
    if (typeof raw === 'string') {
      out.push({ label: key, url: raw, filename: filenameFromUrl(raw, key) })
    } else if (raw && typeof raw === 'object') {
      const obj = raw as Record<string, unknown>
      const url = typeof obj.url === 'string' ? obj.url : ''
      if (!url) continue
      const filename = typeof obj.filename === 'string' ? obj.filename : filenameFromUrl(url, key)
      const size = typeof obj.size === 'number' ? obj.size : undefined
      out.push({ label: key, url, filename, size })
    }
  }
  return out
}

function filenameFromUrl(url: string, fallback: string): string {
  try {
    const last = new URL(url).pathname.split('/').pop() || ''
    return decodeURIComponent(last) || fallback
  } catch {
    return fallback
  }
}

async function handleHiring(d: {
  firstName: string; lastName: string; email: string; phone: string
  school: string; startDate: string; durationMonths: string; linkedin: string
  contentLinks: string; healthLink: string; aiLinks: string; message: string
  files: HiringFile[]
}) {
  await recordEvent({
    type: 'hiring',
    firstName: d.firstName,
    lastName: d.lastName,
    email: d.email,
    company: d.school,
    phone: d.phone,
  })

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('RESEND_API_KEY not set')
    return { statusCode: 500, body: 'Missing API key' }
  }

  const fullName = [d.firstName, d.lastName].filter(Boolean).join(' ') || d.email
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const nl2br = (s: string) => esc(s).replace(/\n/g, '<br/>')

  const html = `
    <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto;">
      <h2 style="color: #09090b; margin-bottom: 8px;">🎓 Nouvelle candidature stage — clempo.fr</h2>
      <p style="color: #555; font-size: 14px; margin-top: 0; margin-bottom: 24px;">
        Candidature reçue via la page <a href="https://www.clempo.fr/hiring" style="color: #0066cc;">/hiring</a>
      </p>

      <h3 style="color: #09090b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 32px; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 8px;">Identité</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #666; width: 160px;">Prénom Nom</td><td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: 600;">${esc(fullName)}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Email</td><td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: 600;"><a href="mailto:${esc(d.email)}" style="color: #0066cc;">${esc(d.email)}</a></td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Téléphone</td><td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: 600;">${esc(d.phone) || '—'}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #666;">LinkedIn</td><td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: 600;">${d.linkedin ? `<a href="${esc(d.linkedin)}" style="color: #0066cc;">${esc(d.linkedin)}</a>` : '—'}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #666;">École / formation</td><td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: 600;">${esc(d.school) || '—'}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Date de début</td><td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: 600;">${esc(d.startDate) || '—'}</td></tr>
        <tr><td style="padding: 8px 0; color: #666;">Durée</td><td style="padding: 8px 0; font-weight: 600;">${esc(d.durationMonths) || '—'} mois</td></tr>
      </table>

      <h3 style="color: #09090b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 32px; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 8px;">📝 Condition 1 — Liens vers du contenu créé</h3>
      <div style="background: #f9f9f9; border-left: 3px solid #09090b; padding: 14px 16px; font-size: 14px; line-height: 1.6; color: #222; border-radius: 4px;">
        ${nl2br(d.contentLinks) || '<em style="color: #999;">(vide)</em>'}
      </div>

      <h3 style="color: #09090b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 8px;">🏥 Condition 2 — Lien avec la santé</h3>
      <div style="background: #f9f9f9; border-left: 3px solid #09090b; padding: 14px 16px; font-size: 14px; line-height: 1.6; color: #222; border-radius: 4px;">
        ${nl2br(d.healthLink) || '<em style="color: #999;">(vide)</em>'}
      </div>

      <h3 style="color: #09090b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 8px;">🤖 Condition 3 — Maîtrise des outils IA</h3>
      <div style="background: #f9f9f9; border-left: 3px solid #09090b; padding: 14px 16px; font-size: 14px; line-height: 1.6; color: #222; border-radius: 4px;">
        ${nl2br(d.aiLinks) || '<em style="color: #999;">(vide)</em>'}
      </div>

      ${d.message ? `
      <h3 style="color: #09090b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 8px;">Message libre</h3>
      <div style="background: #f9f9f9; padding: 14px 16px; font-size: 14px; line-height: 1.6; color: #222; border-radius: 4px;">
        ${nl2br(d.message)}
      </div>
      ` : ''}

      ${d.files.length ? `
      <h3 style="color: #09090b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 8px;">📎 Pièces jointes</h3>
      <ul style="padding-left: 18px; margin: 0; font-size: 14px; line-height: 1.7; color: #222;">
        ${d.files.map(f => `<li><strong style="text-transform: capitalize;">${esc(f.label)}</strong> — <a href="${esc(f.url)}" style="color: #0066cc;">${esc(f.filename)}</a>${f.size ? ` <span style="color:#888;">(${Math.round(f.size / 1024)} Ko)</span>` : ''}</li>`).join('')}
      </ul>
      <p style="font-size: 12px; color: #888; margin-top: 8px;">Les fichiers sont aussi joints à cet email (si l'attachement n'a pas excédé la limite Resend).</p>
      ` : ''}

      <div style="margin-top: 32px; padding: 16px; background: #f9f9f9; border-radius: 8px; font-size: 13px; color: #888;">
        Soumis via le formulaire de candidature stage de clempo.fr/hiring
      </div>
    </div>
  `

  // Fetch each uploaded file and turn it into a base64 attachment for Resend.
  // Skipped silently on fetch failure — the HTML email still links to the file.
  const attachments: { filename: string; content: string }[] = []
  for (const f of d.files) {
    try {
      const r = await fetch(f.url)
      if (!r.ok) { console.warn('hiring: failed to fetch attachment', f.url, r.status); continue }
      const buf = Buffer.from(await r.arrayBuffer())
      attachments.push({ filename: f.filename, content: buf.toString('base64') })
    } catch (err) {
      console.warn('hiring: error fetching attachment', f.url, err)
    }
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Clempo.fr <noreply@clempo.fr>',
      to: ['clement.pougetosmont@gmail.com'],
      replyTo: d.email || undefined,
      subject: `🎓 Candidature stage — ${fullName}`,
      html,
      ...(attachments.length ? { attachments } : {}),
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Resend error (hiring):', err)
    return { statusCode: 500, body: err }
  }
  return { statusCode: 200, body: 'OK' }
}

export { handler }
