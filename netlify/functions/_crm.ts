import { getStore } from '@netlify/blobs'
import { SEED_CONTACTS } from './_crm-seed'

export const CRM_STATUSES = [
  'Non qualifié',
  'Prospect',
  'Lead',
  'Opportunité',
  'Client',
  'Lost',
] as const

export type CrmStatus = (typeof CRM_STATUSES)[number]

export type CrmContact = {
  id: string // stable id (initially = email slug)
  email: string
  firstName: string
  lastName: string
  company: string
  status: CrmStatus
  source: string // "Calendar", "Gmail", "Booking", "Brochure", "Import", "Manual"…
  notes: string
  createdAt: string
  updatedAt: string
}

export type CrmData = {
  contacts: CrmContact[]
  seeded?: boolean
}

const SITE_ID = '266ec893-0de7-4f86-9559-e80fa4a1e3d7'

function getCrmStore() {
  const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_API_TOKEN
  const siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID || SITE_ID
  if (token) {
    return getStore({ name: 'crm', siteID, token })
  }
  return getStore({ name: 'crm' })
}

function makeId(email: string): string {
  return email.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `c-${Date.now()}`
}

export async function readCrm(): Promise<CrmData> {
  const store = getCrmStore()
  const raw = (await store.get('data', { type: 'json' })) as CrmData | null
  if (!raw || !raw.seeded || !Array.isArray(raw.contacts)) {
    // First access → seed with CSV import
    const now = new Date().toISOString()
    const contacts: CrmContact[] = SEED_CONTACTS.map(s => ({
      id: makeId(s.email),
      email: s.email,
      firstName: s.firstName,
      lastName: s.lastName,
      company: s.company,
      status: 'Non qualifié',
      source: s.source || 'Import',
      notes: '',
      createdAt: now,
      updatedAt: now,
    }))
    const data: CrmData = { contacts, seeded: true }
    await store.setJSON('data', data)
    return data
  }
  return raw
}

export async function writeCrm(data: CrmData): Promise<void> {
  const store = getCrmStore()
  await store.setJSON('data', { ...data, seeded: true })
}

/**
 * Upsert a contact by email.
 * - If the email already exists → updates firstName/lastName/company/source if missing,
 *   and sets status to `forceStatus` if provided (used by booking flow to mark as "Lead").
 * - If not → creates a new contact with the given status (default "Non qualifié").
 */
export async function upsertContact(
  input: {
    email: string
    firstName?: string
    lastName?: string
    company?: string
    source?: string
    status?: CrmStatus
    notes?: string
  },
  forceStatus?: CrmStatus,
): Promise<void> {
  try {
    const data = await readCrm()
    const email = input.email.trim().toLowerCase()
    if (!email) return

    const existing = data.contacts.find(c => c.email.toLowerCase() === email)
    const now = new Date().toISOString()

    if (existing) {
      existing.firstName = existing.firstName || input.firstName || ''
      existing.lastName = existing.lastName || input.lastName || ''
      existing.company = existing.company || input.company || ''
      if (input.source && !existing.source.includes(input.source)) {
        existing.source = existing.source ? `${existing.source}, ${input.source}` : input.source
      }
      if (forceStatus) {
        existing.status = forceStatus
      }
      if (input.notes) {
        existing.notes = existing.notes ? `${existing.notes}\n${input.notes}` : input.notes
      }
      existing.updatedAt = now
    } else {
      data.contacts.push({
        id: makeId(email),
        email,
        firstName: input.firstName || '',
        lastName: input.lastName || '',
        company: input.company || '',
        status: forceStatus || input.status || 'Non qualifié',
        source: input.source || 'Manual',
        notes: input.notes || '',
        createdAt: now,
        updatedAt: now,
      })
    }

    await writeCrm(data)
  } catch (err) {
    console.error('upsertContact error:', err)
  }
}
