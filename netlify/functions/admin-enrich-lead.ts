import type { Handler } from '@netlify/functions'
import { checkAuth } from './_analytics'
import { readCrm, writeCrm } from './_crm'

const DROPCONTACT_BASE = 'https://api.dropcontact.io'

type DropcontactEmail = { email?: string; qualification?: string }
type DropcontactResult = {
  first_name?: string
  last_name?: string
  full_name?: string
  email?: DropcontactEmail[] | string
  phone?: string[] | string
  mobile_phone?: string[] | string
  company?: string
  website?: string
  linkedin?: string
  job?: string
  job_title?: string
  civility?: string
}

type SubmitResponse = {
  success?: boolean
  request_id?: string
  error?: unknown
  reason?: string
}

type PollResponse = {
  success: boolean
  data?: DropcontactResult[]
  reason?: string
}

function pickPhone(result: DropcontactResult): string | undefined {
  const mobile = result.mobile_phone
  const fixed = result.phone
  const list: string[] = []
  if (Array.isArray(mobile)) list.push(...mobile)
  else if (typeof mobile === 'string' && mobile) list.push(mobile)
  if (Array.isArray(fixed)) list.push(...fixed)
  else if (typeof fixed === 'string' && fixed) list.push(fixed)
  return list.find(Boolean)
}

function pickEmail(result: DropcontactResult): string | undefined {
  const e = result.email
  if (typeof e === 'string') return e || undefined
  if (!Array.isArray(e)) return undefined
  const correct = e.find(x => /correct|nominative/i.test(x.qualification || ''))
  return (correct?.email) || e.find(x => x.email)?.email
}

const handler: Handler = async (event) => {
  if (!checkAuth(event.headers as Record<string, string | undefined>)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  const apiKey = process.env.DROPCONTACT_API_KEY
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'DROPCONTACT_API_KEY not configured' }),
    }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const { companyId, contactId, requestId } = body as {
      companyId: string
      contactId: string
      requestId?: string
    }

    if (!companyId || !contactId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'companyId + contactId required' }) }
    }

    const data = await readCrm()
    const company = data.companies.find(c => c.id === companyId)
    if (!company) return { statusCode: 404, body: JSON.stringify({ error: 'Company not found' }) }
    const contact = company.contacts.find(c => c.id === contactId)
    if (!contact) return { statusCode: 404, body: JSON.stringify({ error: 'Contact not found' }) }

    let activeRequestId = requestId

    // Submit a new search if no requestId provided
    if (!activeRequestId) {
      const input: Record<string, string> = {}
      if (contact.firstName) input.first_name = contact.firstName
      if (contact.lastName) input.last_name = contact.lastName
      if (!input.first_name && !input.last_name) {
        const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim()
        if (fullName) input.full_name = fullName
      }
      if (contact.linkedIn) input.linkedin = contact.linkedIn
      const companyName = (contact.company || company.name || '').trim()
      // Skip placeholder company names (e.g. when company name is just the email or person name)
      if (companyName && !companyName.includes('@')) {
        input.company = companyName
      }
      // Pass existing email only if it looks like a real address (Dropcontact will verify it)
      if (contact.email && /@/.test(contact.email) && !/(@temp|-no-email|placeholder)/i.test(contact.email)) {
        input.email = contact.email
      }

      // Dropcontact needs enough signal to find the person
      const hasMinimum = !!input.linkedin
        || !!input.email
        || ((input.first_name || input.full_name) && (input.last_name || input.company))
      if (!hasMinimum) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Données insuffisantes : il faut au moins un LinkedIn, un email, ou (nom + entreprise).',
          }),
        }
      }

      const submit = await fetch(`${DROPCONTACT_BASE}/batch`, {
        method: 'POST',
        headers: {
          'X-Access-Token': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [input],
          siren: false,
          language: 'fr',
        }),
      })
      const submitJson = (await submit.json()) as SubmitResponse
      if (!submit.ok || !submitJson.success || !submitJson.request_id) {
        return {
          statusCode: 502,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Dropcontact submit failed',
            details: submitJson.reason || submitJson.error || `HTTP ${submit.status}`,
          }),
        }
      }
      activeRequestId = submitJson.request_id
    }

    // Poll for up to ~7s (Netlify sync timeout is 10s; leave headroom)
    const startedAt = Date.now()
    const MAX_POLL_MS = 7500
    const POLL_INTERVAL_MS = 1500
    let result: DropcontactResult | null = null

    while (Date.now() - startedAt < MAX_POLL_MS) {
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS))
      const pollRes = await fetch(`${DROPCONTACT_BASE}/batch/${activeRequestId}`, {
        headers: { 'X-Access-Token': apiKey },
      })
      const pollJson = (await pollRes.json()) as PollResponse
      if (pollJson.success && pollJson.data && pollJson.data.length > 0) {
        result = pollJson.data[0]
        break
      }
      // success: false → still processing
    }

    if (!result) {
      return {
        statusCode: 202,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pending: true, requestId: activeRequestId }),
      }
    }

    // Apply enriched data — only fill empty fields, never overwrite existing data
    const now = new Date().toISOString()
    const filled: string[] = []

    if (result.first_name && !contact.firstName) {
      contact.firstName = result.first_name
      filled.push('prénom')
    }
    if (result.last_name && !contact.lastName) {
      contact.lastName = result.last_name
      filled.push('nom')
    }

    const enrichedEmail = pickEmail(result)
    if (enrichedEmail && (!contact.email || /(@temp|-no-email|placeholder)/i.test(contact.email))) {
      contact.email = enrichedEmail
      filled.push('email')
    }

    const enrichedPhone = pickPhone(result)
    if (enrichedPhone && !contact.phone) {
      contact.phone = enrichedPhone
      filled.push('téléphone')
    }

    if (result.company && !contact.company) {
      contact.company = result.company
      filled.push('entreprise')
    }
    const jobTitle = result.job_title || result.job
    if (jobTitle && !contact.jobTitle) {
      contact.jobTitle = jobTitle
      filled.push('poste')
    }
    if (result.linkedin && !contact.linkedIn) {
      contact.linkedIn = result.linkedin
      filled.push('linkedin')
    }

    contact.enrichedAt = now
    contact.enrichmentSource = 'Dropcontact'
    contact.updatedAt = now
    company.updatedAt = now

    await writeCrm(data)

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: true,
        contact,
        filled,
        hasChanges: filled.length > 0,
      }),
    }
  } catch (err) {
    console.error('admin-enrich-lead error:', err)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: String(err), stack: (err as Error)?.stack }),
    }
  }
}

export { handler }
