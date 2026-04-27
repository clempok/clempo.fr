import { getStore } from '@netlify/blobs'

export type QuoteLine = {
  description: string
  detail?: string          // Description longue (HTML ou texte)
  quantity: number
  unit?: string            // "jours", "heures", "mois", "forfait"
  unitPrice: number
  tva?: number             // % TVA, défaut 20
  discount?: number        // % remise par ligne
}

export type QuoteArgument = {
  title: string
  description: string
}

export type QuoteSignature = {
  image: string             // base64 (drawn) or rendered text
  type: 'drawn' | 'typed'
  signerName: string
  signerEmail: string
  signerCompany: string
  signerEmailCompta?: string
  signerAddress?: string
  signerPostalCode?: string
  signerCity?: string
  signerCountry?: string
  signerTva?: string
  ip: string
  userAgent: string
  signedAt: string
  cgvAccepted: boolean
}

export type QuoteStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected'

export type Quote = {
  id: string
  reference: string
  companySlug: string
  companyName: string
  clientName: string
  clientEmail: string
  clientCcEmails?: string[]  // Personnes en copie de l'email
  prospectLogo?: string    // URL du logo prospect

  date: string
  dueDate: string
  validUntil?: string      // Date d'expiration du devis

  // Offre
  offerTitle?: string      // "Part-Time CMO"
  context?: {              // Encart contexte
    title: string
    description: string
  }
  presentation?: string    // Texte de présentation du prestataire
  arguments?: QuoteArgument[]  // 3 raisons de collaborer

  lines: QuoteLine[]
  globalDiscount?: number  // % remise globale
  notes: string
  paymentTerms?: string    // Conditions de paiement

  subject?: string         // Objet de l'email (persisté pour pouvoir éditer)
  emailContent: string
  status: QuoteStatus
  accentColor: string

  senderName: string
  senderCompany: string
  senderEmail: string
  senderPhone?: string
  senderPhoto?: string     // URL photo

  cgvText?: string           // HTML des CGV

  createdAt: string
  updatedAt?: string         // Dernière édition
  sentAt?: string
  resentAt?: string          // Dernier renvoi par email
  viewedAt?: string
  signature?: QuoteSignature
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

export function computeLineTotals(lines: QuoteLine[], globalDiscount = 0) {
  let totalHT = 0
  let totalTVA = 0

  for (const l of lines) {
    const lineHT = l.quantity * l.unitPrice * (1 - (l.discount || 0) / 100)
    const lineTVA = lineHT * ((l.tva ?? 20) / 100)
    totalHT += lineHT
    totalTVA += lineTVA
  }

  totalHT = totalHT * (1 - globalDiscount / 100)
  totalTVA = totalTVA * (1 - globalDiscount / 100)

  return { totalHT, totalTVA, totalTTC: totalHT + totalTVA }
}
