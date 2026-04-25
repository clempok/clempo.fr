import type { Handler } from '@netlify/functions'
import { checkAuth } from './_analytics'

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

  // Probe Notion search to see what pages the integration has access to.
  const search = await notionFetch('/search', {
    method: 'POST',
    body: JSON.stringify({
      filter: { value: 'page', property: 'object' },
      page_size: 10,
      sort: { timestamp: 'last_edited_time', direction: 'descending' },
    }),
  })
  type SearchPage = { id: string; url: string; last_edited_time: string; properties?: { title?: { title?: { plain_text?: string }[] }; Name?: { title?: { plain_text?: string }[] } }; parent?: { type: string; database_id?: string; page_id?: string } }
  const searchSample = (search.body as { results?: SearchPage[] })?.results?.slice(0, 10).map((p) => ({
    title: ((p.properties?.title?.title || p.properties?.Name?.title || []) as { plain_text?: string }[])
      .map((r) => r.plain_text || '').join(''),
    url: p.url,
    parentType: p.parent?.type,
    parentId: p.parent?.database_id || p.parent?.page_id,
  }))

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ env, searchSample }, null, 2),
  }
}
