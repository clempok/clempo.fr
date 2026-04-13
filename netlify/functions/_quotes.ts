import { getStore } from '@netlify/blobs'

export type QuoteLine = {
  description: string
  quantity: number
  unitPrice: number
}

export type QuoteStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected'

export type Quote = {
  id: string
  reference: string       // e.g. "DEV/2026/12"
  companySlug: string     // URL-safe slug
  companyName: string     // Display name
  clientName: string
  clientEmail: string
  date: string            // ISO date
  dueDate: string         // ISO date
  lines: QuoteLine[]
  notes: string
  emailContent: string    // Custom email body text
  status: QuoteStatus
  accentColor: string
  senderName: string
  senderCompany: string
  senderEmail: string
  createdAt: string
  sentAt?: string
  viewedAt?: string
}

export type QuotesData = {
  quotes: Quote[]
}

const SITE_ID = '266ec893-0de7-4f86-9559-e80fa4a1e3d7'

function getQuotesStore() {
  const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_API_TOKEN
  const siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID || SITE_ID
  if (token) {
    return getStore({ name: 'quotes', siteID, token })
  }
  return getStore('quotes')
}

export async function loadQuotes(): Promise<QuotesData> {
  const store = getQuotesStore()
  const raw = await store.get('data', { type: 'json' }).catch(() => null)
  if (raw && typeof raw === 'object' && Array.isArray((raw as QuotesData).quotes)) {
    return raw as QuotesData
  }
  return { quotes: [] }
}

export async function saveQuotes(data: QuotesData): Promise<void> {
  const store = getQuotesStore()
  await store.setJSON('data', data)
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function refToSlug(ref: string): string {
  return ref.replace(/\//g, '-').toLowerCase()
}

export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}
