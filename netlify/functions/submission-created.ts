import type { Handler } from '@netlify/functions'
import { recordEvent } from './_analytics'
import { upsertContact } from './_crm'
import { JOURNALISTES_SHEET_URL } from './_journalistes'

/**
 * Netlify Forms event handler. Dispatches by form name (brochure | journalistes).
 * Always sends a lead-notification email to Clément. The journalistes branch
 * also upserts the lead into the CRM with status "Lead".
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

    console.log('submission-created:', { formName, firstName, lastName, email, source, slug })

    if (!formName) {
      console.warn('submission-created: missing form_name, ignoring')
      return { statusCode: 200, body: 'OK (no form_name)' }
    }

    if (formName === 'journalistes') {
      return handleJournalistes({ firstName, lastName, email, source })
    }
    if (formName === 'brochure') {
      return handleBrochure({ firstName, lastName, email, company, phone })
    }
    if (formName === 'data-download') {
      return handleDataDownload({ firstName, lastName, email, phone, company, source, slug })
    }

    console.warn('submission-created: unknown form_name', formName)
    return { statusCode: 200, body: `OK (unknown form: ${formName})` }
  } catch (err) {
    console.error('submission-created error:', err)
    return { statusCode: 500, body: String(err) }
  }
}

async function handleBrochure(d: {
  firstName: string; lastName: string; email: string; company: string; phone: string
}) {
  await recordEvent({ type: 'brochure', ...d })

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

export { handler }
