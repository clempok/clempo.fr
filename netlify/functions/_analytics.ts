import { getStore } from '@netlify/blobs'

export type LeadEvent = {
  id: string
  type: 'booking' | 'brochure' | 'journalistes' | 'data-download' | 'decideurs-hospitaliers' | 'hiring'
  ts: string // ISO
  firstName?: string
  lastName?: string
  email?: string
  company?: string
  phone?: string
  // data-download: free-form label like "Data Médecins Généralistes"
  source?: string
  // data-download: specialty slug (medecins-generalistes, dentistes, …)
  slug?: string
  // booking-only
  date?: string
  hour?: number
  minute?: number
  message?: string
  lang?: string
  // booking-only — outcome tracking
  bookingStatus?: 'pending' | 'success' | 'failed'
  bookingError?: string
  calendarEventId?: string
  hangoutLink?: string
  notificationSent?: boolean
  notificationError?: string
  // booking-only — J-1 reminder tracking (scheduled-appointment-reminders.ts)
  reminderSentAt?: string
  reminderDryRun?: boolean
}

export type AnalyticsData = {
  events: LeadEvent[]
  visits: Record<string, number> // YYYY-MM-DD -> count
  visits_by_path?: Record<string, Record<string, number>>
  visits_by_src?: Record<string, Record<string, number>>
  visits_by_ref?: Record<string, Record<string, number>>
  linkedin_impressions?: Record<string, number>
  // Manually-entered impressions per funnel period. Keyed by `${period}:${key}`
  // (e.g. "month:2026-04", "week:2026-W19"). Takes precedence over the
  // rolling-7d snapshot when displaying the funnel.
  linkedin_impressions_manual?: Record<string, number>
}

const EMPTY: AnalyticsData = { events: [], visits: {} }

const SITE_ID = '266ec893-0de7-4f86-9559-e80fa4a1e3d7'

export function getAnalyticsStore() {
  const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_API_TOKEN
  const siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID || SITE_ID
  if (token) {
    return getStore({ name: 'analytics', siteID, token })
  }
  return getStore({ name: 'analytics' })
}

function store() {
  return getAnalyticsStore()
}

export async function readData(): Promise<AnalyticsData> {
  try {
    const s = store()
    const data = (await s.get('data', { type: 'json' })) as AnalyticsData | null
    if (!data) return { events: [], visits: {} }
    return { ...data, events: data.events || [], visits: data.visits || {} }
  } catch (err) {
    console.error('readData error:', err)
    return { ...EMPTY }
  }
}

export async function writeData(data: AnalyticsData): Promise<void> {
  const s = store()
  await s.setJSON('data', data)
}

export async function recordEvent(ev: Omit<LeadEvent, 'id' | 'ts'> & Partial<Pick<LeadEvent, 'ts'>>): Promise<string | null> {
  try {
    const data = await readData()
    const full: LeadEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ts: ev.ts || new Date().toISOString(),
      ...ev,
    } as LeadEvent
    data.events.push(full)
    // keep last 2000 events max
    if (data.events.length > 2000) {
      data.events = data.events.slice(-2000)
    }
    await writeData(data)
    return full.id
  } catch (err) {
    console.error('recordEvent error:', err)
    return null
  }
}

export async function updateEvent(id: string | null, patch: Partial<LeadEvent>): Promise<void> {
  if (!id) return
  try {
    const data = await readData()
    const ev = data.events.find(e => e.id === id)
    if (!ev) return
    Object.assign(ev, patch)
    await writeData(data)
  } catch (err) {
    console.error('updateEvent error:', err)
  }
}

export async function recordVisit(dateKey: string): Promise<void> {
  try {
    const data = await readData()
    data.visits[dateKey] = (data.visits[dateKey] || 0) + 1
    await writeData(data)
  } catch (err) {
    console.error('recordVisit error:', err)
  }
}

export function checkAuth(headers: Record<string, string | undefined>): boolean {
  const expected = process.env.ADMIN_PASSWORD || 'Ch4!pitron'
  const auth = headers['authorization'] || headers['Authorization'] || ''
  const token = auth.replace(/^Bearer\s+/i, '').trim()
  return token === expected
}
