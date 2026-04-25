import {
  readCrm,
  writeCrm,
  type CrmCompany,
  type CrmContact,
} from './_crm'

const NOTION_API = 'https://api.notion.com/v1'
const NOTION_VERSION = '2022-06-28'
const ADMIN_BASE = 'https://www.clempo.fr/admin'

type NotionRichText = { plain_text?: string; text?: { content?: string } }
type NotionPage = {
  id: string
  url?: string
  properties: Record<string, {
    title?: NotionRichText[]
    rich_text?: NotionRichText[]
    select?: { name?: string } | null
    email?: string | null
    url?: string | null
    date?: { start?: string } | null
    checkbox?: boolean
    relation?: { id: string }[]
  }>
}

async function notionFetch(path: string, opts: RequestInit = {}): Promise<any> {
  const token = process.env.NOTION_TOKEN
  if (!token) throw new Error('NOTION_TOKEN env var not set')
  const res = await fetch(NOTION_API + path, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
      ...((opts.headers as Record<string, string>) || {}),
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Notion ${opts.method || 'GET'} ${path} → ${res.status}: ${text}`)
  }
  return res.json()
}

async function queryByRichText(dbId: string, prop: string, value: string): Promise<string | null> {
  const res = await notionFetch(`/databases/${dbId}/query`, {
    method: 'POST',
    body: JSON.stringify({
      filter: { property: prop, rich_text: { equals: value } },
      page_size: 1,
    }),
  })
  return res.results?.[0]?.id ?? null
}

async function queryByEmail(dbId: string, prop: string, value: string): Promise<string | null> {
  const res = await notionFetch(`/databases/${dbId}/query`, {
    method: 'POST',
    body: JSON.stringify({
      filter: { property: prop, email: { equals: value } },
      page_size: 1,
    }),
  })
  return res.results?.[0]?.id ?? null
}

async function listAllPages(dbId: string, filter?: unknown): Promise<NotionPage[]> {
  const results: NotionPage[] = []
  let cursor: string | undefined
  do {
    const body: Record<string, unknown> = { page_size: 100 }
    if (cursor) body.start_cursor = cursor
    if (filter) body.filter = filter
    const res = await notionFetch(`/databases/${dbId}/query`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    results.push(...(res.results as NotionPage[]))
    cursor = res.has_more ? res.next_cursor : undefined
  } while (cursor)
  return results
}

function textProp(content: string) {
  const trimmed = (content || '').slice(0, 1999)
  return trimmed ? [{ type: 'text', text: { content: trimmed } }] : []
}

function companyProps(company: CrmCompany): Record<string, unknown> {
  const primaryEmail = company.contacts[0]?.email || null
  const primaryLinkedIn = company.contacts.find(c => c.linkedIn)?.linkedIn || null
  return {
    'Name': { title: textProp(company.name || '(sans nom)') },
    'Status': { select: { name: company.status } },
    'Clempo ID': { rich_text: textProp(company.id) },
    'Primary email': primaryEmail ? { email: primaryEmail } : { email: null },
    'Linkedin URL': primaryLinkedIn ? { url: primaryLinkedIn } : { url: null },
    'Notes': { rich_text: textProp(company.notes || '') },
    'Last Activity': { date: { start: company.updatedAt } },
    'Admin URL': { url: `${ADMIN_BASE}?focus=${encodeURIComponent(company.id)}` },
  }
}

function contactProps(contact: CrmContact, companyNotionPageId?: string): Record<string, unknown> {
  const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || contact.email
  const props: Record<string, unknown> = {
    'Name': { title: textProp(fullName) },
    'Email': { email: contact.email },
    'First name': { rich_text: textProp(contact.firstName || '') },
    'Last name': { rich_text: textProp(contact.lastName || '') },
    'Source': { select: { name: (contact.source || 'Manual').split(',')[0].trim() || 'Manual' } },
    'Clempo ID': { rich_text: textProp(contact.id) },
    'Notes': { rich_text: textProp(contact.notes || '') },
    'LinkedIn': contact.linkedIn ? { url: contact.linkedIn } : { url: null },
  }
  if (companyNotionPageId) {
    props['Company'] = { relation: [{ id: companyNotionPageId }] }
  }
  return props
}

async function upsertCompanyPage(dbId: string, company: CrmCompany): Promise<string> {
  let pageId = company.notionPageId
  if (!pageId) {
    pageId = (await queryByRichText(dbId, 'Clempo ID', company.id)) || undefined
  }
  if (pageId) {
    try {
      await notionFetch(`/pages/${pageId}`, {
        method: 'PATCH',
        body: JSON.stringify({ properties: companyProps(company) }),
      })
      return pageId
    } catch {
      // Page was deleted or archived → recreate
    }
  }
  const created = await notionFetch('/pages', {
    method: 'POST',
    body: JSON.stringify({
      parent: { database_id: dbId },
      properties: companyProps(company),
    }),
  })
  return created.id as string
}

async function upsertContactPage(
  dbId: string,
  contact: CrmContact,
  companyNotionPageId: string | undefined,
): Promise<string> {
  let pageId = contact.notionPageId
  if (!pageId) {
    pageId = (await queryByEmail(dbId, 'Email', contact.email)) || undefined
  }
  if (pageId) {
    try {
      await notionFetch(`/pages/${pageId}`, {
        method: 'PATCH',
        body: JSON.stringify({ properties: contactProps(contact, companyNotionPageId) }),
      })
      return pageId
    } catch {
      // fall through
    }
  }
  const created = await notionFetch('/pages', {
    method: 'POST',
    body: JSON.stringify({
      parent: { database_id: dbId },
      properties: contactProps(contact, companyNotionPageId),
    }),
  })
  return created.id as string
}

async function archiveMissing(dbId: string, currentIds: Set<string>): Promise<number> {
  const pages = await listAllPages(dbId)
  let archived = 0
  for (const page of pages) {
    const clempoId = page.properties['Clempo ID']?.rich_text?.[0]?.plain_text
    const status = page.properties['Status']?.select?.name
    if (!clempoId) continue
    if (!currentIds.has(clempoId) && status !== 'Archived') {
      try {
        await notionFetch(`/pages/${page.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            properties: { 'Status': { select: { name: 'Archived' } } },
          }),
        })
        archived++
      } catch (err) {
        console.warn('archive page failed', page.id, err)
      }
    }
  }
  return archived
}

