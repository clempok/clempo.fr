import { getStore } from '@netlify/blobs'

const SITE_ID = '266ec893-0de7-4f86-9559-e80fa4a1e3d7'

export type KeywordRanking = {
  keyword: string
  targetPage: string
  volume: number // estimated monthly search volume
  history: RankingEntry[]
}

export type RankingEntry = {
  date: string // YYYY-MM-DD
  position: number | null // null = not found in top 100
  url?: string // URL found ranking
}

export type SeoData = {
  keywords: KeywordRanking[]
  lastChecked: string | null // ISO date
}

const EMPTY: SeoData = { keywords: [], lastChecked: null }

function store() {
  const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_API_TOKEN
  const siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID || SITE_ID
  if (token) {
    return getStore({ name: 'seo', siteID, token })
  }
  return getStore({ name: 'seo' })
}

export async function readSeo(): Promise<SeoData> {
  try {
    const s = store()
    const data = (await s.get('data', { type: 'json' })) as SeoData | null
    if (!data) return { ...EMPTY, keywords: [] }
    return { keywords: data.keywords || [], lastChecked: data.lastChecked || null }
  } catch (err) {
    console.error('readSeo error:', err)
    return { ...EMPTY, keywords: [] }
  }
}

export async function writeSeo(data: SeoData): Promise<void> {
  const s = store()
  await s.setJSON('data', data)
}
