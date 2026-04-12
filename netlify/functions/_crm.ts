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

/** Priority index: higher = more advanced in pipeline */
const STATUS_PRIORITY: Record<CrmStatus, number> = {
  'Non qualifié': 0,
  'Prospect': 1,
  'Lead': 2,
  'Opportunité': 3,
  'Client': 4,
  'Lost': -1,
}

export type CrmContact = {
  id: string
  email: string
  firstName: string
  lastName: string
  source: string
  notes: string
  createdAt: string
  updatedAt: string
}

export type CrmCompany = {
  id: string
  name: string
  status: CrmStatus
  contacts: CrmContact[]
  notes: string
  createdAt: string
  updatedAt: string
}

export type CrmData = {
  companies: CrmCompany[]
  seeded?: boolean
  version?: number // 2 = company-based
}

// Legacy flat format (version 1)
type CrmDataV1 = {
  contacts: {
    id: string
    email: string
    firstName: string
    lastName: string
    company: string
    status: CrmStatus
    source: string
    notes: string
    createdAt: string
    updatedAt: string
  }[]
  seeded?: boolean
  version?: number
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

function makeId(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `c-${Date.now()}`
}

function makeCompanyId(name: string): string {
  return 'co-' + makeId(name || `unknown-${Date.now()}`)
}

/**
 * Migrate v1 (flat contacts) → v2 (company-based).
 * Groups contacts by company. If any contact had a status ≠ "Non qualifié",
 * the company inherits the most advanced status.
 */
function migrateV1toV2(v1: CrmDataV1): CrmData {
  const groups = new Map<string, CrmDataV1['contacts']>()

  for (const c of v1.contacts) {
    const key = (c.company || '').trim() || `__solo_${c.email}`
    const list = groups.get(key) || []
    list.push(c)
    groups.set(key, list)
  }

  const companies: CrmCompany[] = []
  const now = new Date().toISOString()

  for (const [key, contacts] of groups) {
    const isSolo = key.startsWith('__solo_')
    const companyName = isSolo
      ? contacts.map(c => [c.firstName, c.lastName].filter(Boolean).join(' ')).join(', ') || contacts[0].email
      : key

    // Determine company status: pick the most advanced non-"Non qualifié" status
    let bestStatus: CrmStatus = 'Non qualifié'
    let bestPriority = -2
    for (const c of contacts) {
      const p = STATUS_PRIORITY[c.status] ?? 0
      if (c.status !== 'Non qualifié' && p > bestPriority) {
        bestStatus = c.status
        bestPriority = p
      }
    }

    companies.push({
      id: makeCompanyId(companyName),
      name: companyName,
      status: bestStatus,
      notes: '',
      createdAt: contacts[0]?.createdAt || now,
      updatedAt: contacts[0]?.updatedAt || now,
      contacts: contacts.map(c => ({
        id: c.id || makeId(c.email),
        email: c.email,
        firstName: c.firstName,
        lastName: c.lastName,
        source: c.source || 'Import',
        notes: c.notes || '',
        createdAt: c.createdAt || now,
        updatedAt: c.updatedAt || now,
      })),
    })
  }

  return { companies, seeded: true, version: 2 }
}

/**
 * Seed from CSV, grouping by company.
 */
function seedFromCsv(): CrmData {
  const now = new Date().toISOString()
  const groups = new Map<string, typeof SEED_CONTACTS>()

  for (const s of SEED_CONTACTS) {
    const key = (s.company || '').trim() || `__solo_${s.email}`
    const list = groups.get(key) || []
    list.push(s)
    groups.set(key, list)
  }

  const companies: CrmCompany[] = []

  for (const [key, seeds] of groups) {
    const isSolo = key.startsWith('__solo_')
    const companyName = isSolo
      ? seeds.map(s => [s.firstName, s.lastName].filter(Boolean).join(' ')).join(', ') || seeds[0].email
      : key

    companies.push({
      id: makeCompanyId(companyName),
      name: companyName,
      status: 'Non qualifié',
      notes: '',
      createdAt: now,
      updatedAt: now,
      contacts: seeds.map(s => ({
        id: makeId(s.email),
        email: s.email,
        firstName: s.firstName,
        lastName: s.lastName,
        source: s.source || 'Import',
        notes: '',
        createdAt: now,
        updatedAt: now,
      })),
    })
  }

  return { companies, seeded: true, version: 2 }
}

export async function readCrm(): Promise<CrmData> {
  const store = getCrmStore()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (await store.get('data', { type: 'json' })) as any | null

  if (!raw || !raw.seeded) {
    // First access → seed
    const data = seedFromCsv()
    await store.setJSON('data', data)
    return data
  }

  // Check if it's v1 (has "contacts" array at root) → migrate
  if (raw.version !== 2 && Array.isArray(raw.contacts)) {
    const migrated = migrateV1toV2(raw as CrmDataV1)
    await store.setJSON('data', migrated)
    return migrated
  }

  return raw as CrmData
}

export async function writeCrm(data: CrmData): Promise<void> {
  const store = getCrmStore()
  await store.setJSON('data', { ...data, seeded: true, version: 2 })
}

/**
 * Upsert a contact by email, grouped under a company.
 * - If the email exists → updates fields, optionally upgrades company status.
 * - If not → creates contact in matching company (or creates company).
 * `forceStatus` sets the company status (used by booking → "Lead").
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

    const now = new Date().toISOString()

    // Find existing contact across all companies
    let found = false
    for (const co of data.companies) {
      const existing = co.contacts.find(c => c.email.toLowerCase() === email)
      if (existing) {
        existing.firstName = existing.firstName || input.firstName || ''
        existing.lastName = existing.lastName || input.lastName || ''
        if (input.source && !existing.source.includes(input.source)) {
          existing.source = existing.source ? `${existing.source}, ${input.source}` : input.source
        }
        if (input.notes) {
          existing.notes = existing.notes ? `${existing.notes}\n${input.notes}` : input.notes
        }
        existing.updatedAt = now
        if (forceStatus) {
          co.status = forceStatus
          co.updatedAt = now
        }
        found = true
        break
      }
    }

    if (!found) {
      const companyName = (input.company || '').trim()
      const status = forceStatus || input.status || 'Non qualifié'

      // Find or create company
      let company = companyName
        ? data.companies.find(co => co.name.toLowerCase() === companyName.toLowerCase())
        : undefined

      if (!company) {
        const name = companyName || [input.firstName, input.lastName].filter(Boolean).join(' ') || email
        company = {
          id: makeCompanyId(name),
          name,
          status,
          notes: '',
          contacts: [],
          createdAt: now,
          updatedAt: now,
        }
        data.companies.push(company)
      }

      if (forceStatus) {
        company.status = forceStatus
        company.updatedAt = now
      }

      company.contacts.push({
        id: makeId(email),
        email,
        firstName: input.firstName || '',
        lastName: input.lastName || '',
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
