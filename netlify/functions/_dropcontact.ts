/**
 * Dropcontact API helpers — shared between admin-enrich-lead (manual button)
 * and admin-crm create-contact (autoEnrich flow from linkedin-sync skill).
 *
 * Two-step flow per Dropcontact spec:
 *   1. POST /batch     → returns { request_id }
 *   2. GET  /batch/:id → returns { success, data } once processing is complete
 *
 * Processing time varies (1s for cached LinkedIn URLs, up to several minutes
 * for fresh queries). Netlify functions cap at 10s, so the long path is:
 *   - autoEnrich on create-contact → submit only, store request_id, return
 *   - admin-enrich-lead (manual)   → submit + poll up to 7s, return 202 if pending
 *   - resolve-pending-enrichments  → poll all stored request_ids in one pass
 */

import type { CrmContact, CrmCompany } from './_crm'

const DROPCONTACT_BASE = 'https://api.dropcontact.io'

export type DropcontactInput = {
  first_name?: string
  last_name?: string
  full_name?: string
  email?: string
  linkedin?: string
  company?: string
  website?: string
}

type DropcontactEmail = { email?: string; qualification?: string }
export type DropcontactResult = {
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

/** Build a Dropcontact input from a CRM contact + its parent company name.
 *  Returns null if there's not enough signal for the API. */
export function buildInputFromContact(
  contact: CrmContact,
  companyName: string,
): DropcontactInput | null {
  const input: DropcontactInput = {}
  if (contact.firstName) input.first_name = contact.firstName
  if (contact.lastName) input.last_name = contact.lastName
  if (!input.first_name && !input.last_name) {
    const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim()
    if (fullName) input.full_name = fullName
  }
  if (contact.linkedIn) input.linkedin = contact.linkedIn

  const company = (contact.company || companyName || '').trim()
  if (company && !company.includes('@')) input.company = company

  if (contact.email && /@/.test(contact.email)
      && !/(linkedin\.placeholder|@temp|-no-email|placeholder)/i.test(contact.email)) {
    input.email = contact.email
  }

  const hasMinimum = !!input.linkedin
    || !!input.email
    || ((input.first_name || input.full_name) && (input.last_name || input.company))
  return hasMinimum ? input : null
}

/** Submit a search to Dropcontact. Returns the request_id (no poll). */
export async function submitDropcontactSearch(
  apiKey: string,
  input: DropcontactInput,
): Promise<{ requestId: string } | { error: string }> {
  const res = await fetch(`${DROPCONTACT_BASE}/batch`, {
    method: 'POST',
    headers: {
      'X-Access-Token': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: [input], siren: false, language: 'fr' }),
  })
  const json = (await res.json().catch(() => ({}))) as SubmitResponse
  if (!res.ok || !json.success || !json.request_id) {
    return { error: json.reason || String(json.error || `HTTP ${res.status}`) }
  }
  return { requestId: json.request_id }
}

/** Poll a request once. Returns null if still processing. */
export async function pollDropcontactOnce(
  apiKey: string,
  requestId: string,
): Promise<DropcontactResult | null> {
  const res = await fetch(`${DROPCONTACT_BASE}/batch/${requestId}`, {
    headers: { 'X-Access-Token': apiKey },
  })
  const json = (await res.json().catch(() => ({}))) as PollResponse
  if (json.success && json.data && json.data.length > 0) {
    return json.data[0]
  }
  return null
}

/** Pick the best email from a Dropcontact result. */
export function pickEmail(result: DropcontactResult): string | undefined {
  const e = result.email
  if (typeof e === 'string') return e || undefined
  if (!Array.isArray(e)) return undefined
  const correct = e.find(x => /correct|nominative/i.test(x.qualification || ''))
  return (correct?.email) || e.find(x => x.email)?.email
}

/** Pick the best phone (mobile preferred). */
export function pickPhone(result: DropcontactResult): string | undefined {
  const list: string[] = []
  const m = result.mobile_phone
  if (Array.isArray(m)) list.push(...m)
  else if (typeof m === 'string' && m) list.push(m)
  const f = result.phone
  if (Array.isArray(f)) list.push(...f)
  else if (typeof f === 'string' && f) list.push(f)
  return list.find(Boolean)
}

/** Apply a Dropcontact result to a contact. Mutates in place; never overwrites
 *  existing data. Returns the list of fields that were filled (for UI feedback).
 *  Clears enrichRequestId/enrichSubmittedAt and stamps enrichedAt. */
export function applyResultToContact(
  contact: CrmContact,
  company: CrmCompany,
  result: DropcontactResult,
): string[] {
  const filled: string[] = []
  const now = new Date().toISOString()

  if (result.first_name && !contact.firstName) {
    contact.firstName = result.first_name
    filled.push('prénom')
  }
  if (result.last_name && !contact.lastName) {
    contact.lastName = result.last_name
    filled.push('nom')
  }

  const enrichedEmail = pickEmail(result)
  if (enrichedEmail
      && (!contact.email
          || /(linkedin\.placeholder|@temp|-no-email|placeholder)/i.test(contact.email))) {
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
  contact.enrichRequestId = undefined
  contact.enrichSubmittedAt = undefined
  contact.updatedAt = now
  company.updatedAt = now

  return filled
}
