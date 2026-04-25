import type { Handler } from '@netlify/functions'
import { checkAuth } from './_analytics'
import { readCrm } from './_crm'

const NOTION_API = 'https://api.notion.com/v1'
const NOTION_VERSION = '2022-06-28'

async function notionFetch(path: string, opts: RequestInit = {}): Promise<{ ok: boolean; status: number; body: unknown }> {
  const token = process.env.NOTION_TOKEN
  if (!token) return { ok: false, status: 0, body: 'NOTION_TOKEN not set' }
  const res = await fetch(NOTION_API + path, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
      ...((opts.headers as Record<string, string>) || {}),
    },
  })
  let body: unknown
  try { body = await res.json() } catch { body = await res.text() }
  return { ok: res.ok, status: res.status, body }
}

function textProp(content: string) {
  const trimmed = (content || '').slice(0, 1999)
  return trimmed ? [{ type: 'text', text: { content: trimmed } }] : []
}

export const handler: Handler = async (event) => {
  if (!checkAuth(event.headers as Record<string, string | undefined>)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  const env = {
    NOTION_TOKEN: !!process.env.NOTION_TOKEN,
    NOTION_DB_COMPANIES: process.env.NOTION_DB_COMPANIES || null,
    NOTION_DB_CONTACTS: process.env.NOTION_DB_CONTACTS || null,
    NOTION_DB_MEETINGS: process.env.NOTION_DB_MEETINGS || null,
  }

  const data = await readCrm()
  const allContacts = data.companies.flatMap(co =>
    co.contacts.map(c => ({ contact: c, company: co }))
  )
  const sample = allContacts.slice(0, 3)

  const dbId = process.env.NOTION_DB_CONTACTS
  if (!dbId) {
    return { statusCode: 500, body: JSON.stringify({ env, error: 'NOTION_DB_CONTACTS missing' }) }
  }

  // Test 1: can we read the Contacts DB?
  const dbProbe = await notionFetch(`/databases/${dbId}`)

  // Test 2: run Phase B for first 5 contacts that don't yet have a notionPageId
  const todo = allContacts.filter(s => !s.contact.notionPageId).slice(0, 5)
  const phaseBResults: Array<{ email: string; result: unknown }> = []
  for (const t of todo) {
    const body = {
      parent: { database_id: dbId },
      properties: {
        'Name': { title: textProp([t.contact.firstName, t.contact.lastName].filter(Boolean).join(' ') || t.contact.email) },
        'Email': { email: t.contact.email },
        'First name': { rich_text: textProp(t.contact.firstName || '') },
        'Last name': { rich_text: textProp(t.contact.lastName || '') },
        'Source': { select: { name: (t.contact.source || 'Manual').split(',')[0].trim() || 'Manual' } },
        'Clempo ID': { rich_text: textProp(t.contact.id) },
        'Notes': { rich_text: textProp(t.contact.notes || '') },
        ...(t.company.notionPageId ? { 'Company': { relation: [{ id: t.company.notionPageId }] } } : {}),
      },
    }
    const r = await notionFetch('/pages', { method: 'POST', body: JSON.stringify(body) })
    phaseBResults.push({ email: t.contact.email, result: r })
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      env,
      counts: {
        companies: data.companies.length,
        contacts: allContacts.length,
        contactsWithNotionId: allContacts.filter(s => s.contact.notionPageId).length,
        companiesWithNotionId: data.companies.filter(c => c.notionPageId).length,
      },
      dbProbe: { ok: dbProbe.ok, status: dbProbe.status },
      phaseBResults,
    }, null, 2),
  }
}
