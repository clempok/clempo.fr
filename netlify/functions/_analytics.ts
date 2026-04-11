import { getStore } from '@netlify/blobs'

export type LeadEvent = {
  id: string
  type: 'booking' | 'brochure'
  ts: string // ISO
  firstName?: string
  lastName?: string
  email?: string
  company?: string
  phone?: string
  // booking-only
  date?: string
  hour?: number
  minute?: number
  message?: string
  lang?: string
}

export type AnalyticsData = {
  events: LeadEvent[]
  visits: Record<string, number> // YYYY-MM-DD -> count
}

const EMPTY: AnalyticsData = { events: [], visits: {} }

function store() {
  return getStore({ name: 'analytics', consistency: 'strong' })
}

export async function readData(): Promise<AnalyticsData> {
  try {
    const s = store()
    const data = (await s.get('data', { type: 'json' })) as AnalyticsData | null
    if (!data) return { events: [], visits: {} }
    return { events: data.events || [], visits: data.visits || {} }
  } catch (err) {
    console.error('readData error:', err)
    return { ...EMPTY }
  }
}

export async function writeData(data: AnalyticsData): Promise<void> {
  const s = store()
  await s.setJSON('data', data)
}

export async function recordEvent(ev: Omit<LeadEvent, 'id' | 'ts'> & Partial<Pick<LeadEvent, 'ts'>>): Promise<void> {
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
  } catch (err) {
    console.error('recordEvent error:', err)
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
