import type { Handler } from '@netlify/functions'
import { readCrm, writeCrm } from './_crm'

/**
 * Enregistre la visite d'un contact connu (cookie CID). N'ENVOIE PLUS D'EMAIL :
 * les visites sont remontées une fois par jour par scheduled-leads-digest.ts.
 *
 * Pourquoi : le quota Resend (100 emails/jour, tous usages confondus) était
 * absorbé par les alertes unitaires — 34 le 16/07 au lancement de la base
 * influenceurs — au détriment des séquences NPS et nurture, qui restaient
 * bloquées « en attente » jusqu'à expirer. Seule la prise de RDV reste
 * notifiée en temps réel (book-meeting.ts).
 */
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

    await writeCrm(data)

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, known: true }) }
  } catch (err) {
    console.error('track-crm-visit error:', err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: String(err) }) }
  }
}

export { handler }
