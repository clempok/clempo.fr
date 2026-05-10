import type { Handler } from '@netlify/functions'
import { readCrm, writeCrm } from './_crm'

const ALERT_COOLDOWN_MS = 60 * 60 * 1000 // 1h entre deux alertes pour le même contact
const MAX_VISITS = 50

const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' }
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const body = JSON.parse(event.body || '{}') as { cid?: string; path?: string }
    if (!body.cid) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing cid' }) }

    // Decode email from CID (base64)
    let email: string
    try {
      email = atob(body.cid).toLowerCase().trim()
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid cid' }) }
    }
    if (!email || !email.includes('@')) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid email in cid' }) }
    }

    const path = typeof body.path === 'string' && body.path.startsWith('/') ? body.path.slice(0, 128) : '/'
    const now = new Date().toISOString()

    const data = await readCrm()

    // Find contact across all companies
    let foundContact = null
    let foundCompany = null
    for (const co of data.companies) {
      const contact = co.contacts.find(c => c.email.toLowerCase() === email)
      if (contact) {
        foundContact = contact
        foundCompany = co
        break
      }
    }

    if (!foundContact || !foundCompany) {
      // Unknown visitor — nothing to track in CRM
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, known: false }) }
    }

    // Log the visit
    if (!foundContact.visits) foundContact.visits = []
    foundContact.visits.push({ ts: now, path })
    if (foundContact.visits.length > MAX_VISITS) {
      foundContact.visits = foundContact.visits.slice(-MAX_VISITS)
    }
    foundContact.updatedAt = now

    // Decide whether to send an alert
    const shouldAlert =
      !foundContact.lastVisitAlertAt ||
      Date.now() - new Date(foundContact.lastVisitAlertAt).getTime() > ALERT_COOLDOWN_MS

    if (shouldAlert) {
      foundContact.lastVisitAlertAt = now
      await writeCrm(data)
      await sendAlertEmail({ contact: foundContact, company: foundCompany.name, path, now })
    } else {
      await writeCrm(data)
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, known: true, alerted: shouldAlert }) }
  } catch (err) {
    console.error('track-crm-visit error:', err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: String(err) }) }
  }
}

async function sendAlertEmail(opts: {
  contact: { firstName: string; lastName: string; email: string }
  company: string
  path: string
  now: string
}) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  const { contact, company, path, now } = opts
  const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || contact.email
  const pageLabel = path === '/' ? 'Accueil' : path
  const time = new Date(now).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })

  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #09090b; margin-bottom: 8px;">👀 Visite CRM — clempo.fr</h2>
      <p style="color: #555; margin-bottom: 24px; font-size: 14px;">${time}</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666; width: 120px;">Contact</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600;">${name}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Email</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
            <a href="mailto:${contact.email}" style="color: #0066cc;">${contact.email}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Entreprise</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600;">${company}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #666;">Page visitée</td>
          <td style="padding: 10px 0; font-weight: 600;">
            <a href="https://www.clempo.fr${path}" style="color: #0066cc;">${pageLabel}</a>
          </td>
        </tr>
      </table>
      <div style="margin-top: 24px;">
        <a href="https://www.clempo.fr/admin" style="display: inline-block; background: #0A0A0B; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px;">Ouvrir le CRM →</a>
      </div>
    </div>
  `

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Clempo.fr <noreply@clempo.fr>',
      to: ['clement.pougetosmont@gmail.com'],
      subject: `👀 ${name} (${company}) visite clempo.fr`,
      html,
    }),
  }).catch(err => console.error('Resend alert error:', err))
}

export { handler }
