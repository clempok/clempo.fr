import { getStore } from '@netlify/blobs'
import { SEED_CONTACTS, LEMCAL_CONTACTS } from './_crm-seed'

export const CRM_STATUSES = [
  'Non qualifié',
  'Prospect',
  'Lead',
  'Opportunité',
  'Client',
  'Lost',
] as const

export type CrmStatus = (typeof CRM_STATUSES)[number]

export const CONTACT_LANGUAGES = ['FR', 'EN'] as const
export type ContactLanguage = (typeof CONTACT_LANGUAGES)[number]

export const COMPANY_SIZES = ['Startup', 'Scaleup', 'ETI', 'Grand groupe'] as const
export type CompanySize = (typeof COMPANY_SIZES)[number]

export const COMPANY_LOCATIONS = ['FR', 'Europe_US', 'Autre'] as const
export type CompanyLocation = (typeof COMPANY_LOCATIONS)[number]

export const COMPANY_SECTORS = ['LogicielsSante', 'MedTechBioPharma', 'SanteB2C', 'Autre'] as const
export type CompanySector = (typeof COMPANY_SECTORS)[number]

/** Priority index: higher = more advanced in pipeline */
const STATUS_PRIORITY: Record<CrmStatus, number> = {
  'Non qualifié': 0,
  'Prospect': 1,
  'Lead': 2,
  'Opportunité': 3,
  'Client': 4,
  'Lost': -1,
}

export type CrmContactVisit = {
  ts: string   // ISO
  path: string // e.g. "/articles/marketing-healthtech"
}

export type CrmContact = {
  id: string
  email: string
  firstName: string
  lastName: string
  source: string
  notes: string
  linkedIn?: string
  phone?: string
  jobTitle?: string
  company?: string
  /** Preferred outreach language. Auto-detected on create (".fr" TLD or
   *  French diacritics → FR, else EN) and editable in the admin. */
  language?: ContactLanguage
  /** ISO timestamp of the last successful Dropcontact enrichment, plus the
   *  request_id for traceability. Lets the UI surface "Enriched on X" and
   *  rate-limit re-enrichments. */
  enrichedAt?: string
  enrichmentSource?: string
  /** Dropcontact request_id stored when an enrichment was kicked off but not
   *  yet resolved (autoEnrich on create-contact, or pending poll). Cleared
   *  once the result is applied to the contact. */
  enrichRequestId?: string
  enrichSubmittedAt?: string
  createdAt: string
  updatedAt: string
  /** Last 50 page visits from clempo.fr when the visitor has the CID cookie. */
  visits?: CrmContactVisit[]
  /** ISO timestamp of the last visit-alert email sent for this contact. */
  lastVisitAlertAt?: string
  /** Notion page ID in the Contacts mirror DB, filled by notion-sync. */
  notionPageId?: string
  /** ISO timestamp of the last successful push to Notion. Compared against
   *  updatedAt to detect records that need re-patching. */
  notionSyncedAt?: string
}

export type CrmTask = {
  id: string
  title: string
  dueDate: string // YYYY-MM-DD
  description: string
  done: boolean
  createdAt: string
  updatedAt: string
}

export type CrmStatusHistoryEntry = {
  status: CrmStatus
  at: string // ISO timestamp of when the company entered this status
}

export type CrmCompany = {
  id: string
  name: string
  status: CrmStatus
  contacts: CrmContact[]
  tasks: CrmTask[]
  notes: string
  createdAt: string
  updatedAt: string
  /** Scoring attributes — drive computeCompanyScore. All optional so legacy
   *  records stay valid; UI shows a 0/dash badge until renseigned. */
  size?: CompanySize
  location?: CompanyLocation
  sector?: CompanySector
  /**
   * Chronological log of status transitions, used by the Analytics funnel.
   * Back-filled on read for legacy companies created before this field existed
   * (initial entry = current status at createdAt).
   */
  statusHistory?: CrmStatusHistoryEntry[]
  /** Notion page ID in the Companies mirror DB, filled by notion-sync. */
  notionPageId?: string
  /** ISO timestamp of the last successful push to Notion. Compared against
   *  updatedAt to detect records that need re-patching. */
  notionSyncedAt?: string
}

const SIZE_PTS: Record<CompanySize, number> = { Startup: 4, Scaleup: 10, ETI: 16, 'Grand groupe': 20 }
const LOCATION_PTS: Record<CompanyLocation, number> = { FR: 20, Europe_US: 12, Autre: 4 }
const SECTOR_PTS: Record<CompanySector, number> = { LogicielsSante: 20, MedTechBioPharma: 14, SanteB2C: 8, Autre: 2 }

export type HierarchyLevel = 'Founder' | 'CLevel' | 'Manager' | 'Other'
const HIERARCHY_PTS: Record<HierarchyLevel, number> = { Founder: 20, CLevel: 13, Manager: 6, Other: 0 }

