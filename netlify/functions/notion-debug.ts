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

  // Test 2: try to create one contact page (the very first contact in CRM)
  const target = sample[0]
  const createBody = target ? {
    parent: { database_id: dbId },
    properties: {
      'Name': { title: textProp([target.contact.firstName, target.contact.lastName].filter(Boolean).join(' ') || target.contact.email) },
      'Email': { email: target.contact.email },
      'First name': { rich_text: textProp(target.contact.firstName || '') },
      'Last name': { rich_text: textProp(target.contact.lastName || '') },
      'Source': { select: { name: (target.contact.source || 'Manual').split(',')[0].trim() || 'Manual' } },
      'Clempo ID': { rich_text: textProp(target.contact.id) },
      'Notes': { rich_text: textProp(target.contact.notes || '') },
    },
  } : null

  const createProbe = createBody
    ? await notionFetch('/pages', { method: 'POST', body: JSON.stringify(createBody) })
    : { ok: false, status: 0, body: 'no contact in CRM' }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      env,
      counts: {
        companies: data.companies.length,
        contacts: allContacts.length,
        sampleEmails: sample.map(s => s.contact.email),
        sampleSources: sample.map(s => s.contact.source),
      },
      dbProbe,
      createBody,
      createProbe,
    }, null, 2),
  }
}