// --- Meeting matching ---

function normalize(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/@[^@]*$/, ' ')
    .replace(/\d{1,2}[:h]\d{0,2}/g, ' ')
    .replace(/[^a-zàâéèêëïîôöùûüç0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function matchCompanyForTitle(
  title: string,
  companies: CrmCompany[],
): CrmCompany | null {
  const t = normalize(title)
  if (!t) return null
  const tokens = new Set(t.split(' '))
  let bestCompany: CrmCompany | null = null
  let bestScore = -1
  const bump = (company: CrmCompany, score: number) => {
    if (score > bestScore) {
      bestScore = score
      bestCompany = company
    }
  }
  for (const co of companies) {
    const name = normalize(co.name)
    if (name && name.length >= 3 && t.includes(name)) {
      bump(co, 100 + name.length)
    }
    for (const c of co.contacts) {
      const first = normalize(c.firstName)
      const last = normalize(c.lastName)
      if (first && last && t.includes(`${first} ${last}`)) {
        bump(co, 80 + first.length + last.length)
      } else {
        if (last && last.length >= 4 && tokens.has(last)) bump(co, 60 + last.length)
        if (first && first.length >= 4 && tokens.has(first)) bump(co, 40 + first.length)
        if (first && first.length >= 4) {
          for (const tok of tokens) {
            if (tok.length >= 4 && (tok.startsWith(first) || first.startsWith(tok))) {
              bump(co, 20 + Math.min(first.length, tok.length))
              break
            }
          }
        }
      }
    }
  }
  return bestCompany
}

// --- Task extraction from meeting page ---

type TodoBlock = { id: string; text: string; checked: boolean }

async function getPageTodos(pageId: string): Promise<TodoBlock[]> {
  const todos: TodoBlock[] = []
  const MAX_DEPTH = 6
  async function walk(blockId: string, depth: number) {
    if (depth > MAX_DEPTH) return
    let cursor: string | undefined
    do {
      const q = cursor ? `?page_size=100&start_cursor=${cursor}` : '?page_size=100'
      const res = await notionFetch(`/blocks/${blockId}/children${q}`)
      for (const b of res.results) {
        if (b.type === 'to_do') {
          const text = (b.to_do?.rich_text || [])
            .map((r: NotionRichText) => r.plain_text || r.text?.content || '')
            .join('')
            .trim()
          if (text) todos.push({ id: b.id, text, checked: !!b.to_do?.checked })
        }
        if (b.has_children) await walk(b.id, depth + 1)
      }
      cursor = res.has_more ? res.next_cursor : undefined
    } while (cursor)
  }
  await walk(pageId, 0)
  return todos
}

async function processMeetings(
  meetingsDbId: string,
  companies: CrmCompany[],
): Promise<{ scanned: number; linked: number; tasksCreated: number; synced: number }> {
  let scanned = 0
  let linked = 0
  let tasksCreated = 0
  let synced = 0

  const pages = await listAllPages(meetingsDbId, {
    property: 'Synced to CRM',
    checkbox: { equals: false },
  })

  for (const page of pages) {
    scanned++
    const titleProp =
      page.properties['Titre']?.title ||
      page.properties['Name']?.title ||
      page.properties['Title']?.title ||
      []
    const title = titleProp.map((r: NotionRichText) => r.plain_text || '').join('').trim()
    let notionCompanyId: string | undefined =
      page.properties['Company']?.relation?.[0]?.id

    if (!notionCompanyId) {
      const matched = matchCompanyForTitle(title, companies)
      if (matched?.notionPageId) {
        notionCompanyId = matched.notionPageId
        try {
          await notionFetch(`/pages/${page.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              properties: { 'Company': { relation: [{ id: matched.notionPageId }] } },
            }),
          })
          linked++
        } catch (err) {
          console.warn('could not set Company relation on meeting', page.id, err)
          continue
        }
      } else {
        continue
      }
    }

    const company = companies.find(c => c.notionPageId === notionCompanyId)
    if (!company) continue

    const todos = await getPageTodos(page.id)
    const toExtract = todos.filter(t => !t.checked)

    if (toExtract.length > 0) {
      const data = await readCrm()
      const co = data.companies.find(c => c.id === company.id)
      if (co) {
        if (!co.tasks) co.tasks = []
        const now = new Date().toISOString()
        const due = new Date()
        due.setDate(due.getDate() + 7)
        const dueDate = due.toISOString().slice(0, 10)
        for (const todo of toExtract) {
          co.tasks.push({
            id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            title: todo.text.slice(0, 140),
            dueDate,
            description: `Extrait de la réunion Notion « ${title} »${page.url ? `\n${page.url}` : ''}`,
            done: false,
            createdAt: now,
            updatedAt: now,
          })
          tasksCreated++
        }
        co.updatedAt = now
        await writeCrm(data)
      }
    }

    try {
      await notionFetch(`/pages/${page.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          properties: { 'Synced to CRM': { checkbox: true } },
        }),
      })
      synced++
    } catch (err) {
      console.warn('could not mark meeting synced', page.id, err)
    }
  }

  return { scanned, linked, tasksCreated, synced }
}

// --- Public entry point ---

/**
 * Incremental sync. Bounded by `budgetMs` (default 8s for HTTP, longer for cron).
 *
 * Strategy:
 *  - Skip companies/contacts that already have a notionPageId (initial backfill
 *    runs creates → no re-PATCH; updates are best-effort if we have budget left).
 *  - Phase A: create missing companies until budget exhausted.
 *  - Phase B: create missing contacts until budget exhausted.
 *  - Phase C: process unsynced meeting notes if any budget left.
 *  - archiveMissing only runs once per ~30 min (cheap on a stable CRM).
 */
export async function runSync(opts: { budgetMs?: number } = {}): Promise<Record<string, unknown>> {
  const budgetMs = opts.budgetMs ?? 8000
  const deadline = Date.now() + budgetMs
  const overBudget = () => Date.now() >= deadline
  const result: Record<string, unknown> = {
    startedAt: new Date().toISOString(),
    budgetMs,
  }

  const DB_COMPANIES = process.env.NOTION_DB_COMPANIES
  const DB_CONTACTS = process.env.NOTION_DB_CONTACTS
  const DB_MEETINGS = process.env.NOTION_DB_MEETINGS
  if (!DB_COMPANIES || !DB_CONTACTS || !DB_MEETINGS) {
    result.error = 'Missing env vars: NOTION_DB_COMPANIES, NOTION_DB_CONTACTS, NOTION_DB_MEETINGS'
    return result
  }

  try {
    const data = await readCrm()
    result.companyCount = data.companies.length
    result.contactCount = data.companies.reduce((n, c) => n + c.contacts.length, 0)
    result.companiesAlreadySynced = data.companies.filter(c => c.notionPageId).length
    result.contactsAlreadySynced = data.companies.reduce(
      (n, c) => n + c.contacts.filter(x => x.notionPageId).length, 0,
    )

    const isStale = (updatedAt: string, syncedAt?: string) =>
      !syncedAt || new Date(updatedAt).getTime() > new Date(syncedAt).getTime()

    // Phase A1: create missing companies
    const missingCompanies = data.companies.filter(c => !c.notionPageId)
    let companiesPushed = 0
    let mutated = false
    for (const company of missingCompanies) {
      if (overBudget()) break
      try {
        const pageId = await upsertCompanyPage(DB_COMPANIES, company)
        company.notionPageId = pageId
        company.notionSyncedAt = new Date().toISOString()
        mutated = true
        companiesPushed++
      } catch (err) {
        console.warn('upsert company failed', company.id, err)
      }
    }

    // Phase A2: re-patch companies whose updatedAt > notionSyncedAt
    const staleCompanies = data.companies.filter(
      c => c.notionPageId && isStale(c.updatedAt, c.notionSyncedAt),
    )
    let companiesUpdated = 0
    for (const company of staleCompanies) {
      if (overBudget()) break
      try {
        await upsertCompanyPage(DB_COMPANIES, company)
        company.notionSyncedAt = new Date().toISOString()
        mutated = true
        companiesUpdated++
      } catch (err) {
        console.warn('patch company failed', company.id, err)
      }
    }
    if (mutated) await writeCrm(data)
    result.companiesPushed = companiesPushed
    result.companiesUpdated = companiesUpdated
    result.companiesRemaining = missingCompanies.length - companiesPushed
    result.companiesStaleRemaining = staleCompanies.length - companiesUpdated

    // Phase B1: create missing contacts
    const missingContacts: Array<{ contact: CrmContact; companyPageId: string | undefined }> = []
    for (const company of data.companies) {
      for (const c of company.contacts) {
        if (!c.notionPageId) missingContacts.push({ contact: c, companyPageId: company.notionPageId })
      }
    }
    let contactsPushed = 0
    mutated = false
    for (const { contact, companyPageId } of missingContacts) {
      if (overBudget()) break
      try {
        const pageId = await upsertContactPage(DB_CONTACTS, contact, companyPageId)
        contact.notionPageId = pageId
        contact.notionSyncedAt = new Date().toISOString()
        mutated = true
        contactsPushed++
      } catch (err) {
        console.warn('upsert contact failed', contact.email, err)
      }
    }

    // Phase B2: re-patch contacts whose updatedAt > notionSyncedAt
    const staleContacts: Array<{ contact: CrmContact; companyPageId: string | undefined }> = []
    for (const company of data.companies) {
      for (const c of company.contacts) {
        if (c.notionPageId && isStale(c.updatedAt, c.notionSyncedAt)) {
          staleContacts.push({ contact: c, companyPageId: company.notionPageId })
        }
      }
    }
    let contactsUpdated = 0
    for (const { contact, companyPageId } of staleContacts) {
      if (overBudget()) break
      try {
        await upsertContactPage(DB_CONTACTS, contact, companyPageId)
        contact.notionSyncedAt = new Date().toISOString()
        mutated = true
        contactsUpdated++
      } catch (err) {
        console.warn('patch contact failed', contact.email, err)
      }
    }
    if (mutated) await writeCrm(data)
    result.contactsPushed = contactsPushed
    result.contactsUpdated = contactsUpdated
    result.contactsRemaining = missingContacts.length - contactsPushed
    result.contactsStaleRemaining = staleContacts.length - contactsUpdated

    // Phase C: process meeting notes (only if budget remains and backfill is done)
    if (!overBudget() && result.contactsRemaining === 0 && result.companiesRemaining === 0) {
      try {
        const fresh = await readCrm()
        const stats = await processMeetings(DB_MEETINGS, fresh.companies)
        Object.assign(result, stats)
      } catch (err) {
        console.error('processMeetings failed', err)
        result.meetingsError = String(err)
      }
    } else {
      result.meetingsSkipped = 'backfill in progress or budget exhausted'
    }

    // archiveMissing: only when caller has lots of budget (cron only)
    if (budgetMs >= 60_000 && !overBudget()) {
      try {
        result.companiesArchived = await archiveMissing(
          DB_COMPANIES,
          new Set(data.companies.map(c => c.id)),
        )
      } catch (err) {
        console.warn('archiveMissing companies failed', err)
      }
    }

    result.finishedAt = new Date().toISOString()
    result.elapsedMs = Date.now() - (deadline - budgetMs)
    return result
  } catch (err) {
    console.error('notion-sync fatal error:', err)
    result.error = String(err)
    result.stack = (err as Error).stack
    return result
  }
}