/** Map a single job title to a hierarchy bucket. Order matters: founder > C-level > manager. */
export function classifyJobTitle(title: string | undefined): HierarchyLevel | null {
  if (!title) return null
  const t = title.toLowerCase()
  if (/founder|fondateur|fondatrice|co-?founder|co-?fondateur|cofounder|cofondateur/.test(t)) return 'Founder'
  if (/\bceo\b|\bcto\b|\bcfo\b|\bcoo\b|\bcmo\b|\bcpo\b|\bcro\b|\bcio\b|chief\s+\w+\s+officer|chief\s+\w+|\bpdg\b|\bdg\b|directeur\s+g[eé]n[eé]ral|directrice\s+g[eé]n[eé]rale|\bvp\b|vice\s*-?\s*pr[eé]sident|head\s+of\s+/.test(t)) return 'CLevel'
  if (/manager|director|directeur|directrice|lead\b|responsable|\bhead\b/.test(t)) return 'Manager'
  return 'Other'
}

/** Pick the best hierarchy tier across all contacts of the company. */
export function bestHierarchy(co: CrmCompany): HierarchyLevel | null {
  let best: HierarchyLevel | null = null
  const rank: Record<HierarchyLevel, number> = { Founder: 3, CLevel: 2, Manager: 1, Other: 0 }
  for (const c of co.contacts) {
    const h = classifyJobTitle(c.jobTitle)
    if (!h) continue
    if (!best || rank[h] > rank[best]) best = h
  }
  return best
}

export type CompanyScore = {
  total: number
  size: number
  location: number
  sector: number
  hierarchy: number
  engagement: number
  hierarchyLevel: HierarchyLevel | null
}

export function computeCompanyScore(co: CrmCompany): CompanyScore {
  const size = co.size ? SIZE_PTS[co.size] : 0
  const location = co.location ? LOCATION_PTS[co.location] : 0
  const sector = co.sector ? SECTOR_PTS[co.sector] : 0

  const hierarchyLevel = bestHierarchy(co)
  const hierarchy = hierarchyLevel ? HIERARCHY_PTS[hierarchyLevel] : 0

  let engagement = 0
  for (const c of co.contacts) {
    engagement += Math.min(c.visits?.length || 0, 8)
    const src = (c.source || '').toLowerCase()
    if (src.includes('brochure')) engagement += 3
    if (src.includes('lemcal')) engagement += 2
  }
  engagement = Math.min(engagement, 20)

  return {
    total: size + location + sector + hierarchy + engagement,
    size, location, sector, hierarchy, engagement, hierarchyLevel,
  }
}

export function detectLanguage(input: { email?: string; firstName?: string }): ContactLanguage {
  const email = (input.email || '').toLowerCase()
  if (email.endsWith('.fr')) return 'FR'
  if (/[éèêëàâäîïôöûüç]/i.test(input.firstName || '')) return 'FR'
  return 'EN'
}

export type CrmData = {
  companies: CrmCompany[]
  seeded?: boolean
  lemcalSeeded?: boolean
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
      tasks: [],
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
      tasks: [],
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

  // Also merge Lemcal contacts into initial seed
  mergeLemcalInto({ companies, seeded: true, version: 2 })

  return { companies, seeded: true, lemcalSeeded: true, version: 2 }
}

/**
 * Merge Lemcal contacts into existing CRM data.
 * - If a contact email already exists and company status ≠ "Non qualifié" → keep status
 * - If contact exists but company status == "Non qualifié" → set to "Opportunité"
 * - If contact is new → create with "Opportunité"
 * Skips owner email.
 */
function mergeLemcalInto(data: CrmData): void {
  const now = new Date().toISOString()
  const SKIP_EMAILS = ['c.pougetosmont@gmail.com', 'clement.pougetosmont@gmail.com']

  for (const lc of LEMCAL_CONTACTS) {
    const email = lc.email.toLowerCase()
    if (SKIP_EMAILS.includes(email)) continue

    // Build notes from Lemcal data
    const noteParts: string[] = []
    if (lc.rdvDate) noteParts.push(`RDV ${lc.rdvDate} — ${lc.rdvType || 'Meeting'}`)
    if (lc.notes) noteParts.push(lc.notes)
    const noteText = noteParts.join('\n')

    // Find existing contact across all companies
    let found = false
    for (const co of data.companies) {
      const existing = co.contacts.find(c => c.email.toLowerCase() === email)
      if (existing) {
        // Enrich existing contact
        existing.firstName = existing.firstName || lc.firstName
        existing.lastName = existing.lastName || lc.lastName
        if (!existing.source.includes('Lemcal')) {
          existing.source = existing.source ? `${existing.source}, Lemcal` : 'Lemcal'
        }
        if (lc.linkedIn) existing.linkedIn = lc.linkedIn
        if (noteText && !existing.notes.includes(noteText)) {
          existing.notes = existing.notes ? `${existing.notes}\n${noteText}` : noteText
        }
        existing.updatedAt = now

        // Status rule: keep if != "Non qualifié", else set to "Opportunité"
        if (co.status === 'Non qualifié') {
          if (!co.statusHistory || co.statusHistory.length === 0) {
            co.statusHistory = [{ status: co.status, at: co.createdAt || now }]
          }
          co.statusHistory.push({ status: 'Opportunité', at: now })
          co.status = 'Opportunité'
          co.updatedAt = now
        }
        found = true
        break
      }
    }

    if (!found) {
      const companyName = lc.company || [lc.firstName, lc.lastName].filter(Boolean).join(' ') || email

      // Try to find existing company by name (case-insensitive)
      let company = data.companies.find(
        co => co.name.toLowerCase() === companyName.toLowerCase(),
      )

      if (company) {
        // Add contact to existing company
        company.contacts.push({
          id: makeId(email),
          email,
          firstName: lc.firstName,
          lastName: lc.lastName,
          source: 'Lemcal',
          notes: noteText,
          linkedIn: lc.linkedIn || undefined,
          createdAt: now,
          updatedAt: now,
        })
        // Status rule
        if (company.status === 'Non qualifié') {
          if (!company.statusHistory || company.statusHistory.length === 0) {
            company.statusHistory = [{ status: company.status, at: company.createdAt || now }]
          }
          company.statusHistory.push({ status: 'Opportunité', at: now })
          company.status = 'Opportunité'
          company.updatedAt = now
        }
      } else {
        // Create new company + contact
        data.companies.push({
          id: makeCompanyId(companyName),
          name: companyName,
          status: 'Opportunité',
          notes: '',
          tasks: [],
          createdAt: now,
          updatedAt: now,
          statusHistory: [{ status: 'Opportunité', at: now }],
          contacts: [{
            id: makeId(email),
            email,
            firstName: lc.firstName,
            lastName: lc.lastName,
            source: 'Lemcal',
            notes: noteText,
            linkedIn: lc.linkedIn || undefined,
            createdAt: now,
            updatedAt: now,
          }],
        })
      }
    }
  }
}

export async function readCrm(): Promise<CrmData> {
  const store = getCrmStore()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (await store.get('data', { type: 'json' })) as any | null

  if (!raw || !raw.seeded) {
    // First access → seed (includes Lemcal)
    const data = seedFromCsv()
    await store.setJSON('data', data)
    return data
  }

  // Check if it's v1 (has "contacts" array at root) → migrate
  if (raw.version !== 2 && Array.isArray(raw.contacts)) {
    const migrated = migrateV1toV2(raw as CrmDataV1)
    // Then also merge Lemcal
    mergeLemcalInto(migrated)
    migrated.lemcalSeeded = true
    await store.setJSON('data', migrated)
    return migrated
  }

  // v2 but Lemcal not yet merged → merge now
  if (!raw.lemcalSeeded) {
    const data = raw as CrmData
    mergeLemcalInto(data)
    data.lemcalSeeded = true
    await writeCrm(data)
    return data
  }

  const data = raw as CrmData
  // Backfill tasks array + statusHistory for companies that predate these features
  let needsWrite = false
  for (const co of data.companies) {
    if (!co.tasks) {
      co.tasks = []
      needsWrite = true
    }
    if (!co.statusHistory || co.statusHistory.length === 0) {
      // Seed history with the current status at creation time. This is an
      // approximation — for companies that already went through transitions
      // before this field existed, we can't recover the intermediate states.
      co.statusHistory = [{ status: co.status, at: co.createdAt || new Date().toISOString() }]
      needsWrite = true
    }
  }
  if (needsWrite) await writeCrm(data)
  return data
}

export async function writeCrm(data: CrmData): Promise<void> {
  const store = getCrmStore()
  await store.setJSON('data', { ...data, seeded: true, lemcalSeeded: true, version: 2 })
}

/**
 * Add a task to the company that owns a given contact email.
 * If no company found, does nothing.
 */
export async function addTaskToContactCompany(
  email: string,
  task: { title: string; dueDate: string; description?: string },
): Promise<void> {
  try {
    const data = await readCrm()
    const normalizedEmail = email.trim().toLowerCase()
    const now = new Date().toISOString()

    for (const co of data.companies) {
      if (co.contacts.some(c => c.email.toLowerCase() === normalizedEmail)) {
        if (!co.tasks) co.tasks = []
        co.tasks.push({
          id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: task.title,
          dueDate: task.dueDate,
          description: task.description || '',
          done: false,
          createdAt: now,
          updatedAt: now,
        })
        co.updatedAt = now
        await writeCrm(data)
        return
      }
    }
  } catch (err) {
    console.error('addTaskToContactCompany error:', err)
  }
}

/**
 * Upsert a contact by email, grouped under a company.
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
        if (forceStatus && co.status !== forceStatus) {
          if (!co.statusHistory || co.statusHistory.length === 0) {
            co.statusHistory = [{ status: co.status, at: co.createdAt || now }]
          }
          co.statusHistory.push({ status: forceStatus, at: now })
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
          tasks: [],
          contacts: [],
          createdAt: now,
          updatedAt: now,
          statusHistory: [{ status, at: now }],
        }
        data.companies.push(company)
      }

      if (forceStatus && company.status !== forceStatus) {
        if (!company.statusHistory || company.statusHistory.length === 0) {
          company.statusHistory = [{ status: company.status, at: company.createdAt || now }]
        }
        company.statusHistory.push({ status: forceStatus, at: now })
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
