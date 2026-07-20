import { Fragment, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSort, sortRows, Th, FilterSearch, FilterChoices } from './adminTable'
import OnboardingView from './adminOnboarding'

const REPO = 'clempok/clempo.fr'
const FILE_PATH = 'public/content.json'
const ACCENT = '#0A0A0B'  // Ink — Brand Book 2026
const AUTH_KEY = 'clempo_admin_pw'

const sectionLabels: Record<string, string> = {
  'translations.fr.hero': 'Hero (FR)',
  'translations.fr.about': 'À propos (FR)',
  'translations.fr.articles_section': 'Articles section (FR)',
  'translations.fr.articles_page': 'Page articles (FR)',
  'translations.fr.media': 'Médias (FR)',
  'translations.fr.brochure': 'Brochure (FR)',
  'translations.fr.article_page': 'Page article (FR)',
  'translations.fr.nav': 'Navigation (FR)',
  'translations.fr.footer': 'Footer (FR)',
  'translations.en.hero': 'Hero (EN)',
  'translations.en.about': 'About (EN)',
  'translations.en.articles_section': 'Articles section (EN)',
  'translations.en.articles_page': 'Articles page (EN)',
  'translations.en.media': 'Media (EN)',
  'translations.en.brochure': 'Brochure (EN)',
  'translations.en.article_page': 'Article page (EN)',
  'translations.en.nav': 'Navigation (EN)',
  'translations.en.footer': 'Footer (EN)',
  'clients': 'Clients (marquee)',
  'companies_loader': 'Entreprises (loader)',
  'loader': 'Loader intro',
  'accompagnements': 'Accompagnements',
  'secteurs': 'Secteurs (santé)',
  'seo.fr': 'SEO (FR)',
  'seo.en': 'SEO (EN)',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((o, k) => o?.[k], obj)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setNestedValue(obj: any, path: string, value: any): any {
  const result = JSON.parse(JSON.stringify(obj))
  const keys = path.split('.')
  let current = result
  for (let i = 0; i < keys.length - 1; i++) {
    current = current[keys[i]]
  }
  current[keys[keys.length - 1]] = value
  return result
}

type LeadEvent = {
  id: string
  type: 'booking' | 'brochure' | 'journalistes' | 'data-download' | 'decideurs-hospitaliers' | 'influenceurs-sante' | 'hiring'
  ts: string
  firstName?: string
  lastName?: string
  email?: string
  company?: string
  phone?: string
  source?: string
  slug?: string
  date?: string
  hour?: number
  minute?: number
  message?: string
  lang?: string
  bookingStatus?: 'pending' | 'success' | 'failed'
  bookingError?: string
  calendarEventId?: string
  hangoutLink?: string
  notificationSent?: boolean
  notificationError?: string
}

type AnalyticsResponse = {
  events: LeadEvent[]
  visits: Record<string, number>
  visits_by_path?: Record<string, Record<string, number>>
  visits_by_src?: Record<string, Record<string, number>>
  visits_by_ref?: Record<string, Record<string, number>>
  // Rolling 7-day LinkedIn impressions snapshots, keyed by scan date (YYYY-MM-DD).
  // Pushed each morning by the linkedin-sync skill.
  linkedin_impressions?: Record<string, number>
  // Manually-entered impressions per funnel period. Keyed by `${period}:${key}`
  // (e.g. "month:2026-04", "week:2026-W19"). Takes precedence over the
  // rolling-7d snapshot when displaying the funnel.
  linkedin_impressions_manual?: Record<string, number>
  // Requests rejected by the server-side filter (netlify/functions/_bot-filter.ts),
  // keyed by day. Absent for days before the filter shipped.
  bots_blocked?: Record<string, { total: number; byReason: Record<string, number>; uaSample: Record<string, number> }>
}

// First day fully covered by the server-side bot filter. Visit counts before this
// are inflated by bot traffic that spoofed document.referrer as google.com —
// Search Console recorded 50 real clicks over 07-13/07 while this dashboard
// showed 737. The raw data is kept (a backup lives outside the repo), but it
// cannot be cleaned retroactively: no UA or IP was stored per visit, so there is
// no principled way to tell which individual visits were fake. Hence a marker
// rather than a deletion.
const DATA_QUALITY_CUTOFF = '2026-07-16'

const BOT_REASON_LABELS: Record<string, string> = {
  'bot-ua': 'Bot déclaré (user-agent)',
  'non-browser-ua': 'Script (pas un navigateur)',
  'no-ua': 'User-agent absent',
  'short-ua': 'User-agent tronqué',
  'no-origin': 'Origine absente',
  'bad-origin': 'Origine étrangère au site',
  'no-accept-language': 'Aucune langue négociée',
  'rate-limit': 'Trop de vues (même IP)',
}

// Friendly labels for referrer keys emitted by normalizeRef() in App.tsx.
const REF_LABELS: Record<string, string> = {
  direct: 'Accès direct / bookmark',
  google: 'Google (recherche)',
  gmail: 'Gmail',
  'google-translate': 'Google Traduction',
  'google-news': 'Google Actualités',
  'google-groups': 'Google Groups',
  'google-workspace': 'Google Docs / Drive',
  bing: 'Bing',
  duckduckgo: 'DuckDuckGo',
  yahoo: 'Yahoo',
  ecosia: 'Ecosia',
  qwant: 'Qwant',
  linkedin: 'LinkedIn',
  'twitter/x': 'Twitter / X',
  facebook: 'Facebook',
  instagram: 'Instagram',
  youtube: 'YouTube',
  reddit: 'Reddit',
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  perplexity: 'Perplexity',
  gemini: 'Gemini',
}

function refLabel(key: string): string {
  return REF_LABELS[key] || key
}

type FunnelPeriod = {
  key: string
  label: string
  startISO: string  // inclusive
  endISO: string    // exclusive
}

/**
 * Build the last `count` periods (most recent first) for the funnel table.
 * - Weekly: ISO-style weeks starting Monday, labelled "S14 2026" (week number).
 * - Monthly: calendar months, labelled "avril 2026".
 */
function buildPeriods(mode: 'week' | 'month', count: number): FunnelPeriod[] {
  const periods: FunnelPeriod[] = []
  const today = new Date()

  if (mode === 'week') {
    // Align `cursor` to Monday of the current week (local time)
    const cursor = new Date(today)
    cursor.setHours(0, 0, 0, 0)
    const dow = cursor.getDay() // 0 = Sunday, 1 = Monday...
    const daysFromMonday = (dow + 6) % 7
    cursor.setDate(cursor.getDate() - daysFromMonday)

    for (let i = 0; i < count; i++) {
      const start = new Date(cursor)
      const end = new Date(cursor)
      end.setDate(end.getDate() + 7)
      periods.push({
        key: start.toISOString().slice(0, 10),
        label: isoWeekLabel(start),
        startISO: start.toISOString(),
        endISO: end.toISOString(),
      })
      cursor.setDate(cursor.getDate() - 7)
    }
    return periods
  }

  // Monthly
  const cursor = new Date(today.getFullYear(), today.getMonth(), 1)
  for (let i = 0; i < count; i++) {
    const start = new Date(cursor)
    const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
    periods.push({
      key: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
      label: start.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      startISO: start.toISOString(),
      endISO: end.toISOString(),
    })
    cursor.setMonth(cursor.getMonth() - 1)
  }
  return periods
}

/** ISO-8601 week number (Monday = start of week). Returns "S14 2026" */
function isoWeekLabel(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `S${weekNum} ${d.getUTCFullYear()}`
}

const CRM_STATUSES = ['Non qualifié', 'Prospect', 'Lead', 'Opportunité', 'Client', 'Lost'] as const
type CrmStatus = (typeof CRM_STATUSES)[number]

const CONTACT_LANGUAGES = ['FR', 'EN'] as const
type ContactLanguage = (typeof CONTACT_LANGUAGES)[number]

const COMPANY_SIZES = ['Startup', 'Scaleup', 'ETI', 'Grand groupe'] as const
type CompanySize = (typeof COMPANY_SIZES)[number]

const COMPANY_LOCATIONS = ['FR', 'Europe_US', 'Autre'] as const
type CompanyLocation = (typeof COMPANY_LOCATIONS)[number]

const COMPANY_SECTORS = ['LogicielsSante', 'MedTechBioPharma', 'SanteB2C', 'Autre'] as const
type CompanySector = (typeof COMPANY_SECTORS)[number]

const COMPANY_ORIGINS = ['LinkedIn', 'Outbound', 'Réseau', 'Lead Magnet'] as const
type CompanyOrigin = (typeof COMPANY_ORIGINS)[number]

const SIZE_LABELS: Record<CompanySize, string> = {
  Startup: 'Startup',
  Scaleup: 'Scaleup',
  ETI: 'ETI',
  'Grand groupe': 'Grand groupe',
}
const LOCATION_LABELS: Record<CompanyLocation, string> = {
  FR: 'France',
  Europe_US: 'Europe Ouest / US',
  Autre: 'Autre',
}
const SECTOR_LABELS: Record<CompanySector, string> = {
  LogicielsSante: 'Logiciels santé pro',
  MedTechBioPharma: 'MedTech / BioTech / Pharma',
  SanteB2C: 'Santé B2C',
  Autre: 'Autre',
}
const ORIGIN_COLORS: Record<CompanyOrigin, { bg: string; fg: string }> = {
  LinkedIn: { bg: '#0a66c2', fg: '#fff' },
  Outbound: { bg: '#7c3aed', fg: '#fff' },
  'Réseau': { bg: '#0891b2', fg: '#fff' },
  'Lead Magnet': { bg: '#ea580c', fg: '#fff' },
}

type CrmContactVisit = { ts: string; path: string }

type CrmNpsResponse = {
  id: string
  resource: string
  resourceLabel: string
  downloadedAt: string
  askedAt?: string
  askedToken?: string
  askedDryRun?: boolean
  score?: number
  scoredAt?: string
  comment?: string
  commentAt?: string
}

type CrmContact = {
  id: string
  email: string
  firstName: string
  lastName: string
  source: string
  notes: string
  createdAt: string
  updatedAt: string
  linkedIn?: string
  phone?: string
  jobTitle?: string
  company?: string
  language?: ContactLanguage
  enrichedAt?: string
  enrichmentSource?: string
  notionPageId?: string
  visits?: CrmContactVisit[]
  lastVisitAlertAt?: string
  npsResponses?: CrmNpsResponse[]
}

type CrmTask = {
  id: string
  title: string
  dueDate: string // YYYY-MM-DD
  description: string
  done: boolean
  createdAt: string
  updatedAt: string
}

type CrmStatusHistoryEntry = {
  status: CrmStatus
  at: string
}

type CrmCompany = {
  id: string
  name: string
  status: CrmStatus
  contacts: CrmContact[]
  tasks: CrmTask[]
  notes: string
  createdAt: string
  updatedAt: string
  statusHistory?: CrmStatusHistoryEntry[]
  notionPageId?: string
  size?: CompanySize
  location?: CompanyLocation
  sector?: CompanySector
  origin?: CompanyOrigin
}

const SIZE_PTS: Record<CompanySize, number> = { Startup: 4, Scaleup: 10, ETI: 16, 'Grand groupe': 20 }
const LOCATION_PTS: Record<CompanyLocation, number> = { FR: 20, Europe_US: 12, Autre: 4 }
const SECTOR_PTS: Record<CompanySector, number> = { LogicielsSante: 20, MedTechBioPharma: 14, SanteB2C: 8, Autre: 2 }

type HierarchyLevel = 'Founder' | 'CLevel' | 'Manager' | 'Other'
const HIERARCHY_PTS: Record<HierarchyLevel, number> = { Founder: 20, CLevel: 13, Manager: 6, Other: 0 }
const HIERARCHY_LABELS: Record<HierarchyLevel, string> = { Founder: 'Founder', CLevel: 'C-level', Manager: 'Manager', Other: 'Autre' }

function bestNpsScore(c: CrmContact): number | null {
  if (!c.npsResponses) return null
  const scored = c.npsResponses.filter(r => typeof r.score === 'number') as (CrmNpsResponse & { score: number })[]
  if (scored.length === 0) return null
  return scored.reduce((best, r) => r.score > best ? r.score : best, scored[0].score)
}

function matchesNpsFilter(
  c: CrmContact,
  filter: 'promoters' | 'passives' | 'detractors' | 'pending',
): boolean {
  if (!c.npsResponses || c.npsResponses.length === 0) return false
  if (filter === 'pending') return c.npsResponses.some(r => r.score === undefined)
  return c.npsResponses.some(r => {
    if (typeof r.score !== 'number') return false
    if (filter === 'promoters') return r.score >= 9
    if (filter === 'passives') return r.score >= 7 && r.score <= 8
    if (filter === 'detractors') return r.score <= 6
    return false
  })
}

function npsScoreColor(score: number): string {
  if (score <= 6) return '#dc2626'
  if (score <= 8) return '#f59e0b'
  return '#16a34a'
}

function npsScoreLabel(score: number): string {
  if (score <= 6) return 'Détracteur'
  if (score <= 8) return 'Passif'
  return 'Promoteur'
}

function classifyJobTitle(title: string | undefined): HierarchyLevel | null {
  if (!title) return null
  const t = title.toLowerCase()
  if (/founder|fondateur|fondatrice|co-?founder|co-?fondateur|cofounder|cofondateur/.test(t)) return 'Founder'
  if (/\bceo\b|\bcto\b|\bcfo\b|\bcoo\b|\bcmo\b|\bcpo\b|\bcro\b|\bcio\b|chief\s+\w+\s+officer|chief\s+\w+|\bpdg\b|\bdg\b|directeur\s+g[eé]n[eé]ral|directrice\s+g[eé]n[eé]rale|\bvp\b|vice\s*-?\s*pr[eé]sident|head\s+of\s+/.test(t)) return 'CLevel'
  if (/manager|director|directeur|directrice|lead\b|responsable|\bhead\b/.test(t)) return 'Manager'
  return 'Other'
}

function bestHierarchy(co: CrmCompany): HierarchyLevel | null {
  let best: HierarchyLevel | null = null
  const rank: Record<HierarchyLevel, number> = { Founder: 3, CLevel: 2, Manager: 1, Other: 0 }
  for (const c of co.contacts) {
    const h = classifyJobTitle(c.jobTitle)
    if (!h) continue
    if (!best || rank[h] > rank[best]) best = h
  }
  return best
}

type CompanyScore = {
  total: number
  size: number
  location: number
  sector: number
  hierarchy: number
  engagement: number
  hierarchyLevel: HierarchyLevel | null
}

function computeCompanyScore(co: CrmCompany): CompanyScore {
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
  return { total: size + location + sector + hierarchy + engagement, size, location, sector, hierarchy, engagement, hierarchyLevel }
}

function scoreTier(total: number): 'top' | 'good' | 'mid' | 'low' {
  if (total >= 70) return 'top'
  if (total >= 50) return 'good'
  if (total >= 25) return 'mid'
  return 'low'
}

/**
 * Collapse companies that share the same `id`. These are accidental duplicates:
 * a company id is derived from the name (lowercased, non-alphanumerics collapsed),
 * but the backend's dedup-on-create compared raw lowercased names. So a name
 * variant ("Synapse  Medicine" with a double space, or punctuation differences)
 * slipped past the name check yet normalized to the same id. The result was
 * several CrmCompany records sharing one id → duplicate React keys in the list,
 * which breaks reconciliation so filtered-out rows linger on screen regardless
 * of the active filters. Merging by id restores unique keys and removes the
 * phantom rows. (The backend create paths now normalize too, so this is mostly
 * a safety net for records created before the fix.)
 */
function dedupeCompaniesById(companies: CrmCompany[]): CrmCompany[] {
  const byId = new Map<string, CrmCompany>()
  for (const co of companies) {
    const existing = byId.get(co.id)
    if (!existing) {
      byId.set(co.id, { ...co, contacts: [...co.contacts], tasks: [...(co.tasks || [])] })
      continue
    }
    // Merge contacts (dedupe by id, then by email)
    const seenIds = new Set(existing.contacts.map(c => c.id))
    const seenEmails = new Set(existing.contacts.map(c => c.email.toLowerCase()))
    for (const c of co.contacts) {
      if (seenIds.has(c.id) || seenEmails.has(c.email.toLowerCase())) continue
      seenIds.add(c.id); seenEmails.add(c.email.toLowerCase())
      existing.contacts.push(c)
    }
    // Merge tasks (dedupe by id)
    if (co.tasks?.length) {
      if (!existing.tasks) existing.tasks = []
      const seenTasks = new Set(existing.tasks.map(t => t.id))
      for (const t of co.tasks) {
        if (seenTasks.has(t.id)) continue
        seenTasks.add(t.id)
        existing.tasks.push(t)
      }
    }
    // Keep the most-advanced status and the richest metadata
    if (CRM_STATUSES.indexOf(co.status) > CRM_STATUSES.indexOf(existing.status)) existing.status = co.status
    if ((co.statusHistory?.length || 0) > (existing.statusHistory?.length || 0)) existing.statusHistory = co.statusHistory
    if (co.updatedAt > existing.updatedAt) existing.updatedAt = co.updatedAt
    if (co.notionPageId && !existing.notionPageId) existing.notionPageId = co.notionPageId
    if (co.notes && !existing.notes) existing.notes = co.notes
    if (co.size && !existing.size) existing.size = co.size
    if (co.location && !existing.location) existing.location = co.location
    if (co.sector && !existing.sector) existing.sector = co.sector
  }
  return [...byId.values()]
}

const SCORE_TIER_COLORS: Record<'top' | 'good' | 'mid' | 'low', { bg: string; fg: string; label: string }> = {
  top: { bg: '#d1fae5', fg: '#065f46', label: 'Top' },
  good: { bg: '#dbeafe', fg: '#1e40af', label: 'Bon' },
  mid: { bg: '#fef3c7', fg: '#92400e', label: 'Moyen' },
  low: { bg: '#f4f4f5', fg: '#71717a', label: 'Faible' },
}

function detectLanguage(input: { email?: string; firstName?: string }): ContactLanguage {
  const email = (input.email || '').toLowerCase()
  if (email.endsWith('.fr')) return 'FR'
  if (/[éèêëàâäîïôöûüç]/i.test(input.firstName || '')) return 'FR'
  return 'EN'
}

const STATUS_COLORS: Record<CrmStatus, { bg: string; fg: string }> = {
  'Non qualifié': { bg: '#f4f4f5', fg: '#52525b' },
  'Prospect':     { bg: '#dbeafe', fg: '#1e40af' },
  'Lead':         { bg: '#fef3c7', fg: '#92400e' },
  'Opportunité':  { bg: '#e9d5ff', fg: '#6b21a8' },
  'Client':       { bg: '#d1fae5', fg: '#065f46' },
  'Lost':         { bg: '#fee2e2', fg: '#991b1b' },
}

export default function Admin() {
  const [password, setPassword] = useState(() => sessionStorage.getItem(AUTH_KEY) || '')
  const [authInput, setAuthInput] = useState('')
  const [authError, setAuthError] = useState('')
  const [view, setView] = useState<'analytics' | 'crm' | 'content' | 'nps' | 'quotes' | 'cms' | 'seo' | 'emails' | 'onboarding'>('analytics')

  // Mark this browser as "admin" so quote views from here are not counted
  useEffect(() => {
    if (password) localStorage.setItem('clempo_admin_authed', '1')
  }, [password])

  // Restore native cursor on /admin (body has `cursor: none` globally)
  useEffect(() => {
    const prevBody = document.body.style.cursor
    document.body.style.cursor = 'auto'
    const style = document.createElement('style')
    style.textContent = 'body, a, button, input, textarea, select { cursor: auto !important; } a, button { cursor: pointer !important; }'
    document.head.appendChild(style)
    return () => {
      document.body.style.cursor = prevBody
      document.head.removeChild(style)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    // Validate by calling the admin-data endpoint
    try {
      const res = await fetch('/.netlify/functions/admin-data', {
        headers: { Authorization: `Bearer ${authInput}` },
      })
      if (res.status === 401) {
        setAuthError('Mot de passe incorrect')
        return
      }
      if (!res.ok) {
        setAuthError('Erreur serveur')
        return
      }
      sessionStorage.setItem(AUTH_KEY, authInput)
      localStorage.setItem('clempo_admin_authed', '1')
      setPassword(authInput)
    } catch {
      setAuthError('Erreur réseau')
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem(AUTH_KEY)
    setPassword('')
    setAuthInput('')
  }

  if (!password) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: '#fafafa', fontFamily: "'Inter', sans-serif",
      }}>
        <form onSubmit={handleLogin} style={{
          background: '#fff', padding: '2.5rem', borderRadius: '16px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)', width: '100%', maxWidth: '360px',
          border: '1px solid #eee',
        }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: ACCENT, marginBottom: '0.25rem' }}>
            Admin clempo.fr
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '1.5rem' }}>
            Accès restreint
          </p>
          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#555', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Mot de passe
          </label>
          <input
            type="password"
            value={authInput}
            onChange={e => setAuthInput(e.target.value)}
            autoFocus
            style={{
              width: '100%', padding: '0.7rem 0.9rem', fontSize: '0.9rem',
              border: '1px solid #e0e0e0', borderRadius: '10px', outline: 'none',
              background: '#fafafa', boxSizing: 'border-box', marginBottom: '1rem',
            }}
          />
          <button type="submit" style={{
            width: '100%', padding: '0.75rem', border: 'none', borderRadius: '10px',
            background: ACCENT, color: '#fff', fontSize: '0.85rem', fontWeight: 600,
            cursor: 'pointer',
          }}>
            Se connecter
          </button>
          {authError && (
            <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#dc2626', textAlign: 'center' }}>
              {authError}
            </p>
          )}
        </form>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar */}
      <nav style={{
        width: '240px', flexShrink: 0, borderRight: '1px solid #e5e5e5',
        background: '#fafafa', padding: '1.5rem 1rem', overflowY: 'auto',
      }}>
        <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: ACCENT, marginBottom: '0.5rem' }}>
          Admin
        </h1>
        <p style={{ fontSize: '0.7rem', color: '#999', marginBottom: '1.5rem' }}>clempo.fr</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '1.5rem' }}>
          <button
            onClick={() => setView('analytics')}
            style={tabStyle(view === 'analytics')}
          >
            📊 Analytics
          </button>
          <button
            onClick={() => setView('crm')}
            style={tabStyle(view === 'crm')}
          >
            👥 CRM
          </button>
          <button
            onClick={() => setView('content')}
            style={tabStyle(view === 'content')}
          >
            📥 Contenus
          </button>
          <button
            onClick={() => setView('nps')}
            style={tabStyle(view === 'nps')}
          >
            📊 NPS
          </button>
          <button
            onClick={() => setView('quotes')}
            style={tabStyle(view === 'quotes')}
          >
            📄 Devis
          </button>
          <button
            onClick={() => setView('onboarding')}
            style={tabStyle(view === 'onboarding')}
          >
            📋 Onboarding
          </button>
          <button
            onClick={() => setView('emails')}
            style={tabStyle(view === 'emails')}
          >
            ✉️ Emails
          </button>
          <button
            onClick={() => setView('cms')}
            style={tabStyle(view === 'cms')}
          >
            ✏️ CMS contenu
          </button>
          <button
            onClick={() => setView('seo')}
            style={tabStyle(view === 'seo')}
          >
            🔍 SEO positions
          </button>
        </div>

        <button
          onClick={handleLogout}
          style={{
            width: '100%', padding: '0.5rem', border: '1px solid #e0e0e0',
            borderRadius: '8px', background: '#fff', color: '#666',
            fontSize: '0.75rem', cursor: 'pointer', marginTop: 'auto',
          }}
        >
          Déconnexion
        </button>
      </nav>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: 'auto', background: '#fff' }}>
        {view === 'analytics' ? (
          <AnalyticsView password={password} />
        ) : view === 'crm' ? (
          <CrmView password={password} />
        ) : view === 'content' ? (
          <ContentView password={password} />
        ) : view === 'nps' ? (
          <NpsView password={password} />
        ) : view === 'quotes' ? (
          <QuotesView password={password} />
        ) : view === 'seo' ? (
          <SeoView password={password} />
        ) : view === 'emails' ? (
          <EmailTemplatesView password={password} />
        ) : view === 'onboarding' ? (
          <OnboardingView password={password} />
        ) : (
          <CMSView />
        )}
      </main>
    </div>
  )
}

/* ---------- Analytics ---------- */

function AnalyticsView({ password }: { password: string }) {
  const [data, setData] = useState<AnalyticsResponse | null>(null)
  const [crmCompanies, setCrmCompanies] = useState<CrmCompany[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [range, setRange] = useState<7 | 30 | 90>(30)
  // When set, the source/CTA/page breakdowns describe this single day instead of
  // the whole range — a one-day spike is invisible once averaged into 30 days.
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [funnelPeriod, setFunnelPeriod] = useState<'week' | 'month'>('week')
  const [diag, setDiag] = useState('')
  const [editingImpressionsKey, setEditingImpressionsKey] = useState<string | null>(null)
  const [editingImpressionsValue, setEditingImpressionsValue] = useState('')
  const [liDate, setLiDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [liValue, setLiValue] = useState('')
  const [liStatus, setLiStatus] = useState<{ ok: boolean; msg: string } | null>(null)
  const [liSaving, setLiSaving] = useState(false)
  const { sort: evSort, toggle: evToggle } = useSort()
  const [evTypeFilter, setEvTypeFilter] = useState('all')
  const [evStatusFilter, setEvStatusFilter] = useState('all')
  const [evNameQuery, setEvNameQuery] = useState('')
  const [evEmailQuery, setEvEmailQuery] = useState('')

  const saveManualImpressions = useCallback(async (periodKey: string, valueRaw: string) => {
    const trimmed = valueRaw.trim()
    const isDelete = trimmed === ''
    const value = isDelete ? null : Number(trimmed.replace(/[\s,]/g, ''))
    if (!isDelete && (!Number.isFinite(value!) || value! < 0)) return
    try {
      const r = await fetch('/.netlify/functions/admin-data', {
        method: 'POST',
        headers: { Authorization: `Bearer ${password}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_linkedin_impressions_manual', periodKey: `${funnelPeriod}:${periodKey}`, value }),
      })
      if (!r.ok) throw new Error(await r.text())
      // Optimistic update without full refresh
      setData(prev => {
        if (!prev) return prev
        const manual = { ...(prev.linkedin_impressions_manual || {}) }
        const fullKey = `${funnelPeriod}:${periodKey}`
        if (isDelete) delete manual[fullKey]
        else manual[fullKey] = Math.round(value!)
        return { ...prev, linkedin_impressions_manual: manual }
      })
    } catch (err) {
      console.error('saveManualImpressions error:', err)
      alert(`Échec sauvegarde impressions : ${String(err)}`)
    }
  }, [funnelPeriod, password])

  const refresh = useCallback(() => {
    setLoading(true)
    // Fetch analytics + CRM in parallel — the Funnel block below joins them.
    const hdrs = { Authorization: `Bearer ${password}` }
    Promise.all([
      fetch('/.netlify/functions/admin-data', { headers: hdrs }).then(async r => {
        const body = await r.text()
        if (!r.ok) throw new Error(`admin-data ${r.status}: ${body}`)
        return JSON.parse(body) as AnalyticsResponse
      }),
      fetch('/.netlify/functions/admin-crm', { headers: hdrs }).then(async r => {
        const body = await r.text()
        if (!r.ok) throw new Error(`admin-crm ${r.status}: ${body}`)
        return JSON.parse(body) as { companies: CrmCompany[] }
      }),
    ])
      .then(([analytics, crm]) => {
        setData(analytics)
        setCrmCompanies(dedupeCompaniesById(crm.companies || []))
        setLoading(false)
      })
      .catch(err => { setError(String(err)); setLoading(false) })
  }, [password])

  useEffect(() => { refresh() }, [refresh])

  const runTestWrite = async () => {
    setDiag('Test en cours…')
    try {
      const res = await fetch('/.netlify/functions/admin-data?testwrite=1', {
        headers: { Authorization: `Bearer ${password}` },
      })
      const body = await res.text()
      setDiag(`HTTP ${res.status} — ${body.slice(0, 800)}`)
      if (res.ok) refresh()
    } catch (err) {
      setDiag(`Network error: ${String(err)}`)
    }
  }

  const saveLinkedinImpressions = async (e: React.FormEvent) => {
    e.preventDefault()
    const val = parseInt(liValue, 10)
    if (isNaN(val) || val < 0) {
      setLiStatus({ ok: false, msg: 'Valeur invalide' })
      return
    }
    setLiSaving(true)
    setLiStatus(null)
    try {
      const res = await fetch('/.netlify/functions/admin-data', {
        method: 'POST',
        headers: { Authorization: `Bearer ${password}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_linkedin_impressions', dateKey: liDate, value: val }),
      })
      const body = await res.text()
      if (res.ok) {
        setLiStatus({ ok: true, msg: `Enregistré : ${val.toLocaleString('fr-FR')} impressions pour le ${liDate}` })
        setLiValue('')
        refresh()
      } else {
        setLiStatus({ ok: false, msg: `Erreur ${res.status} : ${body.slice(0, 200)}` })
      }
    } catch (err) {
      setLiStatus({ ok: false, msg: `Erreur réseau : ${String(err)}` })
    } finally {
      setLiSaving(false)
    }
  }

  const stats = useMemo(() => {
    if (!data) return null
    const now = new Date()
    const start = new Date(now)
    start.setDate(start.getDate() - (range - 1))
    const startKey = start.toISOString().slice(0, 10)

    const dates: string[] = []
    for (let i = 0; i < range; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      dates.push(d.toISOString().slice(0, 10))
    }

    const visitsByDay = dates.map(d => ({ date: d, count: data.visits[d] || 0 }))
    const totalVisits = visitsByDay.reduce((s, x) => s + x.count, 0)

    // Aggregate per-day breakdowns (path/src/ref). Scoped to `selectedDay` when
    // the user clicks a bar, otherwise across the whole range.
    const aggDates = selectedDay && dates.includes(selectedDay) ? [selectedDay] : dates
    const aggregate = (buckets?: Record<string, Record<string, number>>): { key: string; count: number }[] => {
      if (!buckets) return []
      const totals: Record<string, number> = {}
      for (const d of aggDates) {
        const day = buckets[d]
        if (!day) continue
        for (const [k, v] of Object.entries(day)) {
          totals[k] = (totals[k] || 0) + (v || 0)
        }
      }
      return Object.entries(totals)
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count)
    }

    const byRef = aggregate(data.visits_by_ref)
    const bySrc = aggregate(data.visits_by_src)
    const byPath = aggregate(data.visits_by_path)
    const botsBlocked = aggDates.reduce((s, d) => s + (data.bots_blocked?.[d]?.total || 0), 0)
    const botReasons = Object.entries(
      aggDates.reduce((acc: Record<string, number>, d) => {
        for (const [r, n] of Object.entries(data.bots_blocked?.[d]?.byReason || {})) acc[r] = (acc[r] || 0) + n
        return acc
      }, {}),
    )
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count)
    const refTotal = byRef.reduce((s, x) => s + x.count, 0)
    const srcTotal = bySrc.reduce((s, x) => s + x.count, 0)
    const pathTotal = byPath.reduce((s, x) => s + x.count, 0)

    const eventsInRange = data.events.filter(e => e.ts.slice(0, 10) >= startKey)
    const bookings = eventsInRange.filter(e => e.type === 'booking').length
    const brochures = eventsInRange.filter(e => e.type === 'brochure').length
    const dataDownloads = eventsInRange.filter(e => e.type === 'data-download').length
    const journalistes = eventsInRange.filter(e => e.type === 'journalistes').length
    const decideurs = eventsInRange.filter(e => e.type === 'decideurs-hospitaliers').length
    const influenceurs = eventsInRange.filter(e => e.type === 'influenceurs-sante').length
    const conversions = bookings + brochures + dataDownloads + journalistes + decideurs + influenceurs
    const rate = totalVisits > 0 ? (conversions / totalVisits) * 100 : 0

    return {
      visitsByDay, totalVisits, bookings, brochures, dataDownloads, journalistes, decideurs, influenceurs, conversions, rate,
      byRef, bySrc, byPath, refTotal, srcTotal, pathTotal, botsBlocked, botReasons,
    }
  }, [data, range, selectedDay])

  // Funnel over time — weekly or monthly. Decoupled from `range` because the
  // funnel has its own time granularity (always shows last 8 periods).
  const funnelRows = useMemo(() => {
    if (!data) return null
    const periods = buildPeriods(funnelPeriod, 8)

    // Count status transitions by scanning each company's statusHistory.
    const countTransitions = (target: CrmStatus, startISO: string, endISO: string): number => {
      if (!crmCompanies) return 0
      let count = 0
      for (const co of crmCompanies) {
        const history = co.statusHistory && co.statusHistory.length > 0
          ? co.statusHistory
          // Fallback for any company the backend forgot to backfill
          : [{ status: co.status, at: co.createdAt }]
        for (const entry of history) {
          if (entry.status === target && entry.at >= startISO && entry.at < endISO) {
            count++
          }
        }
      }
      return count
    }

    // Count visits by summing the per-day `visits` bucket that falls inside the period.
    const countVisits = (startISO: string, endISO: string): number => {
      const startKey = startISO.slice(0, 10)
      const endKey = endISO.slice(0, 10)
      let total = 0
      for (const [day, n] of Object.entries(data.visits)) {
        if (day >= startKey && day < endKey) total += n
      }
      return total
    }

    // LinkedIn impressions: prefer manual entry per period (set from the admin
    // funnel cell) over the rolling-7d snapshot. The snapshot only captures
    // "impressions over the last 7 days at scan time" so it's only correct for
    // the in-progress period.
    const linkedinImpressions = data.linkedin_impressions || {}
    const linkedinImpressionsManual = data.linkedin_impressions_manual || {}
    const snapshotFor = (startISO: string, endISO: string): number | null => {
      const startKey = startISO.slice(0, 10)
      const endKey = endISO.slice(0, 10)
      let bestDate = ''
      let bestVal: number | null = null
      for (const [day, n] of Object.entries(linkedinImpressions)) {
        if (day >= startKey && day < endKey && day > bestDate) {
          bestDate = day
          bestVal = n
        }
      }
      return bestVal
    }
    const impressionsFor = (periodKey: string, startISO: string, endISO: string): { value: number | null; manual: boolean } => {
      const fullKey = `${funnelPeriod}:${periodKey}`
      if (Object.prototype.hasOwnProperty.call(linkedinImpressionsManual, fullKey)) {
        return { value: linkedinImpressionsManual[fullKey], manual: true }
      }
      return { value: snapshotFor(startISO, endISO), manual: false }
    }

    return periods.map(p => {
      const imp = impressionsFor(p.key, p.startISO, p.endISO)
      const impressions = imp.value
      const impressionsManual = imp.manual
      const visits = countVisits(p.startISO, p.endISO)
      const leads = countTransitions('Lead', p.startISO, p.endISO)
      const opportunities = countTransitions('Opportunité', p.startISO, p.endISO)
      const clients = countTransitions('Client', p.startISO, p.endISO)
      const pct = (num: number, den: number | null): number | null =>
        den != null && den > 0 ? (num / den) * 100 : null
      return {
        key: p.key,
        label: p.label,
        impressions,
        impressionsManual,
        visits,
        leads,
        opportunities,
        clients,
        visitsRate: pct(visits, impressions),
        leadsRate: pct(leads, visits),
        opportunitiesRate: pct(opportunities, leads),
        clientsRate: pct(clients, opportunities),
      }
    })
  }, [data, crmCompanies, funnelPeriod])

  if (loading) return <div style={{ padding: '3rem' }}>Chargement...</div>
  if (error) return <div style={{ padding: '3rem', color: '#dc2626' }}>Erreur : {error}</div>
  if (!data || !stats) return null

  const maxVisits = Math.max(1, ...stats.visitsByDay.map(v => v.count))

  // Table « Derniers contacts » — filtres de colonnes + tri (cap à 100 lignes après filtrage)
  const evNameQ = evNameQuery.trim().toLowerCase()
  const evEmailQ = evEmailQuery.trim().toLowerCase()
  const filteredEvents = data.events.filter(ev => {
    if (evTypeFilter !== 'all' && ev.type !== evTypeFilter) return false
    if (evStatusFilter !== 'all' && (ev.bookingStatus || 'none') !== evStatusFilter) return false
    if (evNameQ && ![ev.firstName, ev.lastName].filter(Boolean).join(' ').toLowerCase().includes(evNameQ)) return false
    if (evEmailQ && !(ev.email || '').toLowerCase().includes(evEmailQ)) return false
    return true
  })
  const sortedEvents = sortRows(filteredEvents, evSort, {
    type: ev => ev.type,
    status: ev => ev.bookingStatus || '',
    date: ev => ev.ts,
    name: ev => [ev.firstName, ev.lastName].filter(Boolean).join(' ').toLowerCase(),
    email: ev => (ev.email || '').toLowerCase(),
  }).slice(0, 100)

  return (
    <div style={{ padding: '2rem 3rem', maxWidth: '1100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111', margin: 0 }}>
          Analytics
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={runTestWrite}
            style={{
              padding: '0.4rem 0.8rem', border: '1px solid #e0e0e0', borderRadius: '8px',
              background: '#fff', color: '#555', fontSize: '0.75rem', cursor: 'pointer',
            }}
            title="Teste l'écriture dans Netlify Blobs"
          >
            🧪 Tester le stockage
          </button>
          <button
            onClick={refresh}
            style={{
              padding: '0.4rem 0.8rem', border: '1px solid #e0e0e0', borderRadius: '8px',
              background: '#fff', color: '#555', fontSize: '0.75rem', cursor: 'pointer',
            }}
          >
            ⟳ Rafraîchir
          </button>
          <div style={{ display: 'flex', gap: '4px', background: '#f4f4f5', padding: '4px', borderRadius: '10px' }}>
            {([7, 30, 90] as const).map(d => (
              <button
                key={d}
                onClick={() => setRange(d)}
                style={{
                  padding: '0.4rem 0.8rem', border: 'none', borderRadius: '6px',
                  background: range === d ? '#fff' : 'transparent',
                  color: range === d ? ACCENT : '#666',
                  fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                  boxShadow: range === d ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                {d}j
              </button>
            ))}
          </div>
        </div>
      </div>

      {diag && (
        <pre style={{
          background: '#0a0a0a', color: '#9fe8a7', padding: '1rem', borderRadius: '10px',
          fontSize: '0.7rem', marginBottom: '1.5rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
        }}>
          {diag}
        </pre>
      )}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="Visites" value={stats.totalVisits.toString()} />
        <StatCard label="Rendez-vous" value={stats.bookings.toString()} />
        <StatCard label="Brochures" value={stats.brochures.toString()} />
        <StatCard label="Data download" value={stats.dataDownloads.toString()} />
        <StatCard label="Base décideurs" value={stats.decideurs.toString()} />
        <StatCard label="Base influenceurs" value={stats.influenceurs.toString()} />
        <StatCard label="Journalistes" value={stats.journalistes.toString()} />
        <StatCard
          label="Taux de conversion"
          value={`${stats.rate.toFixed(1)}%`}
          sub={`${stats.conversions} / ${stats.totalVisits}`}
        />
      </div>

      {/* Marketing funnel (weekly / monthly) */}
      <div style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: '14px', padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#555', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Funnel marketing
            </h3>
            <p style={{ fontSize: '0.7rem', color: '#999', margin: '0.25rem 0 0' }}>
              Impressions LinkedIn → Visites → Leads → Opportunités → Clients, par {funnelPeriod === 'week' ? 'semaine' : 'mois'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '4px', background: '#f4f4f5', padding: '4px', borderRadius: '10px' }}>
            {(['week', 'month'] as const).map(p => (
              <button
                key={p}
                onClick={() => setFunnelPeriod(p)}
                style={{
                  padding: '0.4rem 0.8rem', border: 'none', borderRadius: '6px',
                  background: funnelPeriod === p ? '#fff' : 'transparent',
                  color: funnelPeriod === p ? ACCENT : '#666',
                  fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                  boxShadow: funnelPeriod === p ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                {p === 'week' ? 'Hebdo' : 'Mensuel'}
              </button>
            ))}
          </div>
        </div>
        {!funnelRows ? (
          <p style={{ fontSize: '0.75rem', color: '#999', margin: 0 }}>Chargement…</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e5e5' }}>
                <th style={{ ...thStyle, background: 'transparent' }}>Période</th>
                <th style={{ ...thStyle, background: 'transparent', textAlign: 'right' }} title="Snapshot LinkedIn « 7 derniers jours » au moment du scan matinal">Impressions LinkedIn</th>
                <th style={{ ...thStyle, background: 'transparent', textAlign: 'right' }} title="Taux = Visites ÷ Impressions LinkedIn">Visites</th>
                <th style={{ ...thStyle, background: 'transparent', textAlign: 'right' }} title="Taux = Leads ÷ Visites">Nouveaux leads</th>
                <th style={{ ...thStyle, background: 'transparent', textAlign: 'right' }} title="Taux = Opportunités ÷ Leads">Nouv. opportunités</th>
                <th style={{ ...thStyle, background: 'transparent', textAlign: 'right' }} title="Taux = Clients ÷ Opportunités">Nouveaux clients</th>
              </tr>
            </thead>
            <tbody>
              {funnelRows.map((row, idx) => (
                <tr key={row.key} style={{ borderBottom: '1px solid #f0f0f0', background: idx === 0 ? '#fff' : 'transparent' }}>
                  <td style={{ ...tdStyle, fontWeight: idx === 0 ? 600 : 400 }}>
                    {row.label}
                    {idx === 0 && (
                      <span style={{ marginLeft: 8, fontSize: '0.65rem', color: ACCENT, fontWeight: 600 }}>en cours</span>
                    )}
                  </td>
                  <td
                    style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: row.impressions == null ? '#ccc' : '#111', cursor: 'pointer' }}
                    title="Cliquer pour saisir la valeur LinkedIn de la période"
                    onClick={() => {
                      if (editingImpressionsKey === row.key) return
                      setEditingImpressionsKey(row.key)
                      setEditingImpressionsValue(row.impressions != null ? String(row.impressions) : '')
                    }}
                  >
                    {editingImpressionsKey === row.key ? (
                      <input
                        autoFocus
                        type="text"
                        inputMode="numeric"
                        value={editingImpressionsValue}
                        onChange={e => setEditingImpressionsValue(e.target.value)}
                        onBlur={() => {
                          saveManualImpressions(row.key, editingImpressionsValue)
                          setEditingImpressionsKey(null)
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            saveManualImpressions(row.key, editingImpressionsValue)
                            setEditingImpressionsKey(null)
                          }
                          if (e.key === 'Escape') setEditingImpressionsKey(null)
                        }}
                        placeholder="ex. 103389"
                        style={{
                          width: '90px', padding: '2px 6px', textAlign: 'right',
                          border: `1px solid ${ACCENT}`, borderRadius: '4px',
                          fontVariantNumeric: 'tabular-nums', fontSize: '0.8rem',
                        }}
                      />
                    ) : (
                      <>
                        <div>{row.impressions == null ? '—' : row.impressions.toLocaleString('fr-FR')}</div>
                        {row.impressionsManual && (
                          <div style={{ fontSize: '0.6rem', color: ACCENT, fontWeight: 500 }}>saisi</div>
                        )}
                      </>
                    )}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    <div>{row.visits}</div>
                    {row.visitsRate != null && (
                      <div style={{ fontSize: '0.65rem', color: '#999', fontWeight: 400 }}>
                        {row.visitsRate.toFixed(1)}%
                      </div>
                    )}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: row.leads > 0 ? '#111' : '#ccc' }}>
                    <div>{row.leads}</div>
                    {row.leadsRate != null && (
                      <div style={{ fontSize: '0.65rem', color: '#999', fontWeight: 400 }}>
                        {row.leadsRate.toFixed(1)}%
                      </div>
                    )}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: row.opportunities > 0 ? '#111' : '#ccc' }}>
                    <div>{row.opportunities}</div>
                    {row.opportunitiesRate != null && (
                      <div style={{ fontSize: '0.65rem', color: '#999', fontWeight: 400 }}>
                        {row.opportunitiesRate.toFixed(0)}%
                      </div>
                    )}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: row.clients > 0 ? '#111' : '#ccc', fontWeight: row.clients > 0 ? 600 : 400 }}>
                    <div>{row.clients}</div>
                    {row.clientsRate != null && (
                      <div style={{ fontSize: '0.65rem', color: '#999', fontWeight: 400 }}>
                        {row.clientsRate.toFixed(0)}%
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {crmCompanies && crmCompanies.length > 0 && (
          <p style={{ fontSize: '0.65rem', color: '#aaa', margin: '0.75rem 0 0' }}>
            Compte les transitions de statut dans le CRM. L'historique avant aujourd'hui n'a pas été tracké — les données passées se limitent au statut actuel à la date de création de l'entreprise.
          </p>
        )}

        {/* Saisie manuelle des impressions LinkedIn */}
        <form
          onSubmit={saveLinkedinImpressions}
          style={{
            marginTop: '1.25rem',
            paddingTop: '1rem',
            borderTop: '1px solid #eee',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#555', marginRight: '0.25rem' }}>
            Saisir impressions LinkedIn :
          </span>
          <input
            type="date"
            value={liDate}
            onChange={e => setLiDate(e.target.value)}
            style={{
              fontSize: '0.75rem', border: '1px solid #ddd', borderRadius: '6px',
              padding: '0.35rem 0.5rem', outline: 'none', background: '#fff',
            }}
          />
          <input
            type="number"
            min="0"
            step="1"
            placeholder="ex. 12500"
            value={liValue}
            onChange={e => setLiValue(e.target.value)}
            style={{
              fontSize: '0.75rem', border: '1px solid #ddd', borderRadius: '6px',
              padding: '0.35rem 0.5rem', outline: 'none', background: '#fff', width: '110px',
            }}
          />
          <button
            type="submit"
            disabled={liSaving || !liValue}
            style={{
              fontSize: '0.75rem', fontWeight: 600,
              padding: '0.35rem 0.9rem', border: 'none', borderRadius: '6px',
              background: ACCENT, color: '#fff', cursor: liSaving || !liValue ? 'not-allowed' : 'pointer',
              opacity: liSaving || !liValue ? 0.5 : 1,
            }}
          >
            {liSaving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          {liStatus && (
            <span style={{ fontSize: '0.7rem', color: liStatus.ok ? '#16a34a' : '#dc2626' }}>
              {liStatus.msg}
            </span>
          )}
        </form>
      </div>

      {/* Visits chart */}
      <div style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: '14px', padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
            Visites par jour
          </h3>
          <span style={{ fontSize: '0.7rem', color: '#999' }}>
            {selectedDay ? `Analyse isolée sur le ${selectedDay}` : 'Cliquez une barre pour isoler une journée'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '160px' }}>
          {stats.visitsByDay.map(v => {
            const h = (v.count / maxVisits) * 100
            const isSelected = selectedDay === v.date
            const dimmed = selectedDay !== null && !isSelected
            return (
              <div
                key={v.date}
                onClick={() => setSelectedDay(isSelected ? null : v.date)}
                title={`${v.date} : ${v.count} visites — cliquer pour ${isSelected ? 'revenir à la période' : 'isoler ce jour'}`}
                style={{
                  flex: 1,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '2px',
                  cursor: 'pointer',
                  opacity: dimmed ? 0.35 : 1,
                }}
              >
                <span style={{ fontSize: '0.6rem', color: v.count > 0 ? '#555' : '#ccc', fontVariantNumeric: 'tabular-nums', lineHeight: 1, fontWeight: isSelected ? 700 : 400 }}>
                  {v.count > 0 ? v.count : ''}
                </span>
                <div
                  style={{
                    width: '100%',
                    height: `${Math.max(2, h)}%`,
                    background: v.count > 0 ? ACCENT : '#e5e5e5',
                    borderRadius: '3px 3px 0 0',
                    outline: isSelected ? `2px solid ${ACCENT}` : 'none',
                    outlineOffset: '2px',
                  }}
                />
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#999', marginTop: '0.5rem' }}>
          <span>{stats.visitsByDay[0]?.date}</span>
          <span>{stats.visitsByDay[stats.visitsByDay.length - 1]?.date}</span>
        </div>
        {selectedDay && (
          <button
            onClick={() => setSelectedDay(null)}
            style={{
              marginTop: '0.75rem', fontSize: '0.7rem', fontWeight: 600, padding: '0.3rem 0.75rem',
              border: '1px solid #ddd', borderRadius: '6px', background: '#fff', color: '#555', cursor: 'pointer',
            }}
          >
            ← Revenir aux {range} derniers jours
          </button>
        )}
      </div>

      {/* Data quality — visits before the bot filter shipped are inflated. */}
      {stats.visitsByDay.some(v => v.date < DATA_QUALITY_CUTOFF && v.count > 0) && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '2rem', fontSize: '0.75rem', color: '#78350f', lineHeight: 1.5 }}>
          <strong>Visites antérieures au {DATA_QUALITY_CUTOFF} : surestimées.</strong> Des bots falsifiaient leur
          provenance en « google » et n'étaient pas filtrés. Repère : la Search Console comptait 50 clics réels
          du 07 au 13/07 quand ce tableau en affichait 737. Les chiffres à partir du {DATA_QUALITY_CUTOFF} sont
          filtrés côté serveur. L'historique est conservé tel quel : aucun user-agent ni IP n'ayant été stocké par
          visite, il n'existe aucun moyen fiable de distinguer après coup les fausses visites des vraies.
        </div>
      )}

      {/* Sources de trafic */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <SourceBreakdown
          title="Sources externes"
          hint="D'où viennent les visiteurs (moteurs, réseaux, IA, direct)"
          rows={stats.byRef.map(r => ({ key: r.key, label: refLabel(r.key), count: r.count }))}
          total={stats.refTotal}
          emptyMsg="Pas encore de données de référent. Les visites actuelles n'ont pas d'info de provenance."
        />
        <SourceBreakdown
          title="CTAs internes"
          hint="Bouton ou lien cliqué pour arriver sur la page (paramètre ?src=)"
          rows={stats.bySrc.map(r => ({ key: r.key, label: r.key, count: r.count }))}
          total={stats.srcTotal}
          emptyMsg="Aucun CTA taggé n'a encore été cliqué sur la période."
        />
        <SourceBreakdown
          title="Top pages visitées"
          hint={selectedDay ? `Pages les plus vues le ${selectedDay}` : 'Pages les plus vues sur la période'}
          rows={stats.byPath.slice(0, 20).map(r => ({ key: r.key, label: r.key, count: r.count }))}
          total={stats.pathTotal}
          emptyMsg="Pas encore de visites tracées par page."
        />
        <SourceBreakdown
          title={`Bots bloqués (${stats.botsBlocked})`}
          hint="Requêtes rejetées côté serveur, jamais comptées comme visites"
          rows={stats.botReasons.map(r => ({ key: r.key, label: BOT_REASON_LABELS[r.key] || r.key, count: r.count }))}
          total={stats.botsBlocked}
          emptyMsg="Aucun bot bloqué sur la période."
        />
      </div>

      {/* Events table */}
      <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#555', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Derniers contacts ({data.events.length})
      </h3>
      <div style={{ border: '1px solid #eee', borderRadius: '14px', overflow: 'hidden', background: '#fff' }}>
        {data.events.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#999', fontSize: '0.85rem' }}>
            Aucun événement pour le moment.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '1px solid #eee' }}>
                <Th
                  label="Type" thStyle={thStyle} sortKey="type" sort={evSort} onSort={evToggle}
                  filterActive={evTypeFilter !== 'all'}
                  filter={<FilterChoices value={evTypeFilter} onChange={setEvTypeFilter} options={[
                    { value: 'all', label: 'Tous' },
                    { value: 'booking', label: 'RDV' },
                    { value: 'journalistes', label: 'Lead journaliste' },
                    { value: 'data-download', label: 'Data' },
                    { value: 'decideurs-hospitaliers', label: 'Base décideurs' },
                    { value: 'influenceurs-sante', label: 'Base influenceurs' },
                    { value: 'brochure', label: 'Brochure' },
                  ]} />}
                />
                <Th
                  label="Statut" thStyle={thStyle} sortKey="status" sort={evSort} onSort={evToggle}
                  filterActive={evStatusFilter !== 'all'}
                  filter={<FilterChoices value={evStatusFilter} onChange={setEvStatusFilter} options={[
                    { value: 'all', label: 'Tous' },
                    { value: 'success', label: '✓ OK' },
                    { value: 'failed', label: '✗ Échec' },
                    { value: 'pending', label: '⋯ En cours' },
                  ]} />}
                />
                <Th label="Date" thStyle={thStyle} sortKey="date" sort={evSort} onSort={evToggle} />
                <Th
                  label="Nom" thStyle={thStyle} sortKey="name" sort={evSort} onSort={evToggle}
                  filterActive={!!evNameQ}
                  filter={<FilterSearch value={evNameQuery} onChange={setEvNameQuery} placeholder="Nom…" />}
                />
                <Th
                  label="Email" thStyle={thStyle} sortKey="email" sort={evSort} onSort={evToggle}
                  filterActive={!!evEmailQ}
                  filter={<FilterSearch value={evEmailQuery} onChange={setEvEmailQuery} placeholder="Email…" />}
                />
                <th style={thStyle}>Détails</th>
              </tr>
            </thead>
            <tbody>
              {sortedEvents.map(ev => {
                const status = ev.bookingStatus
                const statusColor =
                  status === 'success' ? { bg: '#dcfce7', fg: '#166534' }
                  : status === 'failed' ? { bg: '#fee2e2', fg: '#991b1b' }
                  : status === 'pending' ? { bg: '#fef3c7', fg: '#92400e' }
                  : null
                return (
                <tr key={ev.id} style={{ borderBottom: '1px solid #f4f4f5' }} title={ev.bookingError || ''}>
                  <td style={tdStyle}>
                    {(() => {
                      // One badge per event type. `data-download` shows its `source`
                      // ("Data Médecins Généralistes") verbatim so each row tells which
                      // spécialité was downloaded. The décideurs base is its OWN type —
                      // it used to fall through to the "Brochure" fallback and get
                      // mislabelled. Annotated Record → adding a new type is a compile error.
                      const badges: Record<LeadEvent['type'], { bg: string; fg: string; label: string }> = {
                        booking:                  { bg: '#dbeafe', fg: '#1e40af', label: 'RDV' },
                        journalistes:             { bg: '#dcfce7', fg: '#166534', label: 'Lead journaliste' },
                        'data-download':          { bg: '#ede9fe', fg: '#5b21b6', label: ev.source || (ev.slug ? `Data ${ev.slug}` : 'Data download') },
                        'decideurs-hospitaliers': { bg: '#cffafe', fg: '#155e75', label: 'Base décideurs' },
                        'influenceurs-sante': { bg: '#fae8ff', fg: '#86198f', label: 'Base influenceurs' },
                        hiring:                   { bg: '#fce7f3', fg: '#9d174f', label: 'Recrutement' },
                        brochure:                 { bg: '#fef3c7', fg: '#92400e', label: 'Brochure' },
                      }
                      const { bg, fg, label } = badges[ev.type] ?? { bg: '#f4f4f5', fg: '#71717a', label: ev.type }
                      return (
                        <span style={{
                          display: 'inline-block', padding: '2px 8px', borderRadius: '6px',
                          background: bg, color: fg,
                          fontSize: '0.7rem', fontWeight: 600,
                        }}>
                          {label}
                        </span>
                      )
                    })()}
                  </td>
                  <td style={tdStyle}>
                    {ev.type === 'booking' && statusColor ? (
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: '6px',
                        background: statusColor.bg, color: statusColor.fg,
                        fontSize: '0.7rem', fontWeight: 600,
                      }}>
                        {status === 'success' ? '✓ OK' : status === 'failed' ? '✗ Échec' : '⋯ En cours'}
                      </span>
                    ) : ev.type === 'booking' ? (
                      <span style={{ color: '#aaa', fontSize: '0.7rem' }}>legacy</span>
                    ) : '—'}
                  </td>
                  <td style={tdStyle}>{new Date(ev.ts).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td style={tdStyle}>{[ev.firstName, ev.lastName].filter(Boolean).join(' ') || '—'}</td>
                  <td style={tdStyle}>
                    {ev.email ? <a href={`mailto:${ev.email}`} style={{ color: ACCENT }}>{ev.email}</a> : '—'}
                  </td>
                  <td style={{ ...tdStyle, color: '#666' }}>
                    {ev.type === 'booking' ? (
                      <>
                        {`${ev.date || ''} ${ev.hour !== undefined ? `${String(ev.hour).padStart(2, '0')}:${String(ev.minute || 0).padStart(2, '0')}` : ''}`.trim()}
                        {ev.message ? <div style={{ color: '#999', fontSize: '0.7rem', marginTop: '2px' }}>« {ev.message} »</div> : null}
                        {ev.bookingError ? <div style={{ color: '#991b1b', fontSize: '0.7rem', marginTop: '2px', fontFamily: 'monospace', wordBreak: 'break-all' }}>{ev.bookingError.slice(0, 120)}{ev.bookingError.length > 120 ? '…' : ''}</div> : null}
                        {ev.hangoutLink ? <div style={{ marginTop: '2px' }}><a href={ev.hangoutLink} target="_blank" rel="noreferrer" style={{ color: ACCENT, fontSize: '0.7rem' }}>Meet →</a></div> : null}
                      </>
                    ) : [ev.company, ev.phone].filter(Boolean).join(' · ') || '—'}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{
      background: '#fafafa', border: '1px solid #eee', borderRadius: '14px', padding: '1.25rem',
    }}>
      <p style={{ fontSize: '0.7rem', color: '#888', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
        {label}
      </p>
      <p style={{ fontSize: '1.75rem', fontWeight: 700, color: ACCENT, margin: '0.4rem 0 0' }}>
        {value}
      </p>
      {sub && (
        <p style={{ fontSize: '0.7rem', color: '#999', margin: '0.25rem 0 0' }}>{sub}</p>
      )}
    </div>
  )
}

function SourceBreakdown({
  title, hint, rows, total, emptyMsg,
}: {
  title: string
  hint: string
  rows: { key: string; label: string; count: number }[]
  total: number
  emptyMsg: string
}) {
  const max = Math.max(1, ...rows.map(r => r.count))
  return (
    <div style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: '14px', padding: '1.25rem' }}>
      <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#555', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </h3>
      <p style={{ fontSize: '0.7rem', color: '#999', margin: '0.25rem 0 0.9rem' }}>{hint}</p>
      {rows.length === 0 ? (
        <p style={{ fontSize: '0.75rem', color: '#aaa', fontStyle: 'italic', margin: 0 }}>{emptyMsg}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {rows.map(r => {
            const pct = total > 0 ? (r.count / total) * 100 : 0
            const barW = (r.count / max) * 100
            return (
              <div key={r.key} title={`${r.count} visites — ${pct.toFixed(1)}%`}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                  fontSize: '0.78rem', color: '#333', marginBottom: '3px', gap: '0.5rem',
                }}>
                  <span style={{
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
                  }}>{r.label}</span>
                  <span style={{ color: '#777', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                    {r.count} <span style={{ color: '#bbb', fontSize: '0.7rem' }}>({pct.toFixed(0)}%)</span>
                  </span>
                </div>
                <div style={{ height: '6px', background: '#ececec', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${barW}%`, height: '100%', background: ACCENT, borderRadius: '3px' }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const thStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  textAlign: 'left',
  fontSize: '0.7rem',
  fontWeight: 600,
  color: '#666',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

const tdStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  color: '#333',
  verticalAlign: 'middle',
}

/* ---------- TaskRow ---------- */

/** Render text with clickable URLs */
function Linkify({ text }: { text: string }) {
  const urlRe = /(https?:\/\/[^\s)]+)/g
  const parts = text.split(urlRe)
  return (
    <>
      {parts.map((part, i) =>
        urlRe.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: ACCENT, wordBreak: 'break-all' }}>{part}</a>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  )
}

function TaskRow({ task, isOverdue, onToggle, onDelete, onUpdateDesc, companyName }: {
  task: CrmTask
  isOverdue: boolean
  onToggle: (done: boolean) => void
  onDelete: () => void
  onUpdateDesc: (desc: string) => void
  companyName?: string
}) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [desc, setDesc] = useState(task.description || '')
  const today = new Date().toISOString().slice(0, 10)
  const isToday = task.dueDate === today
  const dateLabel = isToday ? "Aujourd'hui"
    : isOverdue ? `En retard · ${new Date(task.dueDate + 'T12:00:00Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
    : new Date(task.dueDate + 'T12:00:00Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

  return (
    <div style={{
      borderRadius: '7px', marginBottom: '2px',
      background: isOverdue && !task.done ? '#fff5f5' : '#fff',
      border: `1px solid ${isOverdue && !task.done ? '#fecaca' : '#f0f0f0'}`,
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.5rem' }}>
        <input
          type="checkbox"
          checked={task.done}
          onChange={e => onToggle(e.target.checked)}
          style={{ cursor: 'pointer', accentColor: ACCENT, flexShrink: 0 }}
        />
        <span
          onClick={() => setExpanded(e => !e)}
          style={{
            flex: 1, fontSize: '0.78rem', color: task.done ? '#aaa' : '#222',
            textDecoration: task.done ? 'line-through' : 'none',
            cursor: 'pointer',
          }}
        >
          {companyName && <span style={{ fontSize: '0.65rem', color: '#999', marginRight: '6px' }}>{companyName} ·</span>}
          {task.title}
          {(task.description || '') && !expanded && (
            <span style={{ marginLeft: '6px', fontSize: '0.65rem', color: '#bbb' }}>···</span>
          )}
        </span>
        <span style={{
          fontSize: '0.65rem', fontWeight: 600, whiteSpace: 'nowrap',
          color: task.done ? '#bbb' : isOverdue ? '#dc2626' : isToday ? '#1A1A6B' : '#888',
        }}>
          {dateLabel}
        </span>
        <button
          onClick={() => setExpanded(e => !e)}
          style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '0.7rem', padding: '0 2px', lineHeight: 1, flexShrink: 0 }}
        >
          {expanded ? '▲' : '▼'}
        </button>
        <button
          onClick={onDelete}
          style={{ background: 'none', border: 'none', color: '#ddd', cursor: 'pointer', fontSize: '0.85rem', padding: '0 2px', lineHeight: 1, flexShrink: 0 }}
          title="Supprimer"
        >
          ×
        </button>
      </div>
      {expanded && (
        <div style={{ padding: '0 0.5rem 0.5rem 1.8rem' }}>
          {editing ? (
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              onBlur={() => { onUpdateDesc(desc); setEditing(false) }}
              placeholder="Description, CR de réunion, notes..."
              rows={3}
              autoFocus
              style={{
                width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #e0e0e0',
                borderRadius: '7px', fontSize: '0.75rem', outline: 'none', background: '#fafafa',
                boxSizing: 'border-box', resize: 'vertical', fontFamily: "'Inter', sans-serif", lineHeight: 1.5,
              }}
            />
          ) : (
            <div
              onClick={() => { setDesc(task.description || ''); setEditing(true) }}
              style={{
                padding: '0.4rem 0.6rem', borderRadius: '7px', fontSize: '0.75rem',
                background: '#fafafa', cursor: 'text', minHeight: '2.5rem',
                fontFamily: "'Inter', sans-serif", lineHeight: 1.5, whiteSpace: 'pre-wrap',
                color: (task.description || '') ? '#333' : '#bbb',
                border: '1px solid transparent',
              }}
            >
              {(task.description || '') ? <Linkify text={task.description} /> : 'Cliquer pour ajouter une description...'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ---------- SEO Positions ---------- */

type RankingEntry = {
  date: string
  position: number | null
  url?: string
}

type KeywordRanking = {
  keyword: string
  targetPage: string
  volume: number
  history: RankingEntry[]
}

type SeoDataState = {
  keywords: KeywordRanking[]
  lastChecked: string | null
}

function positionBadge(pos: number | null): React.CSSProperties {
  if (pos === null) return { background: '#f4f4f5', color: '#a1a1aa' }
  if (pos <= 3) return { background: '#d1fae5', color: '#065f46' }
  if (pos <= 10) return { background: '#dbeafe', color: '#1e40af' }
  if (pos <= 20) return { background: '#fef3c7', color: '#92400e' }
  if (pos <= 50) return { background: '#fed7aa', color: '#9a3412' }
  return { background: '#fee2e2', color: '#991b1b' }
}

function trendArrow(history: RankingEntry[]): { symbol: string; color: string; delta: number } {
  if (history.length < 2) return { symbol: '—', color: '#a1a1aa', delta: 0 }
  const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date))
  const current = sorted[0].position
  const previous = sorted[1].position
  if (current === null && previous === null) return { symbol: '—', color: '#a1a1aa', delta: 0 }
  if (current === null) return { symbol: '↓', color: '#dc2626', delta: 0 }
  if (previous === null) return { symbol: '↑', color: '#16a34a', delta: 0 }
  const delta = previous - current // positive = improved
  if (delta > 0) return { symbol: `↑${delta}`, color: '#16a34a', delta }
  if (delta < 0) return { symbol: `↓${Math.abs(delta)}`, color: '#dc2626', delta }
  return { symbol: '=', color: '#a1a1aa', delta: 0 }
}

function SeoView({ password }: { password: string }) {
  const [data, setData] = useState<SeoDataState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newKw, setNewKw] = useState('')
  const [newTarget, setNewTarget] = useState('/')
  const [newVolume, setNewVolume] = useState('')
  const [checking, setChecking] = useState(false)
  const [checkResult, setCheckResult] = useState('')
  const { sort, toggle } = useSort()
  const [kwQuery, setKwQuery] = useState('')
  const [targetQuery, setTargetQuery] = useState('')

  const refresh = useCallback(() => {
    setLoading(true)
    fetch('/.netlify/functions/admin-seo', {
      headers: { Authorization: `Bearer ${password}` },
    })
      .then(async r => {
        const body = await r.text()
        if (!r.ok) throw new Error(`${r.status}: ${body}`)
        return JSON.parse(body)
      })
      .then(d => { setData(d); setLoading(false) })
      .catch(err => { setError(String(err)); setLoading(false) })
  }, [password])

  useEffect(() => { refresh() }, [refresh])

  const addKeyword = async () => {
    if (!newKw.trim()) return
    try {
      const res = await fetch('/.netlify/functions/admin-seo', {
        method: 'POST',
        headers: { Authorization: `Bearer ${password}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-keyword',
          keyword: newKw.trim(),
          targetPage: newTarget.trim() || '/',
          volume: parseInt(newVolume) || 0,
        }),
      })
      if (!res.ok) {
        const b = await res.json()
        alert(b.error || 'Erreur')
        return
      }
      setNewKw('')
      setNewTarget('/')
      setNewVolume('')
      setShowAdd(false)
      refresh()
    } catch (err) {
      alert(String(err))
    }
  }

  const removeKeyword = async (keyword: string) => {
    if (!confirm(`Supprimer le suivi de "${keyword}" ?`)) return
    try {
      await fetch('/.netlify/functions/admin-seo', {
        method: 'POST',
        headers: { Authorization: `Bearer ${password}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove-keyword', keyword }),
      })
      refresh()
    } catch (err) {
      alert(String(err))
    }
  }

  if (loading) return <div style={{ padding: '2rem' }}>Chargement...</div>
  if (error) return <div style={{ padding: '2rem', color: '#dc2626' }}>{error}</div>
  if (!data) return null

  const keywords = data.keywords || []

  const kwQ = kwQuery.trim().toLowerCase()
  const targetQ = targetQuery.trim().toLowerCase()
  const filteredKeywords = keywords.filter(k => {
    if (kwQ && !k.keyword.toLowerCase().includes(kwQ)) return false
    if (targetQ && !k.targetPage.toLowerCase().includes(targetQ)) return false
    return true
  })

  // Tri par défaut : meilleure position d'abord, puis alphabétique.
  const defaultSorted = [...filteredKeywords].sort((a, b) => {
    const aPos = a.history.length ? (a.history[a.history.length - 1].position ?? 999) : 999
    const bPos = b.history.length ? (b.history[b.history.length - 1].position ?? 999) : 999
    if (aPos !== bPos) return aPos - bPos
    return a.keyword.localeCompare(b.keyword)
  })
  // Tri par colonne s'il est actif, sinon le tri par défaut.
  const sorted = sort.key
    ? sortRows(filteredKeywords, sort, {
        keyword: k => k.keyword.toLowerCase(),
        position: k => (k.history.length ? k.history[k.history.length - 1].position : null),
        volume: k => k.volume,
        target: k => k.targetPage.toLowerCase(),
      })
    : defaultSorted

  // Stats
  const tracked = keywords.length
  const inTop10 = keywords.filter(k => {
    const last = k.history[k.history.length - 1]
    return last && last.position !== null && last.position <= 10
  }).length
  const inTop3 = keywords.filter(k => {
    const last = k.history[k.history.length - 1]
    return last && last.position !== null && last.position <= 3
  }).length

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: ACCENT, margin: 0 }}>
            Suivi des positions SEO
          </h2>
          {data.lastChecked && (
            <p style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.25rem' }}>
              Dernier check : {new Date(data.lastChecked).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={() => setShowAdd(!showAdd)}
            style={{
              padding: '0.5rem 1rem', border: 'none', borderRadius: '8px',
              background: ACCENT, color: '#fff', fontSize: '0.8rem', fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + Mot-clé
          </button>
          <button
            onClick={async () => {
              setChecking(true)
              setCheckResult('')
              try {
                const res = await fetch('/.netlify/functions/check-seo-rankings', {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${password}` },
                })
                const body = await res.json() as { ok?: boolean; error?: string; summary?: { inTop3: number; inTop10: number; total: number }; checked?: number }
                if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`)
                const s = body.summary
                setCheckResult(s ? `✓ ${body.checked} mots-clés vérifiés — Top 3: ${s.inTop3} · Top 10: ${s.inTop10}` : '✓ Check terminé')
                refresh()
              } catch (err) {
                setCheckResult(`Erreur: ${String(err)}`)
              }
              setChecking(false)
            }}
            disabled={checking}
            style={{
              padding: '0.5rem 0.9rem', border: '1px solid #e0e0e0', borderRadius: '8px',
              background: checking ? '#f4f4f5' : '#fff', color: checking ? '#999' : '#555',
              fontSize: '0.8rem', cursor: checking ? 'default' : 'pointer',
            }}
          >
            {checking ? '⏳ Vérification…' : '🔄 Vérifier positions'}
          </button>
          <button
            onClick={refresh}
            style={{
              padding: '0.5rem 0.9rem', border: '1px solid #e0e0e0', borderRadius: '8px',
              background: '#fff', color: '#555', fontSize: '0.8rem', cursor: 'pointer',
            }}
          >
            ⟳
          </button>
        </div>
      </div>

      {checkResult && (
        <div style={{
          padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: '10px',
          background: checkResult.startsWith('Erreur') ? '#fee2e2' : '#d1fae5',
          color: checkResult.startsWith('Erreur') ? '#991b1b' : '#065f46',
          fontSize: '0.8rem', fontWeight: 500,
        }}>
          {checkResult}
        </div>
      )}

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard label="Mots-clés suivis" value={String(tracked)} />
        <StatCard label="Top 10 Google" value={String(inTop10)} sub={tracked ? `${Math.round((inTop10 / tracked) * 100)}%` : '—'} />
        <StatCard label="Top 3 Google" value={String(inTop3)} sub={tracked ? `${Math.round((inTop3 / tracked) * 100)}%` : '—'} />
      </div>

      {/* Add keyword form */}
      {showAdd && (
        <div style={{
          background: '#fafafa', border: '1px solid #eee', borderRadius: '12px',
          padding: '1.25rem', marginBottom: '1.5rem',
        }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#333', marginBottom: '0.75rem' }}>
            Ajouter un mot-clé
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 0.8fr auto', gap: '0.75rem', alignItems: 'end' }}>
            <div>
              <label style={labelStyle}>Mot-clé</label>
              <input
                value={newKw} onChange={e => setNewKw(e.target.value)}
                placeholder="marketing santé"
                style={inputFieldStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Page cible</label>
              <input
                value={newTarget} onChange={e => setNewTarget(e.target.value)}
                placeholder="/"
                style={inputFieldStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Volume</label>
              <input
                value={newVolume} onChange={e => setNewVolume(e.target.value)}
                placeholder="720"
                type="number"
                style={inputFieldStyle}
              />
            </div>
            <button
              onClick={addKeyword}
              style={{
                padding: '0.7rem 1.2rem', border: 'none', borderRadius: '10px',
                background: ACCENT, color: '#fff', fontSize: '0.8rem', fontWeight: 600,
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              Ajouter
            </button>
          </div>
        </div>
      )}

      {/* Rankings table */}
      {sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
          <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Aucun mot-clé suivi</p>
          <p style={{ fontSize: '0.8rem' }}>Ajoutez vos premiers mots-clés pour commencer le suivi</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <Th
                  label="Mot-clé" thStyle={thStyle} sortKey="keyword" sort={sort} onSort={toggle}
                  filterActive={!!kwQ}
                  filter={<FilterSearch value={kwQuery} onChange={setKwQuery} placeholder="Mot-clé…" />}
                />
                <Th label="Position" thStyle={thStyle} align="center" sortKey="position" sort={sort} onSort={toggle} />
                <th style={{ ...thStyle, textAlign: 'center' }}>Tendance</th>
                <Th label="Volume" thStyle={thStyle} align="center" sortKey="volume" sort={sort} onSort={toggle} />
                <Th
                  label="Page cible" thStyle={thStyle} sortKey="target" sort={sort} onSort={toggle}
                  filterActive={!!targetQ}
                  filter={<FilterSearch value={targetQuery} onChange={setTargetQuery} placeholder="/page…" />}
                />
                <th style={{ ...thStyle, textAlign: 'center' }}>Historique (8 sem.)</th>
                <th style={{ ...thStyle, width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(kw => {
                const lastEntry = kw.history.length ? kw.history[kw.history.length - 1] : null
                const pos = lastEntry?.position ?? null
                const trend = trendArrow(kw.history)
                const last8 = kw.history.slice(-8)

                return (
                  <tr key={kw.keyword} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{kw.keyword}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block', padding: '0.2rem 0.6rem',
                        borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700,
                        ...positionBadge(pos),
                      }}>
                        {pos !== null ? `#${pos}` : '—'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, color: trend.color }}>
                      {trend.symbol}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center', color: '#666' }}>
                      {kw.volume > 0 ? `${kw.volume}/mois` : '—'}
                    </td>
                    <td style={{ ...tdStyle, color: '#888', fontSize: '0.8rem' }}>
                      {kw.targetPage}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '3px', justifyContent: 'center', alignItems: 'end', height: '28px' }}>
                        {last8.length === 0 ? (
                          <span style={{ color: '#ccc', fontSize: '0.7rem' }}>—</span>
                        ) : (
                          last8.map((h, i) => {
                            const barH = h.position === null ? 2 : Math.max(2, 28 - (h.position / 100) * 28)
                            const barColor = h.position === null ? '#e0e0e0'
                              : h.position <= 3 ? '#16a34a'
                              : h.position <= 10 ? '#3b82f6'
                              : h.position <= 20 ? '#f59e0b'
                              : h.position <= 50 ? '#f97316'
                              : '#ef4444'
                            return (
                              <div
                                key={i}
                                title={`${h.date}: ${h.position !== null ? `#${h.position}` : 'Non classé'}`}
                                style={{
                                  width: '6px', height: `${barH}px`,
                                  borderRadius: '2px', background: barColor,
                                }}
                              />
                            )
                          })
                        )}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <button
                        onClick={() => removeKeyword(kw.keyword)}
                        style={{
                          background: 'none', border: 'none', color: '#ccc',
                          cursor: 'pointer', fontSize: '1rem', padding: '0.2rem',
                        }}
                        title="Supprimer"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#fafafa', borderRadius: '10px', fontSize: '0.7rem', color: '#888' }}>
        <strong>Légende positions :</strong>{' '}
        <span style={{ color: '#065f46' }}>Top 3</span> · {' '}
        <span style={{ color: '#1e40af' }}>Top 10</span> · {' '}
        <span style={{ color: '#92400e' }}>Top 20</span> · {' '}
        <span style={{ color: '#9a3412' }}>Top 50</span> · {' '}
        <span style={{ color: '#991b1b' }}>50+</span> · {' '}
        <span style={{ color: '#a1a1aa' }}>Non classé</span>
        <br />
        Les positions sont mises à jour automatiquement chaque semaine.
      </div>
    </div>
  )
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    display: 'block', width: '100%', textAlign: 'left',
    padding: '0.6rem 0.75rem', borderRadius: '8px', border: 'none',
    fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.15s',
    background: active ? `${ACCENT}15` : 'transparent',
    color: active ? ACCENT : '#555',
    fontWeight: active ? 600 : 500,
  }
}

/* ---------- CRM (company-based) ---------- */

function CrmView({ password }: { password: string }) {
  const [companies, setCompanies] = useState<CrmCompany[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CrmStatus | 'all'>('all')
  const [tierFilter, setTierFilter] = useState<'all' | 'top' | 'good' | 'mid' | 'low'>('all')
  const [npsFilter, setNpsFilter] = useState<'all' | 'promoters' | 'passives' | 'detractors' | 'pending'>('all')
  const [originFilter, setOriginFilter] = useState<CompanyOrigin | 'all' | 'none'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'score'>('name')
  const [expandedCoId, setExpandedCoId] = useState<string | null>(null)
  const [expandedContactId, setExpandedContactId] = useState<string | null>(null)
  const [showAddCompany, setShowAddCompany] = useState(false)
  const [addContactForCo, setAddContactForCo] = useState<string | null>(null)
  const [addTaskForCo, setAddTaskForCo] = useState<string | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDate, setNewTaskDate] = useState('')
  const [newTaskDesc, setNewTaskDesc] = useState('')
  const [enrichingId, setEnrichingId] = useState<string | null>(null)
  const [enrichMessage, setEnrichMessage] = useState<{ contactId: string; text: string; tone: 'ok' | 'info' | 'err' } | null>(null)
  const [triggeringNpsId, setTriggeringNpsId] = useState<string | null>(null)
  const [npsTriggerMessage, setNpsTriggerMessage] = useState<{ responseId: string; text: string; tone: 'ok' | 'err' } | null>(null)
  const [classifyingId, setClassifyingId] = useState<string | null>(null)
  const [classifyMessage, setClassifyMessage] = useState<{ companyId: string; text: string; tone: 'ok' | 'info' | 'err' } | null>(null)
  const [backfilling, setBackfilling] = useState(false)
  const [backfillMessage, setBackfillMessage] = useState<{ text: string; tone: 'ok' | 'info' | 'err' } | null>(null)
  const [bulkClassifying, setBulkClassifying] = useState(false)
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number; current: string } | null>(null)

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${password}`, 'Content-Type': 'application/json' }),
    [password],
  )

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/.netlify/functions/admin-crm', { headers: authHeaders })
      const body = await res.text()
      if (!res.ok) throw new Error(`${res.status}: ${body}`)
      const json = JSON.parse(body)
      setCompanies(dedupeCompaniesById(json.companies || []))
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }, [authHeaders])

  useEffect(() => { refresh() }, [refresh])

  /* ---- Company actions ---- */
  const updateCompany = async (id: string, fields: Partial<CrmCompany>) => {
    setCompanies(prev => prev?.map(co => co.id === id ? { ...co, ...fields, updatedAt: new Date().toISOString() } : co) || null)
    try {
      const res = await fetch('/.netlify/functions/admin-crm', {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ action: 'update-company', id, fields }),
      })
      if (!res.ok) throw new Error(await res.text())
    } catch (err) { alert(`Erreur : ${String(err)}`); refresh() }
  }

  const deleteCompany = async (id: string) => {
    if (!confirm('Supprimer cette entreprise et tous ses contacts ?')) return
    try {
      const res = await fetch('/.netlify/functions/admin-crm', {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ action: 'delete-company', id }),
      })
      if (!res.ok) throw new Error(await res.text())
      setCompanies(prev => prev?.filter(co => co.id !== id) || null)
      if (expandedCoId === id) { setExpandedCoId(null); setExpandedContactId(null) }
    } catch (err) { alert(`Erreur : ${String(err)}`) }
  }

  const createCompany = async (name: string, status: CrmStatus, origin?: CompanyOrigin) => {
    try {
      const res = await fetch('/.netlify/functions/admin-crm', {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ action: 'create-company', fields: { name, status, ...(origin ? { origin } : {}) } }),
      })
      const body = await res.text()
      if (!res.ok) throw new Error(body)
      const { company } = JSON.parse(body)
      setCompanies(prev => [company, ...(prev || [])])
      setShowAddCompany(false)
    } catch (err) { alert(`Erreur : ${String(err)}`) }
  }

  /* ---- Contact actions ---- */
  const updateContact = async (companyId: string, contactId: string, fields: Partial<CrmContact>) => {
    setCompanies(prev => prev?.map(co => co.id === companyId
      ? { ...co, contacts: co.contacts.map(c => c.id === contactId ? { ...c, ...fields } : c) }
      : co,
    ) || null)
    try {
      const res = await fetch('/.netlify/functions/admin-crm', {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ action: 'update-contact', companyId, contactId, fields }),
      })
      if (!res.ok) throw new Error(await res.text())
    } catch (err) { alert(`Erreur : ${String(err)}`); refresh() }
  }

  const deleteContact = async (companyId: string, contactId: string) => {
    if (!confirm('Supprimer ce contact ?')) return
    try {
      const res = await fetch('/.netlify/functions/admin-crm', {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ action: 'delete-contact', companyId, contactId }),
      })
      if (!res.ok) throw new Error(await res.text())
      setCompanies(prev => prev?.map(co => co.id === companyId
        ? { ...co, contacts: co.contacts.filter(c => c.id !== contactId) }
        : co,
      ) || null)
      if (expandedContactId === contactId) setExpandedContactId(null)
    } catch (err) { alert(`Erreur : ${String(err)}`) }
  }

  const createContact = async (companyId: string, fields: Partial<CrmContact>) => {
    try {
      const res = await fetch('/.netlify/functions/admin-crm', {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ action: 'create-contact', companyId, fields }),
      })
      const body = await res.text()
      if (!res.ok) throw new Error(body)
      const { contact } = JSON.parse(body)
      setCompanies(prev => prev?.map(co => co.id === companyId
        ? { ...co, contacts: [...co.contacts, contact] }
        : co,
      ) || null)
      setAddContactForCo(null)
    } catch (err) { alert(`Erreur : ${String(err)}`) }
  }

  const enrichContact = async (companyId: string, contactId: string) => {
    setEnrichingId(contactId)
    setEnrichMessage(null)
    try {
      // First call submits the search; if it stays pending we resume with the
      // requestId returned in the 202. Up to 3 retries to cover Dropcontact
      // queue times >7s without exceeding Netlify's function timeout.
      let requestId: string | undefined
      for (let attempt = 0; attempt < 4; attempt++) {
        const res = await fetch('/.netlify/functions/admin-enrich-lead', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ companyId, contactId, requestId }),
        })
        const text = await res.text()
        const json = (() => { try { return JSON.parse(text) } catch { return null } })()

        if (res.status === 202 && json?.pending && json.requestId) {
          requestId = json.requestId
          setEnrichMessage({ contactId, text: 'Recherche Dropcontact en cours…', tone: 'info' })
          continue
        }

        if (!res.ok) {
          throw new Error(json?.error || json?.details || text || `HTTP ${res.status}`)
        }

        // Success — replace the contact in local state
        const updated = json.contact as CrmContact
        setCompanies(prev => prev?.map(co => co.id === companyId
          ? { ...co, contacts: co.contacts.map(c => c.id === contactId ? updated : c) }
          : co,
        ) || null)

        const filled = (json.filled as string[] | undefined) || []
        if (filled.length === 0) {
          setEnrichMessage({ contactId, text: 'Aucune donnée nouvelle trouvée.', tone: 'info' })
        } else {
          setEnrichMessage({ contactId, text: `Enrichi : ${filled.join(', ')}.`, tone: 'ok' })
        }
        return
      }
      // Out of retries
      setEnrichMessage({ contactId, text: 'Recherche encore en cours côté Dropcontact. Réessayez dans quelques instants.', tone: 'info' })
    } catch (err) {
      setEnrichMessage({ contactId, text: `Erreur : ${String(err)}`, tone: 'err' })
    } finally {
      setEnrichingId(null)
    }
  }

  /* ---- NPS manual trigger (skips J+1 wait) ---- */
  const triggerNps = async (companyId: string, contactId: string, responseId: string) => {
    setTriggeringNpsId(responseId)
    setNpsTriggerMessage(null)
    try {
      const res = await fetch('/.netlify/functions/admin-nps-trigger', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ companyId, contactId, responseId, action: 'send' }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        throw new Error(json?.error || json?.detail || `HTTP ${res.status}`)
      }
      const dryRunLabel = json.dryRun ? ` (DRY-RUN → ${json.recipient})` : ` → ${json.recipient}`
      setNpsTriggerMessage({ responseId, text: `Email envoyé${dryRunLabel}`, tone: 'ok' })
      // Reflect the askedAt in local state so the entry stops showing "En attente J+1"
      setCompanies(prev => prev?.map(co => co.id === companyId
        ? {
            ...co,
            contacts: co.contacts.map(c => c.id === contactId
              ? {
                  ...c,
                  npsResponses: c.npsResponses?.map(r => r.id === responseId
                    ? { ...r, askedAt: json.askedAt }
                    : r,
                  ),
                }
              : c,
            ),
          }
        : co,
      ) || null)
    } catch (err) {
      setNpsTriggerMessage({ responseId, text: `Erreur : ${String(err)}`, tone: 'err' })
    } finally {
      setTriggeringNpsId(null)
    }
  }

  const resetNps = async (companyId: string, contactId: string, responseId: string) => {
    if (!window.confirm('Réinitialiser cette entrée NPS ?\n\nLe score, le commentaire et la trace d\'envoi seront effacés. Le contact redeviendra éligible (cron J+1 + campagne backlog).')) return
    setTriggeringNpsId(responseId)
    setNpsTriggerMessage(null)
    try {
      const res = await fetch('/.netlify/functions/admin-nps-trigger', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ companyId, contactId, responseId, action: 'reset' }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        throw new Error(json?.error || json?.detail || `HTTP ${res.status}`)
      }
      setNpsTriggerMessage({ responseId, text: 'NPS réinitialisé', tone: 'ok' })
      // Mirror the reset in local state
      setCompanies(prev => prev?.map(co => co.id === companyId
        ? {
            ...co,
            contacts: co.contacts.map(c => c.id === contactId
              ? {
                  ...c,
                  npsResponses: c.npsResponses?.map(r => r.id === responseId
                    ? {
                        id: r.id,
                        resource: r.resource,
                        resourceLabel: r.resourceLabel,
                        downloadedAt: r.downloadedAt,
                      }
                    : r,
                  ),
                }
              : c,
            ),
          }
        : co,
      ) || null)
    } catch (err) {
      setNpsTriggerMessage({ responseId, text: `Erreur : ${String(err)}`, tone: 'err' })
    } finally {
      setTriggeringNpsId(null)
    }
  }

  /* ---- Classification (LLM) ---- */
  const classifyCompany = async (companyId: string, overwrite = false) => {
    setClassifyingId(companyId)
    setClassifyMessage({ companyId, text: 'Analyse en cours…', tone: 'info' })
    try {
      const res = await fetch('/.netlify/functions/admin-classify-company', {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ companyId, overwrite }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || json?.details || `HTTP ${res.status}`)
      const c = json.classification as { size: string | null; location: string | null; sector: string | null; confidence: string; reasoning: string }
      if (json.applied && json.company) {
        // Replace the company in state with the persisted one (preserves contacts/tasks).
        setCompanies(prev => prev?.map(co => co.id === companyId ? json.company : co) || null)
      }
      const parts = [
        c.size ? `Taille=${c.size}` : null,
        c.location ? `Loc=${c.location}` : null,
        c.sector ? `Secteur=${c.sector}` : null,
      ].filter(Boolean)
      const summary = parts.length === 0
        ? `Aucun signal fiable (${c.confidence}). ${c.reasoning}`
        : `${parts.join(' · ')} (${c.confidence}). ${c.reasoning}`
      setClassifyMessage({ companyId, text: summary, tone: parts.length ? 'ok' : 'info' })
    } catch (err) {
      setClassifyMessage({ companyId, text: `Erreur : ${String(err)}`, tone: 'err' })
    } finally {
      setClassifyingId(null)
    }
  }

  /* ---- Bulk LLM classify (Lead + Opportunité, missing fields) ---- */
  const bulkClassifyPipeline = async () => {
    if (!companies) return
    const targets = companies.filter(co =>
      (co.status === 'Lead' || co.status === 'Opportunité') &&
      (!co.size || !co.location || !co.sector),
    )
    if (targets.length === 0) {
      setBackfillMessage({ text: 'Aucune entreprise Lead/Opportunité avec champs manquants.', tone: 'info' })
      return
    }
    if (!confirm(`Classifier ${targets.length} entreprise${targets.length > 1 ? 's' : ''} (Lead + Opportunité, champs manquants) via Claude ? Cela prendra ~${Math.ceil(targets.length * 2.5)}s.`)) return

    setBulkClassifying(true)
    setBulkProgress({ done: 0, total: targets.length, current: targets[0].name })
    let ok = 0
    let err = 0
    for (let i = 0; i < targets.length; i++) {
      const co = targets[i]
      setBulkProgress({ done: i, total: targets.length, current: co.name })
      try {
        const res = await fetch('/.netlify/functions/admin-classify-company', {
          method: 'POST', headers: authHeaders,
          body: JSON.stringify({ companyId: co.id, overwrite: false }),
        })
        const json = await res.json()
        if (res.ok && json.applied && json.company) {
          setCompanies(prev => prev?.map(c => c.id === co.id ? json.company : c) || null)
          ok++
        } else {
          err++
        }
      } catch {
        err++
      }
      // Light throttle between calls — Anthropic rate limits + give the UI breathing room.
      await new Promise(r => setTimeout(r, 800))
    }
    setBulkProgress(null)
    setBulkClassifying(false)
    setBackfillMessage({
      text: `Classification terminée : ${ok} réussie${ok > 1 ? 's' : ''}${err > 0 ? `, ${err} en erreur` : ''}.`,
      tone: err > 0 ? 'info' : 'ok',
    })
  }

  /* ---- Bulk heuristic location backfill ---- */
  const backfillLocations = async () => {
    if (!confirm('Renseigner la localisation = FR sur toutes les entreprises avec ≥50% d\'emails .fr ? (les valeurs déjà saisies ne sont pas écrasées)')) return
    setBackfilling(true)
    setBackfillMessage({ text: 'Backfill en cours…', tone: 'info' })
    try {
      const res = await fetch('/.netlify/functions/admin-crm', {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ action: 'backfill-locations' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`)
      setBackfillMessage({ text: `${json.updated} entreprise${json.updated > 1 ? 's' : ''} mise${json.updated > 1 ? 's' : ''} à jour (localisation = FR).`, tone: 'ok' })
      await refresh()
    } catch (err) {
      setBackfillMessage({ text: `Erreur : ${String(err)}`, tone: 'err' })
    } finally {
      setBackfilling(false)
    }
  }

  /* ---- Task actions ---- */
  const createTask = async (companyId: string) => {
    if (!newTaskTitle.trim() || !newTaskDate) return
    try {
      const res = await fetch('/.netlify/functions/admin-crm', {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ action: 'create-task', companyId, fields: { title: newTaskTitle.trim(), dueDate: newTaskDate, description: newTaskDesc.trim() } }),
      })
      const body = await res.text()
      if (!res.ok) throw new Error(body)
      const { task } = JSON.parse(body) as { task: CrmTask }
      setCompanies(prev => prev?.map(co => co.id === companyId
        ? { ...co, tasks: [...(co.tasks || []), task] }
        : co,
      ) || null)
      setNewTaskTitle('')
      setNewTaskDate('')
      setNewTaskDesc('')
      setAddTaskForCo(null)
    } catch (err) { alert(`Erreur : ${String(err)}`) }
  }

  const toggleTask = async (companyId: string, taskId: string, done: boolean) => {
    setCompanies(prev => prev?.map(co => co.id === companyId
      ? { ...co, tasks: (co.tasks || []).map(t => t.id === taskId ? { ...t, done } : t) }
      : co,
    ) || null)
    try {
      const res = await fetch('/.netlify/functions/admin-crm', {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ action: 'update-task', companyId, taskId, fields: { done } }),
      })
      if (!res.ok) throw new Error(await res.text())
    } catch (err) { alert(`Erreur : ${String(err)}`); refresh() }
  }

  const updateTaskDesc = async (companyId: string, taskId: string, description: string) => {
    setCompanies(prev => prev?.map(co => co.id === companyId
      ? { ...co, tasks: (co.tasks || []).map(t => t.id === taskId ? { ...t, description } : t) }
      : co,
    ) || null)
    try {
      const res = await fetch('/.netlify/functions/admin-crm', {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ action: 'update-task', companyId, taskId, fields: { description } }),
      })
      if (!res.ok) throw new Error(await res.text())
    } catch (err) { alert(`Erreur : ${String(err)}`); refresh() }
  }

  const deleteTask = async (companyId: string, taskId: string) => {
    try {
      const res = await fetch('/.netlify/functions/admin-crm', {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ action: 'delete-task', companyId, taskId }),
      })
      if (!res.ok) throw new Error(await res.text())
      setCompanies(prev => prev?.map(co => co.id === companyId
        ? { ...co, tasks: (co.tasks || []).filter(t => t.id !== taskId) }
        : co,
      ) || null)
    } catch (err) { alert(`Erreur : ${String(err)}`) }
  }

  /* ---- Filtering ---- */
  const filtered = useMemo(() => {
    if (!companies) return []
    const q = search.trim().toLowerCase()
    const withScore = companies.map(co => ({ co, score: computeCompanyScore(co) }))
    return withScore
      .filter(({ co }) => statusFilter === 'all' || co.status === statusFilter)
      .filter(({ score }) => tierFilter === 'all' || scoreTier(score.total) === tierFilter)
      .filter(({ co }) => {
        if (npsFilter === 'all') return true
        return co.contacts.some(c => matchesNpsFilter(c, npsFilter))
      })
      .filter(({ co }) => {
        if (originFilter === 'all') return true
        if (originFilter === 'none') return !co.origin
        return co.origin === originFilter
      })
      .filter(({ co }) => {
        if (!q) return true
        if (co.name.toLowerCase().includes(q)) return true
        return co.contacts.some(c =>
          c.email.toLowerCase().includes(q) ||
          c.firstName.toLowerCase().includes(q) ||
          c.lastName.toLowerCase().includes(q),
        )
      })
      .sort((a, b) => {
        if (sortBy === 'score') return b.score.total - a.score.total
        return a.co.name.toLowerCase() < b.co.name.toLowerCase() ? -1 : 1
      })
  }, [companies, search, statusFilter, tierFilter, npsFilter, originFilter, sortBy])

  const originCounts = useMemo(() => {
    const c: Record<'all' | 'none' | CompanyOrigin, number> = {
      all: companies?.length || 0, none: 0,
      LinkedIn: 0, Outbound: 0, 'Réseau': 0, 'Lead Magnet': 0,
    }
    companies?.forEach(co => {
      if (co.origin) c[co.origin] += 1
      else c.none += 1
    })
    return c
  }, [companies])

  const npsCounts = useMemo(() => {
    const c = { all: companies?.length || 0, promoters: 0, passives: 0, detractors: 0, pending: 0 }
    companies?.forEach(co => {
      if (co.contacts.some(x => matchesNpsFilter(x, 'promoters'))) c.promoters += 1
      if (co.contacts.some(x => matchesNpsFilter(x, 'passives'))) c.passives += 1
      if (co.contacts.some(x => matchesNpsFilter(x, 'detractors'))) c.detractors += 1
      if (co.contacts.some(x => matchesNpsFilter(x, 'pending'))) c.pending += 1
    })
    return c
  }, [companies])

  const tierCounts = useMemo(() => {
    const c: Record<'all' | 'top' | 'good' | 'mid' | 'low', number> = { all: companies?.length || 0, top: 0, good: 0, mid: 0, low: 0 }
    companies?.forEach(co => { c[scoreTier(computeCompanyScore(co).total)]++ })
    return c
  }, [companies])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: companies?.length || 0 }
    CRM_STATUSES.forEach(s => { c[s] = 0 })
    companies?.forEach(co => { c[co.status] = (c[co.status] || 0) + 1 })
    return c
  }, [companies])

  const totalContacts = useMemo(() => companies?.reduce((sum, co) => sum + co.contacts.length, 0) || 0, [companies])

  if (loading && !companies) return <div style={{ padding: '3rem' }}>Chargement...</div>
  if (error && !companies) return <div style={{ padding: '3rem', color: '#dc2626' }}>Erreur : {error}</div>

  return (
    <div style={{ padding: '2rem 3rem', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111', margin: 0 }}>CRM</h2>
          <p style={{ fontSize: '0.75rem', color: '#999', margin: '0.25rem 0 0' }}>
            {companies?.length || 0} entreprises · {totalContacts} contacts
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowAddCompany(true)}
            style={{
              padding: '0.5rem 0.9rem', border: 'none', borderRadius: '8px',
              background: ACCENT, color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            + Nouvelle entreprise
          </button>
          <button
            onClick={backfillLocations}
            disabled={backfilling}
            title="Renseigne automatiquement location=FR sur les entreprises avec ≥50% d'emails .fr"
            style={{
              padding: '0.5rem 0.9rem', border: '1px solid #e0e0e0', borderRadius: '8px',
              background: backfilling ? '#f4f4f5' : '#fff', color: '#555',
              fontSize: '0.8rem', cursor: backfilling ? 'wait' : 'pointer', fontWeight: 600,
            }}
          >
            {backfilling ? 'Backfill…' : '🇫🇷 Backfill FR'}
          </button>
          <button
            onClick={bulkClassifyPipeline}
            disabled={bulkClassifying}
            title="Classifie via Claude toutes les entreprises Lead/Opportunité avec des champs manquants"
            style={{
              padding: '0.5rem 0.9rem', border: '1px solid #e0e0e0', borderRadius: '8px',
              background: bulkClassifying ? '#f4f4f5' : '#fff', color: '#555',
              fontSize: '0.8rem', cursor: bulkClassifying ? 'wait' : 'pointer', fontWeight: 600,
            }}
          >
            {bulkClassifying && bulkProgress ? `🤖 ${bulkProgress.done}/${bulkProgress.total}…` : '🤖 Classifier pipeline'}
          </button>
          <button
            onClick={refresh}
            style={{
              padding: '0.5rem 0.9rem', border: '1px solid #e0e0e0', borderRadius: '8px',
              background: '#fff', color: '#555', fontSize: '0.8rem', cursor: 'pointer',
            }}
          >
            ⟳ Rafraîchir
          </button>
        </div>
      </div>

      {backfillMessage && (
        <div style={{
          marginBottom: '0.75rem', padding: '0.5rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem',
          background: backfillMessage.tone === 'err' ? '#fef2f2' : backfillMessage.tone === 'ok' ? '#f0fdf4' : '#f1f5f9',
          color: backfillMessage.tone === 'err' ? '#b91c1c' : backfillMessage.tone === 'ok' ? '#166534' : '#475569',
          border: `1px solid ${backfillMessage.tone === 'err' ? '#fecaca' : backfillMessage.tone === 'ok' ? '#bbf7d0' : '#e2e8f0'}`,
        }}>
          {backfillMessage.text}
        </div>
      )}

      {bulkProgress && (
        <div style={{
          marginBottom: '0.75rem', padding: '0.5rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem',
          background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0',
        }}>
          🤖 Classification {bulkProgress.done + 1}/{bulkProgress.total} — en cours : <strong>{bulkProgress.current}</strong>
        </div>
      )}

      {/* Status filter pills */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        <FilterPill label={`Tous (${counts.all})`} active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
        {CRM_STATUSES.map(s => (
          <FilterPill key={s} label={`${s} (${counts[s] || 0})`} active={statusFilter === s} onClick={() => setStatusFilter(s)} color={STATUS_COLORS[s]} />
        ))}
      </div>

      {/* NPS filter pills */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        <FilterPill label={`NPS : tous (${npsCounts.all})`} active={npsFilter === 'all'} onClick={() => setNpsFilter('all')} />
        <FilterPill label={`Promoteurs 9-10 (${npsCounts.promoters})`} active={npsFilter === 'promoters'} onClick={() => setNpsFilter('promoters')} color={{ bg: '#16a34a', fg: '#fff' }} />
        <FilterPill label={`Passifs 7-8 (${npsCounts.passives})`} active={npsFilter === 'passives'} onClick={() => setNpsFilter('passives')} color={{ bg: '#f59e0b', fg: '#fff' }} />
        <FilterPill label={`Détracteurs ≤6 (${npsCounts.detractors})`} active={npsFilter === 'detractors'} onClick={() => setNpsFilter('detractors')} color={{ bg: '#dc2626', fg: '#fff' }} />
        <FilterPill label={`En attente (${npsCounts.pending})`} active={npsFilter === 'pending'} onClick={() => setNpsFilter('pending')} color={{ bg: '#6366f1', fg: '#fff' }} />
      </div>

      {/* Origin filter pills */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        <FilterPill label={`Origine : toutes (${originCounts.all})`} active={originFilter === 'all'} onClick={() => setOriginFilter('all')} />
        {COMPANY_ORIGINS.map(o => (
          <FilterPill key={o} label={`${o} (${originCounts[o]})`} active={originFilter === o} onClick={() => setOriginFilter(o)} color={ORIGIN_COLORS[o]} />
        ))}
        <FilterPill label={`Non renseignée (${originCounts.none})`} active={originFilter === 'none'} onClick={() => setOriginFilter('none')} color={{ bg: '#71717a', fg: '#fff' }} />
      </div>

      {/* Score tier filter + sort toggle */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <FilterPill label={`Score : tous (${tierCounts.all})`} active={tierFilter === 'all'} onClick={() => setTierFilter('all')} />
        <FilterPill label={`Top ≥70 (${tierCounts.top})`} active={tierFilter === 'top'} onClick={() => setTierFilter('top')} color={SCORE_TIER_COLORS.top} />
        <FilterPill label={`Bon 50-69 (${tierCounts.good})`} active={tierFilter === 'good'} onClick={() => setTierFilter('good')} color={SCORE_TIER_COLORS.good} />
        <FilterPill label={`Moyen 25-49 (${tierCounts.mid})`} active={tierFilter === 'mid'} onClick={() => setTierFilter('mid')} color={SCORE_TIER_COLORS.mid} />
        <FilterPill label={`Faible <25 (${tierCounts.low})`} active={tierFilter === 'low'} onClick={() => setTierFilter('low')} color={SCORE_TIER_COLORS.low} />
        <span style={{ marginLeft: 'auto', display: 'flex', gap: '4px', alignItems: 'center', fontSize: '0.7rem', color: '#999' }}>
          Tri :
          <button
            onClick={() => setSortBy('name')}
            style={{
              padding: '0.3rem 0.6rem', border: '1px solid #e0e0e0', borderRadius: '6px',
              background: sortBy === 'name' ? ACCENT : '#fff',
              color: sortBy === 'name' ? '#fff' : '#555',
              fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Nom
          </button>
          <button
            onClick={() => setSortBy('score')}
            style={{
              padding: '0.3rem 0.6rem', border: '1px solid #e0e0e0', borderRadius: '6px',
              background: sortBy === 'score' ? ACCENT : '#fff',
              color: sortBy === 'score' ? '#fff' : '#555',
              fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Score
          </button>
        </span>
      </div>

      {/* Search */}
      <input
        type="text" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Rechercher par entreprise, nom, email..."
        style={{
          width: '100%', padding: '0.7rem 0.9rem', marginBottom: '1rem',
          border: '1px solid #e0e0e0', borderRadius: '10px', fontSize: '0.85rem',
          outline: 'none', background: '#fafafa', boxSizing: 'border-box',
        }}
      />

      {showAddCompany && <NewCompanyForm onSave={createCompany} onCancel={() => setShowAddCompany(false)} />}

      {/* Global tasks section */}
      {(() => {
        if (!companies) return null
        const today = new Date().toISOString().slice(0, 10)
        const future7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
        type TaskWithCo = { task: CrmTask; companyId: string; companyName: string }
        const allOverdue: TaskWithCo[] = []
        const allUpcoming: TaskWithCo[] = []
        for (const co of companies) {
          for (const t of (co.tasks || [])) {
            if (t.done) continue
            if (t.dueDate < today) allOverdue.push({ task: t, companyId: co.id, companyName: co.name })
            else if (t.dueDate <= future7) allUpcoming.push({ task: t, companyId: co.id, companyName: co.name })
          }
        }
        allOverdue.sort((a, b) => a.task.dueDate.localeCompare(b.task.dueDate))
        allUpcoming.sort((a, b) => a.task.dueDate.localeCompare(b.task.dueDate))
        const total = allOverdue.length + allUpcoming.length
        if (total === 0) return null
        return (
          <div style={{ border: '1px solid #eee', borderRadius: '14px', overflow: 'hidden', background: '#fff', marginBottom: '1rem' }}>
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f4f4f5', background: '#fafafa' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#111', margin: 0 }}>
                Tâches
                <span style={{ fontWeight: 400, color: '#999', marginLeft: '8px', fontSize: '0.72rem' }}>
                  {allOverdue.length > 0 && <span style={{ color: '#dc2626', fontWeight: 600 }}>{allOverdue.length} en retard</span>}
                  {allOverdue.length > 0 && allUpcoming.length > 0 && ' · '}
                  {allUpcoming.length > 0 && `${allUpcoming.length} à venir (7j)`}
                </span>
              </p>
            </div>
            <div style={{ padding: '0.5rem 0.75rem' }}>
              {allOverdue.length > 0 && (
                <div style={{ marginBottom: allUpcoming.length > 0 ? '0.5rem' : 0 }}>
                  <p style={{ fontSize: '0.65rem', fontWeight: 600, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 0.3rem' }}>En retard</p>
                  {allOverdue.map(({ task: t, companyId, companyName }) => (
                    <TaskRow key={t.id} task={t} isOverdue companyName={companyName} onToggle={done => toggleTask(companyId, t.id, done)} onDelete={() => deleteTask(companyId, t.id)} onUpdateDesc={desc => updateTaskDesc(companyId, t.id, desc)} />
                  ))}
                </div>
              )}
              {allUpcoming.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.65rem', fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 0.3rem' }}>À venir (7 jours)</p>
                  {allUpcoming.map(({ task: t, companyId, companyName }) => (
                    <TaskRow key={t.id} task={t} isOverdue={false} companyName={companyName} onToggle={done => toggleTask(companyId, t.id, done)} onDelete={() => deleteTask(companyId, t.id)} onUpdateDesc={desc => updateTaskDesc(companyId, t.id, desc)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* Companies list */}
      <div style={{ border: '1px solid #eee', borderRadius: '14px', overflow: 'hidden', background: '#fff' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#999', fontSize: '0.85rem' }}>Aucune entreprise.</div>
        ) : (
          filtered.map(({ co, score }) => {
            const isExpanded = expandedCoId === co.id
            const tier = scoreTier(score.total)
            const tierColor = SCORE_TIER_COLORS[tier]
            return (
              <div key={co.id} style={{ borderBottom: '1px solid #f4f4f5' }}>
                {/* Company row */}
                <div
                  onClick={() => { setExpandedCoId(isExpanded ? null : co.id); setExpandedContactId(null); setAddContactForCo(null) }}
                  style={{
                    display: 'grid', gridTemplateColumns: '2.2fr 0.7fr 1fr 1.5fr auto',
                    gap: '1rem', alignItems: 'center', padding: '0.9rem 1rem',
                    cursor: 'pointer', fontSize: '0.8rem',
                    background: isExpanded ? '#fafafa' : 'transparent',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: '#111', fontSize: '0.85rem' }}>{co.name}</span>
                      {co.origin && (
                        <span style={{
                          padding: '1px 6px', borderRadius: '5px', fontSize: '0.6rem', fontWeight: 700,
                          background: ORIGIN_COLORS[co.origin].bg, color: ORIGIN_COLORS[co.origin].fg,
                        }}>
                          {co.origin}
                        </span>
                      )}
                    </div>
                    <div style={{ color: '#999', fontSize: '0.7rem', marginTop: '2px', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span>{co.contacts.length} contact{co.contacts.length > 1 ? 's' : ''}</span>
                      {co.notionPageId && (
                        <a
                          href={`https://www.notion.so/${co.notionPageId.replace(/-/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{ color: ACCENT, textDecoration: 'none', fontWeight: 600 }}
                          title="Voir dans Notion"
                        >
                          ↗ Notion
                        </a>
                      )}
                    </div>
                  </div>
                  <div
                    title={`Taille ${score.size} · Loc ${score.location} · Secteur ${score.sector} · Hiérarchie ${score.hierarchy}${score.hierarchyLevel ? ` (${HIERARCHY_LABELS[score.hierarchyLevel]})` : ''} · Engagement ${score.engagement}`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                      padding: '3px 8px', borderRadius: '6px',
                      background: tierColor.bg, color: tierColor.fg,
                      fontSize: '0.72rem', fontWeight: 700, width: 'fit-content',
                    }}
                  >
                    {score.total}
                    <span style={{ fontSize: '0.6rem', opacity: 0.7, fontWeight: 600 }}>{tierColor.label}</span>
                  </div>
                  <div style={{ color: '#999', fontSize: '0.7rem' }}>
                    {new Date(co.updatedAt).toLocaleDateString('fr-FR')}
                  </div>
                  <select
                    value={co.status}
                    onClick={e => e.stopPropagation()}
                    onChange={e => updateCompany(co.id, { status: e.target.value as CrmStatus })}
                    style={{
                      padding: '4px 8px', borderRadius: '6px', border: 'none',
                      background: STATUS_COLORS[co.status].bg, color: STATUS_COLORS[co.status].fg,
                      fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    {CRM_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div style={{ fontSize: '0.7rem', color: '#bbb' }}>{isExpanded ? '▲' : '▼'}</div>
                </div>

                {/* Expanded company detail */}
                {isExpanded && (
                  <div style={{ padding: '0 1rem 1rem 1rem', background: '#fafafa' }}>
                    {/* Company notes */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', paddingTop: '0.5rem', marginBottom: '0.75rem' }}>
                      <EditField label="Nom entreprise" value={co.name} onSave={v => updateCompany(co.id, { name: v })} />
                      <div>
                        <label style={crmLabelStyle}>Notes entreprise</label>
                        <textarea
                          value={co.notes}
                          onChange={e => setCompanies(prev => prev?.map(x => x.id === co.id ? { ...x, notes: e.target.value } : x) || null)}
                          onBlur={e => updateCompany(co.id, { notes: e.target.value })}
                          rows={2}
                          style={{ width: '100%', padding: '0.5rem 0.7rem', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '0.8rem', outline: 'none', background: '#fff', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif", resize: 'vertical' }}
                        />
                      </div>
                    </div>

                    {/* Scoring attributes */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <SelectField
                        label="Taille"
                        value={co.size || ''}
                        options={COMPANY_SIZES.map(s => ({ value: s, label: SIZE_LABELS[s] }))}
                        onSave={v => updateCompany(co.id, { size: (v || undefined) as CompanySize | undefined })}
                      />
                      <SelectField
                        label="Localisation"
                        value={co.location || ''}
                        options={COMPANY_LOCATIONS.map(l => ({ value: l, label: LOCATION_LABELS[l] }))}
                        onSave={v => updateCompany(co.id, { location: (v || undefined) as CompanyLocation | undefined })}
                      />
                      <SelectField
                        label="Secteur"
                        value={co.sector || ''}
                        options={COMPANY_SECTORS.map(s => ({ value: s, label: SECTOR_LABELS[s] }))}
                        onSave={v => updateCompany(co.id, { sector: (v || undefined) as CompanySector | undefined })}
                      />
                      <SelectField
                        label="Origine"
                        value={co.origin || ''}
                        options={COMPANY_ORIGINS.map(o => ({ value: o, label: o }))}
                        onSave={v => updateCompany(co.id, { origin: (v || undefined) as CompanyOrigin | undefined })}
                      />
                    </div>

                    {/* Score breakdown + LLM classify */}
                    {(() => {
                      const s = computeCompanyScore(co)
                      const isClassifying = classifyingId === co.id
                      const hasAnyClass = !!(co.size && co.location && co.sector)
                      return (
                        <div style={{ marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.7rem', background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', fontSize: '0.7rem', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, color: '#111' }}>Score : {s.total}/100</span>
                            <span style={{ color: '#999' }}>·</span>
                            <span style={{ color: '#555' }}>Taille {s.size}</span>
                            <span style={{ color: '#999' }}>·</span>
                            <span style={{ color: '#555' }}>Loc {s.location}</span>
                            <span style={{ color: '#999' }}>·</span>
                            <span style={{ color: '#555' }}>Secteur {s.sector}</span>
                            <span style={{ color: '#999' }}>·</span>
                            <span style={{ color: '#555' }} title={s.hierarchyLevel ? HIERARCHY_LABELS[s.hierarchyLevel] : 'Aucun job title détecté'}>
                              Hiérarchie {s.hierarchy}{s.hierarchyLevel ? ` (${HIERARCHY_LABELS[s.hierarchyLevel]})` : ''}
                            </span>
                            <span style={{ color: '#999' }}>·</span>
                            <span style={{ color: '#555' }}>Engagement {s.engagement}</span>
                            <button
                              onClick={() => classifyCompany(co.id, hasAnyClass)}
                              disabled={isClassifying}
                              title={hasAnyClass ? 'Re-classifier (écrase les valeurs)' : 'Deviner Taille/Loc/Secteur via Claude'}
                              style={{
                                marginLeft: 'auto', padding: '0.3rem 0.6rem',
                                border: `1px solid ${ACCENT}`, borderRadius: '6px',
                                background: isClassifying ? '#f4f4f5' : '#fff',
                                color: isClassifying ? '#999' : ACCENT,
                                fontSize: '0.65rem', fontWeight: 600,
                                cursor: isClassifying ? 'wait' : 'pointer',
                              }}
                            >
                              {isClassifying ? 'Analyse…' : hasAnyClass ? '🤖 Re-classifier' : '🤖 Auto-classifier'}
                            </button>
                          </div>
                          {classifyMessage?.companyId === co.id && (
                            <div style={{
                              marginTop: '0.4rem', padding: '0.4rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem',
                              background: classifyMessage.tone === 'err' ? '#fef2f2' : classifyMessage.tone === 'ok' ? '#f0fdf4' : '#f1f5f9',
                              color: classifyMessage.tone === 'err' ? '#b91c1c' : classifyMessage.tone === 'ok' ? '#166534' : '#475569',
                              border: `1px solid ${classifyMessage.tone === 'err' ? '#fecaca' : classifyMessage.tone === 'ok' ? '#bbf7d0' : '#e2e8f0'}`,
                            }}>
                              {classifyMessage.text}
                            </div>
                          )}
                        </div>
                      )
                    })()}

                    {/* Contacts header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                        Contacts ({co.contacts.length})
                      </p>
                      <button
                        onClick={() => setAddContactForCo(addContactForCo === co.id ? null : co.id)}
                        style={{ padding: '3px 10px', border: '1px solid #e0e0e0', borderRadius: '6px', background: '#fff', color: ACCENT, fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        + Contact
                      </button>
                    </div>

                    {addContactForCo === co.id && (
                      <NewContactForm
                        onSave={(fields) => createContact(co.id, fields)}
                        onCancel={() => setAddContactForCo(null)}
                      />
                    )}

                    {/* Contacts list within company */}
                    <div style={{ border: '1px solid #e5e5e5', borderRadius: '10px', overflow: 'hidden', background: '#fff' }}>
                      {co.contacts.length === 0 ? (
                        <div style={{ padding: '1rem', textAlign: 'center', color: '#bbb', fontSize: '0.75rem' }}>Aucun contact</div>
                      ) : co.contacts.map(c => (
                        <div key={c.id} style={{ borderBottom: '1px solid #f4f4f5' }}>
                          <div
                            onClick={() => setExpandedContactId(expandedContactId === c.id ? null : c.id)}
                            style={{
                              display: 'grid', gridTemplateColumns: '2fr 2.5fr 1fr auto',
                              gap: '0.75rem', alignItems: 'center', padding: '0.6rem 0.8rem',
                              cursor: 'pointer', fontSize: '0.78rem',
                            }}
                          >
                            <div>
                              <span style={{ fontWeight: 600, color: '#111' }}>
                                {[c.firstName, c.lastName].filter(Boolean).join(' ') || '—'}
                              </span>
                            </div>
                            <div style={{ color: '#555', wordBreak: 'break-all', fontSize: '0.75rem' }}>{c.email}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#999', fontSize: '0.68rem' }}>
                              {c.language && (
                                <span style={{
                                  display: 'inline-block',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  background: c.language === 'FR' ? '#dbeafe' : '#fef3c7',
                                  color: c.language === 'FR' ? '#1e40af' : '#92400e',
                                  fontSize: '0.62rem',
                                  fontWeight: 700,
                                  letterSpacing: '0.02em',
                                }}>
                                  {c.language}
                                </span>
                              )}
                              {(() => {
                                const best = bestNpsScore(c)
                                if (best === null) return null
                                return (
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    background: npsScoreColor(best),
                                    color: '#fff',
                                    fontSize: '0.62rem',
                                    fontWeight: 700,
                                    letterSpacing: '0.02em',
                                  }} title={`NPS ${best}/10 (${npsScoreLabel(best)})`}>
                                    NPS {best}
                                  </span>
                                )
                              })()}
                              <span>{c.source}</span>
                            </div>
                            <div style={{ fontSize: '0.65rem', color: '#bbb' }}>{expandedContactId === c.id ? '▲' : '▼'}</div>
                          </div>

                          {expandedContactId === c.id && (
                            <div style={{ padding: '0 0.8rem 0.8rem 0.8rem', background: '#f8f8f8' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', paddingTop: '0.5rem' }}>
                                <EditField label="Prénom" value={c.firstName} onSave={v => updateContact(co.id, c.id, { firstName: v })} />
                                <EditField label="Nom" value={c.lastName} onSave={v => updateContact(co.id, c.id, { lastName: v })} />
                                <EditField label="Email" value={c.email} onSave={v => updateContact(co.id, c.id, { email: v })} />
                                <EditField label="Téléphone" value={c.phone || ''} onSave={v => updateContact(co.id, c.id, { phone: v })} />
                                <EditField label="Poste" value={c.jobTitle || ''} onSave={v => updateContact(co.id, c.id, { jobTitle: v })} />
                                <EditField label="Entreprise (contact)" value={c.company || ''} onSave={v => updateContact(co.id, c.id, { company: v })} />
                                <EditField label="LinkedIn" value={c.linkedIn || ''} onSave={v => updateContact(co.id, c.id, { linkedIn: v })} />
                                <EditField label="Source" value={c.source} onSave={v => updateContact(co.id, c.id, { source: v })} />
                                <SelectField
                                  label="Langue"
                                  value={c.language || ''}
                                  options={CONTACT_LANGUAGES.map(l => ({ value: l, label: l }))}
                                  onSave={v => updateContact(co.id, c.id, { language: (v || undefined) as ContactLanguage | undefined })}
                                />
                              </div>
                              <div style={{ marginTop: '0.5rem' }}>
                                <label style={crmLabelStyle}>Notes</label>
                                <textarea
                                  value={c.notes}
                                  onChange={e => setCompanies(prev => prev?.map(co2 => co2.id === co.id
                                    ? { ...co2, contacts: co2.contacts.map(x => x.id === c.id ? { ...x, notes: e.target.value } : x) }
                                    : co2,
                                  ) || null)}
                                  onBlur={e => updateContact(co.id, c.id, { notes: e.target.value })}
                                  rows={2}
                                  style={{ width: '100%', padding: '0.5rem 0.7rem', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '0.78rem', outline: 'none', background: '#fff', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif", resize: 'vertical' }}
                                />
                              </div>
                              {enrichMessage?.contactId === c.id && (
                                <div style={{
                                  marginTop: '0.5rem',
                                  padding: '0.4rem 0.6rem',
                                  borderRadius: '6px',
                                  fontSize: '0.7rem',
                                  background: enrichMessage.tone === 'err' ? '#fef2f2' : enrichMessage.tone === 'ok' ? '#f0fdf4' : '#f1f5f9',
                                  color: enrichMessage.tone === 'err' ? '#b91c1c' : enrichMessage.tone === 'ok' ? '#166534' : '#475569',
                                  border: `1px solid ${enrichMessage.tone === 'err' ? '#fecaca' : enrichMessage.tone === 'ok' ? '#bbf7d0' : '#e2e8f0'}`,
                                }}>
                                  {enrichMessage.text}
                                </div>
                              )}
                              {c.npsResponses && c.npsResponses.length > 0 && (
                                <div style={{ marginTop: '0.6rem' }}>
                                  <label style={{ ...crmLabelStyle, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    📊 NPS
                                    <span style={{ background: '#ede9fe', color: '#5b21b6', borderRadius: '4px', padding: '0.1rem 0.4rem', fontSize: '0.6rem', fontWeight: 700 }}>
                                      {c.npsResponses.length}
                                    </span>
                                  </label>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    {[...c.npsResponses].reverse().map(r => {
                                      const hasScore = typeof r.score === 'number'
                                      const scoreColor = hasScore ? npsScoreColor(r.score as number) : '#94a3b8'
                                      const scoreLabel = hasScore ? npsScoreLabel(r.score as number) : (r.askedAt ? 'En attente de réponse' : 'En attente J+1')
                                      return (
                                        <div key={r.id} style={{ padding: '0.5rem 0.6rem', background: '#fff', borderRadius: '6px', border: '1px solid #eee' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                            <span style={{
                                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                              minWidth: 36, height: 24, padding: '0 6px',
                                              background: scoreColor, color: '#fff',
                                              borderRadius: '6px', fontWeight: 700, fontSize: '0.78rem',
                                            }}>
                                              {hasScore ? `${r.score}/10` : '—'}
                                            </span>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: scoreColor }}>
                                              {scoreLabel}
                                            </span>
                                            <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: '#999' }}>
                                              {r.resourceLabel}
                                            </span>
                                          </div>
                                          <div style={{ fontSize: '0.65rem', color: '#888', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            <span>📥 Téléchargé le {new Date(r.downloadedAt).toLocaleDateString('fr-FR')}</span>
                                            {r.askedAt && (
                                              <span>
                                                📨 Demandé le {new Date(r.askedAt).toLocaleDateString('fr-FR')}
                                                {r.askedDryRun === true && (
                                                  <span style={{
                                                    display: 'inline-block', marginLeft: 6,
                                                    padding: '0 5px', borderRadius: 4,
                                                    background: '#fef3c7', color: '#92400e',
                                                    fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.02em',
                                                  }} title="Email routé vers ton inbox uniquement, le prospect n'a rien reçu.">
                                                    TEST
                                                  </span>
                                                )}
                                                {r.askedDryRun === false && (
                                                  <span style={{
                                                    display: 'inline-block', marginLeft: 6,
                                                    padding: '0 5px', borderRadius: 4,
                                                    background: '#dcfce7', color: '#166534',
                                                    fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.02em',
                                                  }} title="Email envoyé au vrai prospect.">
                                                    PROD
                                                  </span>
                                                )}
                                                {r.askedDryRun === undefined && (
                                                  <span style={{
                                                    display: 'inline-block', marginLeft: 6,
                                                    padding: '0 5px', borderRadius: 4,
                                                    background: '#f1f5f9', color: '#64748b',
                                                    fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.02em',
                                                  }} title="Statut inconnu (envoi antérieur au tracking). Vérifier sur Resend.">
                                                    ?
                                                  </span>
                                                )}
                                              </span>
                                            )}
                                            {r.scoredAt && <span>✅ Noté le {new Date(r.scoredAt).toLocaleDateString('fr-FR')}</span>}
                                          </div>
                                          <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            {!r.askedAt ? (
                                              <button
                                                onClick={() => triggerNps(co.id, c.id, r.id)}
                                                disabled={triggeringNpsId === r.id}
                                                style={{
                                                  padding: '0.3rem 0.7rem',
                                                  border: `1px solid ${ACCENT}`,
                                                  borderRadius: '6px',
                                                  background: triggeringNpsId === r.id ? '#f4f4f5' : ACCENT,
                                                  color: triggeringNpsId === r.id ? '#999' : '#fff',
                                                  fontSize: '0.65rem',
                                                  fontWeight: 600,
                                                  cursor: triggeringNpsId === r.id ? 'wait' : 'pointer',
                                                }}
                                                title="Envoyer l'email NPS maintenant (skip J+1)"
                                              >
                                                {triggeringNpsId === r.id ? 'Envoi…' : '📨 Envoyer maintenant'}
                                              </button>
                                            ) : (
                                              <button
                                                onClick={() => resetNps(co.id, c.id, r.id)}
                                                disabled={triggeringNpsId === r.id}
                                                style={{
                                                  padding: '0.3rem 0.7rem',
                                                  border: '1px solid #d4d4d8',
                                                  borderRadius: '6px',
                                                  background: '#fff',
                                                  color: '#52525b',
                                                  fontSize: '0.65rem',
                                                  fontWeight: 600,
                                                  cursor: triggeringNpsId === r.id ? 'wait' : 'pointer',
                                                }}
                                                title="Réinitialiser : efface askedAt, score et commentaire pour rendre l'entrée à nouveau éligible"
                                              >
                                                {triggeringNpsId === r.id ? 'Réinit…' : '↺ Réinitialiser'}
                                              </button>
                                            )}
                                            {npsTriggerMessage?.responseId === r.id && (
                                              <span style={{
                                                fontSize: '0.65rem',
                                                color: npsTriggerMessage.tone === 'err' ? '#b91c1c' : '#166534',
                                              }}>
                                                {npsTriggerMessage.text}
                                              </span>
                                            )}
                                          </div>
                                          {r.comment && (
                                            <div style={{
                                              marginTop: '0.4rem',
                                              padding: '0.4rem 0.6rem',
                                              background: '#f8fafc',
                                              borderLeft: `3px solid ${scoreColor}`,
                                              borderRadius: '4px',
                                              fontSize: '0.72rem',
                                              color: '#334155',
                                              whiteSpace: 'pre-wrap',
                                              lineHeight: 1.5,
                                            }}>
                                              "{r.comment}"
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                              {c.visits && c.visits.length > 0 && (
                                <div style={{ marginTop: '0.6rem' }}>
                                  <label style={{ ...crmLabelStyle, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    👀 Visites récentes
                                    <span style={{ background: '#e0f2e9', color: '#166534', borderRadius: '4px', padding: '0.1rem 0.4rem', fontSize: '0.6rem', fontWeight: 700 }}>
                                      {c.visits.length}
                                    </span>
                                  </label>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '120px', overflowY: 'auto' }}>
                                    {[...c.visits].reverse().map((v, i) => (
                                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#555', padding: '0.2rem 0.4rem', background: '#fff', borderRadius: '4px', border: '1px solid #eee' }}>
                                        <span style={{ fontFamily: 'monospace', color: '#0066cc' }}>{v.path}</span>
                                        <span style={{ color: '#aaa', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
                                          {new Date(v.ts).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <p style={{ fontSize: '0.6rem', color: '#bbb', margin: 0 }}>
                                  Créé : {new Date(c.createdAt).toLocaleDateString('fr-FR')} · Maj : {new Date(c.updatedAt).toLocaleString('fr-FR')}
                                  {c.enrichedAt && ` · Enrichi : ${new Date(c.enrichedAt).toLocaleDateString('fr-FR')}`}
                                </p>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                  <button
                                    onClick={() => enrichContact(co.id, c.id)}
                                    disabled={enrichingId === c.id}
                                    style={{
                                      padding: '0.3rem 0.7rem',
                                      border: `1px solid ${ACCENT}`,
                                      borderRadius: '6px',
                                      background: enrichingId === c.id ? '#f4f4f5' : ACCENT,
                                      color: enrichingId === c.id ? '#999' : '#fff',
                                      fontSize: '0.65rem',
                                      fontWeight: 600,
                                      cursor: enrichingId === c.id ? 'wait' : 'pointer',
                                    }}
                                    title="Enrichir email + téléphone via Dropcontact"
                                  >
                                    {enrichingId === c.id ? 'Enrichissement…' : 'Enrichir'}
                                  </button>
                                  <button
                                    onClick={() => deleteContact(co.id, c.id)}
                                    style={{ padding: '0.3rem 0.6rem', border: '1px solid #fecaca', borderRadius: '6px', background: '#fff', color: '#dc2626', fontSize: '0.65rem', cursor: 'pointer' }}
                                  >
                                    Supprimer
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Tasks section */}
                    {(() => {
                      const tasks = co.tasks || []
                      const today = new Date().toISOString().slice(0, 10)
                      const upcoming = tasks.filter(t => !t.done && t.dueDate >= today).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
                      const overdue = tasks.filter(t => !t.done && t.dueDate < today).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
                      const done = tasks.filter(t => t.done).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5)
                      return (
                        <div style={{ marginTop: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                              Tâches ({tasks.filter(t => !t.done).length} actives)
                            </p>
                            <button
                              onClick={() => { setAddTaskForCo(addTaskForCo === co.id ? null : co.id); setNewTaskTitle(''); setNewTaskDate(''); setNewTaskDesc('') }}
                              style={{ padding: '3px 10px', border: '1px solid #e0e0e0', borderRadius: '6px', background: '#fff', color: ACCENT, fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              + Tâche
                            </button>
                          </div>

                          {addTaskForCo === co.id && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.5rem' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0.5rem', alignItems: 'center' }}>
                                <input
                                  value={newTaskTitle}
                                  onChange={e => setNewTaskTitle(e.target.value)}
                                  placeholder="Titre de la tâche..."
                                  style={{ padding: '0.45rem 0.7rem', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '0.78rem', outline: 'none', background: '#fff' }}
                                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && createTask(co.id)}
                                  autoFocus
                                />
                                <input
                                  type="date"
                                  value={newTaskDate}
                                  onChange={e => setNewTaskDate(e.target.value)}
                                  min={today}
                                  style={{ padding: '0.45rem 0.7rem', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '0.78rem', outline: 'none', background: '#fff' }}
                                />
                                <button
                                  onClick={() => createTask(co.id)}
                                  disabled={!newTaskTitle.trim() || !newTaskDate}
                                  style={{ padding: '0.45rem 0.9rem', border: 'none', borderRadius: '8px', background: ACCENT, color: '#fff', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', opacity: (!newTaskTitle.trim() || !newTaskDate) ? 0.5 : 1 }}
                                >
                                  Ajouter
                                </button>
                              </div>
                              <textarea
                                value={newTaskDesc}
                                onChange={e => setNewTaskDesc(e.target.value)}
                                placeholder="Description, CR de réunion, notes... (optionnel)"
                                rows={2}
                                style={{ padding: '0.45rem 0.7rem', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '0.78rem', outline: 'none', background: '#fff', resize: 'vertical', fontFamily: "'Inter', sans-serif", lineHeight: 1.5 }}
                              />
                            </div>
                          )}

                          {overdue.length > 0 && (
                            <div style={{ marginBottom: '0.4rem' }}>
                              {overdue.map(t => (
                                <TaskRow key={t.id} task={t} isOverdue onToggle={done => toggleTask(co.id, t.id, done)} onDelete={() => deleteTask(co.id, t.id)} onUpdateDesc={desc => updateTaskDesc(co.id, t.id, desc)} />
                              ))}
                            </div>
                          )}

                          {upcoming.length > 0 && (
                            <div style={{ marginBottom: '0.4rem' }}>
                              {upcoming.map(t => (
                                <TaskRow key={t.id} task={t} isOverdue={false} onToggle={done => toggleTask(co.id, t.id, done)} onDelete={() => deleteTask(co.id, t.id)} onUpdateDesc={desc => updateTaskDesc(co.id, t.id, desc)} />
                              ))}
                            </div>
                          )}

                          {upcoming.length === 0 && overdue.length === 0 && tasks.length === 0 && (
                            <p style={{ fontSize: '0.72rem', color: '#bbb', margin: '0 0 0.4rem', fontStyle: 'italic' }}>Aucune tâche planifiée</p>
                          )}

                          {done.length > 0 && (
                            <details style={{ marginTop: '0.25rem' }}>
                              <summary style={{ fontSize: '0.68rem', color: '#bbb', cursor: 'pointer', userSelect: 'none' }}>
                                {tasks.filter(t => t.done).length} tâche{tasks.filter(t => t.done).length > 1 ? 's' : ''} terminée{tasks.filter(t => t.done).length > 1 ? 's' : ''}
                              </summary>
                              <div style={{ marginTop: '0.25rem', opacity: 0.6 }}>
                                {done.map(t => (
                                  <TaskRow key={t.id} task={t} isOverdue={false} onToggle={d => toggleTask(co.id, t.id, d)} onDelete={() => deleteTask(co.id, t.id)} onUpdateDesc={desc => updateTaskDesc(co.id, t.id, desc)} />
                                ))}
                              </div>
                            </details>
                          )}
                        </div>
                      )
                    })()}

                    {/* Company actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                      <p style={{ fontSize: '0.6rem', color: '#bbb', margin: 0 }}>
                        Créé : {new Date(co.createdAt).toLocaleDateString('fr-FR')} · Maj : {new Date(co.updatedAt).toLocaleString('fr-FR')}
                      </p>
                      <button
                        onClick={() => deleteCompany(co.id)}
                        style={{ padding: '0.4rem 0.7rem', border: '1px solid #fecaca', borderRadius: '6px', background: '#fff', color: '#dc2626', fontSize: '0.7rem', cursor: 'pointer' }}
                      >
                        Supprimer l'entreprise
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

/* ---------- NPS ---------- */

/** Aggregated NPS metrics for one resource (or the whole site).
 *  Sent / scored / rate are computed over real prospect sends only —
 *  DRY-RUN entries are filtered out upstream. */
type NpsAggregate = {
  sent: number
  scored: number
  promoters: number
  passives: number
  detractors: number
  comments: number
  nps: number | null
  rate: number | null
}

function emptyAggregate(): NpsAggregate {
  return { sent: 0, scored: 0, promoters: 0, passives: 0, detractors: 0, comments: 0, nps: null, rate: null }
}

function accumulate(agg: NpsAggregate, r: CrmNpsResponse): void {
  if (r.askedAt) agg.sent += 1
  if (typeof r.score === 'number') {
    agg.scored += 1
    if (r.score >= 9) agg.promoters += 1
    else if (r.score >= 7) agg.passives += 1
    else agg.detractors += 1
  }
  if (r.comment && r.comment.trim().length > 0) agg.comments += 1
}

function finalizeAggregate(agg: NpsAggregate): NpsAggregate {
  agg.nps = agg.scored > 0 ? Math.round(((agg.promoters - agg.detractors) / agg.scored) * 100) : null
  agg.rate = agg.sent > 0 ? agg.scored / agg.sent : null
  return agg
}

function npsHeadlineColor(nps: number | null): string {
  if (nps === null) return '#71717a'
  if (nps >= 50) return '#16a34a'
  if (nps >= 0) return '#f59e0b'
  return '#dc2626'
}

function NpsView({ password }: { password: string }) {
  const [companies, setCompanies] = useState<CrmCompany[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [resourceFilter, setResourceFilter] = useState<string>('all')
  const [scoreFilter, setScoreFilter] = useState<'all' | 'promoters' | 'passives' | 'detractors'>('all')
  const { sort: npsSort, toggle: npsToggle } = useSort()
  const [npsLabelQuery, setNpsLabelQuery] = useState('')
  const [backlogDays, setBacklogDays] = useState(15)
  const [backlogState, setBacklogState] = useState<'idle' | 'previewing' | 'preview-ready' | 'sending' | 'done' | 'err'>('idle')
  const [backlogPreview, setBacklogPreview] = useState<{ count: number; dryRun: boolean; eligibles: Array<{ contactId: string; email: string; fullName: string; resourceLabel: string; downloadedAt: string; hasExistingEntry: boolean; kind: 'fresh' | 'test-resend' }> } | null>(null)
  const [backlogResult, setBacklogResult] = useState<{ sent: number; errors: number; remaining: number; dryRun: boolean; failures: Array<{ email: string; error: string }> } | null>(null)
  const [backlogError, setBacklogError] = useState('')

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${password}`, 'Content-Type': 'application/json' }),
    [password],
  )

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/.netlify/functions/admin-crm', { headers: authHeaders })
      const body = await res.text()
      if (!res.ok) throw new Error(`${res.status}: ${body}`)
      const json = JSON.parse(body)
      setCompanies(dedupeCompaniesById(json.companies || []))
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }, [authHeaders])

  useEffect(() => { refresh() }, [refresh])

  /* ---- NPS backlog campaign (15-day catchup) ---- */
  const previewBacklog = async () => {
    setBacklogState('previewing')
    setBacklogError('')
    setBacklogResult(null)
    try {
      const res = await fetch('/.netlify/functions/admin-nps-backlog', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ mode: 'preview', days: backlogDays }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`)
      setBacklogPreview(json)
      setBacklogState('preview-ready')
    } catch (err) {
      setBacklogError(String(err))
      setBacklogState('err')
    }
  }

  const sendBacklog = async () => {
    if (!backlogPreview) return
    setBacklogState('sending')
    setBacklogError('')
    try {
      const res = await fetch('/.netlify/functions/admin-nps-backlog', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ mode: 'send', days: backlogDays }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`)
      setBacklogResult(json)
      setBacklogState('done')
      void refresh()
    } catch (err) {
      setBacklogError(String(err))
      setBacklogState('err')
    }
  }

  const resetBacklog = () => {
    setBacklogState('idle')
    setBacklogPreview(null)
    setBacklogResult(null)
    setBacklogError('')
  }

  // DRY-RUN entries are excluded so the numbers reflect real prospect
  // interactions only. Entries with askedDryRun === undefined predate the
  // tracking field and are treated as real (cf. admin-nps-backlog).
  const allResponses = useMemo(() => {
    if (!companies) return []
    const out: Array<{
      response: CrmNpsResponse
      companyId: string
      companyName: string
      contactId: string
      contactEmail: string
      contactName: string
    }> = []
    for (const co of companies) {
      for (const c of co.contacts) {
        if (!c.npsResponses) continue
        for (const r of c.npsResponses) {
          if (r.askedDryRun === true) continue
          out.push({
            response: r,
            companyId: co.id,
            companyName: co.name,
            contactId: c.id,
            contactEmail: c.email,
            contactName: [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email,
          })
        }
      }
    }
    return out
  }, [companies])

  const overall = useMemo(() => {
    const agg = emptyAggregate()
    for (const { response: r } of allResponses) accumulate(agg, r)
    return finalizeAggregate(agg)
  }, [allResponses])

  const perResource = useMemo(() => {
    const map = new Map<string, NpsAggregate & { slug: string; label: string }>()
    for (const { response: r } of allResponses) {
      let row = map.get(r.resource)
      if (!row) {
        row = { ...emptyAggregate(), slug: r.resource, label: r.resourceLabel || r.resource }
        map.set(r.resource, row)
      } else if (!row.label && r.resourceLabel) {
        row.label = r.resourceLabel
      }
      accumulate(row, r)
    }
    for (const row of map.values()) finalizeAggregate(row)
    return Array.from(map.values()).sort((a, b) => b.scored - a.scored || b.sent - a.sent)
  }, [allResponses])

  const resourceOptions = useMemo(
    () => perResource.map(r => ({ slug: r.slug, label: r.label })),
    [perResource],
  )

  const feedbacks = useMemo(() => {
    const items = allResponses
      .filter(({ response: r }) => r.comment && r.comment.trim().length > 0)
      .filter(({ response: r }) => resourceFilter === 'all' || r.resource === resourceFilter)
      .filter(({ response: r }) => {
        if (scoreFilter === 'all') return true
        if (typeof r.score !== 'number') return false
        if (scoreFilter === 'promoters') return r.score >= 9
        if (scoreFilter === 'passives') return r.score >= 7 && r.score <= 8
        if (scoreFilter === 'detractors') return r.score <= 6
        return true
      })
    items.sort((a, b) => {
      const ta = a.response.commentAt || a.response.scoredAt || ''
      const tb = b.response.commentAt || b.response.scoredAt || ''
      return ta < tb ? 1 : -1
    })
    return items
  }, [allResponses, resourceFilter, scoreFilter])

  if (loading && !companies) return <div style={{ padding: '3rem' }}>Chargement…</div>
  if (error && !companies) return <div style={{ padding: '3rem', color: '#dc2626' }}>Erreur : {error}</div>

  const npsLabelQ = npsLabelQuery.trim().toLowerCase()
  const perResourceFiltered = npsLabelQ
    ? perResource.filter(r => r.label.toLowerCase().includes(npsLabelQ))
    : perResource
  const perResourceView = npsSort.key
    ? sortRows(perResourceFiltered, npsSort, {
        label: r => r.label.toLowerCase(),
        nps: r => r.nps,
        scored: r => r.scored,
        sent: r => r.sent,
        rate: r => r.rate,
        comments: r => r.comments,
      })
    : perResourceFiltered

  const formatPct = (n: number | null, digits = 0) => n === null ? '—' : `${(n * 100).toFixed(digits)}%`
  const formatNps = (n: number | null) => n === null ? '—' : (n > 0 ? `+${n}` : `${n}`)
  const formatDate = (iso: string | undefined) => {
    if (!iso) return ''
    try { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) }
    catch { return iso }
  }

  return (
    <div style={{ padding: '2rem 3rem', maxWidth: '1200px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111', margin: 0 }}>NPS</h2>
          <p style={{ fontSize: '0.75rem', color: '#999', margin: '0.25rem 0 0' }}>
            Satisfaction des téléchargements (data santé, journalistes). Les envois DRY-RUN sont exclus.
          </p>
        </div>
        <button
          onClick={refresh}
          style={{
            padding: '0.5rem 0.9rem', border: '1px solid #e0e0e0', borderRadius: '8px',
            background: '#fff', color: '#555', fontSize: '0.8rem', cursor: 'pointer',
          }}
        >
          ⟳ Rafraîchir
        </button>
      </div>

      {/* NPS backlog campaign panel */}
      <div style={{
        marginBottom: '1.5rem',
        padding: '0.65rem 0.85rem',
        background: '#faf5ff',
        border: '1px solid #e9d5ff',
        borderRadius: '10px',
        fontSize: '0.78rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <strong style={{ color: '#5b21b6' }}>📨 Campagne NPS backlog</strong>
          <span style={{ color: '#6b7280' }}>contacts ayant téléchargé une ressource il y a moins de</span>
          <input
            type="number"
            min={1}
            max={365}
            value={backlogDays}
            onChange={(e) => setBacklogDays(Math.max(1, Math.min(365, parseInt(e.target.value, 10) || 15)))}
            disabled={backlogState === 'previewing' || backlogState === 'sending'}
            style={{ width: 60, padding: '0.25rem 0.4rem', border: '1px solid #d4d4d8', borderRadius: '6px', fontSize: '0.78rem' }}
          />
          <span style={{ color: '#6b7280' }}>jours</span>
          {(backlogState === 'idle' || backlogState === 'err') && (
            <button
              onClick={previewBacklog}
              style={{
                padding: '0.35rem 0.8rem',
                border: `1px solid ${ACCENT}`,
                borderRadius: '6px',
                background: '#fff',
                color: ACCENT,
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Voir les éligibles
            </button>
          )}
          {backlogState === 'previewing' && <span style={{ color: '#6b7280' }}>Chargement…</span>}
          {backlogState === 'preview-ready' && backlogPreview && (
            <>
              <span style={{ color: '#5b21b6', fontWeight: 600 }}>
                {backlogPreview.count} éligible{backlogPreview.count > 1 ? 's' : ''}
                {backlogPreview.dryRun && ' · DRY-RUN'}
              </span>
              {backlogPreview.count > 0 && (
                <button
                  onClick={() => {
                    const label = backlogPreview.dryRun
                      ? `Envoyer ${backlogPreview.count} email(s) en DRY-RUN vers toi ?`
                      : `Envoyer ${backlogPreview.count} email(s) NPS aux prospects ? Cette action est définitive.`
                    if (window.confirm(label)) void sendBacklog()
                  }}
                  style={{
                    padding: '0.35rem 0.8rem',
                    border: '1px solid #16a34a',
                    borderRadius: '6px',
                    background: '#16a34a',
                    color: '#fff',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Envoyer maintenant
                </button>
              )}
              <button
                onClick={resetBacklog}
                style={{
                  padding: '0.35rem 0.6rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  background: '#fff',
                  color: '#666',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                }}
              >
                Annuler
              </button>
            </>
          )}
          {backlogState === 'sending' && <span style={{ color: '#6b7280' }}>Envoi en cours, ne pas fermer…</span>}
          {backlogState === 'done' && backlogResult && (
            <>
              <span style={{ color: '#166534', fontWeight: 600 }}>
                ✅ {backlogResult.sent} envoyé(s){backlogResult.errors > 0 ? ` · ${backlogResult.errors} erreur(s)` : ''}
                {backlogResult.remaining > 0 ? ` · ${backlogResult.remaining} restant(s)` : ''}
                {backlogResult.dryRun && ' · DRY-RUN'}
              </span>
              <button
                onClick={resetBacklog}
                style={{ padding: '0.35rem 0.6rem', border: '1px solid #e0e0e0', borderRadius: '6px', background: '#fff', color: '#666', fontSize: '0.72rem', cursor: 'pointer' }}
              >
                Fermer
              </button>
            </>
          )}
        </div>
        {backlogState === 'preview-ready' && backlogPreview && backlogPreview.count > 0 && (
          <div style={{
            marginTop: '0.5rem',
            maxHeight: 180,
            overflowY: 'auto',
            background: '#fff',
            border: '1px solid #ede9fe',
            borderRadius: '6px',
            padding: '0.35rem 0.6rem',
            fontSize: '0.7rem',
            lineHeight: 1.5,
          }}>
            {backlogPreview.eligibles.map(e => (
              <div key={e.contactId} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', borderBottom: '1px solid #f4f4f5', padding: '0.2rem 0' }}>
                <span style={{ flex: 1, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {e.kind === 'test-resend' && (
                    <span
                      title="Avait un envoi DRY-RUN (ou antérieur au tracking). Le score/commentaire éventuels seront nettoyés, puis l'email partira en prod."
                      style={{
                        padding: '0 5px', borderRadius: 4,
                        background: '#fef3c7', color: '#92400e',
                        fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.02em',
                      }}
                    >
                      TEST→PROD
                    </span>
                  )}
                  {e.fullName} · <span style={{ color: '#0066cc' }}>{e.email}</span>
                </span>
                <span style={{ color: '#6b7280' }}>{e.resourceLabel}</span>
                <span style={{ color: '#9ca3af', whiteSpace: 'nowrap' }}>{new Date(e.downloadedAt).toLocaleDateString('fr-FR')}</span>
              </div>
            ))}
          </div>
        )}
        {backlogState === 'preview-ready' && backlogPreview?.count === 0 && (
          <div style={{ marginTop: '0.4rem', color: '#6b7280' }}>Aucun contact éligible sur la période.</div>
        )}
        {backlogState === 'done' && backlogResult && backlogResult.failures.length > 0 && (
          <div style={{ marginTop: '0.5rem', color: '#b91c1c', fontSize: '0.7rem' }}>
            Échecs : {backlogResult.failures.map(f => `${f.email} (${f.error})`).join(', ')}
          </div>
        )}
        {backlogError && (
          <div style={{ marginTop: '0.4rem', color: '#b91c1c', fontSize: '0.7rem' }}>Erreur : {backlogError}</div>
        )}
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem',
        marginBottom: '2rem',
      }}>
        <NpsKpiCard
          title="NPS total"
          value={formatNps(overall.nps)}
          subtitle={`${overall.promoters} promoteur(s) · ${overall.passives} passif(s) · ${overall.detractors} détracteur(s)`}
          color={npsHeadlineColor(overall.nps)}
        />
        <NpsKpiCard
          title="Taux de réponse"
          value={formatPct(overall.rate, 1)}
          subtitle={`${overall.scored} note(s) / ${overall.sent} email(s) envoyé(s)`}
        />
        <NpsKpiCard
          title="Réponses scorées"
          value={String(overall.scored)}
          subtitle={`Sur ${overall.sent} email(s) NPS envoyé(s)`}
        />
        <NpsKpiCard
          title="Commentaires"
          value={String(overall.comments)}
          subtitle={`Sur ${overall.scored} note(s) reçue(s)`}
        />
      </div>

      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111', margin: '0 0 0.75rem' }}>
        NPS par contenu
      </h3>
      {perResource.length === 0 ? (
        <div style={{ padding: '1rem', background: '#f8f8f6', border: '1px solid #eee', borderRadius: '10px', color: '#666', fontSize: '0.8rem', marginBottom: '2rem' }}>
          Aucune donnée NPS pour le moment.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', marginBottom: '2rem', border: '1px solid #eee', borderRadius: '10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead style={{ background: '#fafafa', textAlign: 'left' }}>
              <tr>
                <Th
                  label="Contenu" thStyle={npsThStyle} sortKey="label" sort={npsSort} onSort={npsToggle}
                  filterActive={!!npsLabelQ}
                  filter={<FilterSearch value={npsLabelQuery} onChange={setNpsLabelQuery} placeholder="Contenu…" />}
                />
                <Th label="NPS" thStyle={npsThStyle} align="right" sortKey="nps" sort={npsSort} onSort={npsToggle} />
                <Th label="Notes" thStyle={npsThStyle} align="right" sortKey="scored" sort={npsSort} onSort={npsToggle} />
                <Th label="Envoyés" thStyle={npsThStyle} align="right" sortKey="sent" sort={npsSort} onSort={npsToggle} />
                <Th label="Taux réponse" thStyle={npsThStyle} align="right" sortKey="rate" sort={npsSort} onSort={npsToggle} />
                <th style={{ ...npsThStyle, textAlign: 'right' }}>Prom. / Pass. / Détr.</th>
                <Th label="Comm." thStyle={npsThStyle} align="right" sortKey="comments" sort={npsSort} onSort={npsToggle} />
              </tr>
            </thead>
            <tbody>
              {perResourceView.map(row => (
                <tr key={row.slug} style={{ borderTop: '1px solid #f0f0f0' }}>
                  <td style={npsTdStyle}>{row.label}</td>
                  <td style={{ ...npsTdStyle, textAlign: 'right', fontWeight: 700, color: npsHeadlineColor(row.nps) }}>
                    {formatNps(row.nps)}
                  </td>
                  <td style={{ ...npsTdStyle, textAlign: 'right' }}>{row.scored}</td>
                  <td style={{ ...npsTdStyle, textAlign: 'right' }}>{row.sent}</td>
                  <td style={{ ...npsTdStyle, textAlign: 'right' }}>{formatPct(row.rate, 1)}</td>
                  <td style={{ ...npsTdStyle, textAlign: 'right', color: '#555' }}>
                    <span style={{ color: '#16a34a' }}>{row.promoters}</span>
                    <span style={{ color: '#bbb' }}> / </span>
                    <span style={{ color: '#f59e0b' }}>{row.passives}</span>
                    <span style={{ color: '#bbb' }}> / </span>
                    <span style={{ color: '#dc2626' }}>{row.detractors}</span>
                  </td>
                  <td style={{ ...npsTdStyle, textAlign: 'right' }}>{row.comments}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.6rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111', margin: 0 }}>
          Feedbacks ({feedbacks.length})
        </h3>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <FilterPill label="Tous scores" active={scoreFilter === 'all'} onClick={() => setScoreFilter('all')} />
          <FilterPill label="Promoteurs" active={scoreFilter === 'promoters'} onClick={() => setScoreFilter('promoters')} color={{ bg: '#16a34a', fg: '#fff' }} />
          <FilterPill label="Passifs" active={scoreFilter === 'passives'} onClick={() => setScoreFilter('passives')} color={{ bg: '#f59e0b', fg: '#fff' }} />
          <FilterPill label="Détracteurs" active={scoreFilter === 'detractors'} onClick={() => setScoreFilter('detractors')} color={{ bg: '#dc2626', fg: '#fff' }} />
        </div>
      </div>
      <div style={{ marginBottom: '0.75rem' }}>
        <select
          value={resourceFilter}
          onChange={e => setResourceFilter(e.target.value)}
          style={{
            padding: '0.4rem 0.6rem', border: '1px solid #e0e0e0', borderRadius: '8px',
            fontSize: '0.78rem', background: '#fff', color: '#333',
          }}
        >
          <option value="all">Tous les contenus</option>
          {resourceOptions.map(o => (
            <option key={o.slug} value={o.slug}>{o.label}</option>
          ))}
        </select>
      </div>

      {feedbacks.length === 0 ? (
        <div style={{ padding: '1rem', background: '#f8f8f6', border: '1px solid #eee', borderRadius: '10px', color: '#666', fontSize: '0.8rem' }}>
          Aucun commentaire pour ces filtres.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {feedbacks.map(({ response: r, companyName, contactName, contactEmail }) => {
            const score = typeof r.score === 'number' ? r.score : null
            return (
              <div key={r.id} style={{
                padding: '0.85rem 1rem', border: '1px solid #eee', borderRadius: '10px', background: '#fff',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  {score !== null && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 36, height: 36, borderRadius: '8px',
                      background: npsScoreColor(score), color: '#fff',
                      fontWeight: 700, fontSize: '0.9rem', flexShrink: 0,
                    }}>
                      {score}
                    </span>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#111' }}>
                      {contactName} <span style={{ color: '#999', fontWeight: 400 }}>· {companyName}</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#999' }}>
                      {contactEmail} · {r.resourceLabel} · {formatDate(r.commentAt || r.scoredAt)}
                    </div>
                  </div>
                  {score !== null && (
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 600,
                      padding: '0.2rem 0.5rem', borderRadius: '6px',
                      background: `${npsScoreColor(score)}15`, color: npsScoreColor(score),
                    }}>
                      {npsScoreLabel(score)}
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#333', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {r.comment}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const npsThStyle: React.CSSProperties = {
  padding: '0.55rem 0.75rem', fontSize: '0.68rem',
  fontWeight: 600, color: '#666',
  textTransform: 'uppercase', letterSpacing: '0.04em',
  borderBottom: '1px solid #eee',
}
const npsTdStyle: React.CSSProperties = {
  padding: '0.6rem 0.75rem', fontSize: '0.82rem', color: '#222',
}

function NpsKpiCard({ title, value, subtitle, color }: {
  title: string; value: string; subtitle?: string; color?: string
}) {
  return (
    <div style={{
      padding: '1rem 1.1rem', border: '1px solid #eee', borderRadius: '12px', background: '#fff',
    }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {title}
      </div>
      <div style={{ fontSize: '1.8rem', fontWeight: 700, color: color || '#111', margin: '0.3rem 0 0.2rem' }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: '0.7rem', color: '#999' }}>{subtitle}</div>
      )}
    </div>
  )
}

/* ---------- Contenus ---------- */

/** Priority index mirroring _crm.ts STATUS_PRIORITY. Used to count how many
 *  leads from a given content reached "Opportunité" or "Client" (current
 *  status only — not historical). Lost is excluded from conversion counts. */
const STATUS_PRIORITY_CLIENT: Record<CrmStatus, number> = {
  'Non qualifié': 0,
  'Prospect': 1,
  'Lead': 2,
  'Opportunité': 3,
  'Client': 4,
  'Lost': -1,
}

type ContentLead = {
  contactId: string
  companyId: string
  contactName: string
  contactEmail: string
  companyName: string
  companyStatus: CrmStatus
  downloadedAt: string
  npsScore: number | null
  npsComment: string
}

type ContentBucket = NpsAggregate & {
  slug: string
  label: string
  leads: ContentLead[]
  opportunitiesCount: number
  clientsCount: number
}

function ContentView({ password }: { password: string }) {
  const [companies, setCompanies] = useState<CrmCompany[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null)

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${password}`, 'Content-Type': 'application/json' }),
    [password],
  )

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/.netlify/functions/admin-crm', { headers: authHeaders })
      const body = await res.text()
      if (!res.ok) throw new Error(`${res.status}: ${body}`)
      const json = JSON.parse(body)
      setCompanies(dedupeCompaniesById(json.companies || []))
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }, [authHeaders])

  useEffect(() => { refresh() }, [refresh])

  const buckets = useMemo<ContentBucket[]>(() => {
    if (!companies) return []
    const map = new Map<string, ContentBucket>()

    for (const co of companies) {
      for (const c of co.contacts) {
        if (!c.npsResponses || c.npsResponses.length === 0) continue
        // One contact may have downloaded several contents — credit each bucket once per contact.
        const seenSlugs = new Set<string>()
        for (const r of c.npsResponses) {
          // Exclude DRY-RUN entries from NPS aggregation, but keep the lead in
          // the bucket — they did download the content, just got a fake email.
          let row = map.get(r.resource)
          if (!row) {
            row = {
              ...emptyAggregate(),
              slug: r.resource,
              label: r.resourceLabel || r.resource,
              leads: [],
              opportunitiesCount: 0,
              clientsCount: 0,
            }
            map.set(r.resource, row)
          } else if (!row.label && r.resourceLabel) {
            row.label = r.resourceLabel
          }
          if (r.askedDryRun !== true) accumulate(row, r)
          if (!seenSlugs.has(r.resource)) {
            seenSlugs.add(r.resource)
            const priority = STATUS_PRIORITY_CLIENT[co.status] ?? 0
            row.leads.push({
              contactId: c.id,
              companyId: co.id,
              contactName: [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email,
              contactEmail: c.email,
              companyName: co.name,
              companyStatus: co.status,
              downloadedAt: r.downloadedAt,
              npsScore: typeof r.score === 'number' ? r.score : null,
              npsComment: r.comment || '',
            })
            if (priority >= 3) row.opportunitiesCount += 1
            if (priority >= 4) row.clientsCount += 1
          }
        }
      }
    }

    for (const row of map.values()) {
      finalizeAggregate(row)
      row.leads.sort((a, b) => (a.downloadedAt < b.downloadedAt ? 1 : -1))
    }
    return Array.from(map.values()).sort((a, b) => b.leads.length - a.leads.length)
  }, [companies])

  if (loading && !companies) return <div style={{ padding: '3rem' }}>Chargement…</div>
  if (error && !companies) return <div style={{ padding: '3rem', color: '#dc2626' }}>Erreur : {error}</div>

  const formatNps = (n: number | null) => n === null ? '—' : (n > 0 ? `+${n}` : `${n}`)
  const formatDate = (iso: string | undefined) => {
    if (!iso) return ''
    try { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) }
    catch { return iso }
  }

  return (
    <div style={{ padding: '2rem 3rem', maxWidth: '1200px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111', margin: 0 }}>Contenus</h2>
          <p style={{ fontSize: '0.75rem', color: '#999', margin: '0.25rem 0 0' }}>
            Performance des lead magnets : leads → opportunités → clients, et NPS par contenu.
          </p>
        </div>
        <button
          onClick={refresh}
          style={{
            padding: '0.5rem 0.9rem', border: '1px solid #e0e0e0', borderRadius: '8px',
            background: '#fff', color: '#555', fontSize: '0.8rem', cursor: 'pointer',
          }}
        >
          ⟳ Rafraîchir
        </button>
      </div>

      {buckets.length === 0 ? (
        <div style={{ padding: '1rem', background: '#f8f8f6', border: '1px solid #eee', borderRadius: '10px', color: '#666', fontSize: '0.8rem' }}>
          Aucun lead magnet enregistré pour le moment.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {buckets.map(b => {
            const isExpanded = expandedSlug === b.slug
            const conversionPct = (n: number) => b.leads.length > 0 ? `${Math.round((n / b.leads.length) * 100)}%` : '—'
            return (
              <div key={b.slug} style={{ border: '1px solid #eee', borderRadius: '12px', background: '#fff', overflow: 'hidden' }}>
                <button
                  onClick={() => setExpandedSlug(isExpanded ? null : b.slug)}
                  style={{
                    width: '100%', display: 'grid',
                    gridTemplateColumns: '1.5fr repeat(4, minmax(90px, 1fr)) 32px',
                    alignItems: 'center', gap: '0.75rem',
                    padding: '0.9rem 1.1rem', background: 'transparent', border: 'none',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111' }}>
                    {b.label}
                    <div style={{ fontSize: '0.65rem', color: '#999', fontWeight: 400, marginTop: 2 }}>{b.slug}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111', fontVariantNumeric: 'tabular-nums' }}>{b.leads.length}</div>
                    <div style={{ fontSize: '0.65rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Leads</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: b.opportunitiesCount > 0 ? '#6b21a8' : '#ccc', fontVariantNumeric: 'tabular-nums' }}>
                      {b.opportunitiesCount}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Opp. <span style={{ color: '#bbb' }}>{conversionPct(b.opportunitiesCount)}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: b.clientsCount > 0 ? '#065f46' : '#ccc', fontVariantNumeric: 'tabular-nums' }}>
                      {b.clientsCount}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Clients <span style={{ color: '#bbb' }}>{conversionPct(b.clientsCount)}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: npsHeadlineColor(b.nps), fontVariantNumeric: 'tabular-nums' }}>
                      {formatNps(b.nps)}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      NPS ({b.scored})
                    </div>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#999', textAlign: 'center' }}>
                    {isExpanded ? '▴' : '▾'}
                  </div>
                </button>
                {isExpanded && (
                  <div style={{ borderTop: '1px solid #eee', background: '#fafafa', padding: '0.5rem 0.75rem 1rem' }}>
                    {b.leads.length === 0 ? (
                      <p style={{ margin: '0.6rem', fontSize: '0.78rem', color: '#999' }}>Aucun lead pour ce contenu.</p>
                    ) : (
                      <div style={{ overflowX: 'auto', border: '1px solid #eee', borderRadius: '8px', background: '#fff' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                          <thead style={{ background: '#fafafa', textAlign: 'left' }}>
                            <tr>
                              <th style={npsThStyle}>Nom</th>
                              <th style={npsThStyle}>Email</th>
                              <th style={npsThStyle}>Entreprise</th>
                              <th style={{ ...npsThStyle, textAlign: 'center' }}>Statut</th>
                              <th style={{ ...npsThStyle, textAlign: 'right' }}>Téléchargé</th>
                              <th style={{ ...npsThStyle, textAlign: 'center' }}>NPS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {b.leads.map(l => {
                              const sc = STATUS_COLORS[l.companyStatus]
                              return (
                                <tr key={`${l.companyId}-${l.contactId}`} style={{ borderTop: '1px solid #f0f0f0' }}>
                                  <td style={{ ...npsTdStyle, fontWeight: 600 }}>{l.contactName}</td>
                                  <td style={npsTdStyle}>
                                    <a href={`mailto:${l.contactEmail}`} style={{ color: '#0066cc', textDecoration: 'none' }}>
                                      {l.contactEmail}
                                    </a>
                                  </td>
                                  <td style={{ ...npsTdStyle, color: '#555' }}>{l.companyName}</td>
                                  <td style={{ ...npsTdStyle, textAlign: 'center' }}>
                                    <span style={{
                                      display: 'inline-block', padding: '2px 8px', borderRadius: '6px',
                                      background: sc.bg, color: sc.fg,
                                      fontSize: '0.7rem', fontWeight: 600,
                                    }}>
                                      {l.companyStatus}
                                    </span>
                                  </td>
                                  <td style={{ ...npsTdStyle, textAlign: 'right', color: '#999', whiteSpace: 'nowrap' }}>
                                    {formatDate(l.downloadedAt)}
                                  </td>
                                  <td style={{ ...npsTdStyle, textAlign: 'center' }}>
                                    {l.npsScore === null ? (
                                      <span style={{ color: '#ccc' }}>—</span>
                                    ) : (
                                      <span style={{
                                        display: 'inline-block', minWidth: 26, padding: '2px 6px',
                                        borderRadius: '5px', background: npsScoreColor(l.npsScore), color: '#fff',
                                        fontWeight: 700, fontSize: '0.72rem',
                                      }}>
                                        {l.npsScore}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const crmLabelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.65rem', fontWeight: 600, color: '#666',
  marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.04em',
}

function FilterPill({ label, active, onClick, color }: {
  label: string; active: boolean; onClick: () => void; color?: { bg: string; fg: string }
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.35rem 0.7rem', border: '1px solid transparent', borderRadius: '8px',
        background: active ? (color?.bg || ACCENT) : '#f4f4f5',
        color: active ? (color?.fg || '#fff') : '#555',
        fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
        borderColor: active ? (color?.fg || ACCENT) + '33' : 'transparent',
      }}
    >
      {label}
    </button>
  )
}

function EditField({ label, value, onSave }: { label: string; value: string; onSave: (v: string) => void }) {
  const [local, setLocal] = useState(value)
  useEffect(() => { setLocal(value) }, [value])
  return (
    <div>
      <label style={crmLabelStyle}>{label}</label>
      <input
        type="text" value={local} onChange={e => setLocal(e.target.value)}
        onBlur={() => { if (local !== value) onSave(local) }}
        style={{
          width: '100%', padding: '0.5rem 0.7rem', border: '1px solid #e0e0e0',
          borderRadius: '8px', fontSize: '0.8rem', outline: 'none',
          background: '#fff', boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

function SelectField({ label, value, options, onSave, allowEmpty = true }: {
  label: string
  value: string
  options: ReadonlyArray<{ value: string; label: string }>
  onSave: (v: string) => void
  allowEmpty?: boolean
}) {
  return (
    <div>
      <label style={crmLabelStyle}>{label}</label>
      <select
        value={value}
        onChange={e => onSave(e.target.value)}
        style={{
          width: '100%', padding: '0.5rem 0.7rem', border: '1px solid #e0e0e0',
          borderRadius: '8px', fontSize: '0.8rem', outline: 'none',
          background: '#fff', boxSizing: 'border-box',
        }}
      >
        {allowEmpty && <option value="">—</option>}
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  )
}

function NewCompanyForm({ onSave, onCancel }: { onSave: (name: string, status: CrmStatus, origin?: CompanyOrigin) => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [status, setStatus] = useState<CrmStatus>('Non qualifié')
  const [origin, setOrigin] = useState<CompanyOrigin | ''>('')
  return (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: '12px', padding: '1rem', marginBottom: '1rem', background: '#fafafa' }}>
      <p style={{ fontSize: '0.8rem', fontWeight: 600, color: ACCENT, margin: '0 0 0.75rem' }}>Nouvelle entreprise</p>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.5rem' }}>
        <input placeholder="Nom de l'entreprise *" value={name} onChange={e => setName(e.target.value)} style={newFieldStyle} />
        <select value={status} onChange={e => setStatus(e.target.value as CrmStatus)} style={newFieldStyle}>
          {CRM_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={origin} onChange={e => setOrigin(e.target.value as CompanyOrigin | '')} style={newFieldStyle}>
          <option value="">Origine —</option>
          {COMPANY_ORIGINS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ padding: '0.45rem 0.9rem', border: '1px solid #e0e0e0', borderRadius: '8px', background: '#fff', color: '#555', fontSize: '0.75rem', cursor: 'pointer' }}>Annuler</button>
        <button onClick={() => name.trim() && onSave(name.trim(), status, origin || undefined)} disabled={!name.trim()}
          style={{ padding: '0.45rem 0.9rem', border: 'none', borderRadius: '8px', background: ACCENT, color: '#fff', fontSize: '0.75rem', fontWeight: 600, cursor: name.trim() ? 'pointer' : 'not-allowed', opacity: name.trim() ? 1 : 0.5 }}>
          Créer
        </button>
      </div>
    </div>
  )
}

function NewContactForm({ onSave, onCancel }: { onSave: (fields: Partial<CrmContact>) => void; onCancel: () => void }) {
  const [fields, setFields] = useState<Partial<CrmContact>>({ email: '', firstName: '', lastName: '', source: 'Manual', notes: '', language: undefined })
  const [langTouched, setLangTouched] = useState(false)
  const upd = (k: keyof CrmContact, v: string) => setFields(p => {
    const next = { ...p, [k]: v }
    // Auto-detect language as long as the user hasn't picked one manually.
    if (!langTouched && (k === 'email' || k === 'firstName')) {
      next.language = detectLanguage({ email: next.email, firstName: next.firstName })
    }
    return next
  })
  return (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: '10px', padding: '0.75rem', marginBottom: '0.75rem', background: '#fff' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
        <input placeholder="Email *" value={fields.email} onChange={e => upd('email', e.target.value)} style={newFieldStyle} />
        <input placeholder="Prénom" value={fields.firstName} onChange={e => upd('firstName', e.target.value)} style={newFieldStyle} />
        <input placeholder="Nom" value={fields.lastName} onChange={e => upd('lastName', e.target.value)} style={newFieldStyle} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem', marginTop: '0.5rem' }}>
        <select
          value={fields.language || ''}
          onChange={e => { setLangTouched(true); setFields(p => ({ ...p, language: (e.target.value || undefined) as ContactLanguage | undefined })) }}
          style={newFieldStyle}
        >
          <option value="">Langue —</option>
          {CONTACT_LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ padding: '0.35rem 0.7rem', border: '1px solid #e0e0e0', borderRadius: '6px', background: '#fff', color: '#555', fontSize: '0.7rem', cursor: 'pointer' }}>Annuler</button>
        <button onClick={() => fields.email && onSave(fields)} disabled={!fields.email}
          style={{ padding: '0.35rem 0.7rem', border: 'none', borderRadius: '6px', background: ACCENT, color: '#fff', fontSize: '0.7rem', fontWeight: 600, cursor: fields.email ? 'pointer' : 'not-allowed', opacity: fields.email ? 1 : 0.5 }}>
          Ajouter
        </button>
      </div>
    </div>
  )
}

const newFieldStyle: React.CSSProperties = {
  padding: '0.5rem 0.7rem', border: '1px solid #e0e0e0', borderRadius: '8px',
  fontSize: '0.8rem', outline: 'none', background: '#fff', boxSizing: 'border-box',
}

/* ---------- Emails (nurture templates editor) ---------- */

type EmailTemplate = { subject: string; body: string }
type EmailTemplateKey = 'resource-delivery' | 'nurture-j3' | 'nurture-j7' | 'appointment-reminder'
type EmailTemplatesData = Record<EmailTemplateKey, { FR: EmailTemplate; EN: EmailTemplate }> & { updatedAt?: string }

const EMAIL_TEMPLATE_META: { key: EmailTemplateKey; label: string; hint: string }[] = [
  { key: 'resource-delivery', label: 'J0 — Livraison ressource', hint: "Envoyé immédiatement après le téléchargement, avec le(s) lien(s) d'accès direct à la ressource." },
  { key: 'nurture-j3', label: 'J+3 — Autres ressources', hint: "Envoyé 3 jours après le 1er téléchargement. Propose les lead magnets que le contact n'a pas encore pris." },
  { key: 'nurture-j7', label: 'J+7 — Mon offre', hint: 'Envoyé 7 jours après le 1er téléchargement. Présente Advisory / Part-Time CMO / transition + CTA brief.' },
  { key: 'appointment-reminder', label: 'RDV — Rappel J-1', hint: 'Envoyé la veille de chaque RDV pris sur /booking (cron quotidien 8h UTC). Redonne le lien de réservation pour décaler le créneau si besoin.' },
]

const EMAIL_PLACEHOLDERS: { name: string; desc: string }[] = [
  { name: '{{hello}}', desc: '« Bonjour Marie, » ou « Bonjour, » selon les données' },
  { name: '{{firstName}}', desc: 'prénom seul (peut être vide)' },
  { name: '{{resourceLabel}}', desc: 'nom de la ressource téléchargée' },
  { name: '{{resourceUrl}}', desc: "lien d'accès direct à la ressource téléchargée (Gsheet / fichier, comme l'email J0)" },
  { name: '{{resourcesHtml}}', desc: 'liste <ul> des autres ressources (J+3 uniquement)' },
  { name: '{{resourceLinksHtml}}', desc: "bouton(s) d'accès à la ressource (livraison uniquement)" },
  { name: '{{videoHtml}}', desc: 'miniature cliquable de la vidéo de présentation (→ YouTube)' },
  { name: '{{bookingUrl}}', desc: 'lien de prise de RDV tracké (sert aussi à décaler — rappel J-1)' },
  { name: '{{siteUrl}}', desc: 'https://www.clempo.fr' },
  { name: '{{appointmentDate}}', desc: 'date du RDV en toutes lettres, heure de Paris (rappel J-1)' },
  { name: '{{appointmentTime}}', desc: 'heure de début du RDV, HH:MM Paris (rappel J-1)' },
]

const resourcesListHtml = (items: string[]) =>
  `<ul style="padding-left:20px;margin:16px 0;">${items.map(l => `<li style="margin:0 0 10px;"><a href="#" style="color:#1A1A6B;">${l}</a></li>`).join('')}</ul>`

const videoSampleHtml = (alt: string, caption: string) =>
  `<p style="margin:24px 0 8px;"><a href="https://www.youtube.com/watch?v=rdwcJ7gAyv0"><img src="https://img.youtube.com/vi/rdwcJ7gAyv0/maxresdefault.jpg" alt="${alt}" width="520" style="width:100%;max-width:520px;border-radius:8px;border:1px solid rgba(10,10,11,0.08);display:block;" /></a></p><p style="margin:0 0 24px;font-size:14px;"><a href="https://www.youtube.com/watch?v=rdwcJ7gAyv0" style="color:#1A1A6B;">▶ ${caption}</a></p>`

/** Sample data per language — mirrors what the cron generates for a real
 *  contact, so the EN preview shows EN variables (and FR shows FR). */
const EMAIL_SAMPLE_VARS: Record<'FR' | 'EN', Record<string, string>> = {
  FR: {
    hello: 'Bonjour Marie,',
    firstName: 'Marie',
    resourceLabel: 'Base décideurs hospitaliers',
    resourceUrl: 'https://docs.google.com/spreadsheets/d/147n3ARYM5gH2RAMlMelvXIqEJsII1u-d/edit?usp=sharing',
    resourcesHtml: resourcesListHtml([
      'La liste des journalistes santé français et américains (pour vos RP)',
      'Les parts de marché des logiciels médicaux, spécialité par spécialité',
      'Mes articles de blog dédiés aux acteurs de la santé',
    ]),
    resourceLinksHtml: '<p style="margin:16px 0;"><a href="#" style="display:inline-block;padding:12px 24px;background:#0A0A0B;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">📥 Télécharger la ressource</a></p>',
    videoHtml: videoSampleHtml('Présentation en vidéo — Clément Pouget-Osmont', 'Regarder la vidéo de présentation'),
    bookingUrl: 'https://www.clempo.fr/booking?src=nurture-j7',
    siteUrl: 'https://www.clempo.fr',
    appointmentDate: 'lundi 16 juin 2026',
    appointmentTime: '14:30',
  },
  EN: {
    hello: 'Hi Marie,',
    firstName: 'Marie',
    resourceLabel: 'The hospital decision-makers database (CEOs, CIOs, CME presidents)',
    resourceUrl: 'https://docs.google.com/spreadsheets/d/147n3ARYM5gH2RAMlMelvXIqEJsII1u-d/edit?usp=sharing',
    resourcesHtml: resourcesListHtml([
      'The list of French and US healthcare journalists (for your PR)',
      'Medical software market shares, specialty by specialty',
      'My blog articles for healthcare players',
    ]),
    resourceLinksHtml: '<p style="margin:16px 0;"><a href="#" style="display:inline-block;padding:12px 24px;background:#0A0A0B;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">📥 Download the resource</a></p>',
    videoHtml: videoSampleHtml('Video introduction — Clément Pouget-Osmont', 'Watch the intro video'),
    bookingUrl: 'https://www.clempo.fr/booking?src=nurture-j7',
    siteUrl: 'https://www.clempo.fr',
    appointmentDate: 'Monday 16 June 2026',
    appointmentTime: '14:30',
  },
}

function renderEmailPreview(input: string, lang: 'FR' | 'EN'): string {
  return input.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, key) => EMAIL_SAMPLE_VARS[lang][key] ?? m)
}

/* ---------- Emails — statistiques ouvertures / clics ---------- */

type EmailSendStats = {
  id: string
  templateKey: string
  language: 'FR' | 'EN'
  to: string
  recipientName?: string
  company?: string
  subject: string
  sentAt: string
  opens: number
  firstOpenAt?: string
  lastOpenAt?: string
  totalClicks: number
  clicks: { url: string; count: number; lastAt: string }[]
}

type EmailStatsData = {
  totals: Record<string, { sent: number; opened: number; clicked: number }>
  sends: EmailSendStats[]
}

const EMAIL_TEMPLATE_SHORT: Record<string, string> = {
  'resource-delivery': 'J0 — Livraison',
  'nurture-j3': 'J+3 — Ressources',
  'nurture-j7': 'J+7 — Offre',
  'appointment-reminder': 'RDV — Rappel J-1',
}

const fmtEmailDate = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })

const pctOf = (n: number, total: number) => (total === 0 ? '—' : `${Math.round((n / total) * 100)}%`)

/** Strip protocol/www for compact link display in the click detail. */
const shortUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')

function EmailStatsView({ password }: { password: string }) {
  const [data, setData] = useState<EmailStatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterKey, setFilterKey] = useState<string>('all')
  const { sort, toggle } = useSort()
  const [nameQuery, setNameQuery] = useState('')
  const [openFilter, setOpenFilter] = useState<'all' | 'yes' | 'no'>('all')
  const [clickFilter, setClickFilter] = useState<'all' | 'yes' | 'no'>('all')

  useEffect(() => {
    fetch('/.netlify/functions/admin-email-stats', { headers: { Authorization: `Bearer ${password}` } })
      .then(async r => {
        if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`)
        return r.json()
      })
      .then(setData)
      .catch(err => setError(String(err)))
      .finally(() => setLoading(false))
  }, [password])

  if (loading) return <div style={{ padding: '3rem', color: '#666' }}>Chargement…</div>
  if (!data) return <div style={{ padding: '3rem', color: '#dc2626' }}>Erreur : {error || 'stats indisponibles'}</div>

  const q = nameQuery.trim().toLowerCase()
  const filteredSends = data.sends.filter(s => {
    if (filterKey !== 'all' && s.templateKey !== filterKey) return false
    if (q && !`${s.recipientName || ''} ${s.to || ''} ${s.company || ''}`.toLowerCase().includes(q)) return false
    if (openFilter === 'yes' && !(s.opens > 0)) return false
    if (openFilter === 'no' && s.opens > 0) return false
    if (clickFilter === 'yes' && !(s.totalClicks > 0)) return false
    if (clickFilter === 'no' && s.totalClicks > 0) return false
    return true
  })
  const sends = sortRows(filteredSends, sort, {
    date: s => s.sentAt,
    recipient: s => (s.recipientName || s.to || '').toLowerCase(),
    template: s => EMAIL_TEMPLATE_SHORT[s.templateKey] || s.templateKey,
    opens: s => s.opens,
    clicks: s => s.totalClicks,
  })

  const cardStyle: React.CSSProperties = {
    flex: '1 1 180px', padding: '0.9rem 1.1rem', border: '1px solid #eee',
    borderRadius: '10px', background: '#fff', minWidth: '180px',
  }
  const metricStyle: React.CSSProperties = { fontSize: '1.15rem', fontWeight: 700, color: '#111' }
  const metricLabelStyle: React.CSSProperties = { fontSize: '0.65rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' }
  const thStyle: React.CSSProperties = {
    textAlign: 'left', padding: '0.5rem 0.75rem', fontSize: '0.65rem', fontWeight: 600,
    color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #eee',
  }
  const tdStyle: React.CSSProperties = { padding: '0.55rem 0.75rem', fontSize: '0.8rem', color: '#333', borderBottom: '1px solid #f3f3f3', verticalAlign: 'top' }
  const pillStyle = (active: boolean): React.CSSProperties => ({
    padding: '0.35rem 0.75rem', border: `1px solid ${active ? ACCENT : '#e0e0e0'}`,
    borderRadius: '8px', background: active ? ACCENT : '#fff',
    color: active ? '#fff' : '#555', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
  })

  return (
    <div>
      {/* Per-template summary */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {EMAIL_TEMPLATE_META.map(m => {
          const t = data.totals[m.key] || { sent: 0, opened: 0, clicked: 0 }
          return (
            <div key={m.key} style={cardStyle}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#555', margin: '0 0 0.6rem' }}>{EMAIL_TEMPLATE_SHORT[m.key] || m.key}</p>
              <div style={{ display: 'flex', gap: '1.1rem' }}>
                <div><div style={metricStyle}>{t.sent}</div><div style={metricLabelStyle}>Envoyés</div></div>
                <div><div style={metricStyle}>{pctOf(t.opened, t.sent)}</div><div style={metricLabelStyle}>Ouverture</div></div>
                <div><div style={metricStyle}>{pctOf(t.clicked, t.sent)}</div><div style={metricLabelStyle}>Clic</div></div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.9rem', flexWrap: 'wrap' }}>
        <button onClick={() => setFilterKey('all')} style={pillStyle(filterKey === 'all')}>Tous</button>
        {EMAIL_TEMPLATE_META.map(m => (
          <button key={m.key} onClick={() => setFilterKey(m.key)} style={pillStyle(filterKey === m.key)}>
            {EMAIL_TEMPLATE_SHORT[m.key] || m.key}
          </button>
        ))}
      </div>

      {sends.length === 0 ? (
        <div style={{ padding: '2rem', border: '1px dashed #e0e0e0', borderRadius: '10px', color: '#888', fontSize: '0.85rem' }}>
          {data.sends.length === 0
            ? 'Aucun envoi tracké pour le moment. Le tracking démarre avec les prochains envois réels (les tests admin et les dry-runs ne sont pas comptés).'
            : 'Aucun envoi ne correspond à ces filtres.'}
        </div>
      ) : (
        <div style={{ border: '1px solid #eee', borderRadius: '10px', overflow: 'hidden', background: '#fff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <Th label="Date" thStyle={thStyle} sortKey="date" sort={sort} onSort={toggle} />
                <Th
                  label="Destinataire" thStyle={thStyle} sortKey="recipient" sort={sort} onSort={toggle}
                  filterActive={!!q}
                  filter={<FilterSearch value={nameQuery} onChange={setNameQuery} placeholder="Nom, email, société…" />}
                />
                <Th label="Email" thStyle={thStyle} sortKey="template" sort={sort} onSort={toggle} />
                <Th
                  label="Ouvert" thStyle={thStyle} sortKey="opens" sort={sort} onSort={toggle}
                  filterActive={openFilter !== 'all'}
                  filter={<FilterChoices value={openFilter} onChange={v => setOpenFilter(v as 'all' | 'yes' | 'no')} options={[
                    { value: 'all', label: 'Tous' },
                    { value: 'yes', label: 'Ouverts uniquement' },
                    { value: 'no', label: 'Non ouverts' },
                  ]} />}
                />
                <Th
                  label="Clics" thStyle={thStyle} sortKey="clicks" sort={sort} onSort={toggle}
                  filterActive={clickFilter !== 'all'}
                  filter={<FilterChoices value={clickFilter} onChange={v => setClickFilter(v as 'all' | 'yes' | 'no')} options={[
                    { value: 'all', label: 'Tous' },
                    { value: 'yes', label: 'Cliqués uniquement' },
                    { value: 'no', label: 'Sans clic' },
                  ]} />}
                />
              </tr>
            </thead>
            <tbody>
              {sends.map(s => {
                const expanded = expandedId === s.id
                return (
                  <Fragment key={s.id}>
                    <tr
                      onClick={() => setExpandedId(expanded ? null : s.id)}
                      style={{ cursor: 'pointer', background: expanded ? '#fafafa' : undefined }}
                    >
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{fmtEmailDate(s.sentAt)}</td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: s.recipientName ? 600 : 400 }}>{s.recipientName || s.to}</div>
                        {s.recipientName && <div style={{ fontSize: '0.72rem', color: '#999' }}>{s.to}</div>}
                        {s.company && <div style={{ fontSize: '0.72rem', color: '#999' }}>{s.company}</div>}
                      </td>
                      <td style={tdStyle}>
                        {EMAIL_TEMPLATE_SHORT[s.templateKey] || s.templateKey}
                        <span style={{ color: '#bbb', fontSize: '0.72rem' }}> · {s.language}</span>
                      </td>
                      <td style={tdStyle}>
                        {s.opens > 0
                          ? <span style={{ color: '#059669', fontWeight: 600 }}>✓ {s.opens > 1 ? `${s.opens}×` : ''}</span>
                          : <span style={{ color: '#bbb' }}>—</span>}
                      </td>
                      <td style={tdStyle}>
                        {s.totalClicks > 0
                          ? <span style={{ color: ACCENT, fontWeight: 600 }}>{s.totalClicks}</span>
                          : <span style={{ color: '#bbb' }}>—</span>}
                      </td>
                    </tr>
                    {expanded && (
                      <tr>
                        <td colSpan={5} style={{ ...tdStyle, background: '#fafafa', fontSize: '0.78rem' }}>
                          <p style={{ margin: '0 0 0.4rem', color: '#555' }}><strong>Sujet :</strong> {s.subject}</p>
                          <p style={{ margin: '0 0 0.4rem', color: '#555' }}>
                            <strong>Ouvertures :</strong>{' '}
                            {s.opens === 0
                              ? 'aucune (ou images bloquées par le client mail)'
                              : `${s.opens} — première le ${fmtEmailDate(s.firstOpenAt!)}${s.opens > 1 ? `, dernière le ${fmtEmailDate(s.lastOpenAt!)}` : ''}`}
                          </p>
                          <div style={{ color: '#555' }}>
                            <strong>Liens cliqués :</strong>
                            {s.clicks.length === 0 ? ' aucun' : (
                              <ul style={{ margin: '0.3rem 0 0', paddingLeft: '1.2rem' }}>
                                {s.clicks.map((c, i) => (
                                  <li key={i} style={{ margin: '0 0 0.2rem' }}>
                                    <a href={c.url} target="_blank" rel="noreferrer" style={{ color: ACCENT }}>{shortUrl(c.url)}</a>
                                    {' '}— {c.count} clic{c.count > 1 ? 's' : ''} (dernier le {fmtEmailDate(c.lastAt)})
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ fontSize: '0.7rem', color: '#999', margin: '0.75rem 0 0' }}>
        Les taux d'ouverture sont une borne haute (Apple Mail et le proxy images de Gmail préchargent
        le pixel) — les clics sont le signal fiable. Tests admin et dry-runs exclus.
      </p>
    </div>
  )
}

type ScheduledEmail = {
  id: string
  templateKey: 'nps-ask' | 'nurture-j3' | 'nurture-j7' | 'appointment-reminder'
  language: 'FR' | 'EN'
  to: string
  recipientName?: string
  company?: string
  resourceLabel?: string
  anchorAt: string
  plannedSendAt: string
  status: 'scheduled' | 'pending'
}
type ScheduledData = {
  generatedAt: string
  live: { nurture: boolean; nps: boolean; appointment: boolean }
  caps: { nurture: number; nps: number }
  counts: { total: number; scheduled: number; pending: number }
  upcoming: ScheduledEmail[]
}

const SCHED_LABEL: Record<string, string> = {
  'nps-ask': 'J+1 — NPS',
  'nurture-j3': 'J+3 — Ressources',
  'nurture-j7': 'J+7 — Offre',
  'appointment-reminder': 'RDV — Rappel J-1',
}

const fmtSchedDate = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

const relSchedDay = (iso: string) => {
  const days = Math.round((Date.parse(iso) - Date.now()) / 86_400_000)
  if (days <= 0) return "aujourd'hui"
  if (days === 1) return 'demain'
  return `dans ${days} j`
}

function ScheduledEmailsView({ password }: { password: string }) {
  const [data, setData] = useState<ScheduledData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { sort, toggle } = useSort({ key: 'planned', dir: 'asc' })
  const [nameQuery, setNameQuery] = useState('')
  const [tplFilter, setTplFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetch('/.netlify/functions/admin-scheduled-emails', { headers: { Authorization: `Bearer ${password}` } })
      .then(async r => {
        if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`)
        return r.json()
      })
      .then(setData)
      .catch(err => setError(String(err)))
      .finally(() => setLoading(false))
  }, [password])

  if (loading) return <div style={{ padding: '3rem', color: '#666' }}>Chargement…</div>
  if (!data) return <div style={{ padding: '3rem', color: '#dc2626' }}>Erreur : {error || 'indisponible'}</div>

  const thStyle: React.CSSProperties = {
    textAlign: 'left', padding: '0.5rem 0.75rem', fontSize: '0.65rem', fontWeight: 600,
    color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #eee',
  }
  const tdStyle: React.CSSProperties = { padding: '0.55rem 0.75rem', fontSize: '0.8rem', color: '#333', borderBottom: '1px solid #f3f3f3', verticalAlign: 'top' }
  const cardStyle: React.CSSProperties = {
    flex: '1 1 150px', padding: '0.9rem 1.1rem', border: '1px solid #eee',
    borderRadius: '10px', background: '#fff', minWidth: '150px',
  }

  const q = nameQuery.trim().toLowerCase()
  const filtered = data.upcoming.filter(u => {
    if (tplFilter !== 'all' && u.templateKey !== tplFilter) return false
    if (statusFilter !== 'all' && u.status !== statusFilter) return false
    if (q && !`${u.recipientName || ''} ${u.to} ${u.company || ''}`.toLowerCase().includes(q)) return false
    return true
  })
  const rows = sortRows(filtered, sort, {
    planned: u => u.plannedSendAt,
    recipient: u => (u.recipientName || u.to).toLowerCase(),
    template: u => SCHED_LABEL[u.templateKey] || u.templateKey,
    status: u => u.status,
  })

  // Dry-run = l'email part vers le owner, pas vers le contact → à signaler.
  const dryWarn: string[] = []
  if (!data.live.nurture) dryWarn.push('nurture J+3/J+7')
  if (!data.live.nps) dryWarn.push('NPS J+1')
  if (!data.live.appointment) dryWarn.push('rappel RDV J-1')

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div style={cardStyle}>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#111' }}>{data.counts.total}</div>
          <div style={{ fontSize: '0.65rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>À venir</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#b45309' }}>{data.counts.pending}</div>
          <div style={{ fontSize: '0.65rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>En attente (prochain run)</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#111' }}>{data.counts.scheduled}</div>
          <div style={{ fontSize: '0.65rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Programmés (futur)</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111' }}>{data.caps.nurture} / {data.caps.nps}</div>
          <div style={{ fontSize: '0.65rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plafond/jour nurture / NPS</div>
        </div>
      </div>

      {dryWarn.length > 0 && (
        <div style={{ padding: '0.7rem 1rem', marginBottom: '1rem', borderRadius: '10px', background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', fontSize: '0.78rem' }}>
          ⚠️ Mode DRY-RUN actif pour {dryWarn.join(' et ')} : ces emails partent vers le owner (pas le contact réel) tant que le flag live n'est pas activé.
        </div>
      )}

      {data.upcoming.length === 0 ? (
        <div style={{ padding: '2rem', border: '1px dashed #e0e0e0', borderRadius: '10px', color: '#888', fontSize: '0.85rem' }}>
          Aucun email programmé à venir. Les emails apparaissent ici dès qu'un contact entre dans une fenêtre d'envoi : J+1, J+3, J+7 après un téléchargement, ou le rappel J-1 d'un RDV à venir.
        </div>
      ) : (
        <div style={{ border: '1px solid #eee', borderRadius: '10px', overflow: 'hidden', background: '#fff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <Th label="Envoi prévu" thStyle={thStyle} sortKey="planned" sort={sort} onSort={toggle} />
                <Th
                  label="Destinataire" thStyle={thStyle} sortKey="recipient" sort={sort} onSort={toggle}
                  filterActive={!!q}
                  filter={<FilterSearch value={nameQuery} onChange={setNameQuery} placeholder="Nom, email, société…" />}
                />
                <Th
                  label="Email" thStyle={thStyle} sortKey="template" sort={sort} onSort={toggle}
                  filterActive={tplFilter !== 'all'}
                  filter={<FilterChoices value={tplFilter} onChange={setTplFilter} options={[
                    { value: 'all', label: 'Tous' },
                    { value: 'nps-ask', label: 'J+1 — NPS' },
                    { value: 'nurture-j3', label: 'J+3 — Ressources' },
                    { value: 'nurture-j7', label: 'J+7 — Offre' },
                    { value: 'appointment-reminder', label: 'RDV — Rappel J-1' },
                  ]} />}
                />
                <th style={thStyle}>Ressource</th>
                <Th
                  label="Statut" thStyle={thStyle} sortKey="status" sort={sort} onSort={toggle}
                  filterActive={statusFilter !== 'all'}
                  filter={<FilterChoices value={statusFilter} onChange={setStatusFilter} options={[
                    { value: 'all', label: 'Tous' },
                    { value: 'pending', label: 'En attente (dû)' },
                    { value: 'scheduled', label: 'Programmé (futur)' },
                  ]} />}
                />
              </tr>
            </thead>
            <tbody>
              {rows.map(u => (
                <tr key={u.id}>
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                    {fmtSchedDate(u.plannedSendAt)}
                    <span style={{ color: '#bbb', fontSize: '0.72rem' }}> · {relSchedDay(u.plannedSendAt)}</span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: u.recipientName ? 600 : 400 }}>{u.recipientName || u.to}</div>
                    {u.recipientName && <div style={{ fontSize: '0.72rem', color: '#999' }}>{u.to}</div>}
                    {u.company && <div style={{ fontSize: '0.72rem', color: '#999' }}>{u.company}</div>}
                  </td>
                  <td style={tdStyle}>
                    {SCHED_LABEL[u.templateKey] || u.templateKey}
                    <span style={{ color: '#bbb', fontSize: '0.72rem' }}> · {u.language}</span>
                  </td>
                  <td style={{ ...tdStyle, color: '#666' }}>{u.resourceLabel || '—'}</td>
                  <td style={tdStyle}>
                    {u.status === 'pending'
                      ? <span style={{ color: '#b45309', fontWeight: 600 }}>⏳ En attente</span>
                      : <span style={{ color: '#2563eb', fontWeight: 600 }}>📅 Programmé</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ fontSize: '0.7rem', color: '#999', margin: '0.75rem 0 0' }}>
        Dates théoriques au plus tôt (prochain run du cron : nurture 9h30 UTC, NPS 10h UTC).
        « En attente » = déjà dans la fenêtre d'envoi, partira au prochain run si le plafond Resend du jour le permet — sinon +24h.
        Généré le {new Date(data.generatedAt).toLocaleString('fr-FR')}.
      </p>
    </div>
  )
}

/** Zero-dependency rich text editor on contentEditable + execCommand.
 *  Uncontrolled by design: the DOM is initialized once per `key` remount
 *  (feeding state back on every keystroke would reset the cursor). */
function EmailRichEditor({ initialHtml, onChange }: { initialHtml: string; onChange: (html: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  // The content is set imperatively ONCE at mount and React never renders it:
  // no dangerouslySetInnerHTML, no children. Under React 19, an (even
  // unchanged) dangerouslySetInnerHTML gets re-applied on parent re-renders,
  // which rewrites the DOM on every keystroke — caret jumps to the start and
  // text appears to type backwards. Keeping React fully out of the content
  // makes the editor truly uncontrolled; template/lang switches remount via
  // the `key` prop and re-run this effect with the then-current value.
  const initialRef = useRef(initialHtml)

  useEffect(() => {
    if (ref.current) ref.current.innerHTML = initialRef.current
    // Enter → <p> (block emails render reliably) instead of <div>.
    try { document.execCommand('defaultParagraphSeparator', false, 'p') } catch { /* older engines */ }
  }, [])

  const exec = (command: string, value?: string) => {
    ref.current?.focus()
    document.execCommand(command, false, value)
    if (ref.current) onChange(ref.current.innerHTML)
  }

  const addLink = () => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !ref.current?.contains(sel.anchorNode)) {
      alert('Sélectionnez d\'abord le texte à transformer en lien.')
      return
    }
    const url = window.prompt('URL du lien :', 'https://')
    if (!url || url === 'https://') return
    exec('createLink', url)
  }

  const toolBtnStyle: React.CSSProperties = {
    padding: '0.3rem 0.65rem', border: '1px solid #e0e0e0', borderRadius: '6px',
    background: '#fff', color: '#333', fontSize: '0.78rem', cursor: 'pointer', lineHeight: 1.2,
  }

  return (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: '0.35rem', padding: '0.45rem', borderBottom: '1px solid #eee', background: '#fafafa', flexWrap: 'wrap' }}>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => exec('bold')} title="Gras" style={{ ...toolBtnStyle, fontWeight: 700 }}>B</button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => exec('italic')} title="Italique" style={{ ...toolBtnStyle, fontStyle: 'italic' }}>I</button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={addLink} title="Lien sur le texte sélectionné" style={toolBtnStyle}>🔗 Lien</button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => exec('insertUnorderedList')} title="Liste à puces" style={toolBtnStyle}>• Liste</button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => exec('removeFormat')} title="Retirer le formatage" style={{ ...toolBtnStyle, color: '#888' }}>⌫ Format</button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => ref.current && onChange(ref.current.innerHTML)}
        style={{
          minHeight: '300px', maxHeight: '460px', overflowY: 'auto',
          padding: '0.9rem 1rem', fontSize: '0.88rem', lineHeight: 1.55,
          color: '#0a0a0a', outline: 'none', background: '#fff',
        }}
      />
    </div>
  )
}

function EmailTemplatesView({ password }: { password: string }) {
  const [templates, setTemplates] = useState<EmailTemplatesData | null>(null)
  const [defaults, setDefaults] = useState<EmailTemplatesData | null>(null)
  const [subTab, setSubTab] = useState<'templates' | 'stats' | 'scheduled'>('templates')
  const [activeKey, setActiveKey] = useState<EmailTemplateKey>('resource-delivery')
  const [activeLang, setActiveLang] = useState<'FR' | 'EN'>('FR')
  const [editorMode, setEditorMode] = useState<'rich' | 'html'>('rich')
  /** Bumped on reset / external body change to remount the rich editor. */
  const [editorEpoch, setEditorEpoch] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${password}`, 'Content-Type': 'application/json' }),
    [password],
  )

  useEffect(() => {
    fetch('/.netlify/functions/admin-email-templates', { headers: authHeaders })
      .then(async r => {
        if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`)
        return r.json()
      })
      .then(json => { setTemplates(json.templates); setDefaults(json.defaults) })
      .catch(err => setError(String(err)))
      .finally(() => setLoading(false))
  }, [authHeaders])

  const flash = (msg: string) => { setNotice(msg); setTimeout(() => setNotice(''), 4000) }

  const updateField = (field: 'subject' | 'body', value: string) => {
    setTemplates(prev => prev ? ({
      ...prev,
      [activeKey]: {
        ...prev[activeKey],
        [activeLang]: { ...prev[activeKey][activeLang], [field]: value },
      },
    }) : prev)
    setDirty(true)
  }

  const handleSave = async () => {
    if (!templates) return
    setSaving(true); setError('')
    try {
      const res = await fetch('/.netlify/functions/admin-email-templates', {
        method: 'PUT', headers: authHeaders, body: JSON.stringify(templates),
      })
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`)
      setDirty(false)
      flash('✓ Templates sauvegardés — le prochain envoi du cron utilisera cette version.')
    } catch (err) {
      setError(String(err))
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    if (!templates) return
    setTesting(true); setError('')
    try {
      const tpl = templates[activeKey][activeLang]
      const res = await fetch('/.netlify/functions/admin-email-templates', {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ action: 'test', key: activeKey, language: activeLang, subject: tpl.subject, body: tpl.body }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || `${res.status}`)
      flash(`✓ Test envoyé à ${json.sentTo} (version affichée dans l'éditeur, même non sauvegardée).`)
    } catch (err) {
      setError(String(err))
    } finally {
      setTesting(false)
    }
  }

  const handleReset = () => {
    if (!defaults) return
    setTemplates(prev => prev ? ({
      ...prev,
      [activeKey]: {
        ...prev[activeKey],
        [activeLang]: { ...defaults[activeKey][activeLang] },
      },
    }) : prev)
    setEditorEpoch(n => n + 1)
    setDirty(true)
    flash('Template réinitialisé au défaut — pensez à sauvegarder.')
  }

  const pillStyle = (active: boolean): React.CSSProperties => ({
    padding: '0.45rem 0.9rem', border: `1px solid ${active ? ACCENT : '#e0e0e0'}`,
    borderRadius: '8px', background: active ? ACCENT : '#fff',
    color: active ? '#fff' : '#555', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
  })

  const header = (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111', margin: 0 }}>Emails</h2>
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button onClick={() => setSubTab('templates')} style={pillStyle(subTab === 'templates')}>✏️ Templates</button>
          <button onClick={() => setSubTab('stats')} style={pillStyle(subTab === 'stats')}>📊 Statistiques</button>
          <button onClick={() => setSubTab('scheduled')} style={pillStyle(subTab === 'scheduled')}>📅 Programmés</button>
        </div>
      </div>
      <p style={{ fontSize: '0.75rem', color: '#999', margin: '0.25rem 0 0' }}>
        {subTab === 'stats'
          ? 'Ouvertures et clics des emails envoyés (livraison + séquence nurture). Cliquez sur une ligne pour le détail par lien.'
          : subTab === 'scheduled'
            ? 'Emails programmés à venir (J+1 NPS, J+3, J+7 depuis les téléchargements ; rappel J-1 depuis les RDV pris). Les dates sont théoriques : si le plafond Resend du jour est atteint, l’envoi glisse de 24h.'
            : <>Templates de la séquence nurture (cron quotidien 9h30 UTC). Modifications prises en compte au prochain envoi, sans redéploiement.
              {templates?.updatedAt && ` · Dernière sauvegarde : ${new Date(templates.updatedAt).toLocaleString('fr-FR')}`}</>}
      </p>
    </div>
  )

  // Stats / Programmés don't depend on the templates fetch — render even if it failed.
  if (subTab === 'stats') {
    return (
      <div style={{ padding: '2rem 3rem', maxWidth: '1200px' }}>
        {header}
        <EmailStatsView password={password} />
      </div>
    )
  }
  if (subTab === 'scheduled') {
    return (
      <div style={{ padding: '2rem 3rem', maxWidth: '1200px' }}>
        {header}
        <ScheduledEmailsView password={password} />
      </div>
    )
  }

  if (loading) return <div style={{ padding: '3rem', color: '#666' }}>Chargement…</div>
  if (!templates) return <div style={{ padding: '3rem', color: '#dc2626' }}>Erreur : {error || 'templates indisponibles'}</div>

  const tpl = templates[activeKey][activeLang]
  const meta = EMAIL_TEMPLATE_META.find(m => m.key === activeKey)!

  return (
    <div style={{ padding: '2rem 3rem', maxWidth: '1200px' }}>
      {header}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        {EMAIL_TEMPLATE_META.map(m => (
          <button key={m.key} onClick={() => setActiveKey(m.key)} style={pillStyle(activeKey === m.key)}>
            {m.label}
          </button>
        ))}
        <span style={{ width: '1px', background: '#e0e0e0', margin: '0 0.5rem' }} />
        {(['FR', 'EN'] as const).map(l => (
          <button key={l} onClick={() => setActiveLang(l)} style={pillStyle(activeLang === l)}>
            {l}
          </button>
        ))}
      </div>
      <p style={{ fontSize: '0.75rem', color: '#888', margin: '0 0 1.25rem' }}>{meta.hint}</p>

      {notice && <div style={{ padding: '0.6rem 0.9rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', fontSize: '0.78rem', marginBottom: '1rem' }}>{notice}</div>}
      {error && <div style={{ padding: '0.6rem 0.9rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '0.78rem', marginBottom: '1rem' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(380px, 1fr) minmax(320px, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
        {/* Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: '#666', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sujet</label>
            <input
              value={tpl.subject}
              onChange={e => updateField('subject', e.target.value)}
              style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
              <label style={{ fontSize: '0.68rem', fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Corps</label>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {([['rich', 'Éditeur'], ['html', 'HTML']] as const).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setEditorMode(mode)}
                    style={{
                      padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer',
                      border: `1px solid ${editorMode === mode ? ACCENT : '#e0e0e0'}`,
                      background: editorMode === mode ? ACCENT : '#fff',
                      color: editorMode === mode ? '#fff' : '#888',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {editorMode === 'rich' ? (
              <EmailRichEditor
                key={`${activeKey}-${activeLang}-${editorEpoch}`}
                initialHtml={tpl.body}
                onChange={html => updateField('body', html)}
              />
            ) : (
              <textarea
                value={tpl.body}
                onChange={e => updateField('body', e.target.value)}
                rows={18}
                style={{ width: '100%', padding: '0.7rem 0.8rem', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '0.78rem', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', lineHeight: 1.5, outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
              />
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={handleSave} disabled={saving || !dirty}
              style={{ padding: '0.55rem 1.1rem', border: 'none', borderRadius: '8px', background: dirty ? ACCENT : '#e0e0e0', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: dirty ? 'pointer' : 'not-allowed' }}>
              {saving ? 'Sauvegarde…' : dirty ? 'Sauvegarder' : 'Sauvegardé ✓'}
            </button>
            <button onClick={handleTest} disabled={testing}
              style={{ padding: '0.55rem 1.1rem', border: '1px solid #e0e0e0', borderRadius: '8px', background: '#fff', color: '#333', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
              {testing ? 'Envoi…' : '📤 M’envoyer un test'}
            </button>
            <button onClick={handleReset}
              style={{ padding: '0.55rem 1.1rem', border: '1px solid #e0e0e0', borderRadius: '8px', background: '#fff', color: '#888', fontSize: '0.8rem', cursor: 'pointer' }}>
              ↺ Réinitialiser au défaut
            </button>
          </div>

          <div style={{ padding: '0.9rem 1rem', background: '#f8f8f6', border: '1px solid #eee', borderRadius: '10px' }}>
            <p style={{ fontSize: '0.68rem', fontWeight: 600, color: '#666', margin: '0 0 0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Placeholders disponibles</p>
            {EMAIL_PLACEHOLDERS.map(p => (
              <p key={p.name} style={{ fontSize: '0.72rem', color: '#777', margin: '0 0 0.25rem' }}>
                <code style={{ background: '#fff', border: '1px solid #eee', borderRadius: '4px', padding: '0 4px' }}>{p.name}</code> — {p.desc}
              </p>
            ))}
            <p style={{ fontSize: '0.72rem', color: '#999', margin: '0.5rem 0 0' }}>
              Signature et lien de désinscription sont ajoutés automatiquement à l'envoi.
            </p>
          </div>
        </div>

        {/* Preview */}
        <div>
          <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: '#666', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Aperçu (données d'exemple)
          </label>
          <div style={{ border: '1px solid #eee', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ padding: '0.7rem 1rem', borderBottom: '1px solid #eee', background: '#fafafa', fontSize: '0.8rem', color: '#333' }}>
              <strong>Sujet :</strong> {renderEmailPreview(tpl.subject, activeLang)}
            </div>
            <div
              style={{ padding: '1.25rem', background: '#fff', fontSize: '0.85rem', lineHeight: 1.55, color: '#0a0a0a', maxHeight: '480px', overflowY: 'auto' }}
              dangerouslySetInnerHTML={{ __html: renderEmailPreview(tpl.body, activeLang) }}
            />
            <div style={{ padding: '0.7rem 1rem', borderTop: '1px solid #eee', background: '#fafafa', fontSize: '0.72rem', color: '#999' }}>
              Clément Pouget-Osmont · <span style={{ textDecoration: 'underline' }}>Échangeons</span> (→ /booking) · <span style={{ textDecoration: 'underline' }}>Ne plus recevoir ces emails</span> (ajouté automatiquement)
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- CMS (existing content editor) ---------- */

function CMSView() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [content, setContent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [token, setToken] = useState(() => localStorage.getItem('gh_token') || '')
  const [activeSection, setActiveSection] = useState('translations.fr.hero')
  const [sha, setSha] = useState('')

  useEffect(() => {
    fetch('/content.json')
      .then(r => r.json())
      .then(data => { setContent(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const saveToken = (t: string) => {
    setToken(t)
    localStorage.setItem('gh_token', t)
  }

  const handleSave = useCallback(async () => {
    if (!token) { setError('Token GitHub requis'); return }
    setSaving(true); setError(''); setSaved(false)

    try {
      const fileRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' },
      })
      const fileData = await fileRes.json()
      const currentSha = fileData.sha || sha

      const body = JSON.stringify({
        message: 'Update content via admin CMS',
        content: btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2)))),
        sha: currentSha,
      })

      const putRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body,
      })

      if (!putRes.ok) {
        const err = await putRes.json()
        throw new Error(err.message || 'GitHub API error')
      }

      const result = await putRes.json()
      setSha(result.content.sha)
      setSaved(true)
      setTimeout(() => setSaved(false), 4000)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }, [content, token, sha])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateField = useCallback((path: string, field: string, value: any) => {
    setContent((prev: Record<string, unknown>) => {
      const sectionData = getNestedValue(prev, path)
      const updated = { ...sectionData, [field]: value }
      return setNestedValue(prev, path, updated)
    })
  }, [])

  if (loading || !content) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ color: '#666' }}>Chargement...</p>
      </div>
    )
  }

  const sectionData = getNestedValue(content, activeSection)

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <div style={{
        width: '220px', flexShrink: 0, borderRight: '1px solid #eee',
        padding: '1.5rem 1rem', overflowY: 'auto', background: '#fcfcfc',
      }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 600, color: '#666', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            GitHub Token
          </label>
          <input
            type="password"
            value={token}
            onChange={e => saveToken(e.target.value)}
            placeholder="ghp_..."
            style={{
              width: '100%', padding: '0.5rem', fontSize: '0.75rem',
              border: '1px solid #ddd', borderRadius: '8px', outline: 'none',
              background: '#fff', boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {Object.entries(sectionLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '0.5rem 0.75rem', borderRadius: '8px', border: 'none',
                fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.15s',
                background: activeSection === key ? `${ACCENT}15` : 'transparent',
                color: activeSection === key ? ACCENT : '#555',
                fontWeight: activeSection === key ? 600 : 400,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            onClick={handleSave}
            disabled={saving || !token}
            style={{
              width: '100%', padding: '0.7rem', border: 'none', borderRadius: '10px',
              background: saved ? '#059669' : ACCENT, color: '#fff',
              fontSize: '0.8rem', fontWeight: 600, cursor: saving ? 'wait' : 'pointer',
              opacity: !token ? 0.5 : 1, transition: 'all 0.2s',
            }}
          >
            {saving ? 'Push en cours...' : saved ? '✓ Pushé sur GitHub !' : 'Sauvegarder & Deploy'}
          </button>
          {saved && (
            <p style={{ fontSize: '0.7rem', color: '#059669', textAlign: 'center' }}>
              Netlify va redéployer automatiquement
            </p>
          )}
          {error && (
            <p style={{ fontSize: '0.7rem', color: '#dc2626', textAlign: 'center' }}>{error}</p>
          )}
        </div>
      </div>

      <div style={{ flex: 1, padding: '2rem 3rem', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem', color: '#111' }}>
          {sectionLabels[activeSection]}
        </h2>

        {sectionData && typeof sectionData === 'object' && !Array.isArray(sectionData) ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '640px' }}>
            {Object.entries(sectionData).map(([field, value]) => {
              if (Array.isArray(value)) {
                return (
                  <div key={field}>
                    <label style={labelStyle}>{field}</label>
                    {(value as Record<string, string>[]).map((item, i) => (
                      <div key={i} style={{ border: '1px solid #e5e5e5', borderRadius: '12px', padding: '1rem', marginBottom: '0.75rem', background: '#fafafa' }}>
                        <p style={{ fontSize: '0.7rem', fontWeight: 600, color: ACCENT, marginBottom: '0.5rem' }}>#{i + 1}</p>
                        {Object.entries(item).map(([subKey, subVal]) => (
                          <div key={subKey} style={{ marginBottom: '0.75rem' }}>
                            <label style={{ ...labelStyle, fontSize: '0.7rem' }}>{subKey}</label>
                            {String(subVal).length > 80 ? (
                              <textarea
                                value={String(subVal)}
                                onChange={e => {
                                  const newArr = [...value as Record<string, string>[]]
                                  newArr[i] = { ...newArr[i], [subKey]: e.target.value }
                                  updateField(activeSection, field, newArr)
                                }}
                                rows={3}
                                style={textareaStyle}
                              />
                            ) : (
                              <input
                                type="text"
                                value={String(subVal)}
                                onChange={e => {
                                  const newArr = [...value as Record<string, string>[]]
                                  newArr[i] = { ...newArr[i], [subKey]: e.target.value }
                                  updateField(activeSection, field, newArr)
                                }}
                                style={inputFieldStyle}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )
              }

              if (typeof value === 'string') {
                const isLong = value.length > 80
                return (
                  <div key={field}>
                    <label style={labelStyle}>{field}</label>
                    {isLong ? (
                      <textarea
                        value={value}
                        onChange={e => updateField(activeSection, field, e.target.value)}
                        rows={Math.min(6, Math.ceil(value.length / 60))}
                        style={textareaStyle}
                      />
                    ) : (
                      <input
                        type="text"
                        value={value}
                        onChange={e => updateField(activeSection, field, e.target.value)}
                        style={inputFieldStyle}
                      />
                    )}
                  </div>
                )
              }

              return null
            })}
          </div>
        ) : Array.isArray(sectionData) ? (
          <div style={{ maxWidth: '640px' }}>
            <label style={labelStyle}>Valeurs (une par ligne)</label>
            <textarea
              value={(sectionData as string[]).join('\n')}
              onChange={e => {
                const parts = activeSection.split('.')
                if (parts.length === 1) {
                  setContent((prev: Record<string, unknown>) => ({
                    ...prev,
                    [activeSection]: e.target.value.split('\n').filter(Boolean),
                  }))
                }
              }}
              rows={Math.max(5, (sectionData as string[]).length + 2)}
              style={textareaStyle}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#555',
  marginBottom: '0.4rem',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.04em',
}

const inputFieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.7rem 0.9rem',
  border: '1px solid #e0e0e0',
  borderRadius: '10px',
  fontSize: '0.875rem',
  outline: 'none',
  background: '#fafafa',
  boxSizing: 'border-box' as const,
  transition: 'border-color 0.2s',
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.7rem 0.9rem',
  border: '1px solid #e0e0e0',
  borderRadius: '10px',
  fontSize: '0.875rem',
  outline: 'none',
  background: '#fafafa',
  boxSizing: 'border-box' as const,
  resize: 'vertical' as const,
  fontFamily: "'Inter', sans-serif",
  lineHeight: 1.6,
}

/* ---------- Quotes ---------- */

type AdminQuote = {
  id: string
  reference: string
  companySlug: string
  companyName: string
  clientName: string
  clientEmail: string
  clientCcEmails?: string[]
  prospectLogo?: string
  date: string
  dueDate: string
  validUntil?: string
  offerTitle?: string
  context?: { title: string; description: string }
  presentation?: string
  arguments?: { title: string; description: string }[]
  lines: { description: string; detail?: string; quantity: number; unit?: string; unitPrice: number; tva?: number; discount?: number }[]
  globalDiscount?: number
  notes: string
  paymentTerms?: string
  subject?: string
  emailContent: string
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected'
  accentColor: string
  senderName: string
  senderCompany: string
  senderEmail: string
  senderPhone?: string
  senderPhoto?: string
  createdAt: string
  updatedAt?: string
  sentAt?: string
  resentAt?: string
  viewedAt?: string
  lastViewedAt?: string
  viewCount?: number
}

type QuoteLine = {
  description: string
  detail: string
  quantity: number
  unit: string
  unitPrice: number
  tva: number
  discount: number
}

type QuoteArgument = { title: string; description: string }

const QUOTE_STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  draft:    { bg: '#f4f4f5', fg: '#52525b' },
  sent:     { bg: '#dbeafe', fg: '#1e40af' },
  viewed:   { bg: '#fef3c7', fg: '#92400e' },
  accepted: { bg: '#d1fae5', fg: '#065f46' },
  rejected: { bg: '#fee2e2', fg: '#991b1b' },
}

const QUOTE_STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  sent: 'Envoyé',
  viewed: 'Consulté',
  accepted: 'Accepté',
  rejected: 'Refusé',
}

const QUOTE_SECTIONS = [
  { key: 'emetteur', label: 'Emetteur' },
  { key: 'client', label: 'Client / Prospect' },
  { key: 'offre', label: 'Prestataire & Arguments' },
  { key: 'produits', label: 'Produits' },
  { key: 'conditions', label: 'Conditions' },
  { key: 'email', label: 'Email' },
  { key: 'apparence', label: 'Apparence' },
] as const

type QuoteSectionKey = typeof QUOTE_SECTIONS[number]['key']

const QUOTE_ACCENT_PRESETS = [
  { label: 'Clempo (Ink)', value: '#0A0A0B' },
  { label: 'Signal', value: '#00D68F' },
]

// ── Brand Book 2026 — devis preview tokens ──
const Q_INK = '#0A0A0B'
const Q_PAPER = '#EDEBE4'
const Q_PAPER_SOFT = '#F4F4F2'
const Q_GRAPHITE = '#2A2D35'
const Q_STEEL = '#6B6F7A'
const Q_MIST = '#B8BCC4'
const Q_SIGNAL = '#00D68F'
const Q_BORDER = 'rgba(10,10,11,0.08)'
const Q_FT = "'Inter', sans-serif"
const Q_FM = "'JetBrains Mono', ui-monospace, monospace"
const Q_FS = "'Instrument Serif', Georgia, serif"

const UNIT_OPTIONS = ['jours', 'heures', 'mois', 'forfait']

const emptyLine = (): QuoteLine => ({ description: '', detail: '', quantity: 1, unit: 'jours', unitPrice: 0, tva: 20, discount: 0 })
const DEFAULT_ARGS: QuoteArgument[] = [
  { title: "L'experience Directeur Marketing", description: "J'ai dirigé les équipes marketing de plusieurs entreprises innovantes comme Cherry Biotech (biotech), DocCity (immobilier santé), HeyTeam (HR tech), Sofia Développement (Healthtech). J'aime autant construire une stratégie de marque et définir un positionnement que passer à l'opérationnel : concevoir des campagnes, produire du contenu, piloter la croissance." },
  { title: 'Expertise Sante', description: "Plus de 12 ans d'experience dans le marketing santé dont 5 ans chez Doctolib. Je connais les contraintes réglementaires, les cycles de vente longs et les spécificités du marche de la santé en France et en Europe." },
  { title: 'Une collaboration facile', description: "Les avantages du freelance à temps partager pour avoir un profil senior dans l'équipe sans les contraintes d'une embauche classique" },
]
function makeInitialForm() {
  const today = new Date()
  const due = new Date(today); due.setDate(due.getDate() + 30)
  const valid = new Date(today); valid.setDate(valid.getDate() + 30)
  const num = String(Math.floor(Math.random() * 99) + 1).padStart(2, '0')
  return {
    senderName: 'Clement Pouget-Osmont',
    senderCompany: 'Clempo',
    senderEmail: 'clement.pougetosmont@gmail.com',
    senderPhone: '',
    clientName: '',
    clientCompany: '',
    clientEmail: '',
    clientCcEmails: '',
    prospectLogo: '',
    reference: `DEV/${today.getFullYear()}/${num}`,
    subject: '',
    date: today.toISOString().split('T')[0],
    dueDate: due.toISOString().split('T')[0],
    validUntil: valid.toISOString().split('T')[0],
    offerTitle: '',
    contextTitle: '',
    contextDescription: '',
    presentation: '',
    emailContent: '',
    notes: '',
    paymentTerms: '',
    accentColor: '#0A0A0B',
    globalDiscount: 0,
  }
}

function QuotesView({ password }: { password: string }) {
  const [subView, setSubView] = useState<'history' | 'new'>('history')
  const [quotes, setQuotes] = useState<AdminQuote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{ msg: string; color: string } | null>(null)
  const [activeSection, setActiveSection] = useState<QuoteSectionKey>('emetteur')

  const [form, setForm] = useState(makeInitialForm)
  const [lines, setLines] = useState<QuoteLine[]>([emptyLine()])
  const [args, setArgs] = useState<QuoteArgument[]>(DEFAULT_ARGS.map(a => ({ ...a })))
  const [sending, setSending] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingRef, setEditingRef] = useState<string>('')
  const [editingStatus, setEditingStatus] = useState<AdminQuote['status'] | null>(null)

  const resetForm = useCallback(() => {
    setForm(makeInitialForm())
    setLines([emptyLine()])
    setArgs(DEFAULT_ARGS.map(a => ({ ...a })))
    setEditingId(null)
    setEditingRef('')
    setEditingStatus(null)
  }, [])

  const startEdit = useCallback((q: AdminQuote) => {
    setForm({
      senderName: q.senderName,
      senderCompany: q.senderCompany,
      senderEmail: q.senderEmail,
      senderPhone: q.senderPhone || '',
      clientName: q.clientName,
      clientCompany: q.companyName,
      clientEmail: q.clientEmail,
      clientCcEmails: (q.clientCcEmails || []).join(', '),
      prospectLogo: q.prospectLogo || '',
      reference: q.reference,
      subject: q.subject || '',
      date: q.date,
      dueDate: q.dueDate,
      validUntil: q.validUntil || '',
      offerTitle: q.offerTitle || '',
      contextTitle: q.context?.title || '',
      contextDescription: q.context?.description || '',
      presentation: q.presentation || '',
      emailContent: q.emailContent || '',
      notes: q.notes || '',
      paymentTerms: q.paymentTerms || '',
      accentColor: q.accentColor || '#0A0A0B',
      globalDiscount: q.globalDiscount || 0,
    })
    setLines((q.lines && q.lines.length ? q.lines : [emptyLine()]).map(l => ({
      description: l.description || '',
      detail: l.detail || '',
      quantity: l.quantity ?? 1,
      unit: l.unit || 'jours',
      unitPrice: l.unitPrice ?? 0,
      tva: l.tva ?? 20,
      discount: l.discount ?? 0,
    })))
    setArgs(q.arguments && q.arguments.length
      ? q.arguments.map(a => ({ title: a.title || '', description: a.description || '' }))
      : DEFAULT_ARGS.map(a => ({ ...a })),
    )
    setEditingId(q.id)
    setEditingRef(q.reference)
    setEditingStatus(q.status)
    setActiveSection('emetteur')
    setSubView('new')
  }, [])

  const refresh = useCallback(() => {
    setLoading(true)
    fetch('/.netlify/functions/admin-quotes', {
      headers: { Authorization: `Bearer ${password}` },
    })
      .then(r => r.ok ? r.json() : r.text().then(t => Promise.reject(t)))
      .then(d => { setQuotes(d.quotes || []); setError('') })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [password])

  useEffect(() => { refresh() }, [refresh])

  const showToast = (msg: string, color = ACCENT) => {
    setToast({ msg, color })
    setTimeout(() => setToast(null), 5000)
  }

  const updateStatus = async (id: string, status: string) => {
    await fetch('/.netlify/functions/admin-quotes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${password}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update-status', id, status }),
    })
    refresh()
  }

  const deleteQuote = async (id: string) => {
    if (!confirm('Supprimer ce devis ?')) return
    await fetch('/.netlify/functions/admin-quotes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${password}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    })
    refresh()
  }

  const fmtDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) }
    catch { return d }
  }

  const fmtEur = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)

  // --- Financial computations ---
  const computeLineTotal = (l: QuoteLine) => {
    const base = l.quantity * l.unitPrice
    const afterDiscount = base * (1 - (l.discount || 0) / 100)
    return afterDiscount
  }

  const subtotalHT = lines.reduce((s, l) => s + computeLineTotal(l), 0)
  const afterGlobalDiscount = subtotalHT * (1 - (form.globalDiscount || 0) / 100)
  const totalTVA = lines.reduce((s, l) => {
    const lt = computeLineTotal(l) * (1 - (form.globalDiscount || 0) / 100)
    return s + lt * ((l.tva || 0) / 100)
  }, 0)
  const totalTTC = afterGlobalDiscount + totalTVA

  const fmtAmount = (q: AdminQuote) => {
    const ht = q.lines.reduce((s, l) => {
      const base = l.quantity * l.unitPrice
      const afterDis = base * (1 - (l.discount || 0) / 100)
      return s + afterDis
    }, 0)
    const afterGD = ht * (1 - (q.globalDiscount || 0) / 100)
    const tva = q.lines.reduce((s, l) => {
      const lt = l.quantity * l.unitPrice * (1 - (l.discount || 0) / 100) * (1 - (q.globalDiscount || 0) / 100)
      return s + lt * ((l.tva || 0) / 100)
    }, 0)
    return fmtEur(afterGD + tva)
  }

  // mode:
  //   'send'        -> envoi initial d'un nouveau devis (création + email)
  //   'save-draft'  -> création d'un brouillon, pas d'email (présentation live, envoi différé)
  //   'save'        -> sauvegarde des modifications, pas d'email
  //   'save-resend' -> sauvegarde + envoi/renvoi de l'email
  const handleSubmit = async (mode: 'send' | 'save' | 'save-resend' | 'save-draft') => {
    if (!form.clientEmail) return showToast('Email du client requis', '#dc2626')
    if (!form.clientName) return showToast('Nom du client requis', '#dc2626')
    if (mode !== 'save' && mode !== 'save-draft' && !form.emailContent.trim()) return showToast("Contenu de l'email requis", '#dc2626')
    if (lines.every(l => !l.description)) return showToast('Au moins une ligne requise', '#dc2626')

    const ccList = form.clientCcEmails
      .split(/[,;\n]/).map(s => s.trim()).filter(Boolean)

    const confirmMsg =
      mode === 'send'        ? `Envoyer le devis ${form.reference} a ${form.clientEmail}${ccList.length ? ` (+ ${ccList.length} en copie)` : ''} ?`
      : mode === 'save-draft'? `Enregistrer le devis ${form.reference} en brouillon (sans envoyer d'email) ?`
      : mode === 'save'      ? `Enregistrer les modifications du devis ${editingRef} (sans renvoyer d'email) ?`
      :                        `Envoyer le devis ${editingRef} mis a jour a ${form.clientEmail}${ccList.length ? ` (+ ${ccList.length} en copie)` : ''} ?`
    if (!confirm(confirmMsg)) return

    setSending(true)
    try {
      const payload = {
        ...form,
        clientCcEmails: ccList,
        lines,
        arguments: args.filter(a => a.title.trim()),
        context: form.contextTitle ? { title: form.contextTitle, description: form.contextDescription } : undefined,
      }

      let res: Response
      let result: { error?: string; quoteUrl?: string; ok?: boolean }

      if (mode === 'save') {
        // Patch en place via admin-quotes — pas d'email
        res = await fetch('/.netlify/functions/admin-quotes', {
          method: 'POST',
          headers: { Authorization: `Bearer ${password}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update',
            id: editingId,
            patch: {
              reference: payload.reference,
              companyName: payload.clientCompany || payload.clientName,
              clientName: payload.clientName,
              clientEmail: payload.clientEmail,
              clientCcEmails: ccList.length ? ccList : undefined,
              prospectLogo: payload.prospectLogo || undefined,
              date: payload.date,
              dueDate: payload.dueDate,
              validUntil: payload.validUntil || payload.dueDate,
              offerTitle: payload.offerTitle || undefined,
              context: payload.context,
              presentation: payload.presentation || undefined,
              arguments: payload.arguments,
              lines: payload.lines,
              globalDiscount: payload.globalDiscount || 0,
              notes: payload.notes,
              paymentTerms: payload.paymentTerms || undefined,
              subject: payload.subject || undefined,
              emailContent: payload.emailContent,
              accentColor: payload.accentColor || '#0A0A0B',
              senderName: payload.senderName,
              senderCompany: payload.senderCompany,
              senderEmail: payload.senderEmail,
              senderPhone: payload.senderPhone || undefined,
            },
          }),
        })
        result = await res.json()
      } else {
        // 'send' (création + email), 'save-draft' (création brouillon, pas d'email),
        // ou 'save-resend' (update + email)
        res = await fetch('/.netlify/functions/send-quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: password,
            data: {
              ...payload,
              existingId: mode === 'save-resend' ? editingId : undefined,
              draft: mode === 'save-draft',
            },
          }),
        })
        result = await res.json()
      }

      if (!res.ok) throw new Error(result.error || `HTTP ${res.status}`)

      const successMsg =
        mode === 'send'        ? `Devis envoye ! URL : ${result.quoteUrl}`
        : mode === 'save-draft'? `Brouillon enregistre. URL de presentation : ${result.quoteUrl}`
        : mode === 'save'      ? `Devis ${editingRef} mis a jour (sans renvoi d'email).`
        :                        `Devis ${editingRef} mis a jour et envoye. URL : ${result.quoteUrl}`
      showToast(successMsg, '#16a34a')
      refresh()
      resetForm()
      setSubView('history')
    } catch (e) {
      showToast(`Erreur : ${(e as Error).message}`, '#dc2626')
    } finally {
      setSending(false)
    }
  }

  // --- Styles ---
  const qInput: React.CSSProperties = {
    width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #e0e0e0',
    borderRadius: 8, fontSize: '0.85rem', outline: 'none', background: '#fafafa',
    boxSizing: 'border-box', fontFamily: "'Inter', sans-serif",
  }
  const qLabel: React.CSSProperties = {
    display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#555',
    marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.03em',
  }
  const qSectionHead: React.CSSProperties = {
    fontSize: '0.75rem', fontWeight: 600, color: '#999', textTransform: 'uppercase',
    letterSpacing: '0.05em', marginBottom: '0.75rem',
  }

  const updateLine = (i: number, patch: Partial<QuoteLine>) => {
    setLines(ls => ls.map((l, j) => j === i ? { ...l, ...patch } : l))
  }
  const updateArg = (i: number, patch: Partial<QuoteArgument>) => {
    setArgs(as => as.map((a, j) => j === i ? { ...a, ...patch } : a))
  }

  // --- Section renderers ---
  const renderEmetteur = () => (
    <>
      <h3 style={qSectionHead}>Emetteur</h3>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <div style={{ flex: 1 }}>
          <label style={qLabel}>Nom</label>
          <input style={qInput} value={form.senderName} onChange={e => setForm(f => ({ ...f, senderName: e.target.value }))} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={qLabel}>Entreprise</label>
          <input style={qInput} value={form.senderCompany} onChange={e => setForm(f => ({ ...f, senderCompany: e.target.value }))} />
        </div>
      </div>
      <div style={{ marginBottom: '0.5rem' }}>
        <label style={qLabel}>Email</label>
        <input style={qInput} type="email" value={form.senderEmail} onChange={e => setForm(f => ({ ...f, senderEmail: e.target.value }))} />
      </div>
      <div style={{ marginBottom: '0.5rem' }}>
        <label style={qLabel}>Telephone (optionnel)</label>
        <input style={qInput} type="tel" value={form.senderPhone} onChange={e => setForm(f => ({ ...f, senderPhone: e.target.value }))} placeholder="+33 6 12 34 56 78" />
      </div>
    </>
  )

  const renderClient = () => (
    <>
      <h3 style={qSectionHead}>Client / Prospect</h3>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <div style={{ flex: 1 }}>
          <label style={qLabel}>Nom du contact</label>
          <input style={qInput} value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} placeholder="Jean Dupont" />
        </div>
        <div style={{ flex: 1 }}>
          <label style={qLabel}>Entreprise</label>
          <input style={qInput} value={form.clientCompany} onChange={e => setForm(f => ({ ...f, clientCompany: e.target.value }))} placeholder="Acme SAS" />
        </div>
      </div>
      <div style={{ marginBottom: '0.5rem' }}>
        <label style={qLabel}>Email</label>
        <input style={qInput} type="email" value={form.clientEmail} onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))} placeholder="jean@acme.fr" />
      </div>
      <div style={{ marginBottom: '0.5rem' }}>
        <label style={qLabel}>En copie (CC) — optionnel</label>
        <input style={qInput} type="text" value={form.clientCcEmails}
          onChange={e => setForm(f => ({ ...f, clientCcEmails: e.target.value }))}
          placeholder="cfo@acme.fr, assistante@acme.fr" />
        <p style={{ fontSize: '0.7rem', color: '#999', marginTop: '0.25rem' }}>
          Plusieurs emails séparés par des virgules. Ils recevront la même copie de l'email.
        </p>
      </div>
      <div style={{ marginBottom: '0.5rem' }}>
        <label style={qLabel}>Logo prospect (optionnel)</label>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input style={{ ...qInput, flex: 1 }} value={form.prospectLogo} onChange={e => setForm(f => ({ ...f, prospectLogo: e.target.value }))} placeholder="URL ou uploader un fichier" />
          <label style={{
            padding: '0.5rem 0.75rem', borderRadius: 8, border: `1px solid ${ACCENT}`,
            color: ACCENT, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            Uploader
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
              const file = e.target.files?.[0]
              if (!file) return
              if (file.size > 500_000) { alert('Image trop lourde (max 500 Ko)'); return }
              const reader = new FileReader()
              reader.onload = () => setForm(f => ({ ...f, prospectLogo: reader.result as string }))
              reader.readAsDataURL(file)
              e.target.value = ''
            }} />
          </label>
          {form.prospectLogo && (
            <button onClick={() => setForm(f => ({ ...f, prospectLogo: '' }))} style={{
              background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 18, padding: 0, lineHeight: 1,
            }} title="Supprimer le logo">×</button>
          )}
        </div>
        {form.prospectLogo && (
          <div style={{ marginTop: '0.4rem', padding: '0.5rem', background: '#f9f9f9', borderRadius: 8, border: '1px solid #eee', display: 'inline-block' }}>
            <img src={form.prospectLogo} alt="Logo preview" style={{ maxHeight: 40, maxWidth: 120, objectFit: 'contain', display: 'block' }} />
          </div>
        )}
      </div>
      <div style={{ marginBottom: '0.5rem' }}>
        <label style={qLabel}>Titre de l'offre</label>
        <input style={qInput} value={form.offerTitle} onChange={e => setForm(f => ({ ...f, offerTitle: e.target.value }))} placeholder="Part-Time CMO" />
      </div>
      <div style={{ marginBottom: '0.5rem' }}>
        <label style={qLabel}>Contexte — titre</label>
        <input style={qInput} value={form.contextTitle} onChange={e => setForm(f => ({ ...f, contextTitle: e.target.value }))} placeholder="Vos enjeux de croissance" />
      </div>
      <div style={{ marginBottom: '0.5rem' }}>
        <label style={qLabel}>Contexte — description</label>
        <textarea style={{ ...qInput, minHeight: 70, resize: 'vertical' as const, lineHeight: 1.6 }} value={form.contextDescription} onChange={e => setForm(f => ({ ...f, contextDescription: e.target.value }))} placeholder="Decrivez le contexte du prospect..." />
      </div>
    </>
  )

  const renderOffre = () => (
    <>
      <h3 style={qSectionHead}>Prestataire & Arguments</h3>
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={qLabel}>Presentation du prestataire</label>
        <textarea style={{ ...qInput, minHeight: 70, resize: 'vertical' as const, lineHeight: 1.6 }} value={form.presentation} onChange={e => setForm(f => ({ ...f, presentation: e.target.value }))} placeholder="Decrivez votre expertise..." />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h4 style={{ ...qSectionHead, fontSize: '0.7rem', marginBottom: 0 }}>Arguments (3 blocs)</h4>
        <button onClick={() => setArgs(DEFAULT_ARGS.map(a => ({ ...a })))} style={{ background: 'none', border: '1px solid #ddd', borderRadius: 6, padding: '0.25rem 0.6rem', fontSize: '0.65rem', color: '#888', cursor: 'pointer' }}>
          Reinitialiser
        </button>
      </div>
      {args.map((arg, i) => (
        <div key={i} style={{ background: '#f9f9f9', border: '1px solid #eee', borderRadius: 8, padding: '0.6rem', marginBottom: '0.5rem' }}>
          <div style={{ marginBottom: '0.35rem' }}>
            <label style={qLabel}>Argument {i + 1} — titre</label>
            <input style={qInput} value={arg.title} onChange={e => updateArg(i, { title: e.target.value })} placeholder={`Argument ${i + 1}`} />
          </div>
          <div>
            <label style={qLabel}>Description</label>
            <textarea style={{ ...qInput, minHeight: 44, resize: 'vertical' as const, lineHeight: 1.5 }} value={arg.description} onChange={e => updateArg(i, { description: e.target.value })} />
          </div>
        </div>
      ))}
    </>
  )

  const renderProduits = () => (
    <>
      <h3 style={qSectionHead}>Produits</h3>
      {lines.map((line, i) => (
        <div key={i} style={{ background: '#f9f9f9', border: '1px solid #eee', borderRadius: 8, padding: '0.75rem', marginBottom: '0.5rem', position: 'relative' }}>
          {lines.length > 1 && (
            <button
              onClick={() => setLines(ls => ls.filter((_, j) => j !== i))}
              style={{ position: 'absolute', top: 6, right: 8, background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 16 }}
            >
              x
            </button>
          )}
          <div style={{ marginBottom: '0.4rem' }}>
            <label style={qLabel}>Description</label>
            <input style={qInput} value={line.description} placeholder="Prestation de conseil..."
              onChange={e => updateLine(i, { description: e.target.value })} />
          </div>
          <div style={{ marginBottom: '0.4rem' }}>
            <label style={qLabel}>Detail (optionnel)</label>
            <textarea style={{ ...qInput, minHeight: 40, resize: 'vertical' as const, lineHeight: 1.5 }} value={line.detail}
              onChange={e => updateLine(i, { detail: e.target.value })} placeholder="Details supplementaires..." />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <div style={{ flex: 1 }}>
              <label style={qLabel}>Quantite</label>
              <input style={qInput} type="number" min={0} step={0.5} value={line.quantity}
                onChange={e => updateLine(i, { quantity: parseFloat(e.target.value) || 0 })} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={qLabel}>Unite</label>
              <select style={qInput} value={line.unit} onChange={e => updateLine(i, { unit: e.target.value })}>
                {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <div style={{ flex: 1 }}>
              <label style={qLabel}>Prix unit. HT</label>
              <input style={qInput} type="number" min={0} step={0.01} value={line.unitPrice}
                onChange={e => updateLine(i, { unitPrice: parseFloat(e.target.value) || 0 })} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={qLabel}>TVA %</label>
              <input style={qInput} type="number" min={0} max={100} step={0.1} value={line.tva}
                onChange={e => updateLine(i, { tva: parseFloat(e.target.value) || 0 })} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={qLabel}>Remise %</label>
              <input style={qInput} type="number" min={0} max={100} step={1} value={line.discount}
                onChange={e => updateLine(i, { discount: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.78rem', color: '#666', fontWeight: 600 }}>
            Total HT : {fmtEur(computeLineTotal(line))}
          </div>
        </div>
      ))}
      <button
        onClick={() => setLines(ls => [...ls, emptyLine()])}
        style={{ padding: '0.4rem 0.8rem', borderRadius: 6, background: '#f0f0f0', border: '1px solid #ddd', fontSize: '0.78rem', cursor: 'pointer', marginBottom: '1rem' }}
      >
        + Ajouter un produit
      </button>
      <div style={{ marginBottom: '0.5rem' }}>
        <label style={qLabel}>Remise globale %</label>
        <input style={{ ...qInput, maxWidth: 120 }} type="number" min={0} max={100} step={1} value={form.globalDiscount}
          onChange={e => setForm(f => ({ ...f, globalDiscount: parseFloat(e.target.value) || 0 }))} />
      </div>
      <div style={{ background: '#f8f8f6', borderRadius: 8, padding: '0.75rem', marginTop: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
          <span style={{ color: '#999' }}>Sous-total HT</span>
          <span style={{ fontWeight: 600 }}>{fmtEur(subtotalHT)}</span>
        </div>
        {(form.globalDiscount || 0) > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
            <span style={{ color: '#dc2626' }}>Remise globale ({form.globalDiscount}%)</span>
            <span style={{ color: '#dc2626', fontWeight: 600 }}>-{fmtEur(subtotalHT - afterGlobalDiscount)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
          <span style={{ color: '#999' }}>Total HT</span>
          <span style={{ fontWeight: 600 }}>{fmtEur(afterGlobalDiscount)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
          <span style={{ color: '#999' }}>TVA</span>
          <span>{fmtEur(totalTVA)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, paddingTop: '0.4rem', borderTop: '1px solid #e0e0e0' }}>
          <span>Total TTC</span>
          <span style={{ color: form.accentColor }}>{fmtEur(totalTTC)}</span>
        </div>
      </div>
    </>
  )

  const renderConditions = () => (
    <>
      <h3 style={qSectionHead}>Conditions</h3>
      <div style={{ marginBottom: '0.5rem' }}>
        <label style={qLabel}>Conditions de paiement</label>
        <textarea style={{ ...qInput, minHeight: 60, resize: 'vertical' as const, lineHeight: 1.6 }} value={form.paymentTerms} onChange={e => setForm(f => ({ ...f, paymentTerms: e.target.value }))} placeholder="30 jours fin de mois..." />
      </div>
      <div style={{ marginBottom: '0.5rem' }}>
        <label style={qLabel}>Notes</label>
        <textarea style={{ ...qInput, minHeight: 60, resize: 'vertical' as const, lineHeight: 1.6 }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes additionnelles..." />
      </div>
      <div style={{ marginBottom: '0.5rem' }}>
        <label style={qLabel}>Date d'expiration</label>
        <input style={{ ...qInput, maxWidth: 200 }} type="date" value={form.validUntil} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))} />
      </div>
    </>
  )

  const renderEmail = () => (
    <>
      <h3 style={qSectionHead}>Email</h3>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <div style={{ flex: 1 }}>
          <label style={qLabel}>Reference</label>
          <input style={qInput} value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={qLabel}>Date</label>
          <input style={qInput} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <div style={{ flex: 1 }}>
          <label style={qLabel}>Echeance</label>
          <input style={qInput} type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
        </div>
        <div style={{ flex: 1 }} />
      </div>
      <div style={{ marginBottom: '0.5rem' }}>
        <label style={qLabel}>Objet de l'email</label>
        <input style={qInput} value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder={`${form.reference} — ${form.senderCompany}`} />
      </div>
      <div style={{ marginBottom: '0.5rem' }}>
        <label style={qLabel}>Contenu de l'email</label>
        <textarea
          rows={6}
          style={{ ...qInput, minHeight: 120, resize: 'vertical' as const, lineHeight: 1.6 }}
          value={form.emailContent}
          onChange={e => setForm(f => ({ ...f, emailContent: e.target.value }))}
          placeholder={`Bonjour ${form.clientName || 'Jean'},\n\nSuite a notre echange, je vous fais parvenir le devis pour la prestation convenue.\n\nN'hesitez pas a me contacter si vous avez des questions.\n\nBien cordialement,\nClement`}
        />
        <p style={{ fontSize: '0.7rem', color: '#999', marginTop: '0.25rem' }}>
          Ce texte apparait dans l'email. Le devis complet est sur la page hebergee.
        </p>
      </div>
    </>
  )

  const renderApparence = () => (
    <>
      <h3 style={qSectionHead}>Apparence</h3>
      <div style={{ marginBottom: '0.5rem' }}>
        <label style={qLabel}>Couleur d'accent</label>
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {QUOTE_ACCENT_PRESETS.map(c => (
            <button key={c.value} onClick={() => setForm(f => ({ ...f, accentColor: c.value }))}
              style={{
                padding: '0.4rem 0.85rem', borderRadius: 4, fontSize: '0.72rem', fontWeight: 500, cursor: 'pointer',
                fontFamily: Q_FT,
                background: c.value, color: c.value === Q_SIGNAL ? Q_INK : Q_PAPER,
                border: form.accentColor === c.value ? `2px solid ${Q_SIGNAL}` : '2px solid transparent',
              }}>
              {c.label}
            </button>
          ))}
        </div>
        <p style={{ fontSize: '0.7rem', color: '#999', marginTop: '0.4rem', lineHeight: 1.5 }}>
          Le devis public utilise <strong>Ink</strong> par défaut (charte Brand Book 2026). La couleur sert d'accent dans certaines variantes.
        </p>
      </div>
    </>
  )

  const sectionRenderers: Record<QuoteSectionKey, () => React.ReactNode> = {
    emetteur: renderEmetteur,
    client: renderClient,
    offre: renderOffre,
    produits: renderProduits,
    conditions: renderConditions,
    email: renderEmail,
    apparence: renderApparence,
  }

  return (
    <div style={{ padding: '2rem' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, background: toast.color, color: '#fff',
          padding: '12px 20px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 500,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)', zIndex: 100, maxWidth: 450,
          wordBreak: 'break-all',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Sub-nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button
            onClick={() => setSubView('history')}
            style={{
              padding: '0.5rem 1rem', borderRadius: 8, border: 'none',
              background: subView === 'history' ? ACCENT : '#f4f4f5',
              color: subView === 'history' ? '#fff' : '#555',
              fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Historique ({quotes.length})
          </button>
          <button
            onClick={() => { resetForm(); setSubView('new'); setActiveSection('emetteur') }}
            style={{
              padding: '0.5rem 1rem', borderRadius: 8, border: 'none',
              background: subView === 'new' && !editingId ? ACCENT : '#f4f4f5',
              color: subView === 'new' && !editingId ? '#fff' : '#555',
              fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            + Nouveau devis
          </button>
          {editingId && subView === 'new' && (
            <span style={{
              padding: '0.5rem 0.85rem', borderRadius: 8,
              background: '#fef3c7', color: '#92400e',
              fontSize: '0.78rem', fontWeight: 600,
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            }}>
              ✎ Modification de {editingRef}
            </span>
          )}
        </div>
        {subView === 'history' && (
          <button onClick={refresh} style={{
            padding: '0.4rem 0.8rem', borderRadius: 8, background: '#f4f4f5',
            border: '1px solid #e0e0e0', fontSize: '0.75rem', cursor: 'pointer',
          }}>
            Actualiser
          </button>
        )}
      </div>

      {/* ===================== NEW QUOTE FORM ===================== */}
      {subView === 'new' && (
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
          {/* Left sidebar: section navigation */}
          <div style={{ flex: '0 0 140px', position: 'sticky', top: '1rem', alignSelf: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              {QUOTE_SECTIONS.map((s, idx) => (
                <button
                  key={s.key}
                  onClick={() => setActiveSection(s.key)}
                  style={{
                    padding: '0.45rem 0.65rem', borderRadius: 6, border: 'none', textAlign: 'left',
                    background: activeSection === s.key ? form.accentColor + '12' : 'transparent',
                    color: activeSection === s.key ? form.accentColor : '#888',
                    fontSize: '0.75rem', fontWeight: activeSection === s.key ? 700 : 500,
                    cursor: 'pointer', transition: 'all 0.15s',
                    borderLeft: activeSection === s.key ? `3px solid ${form.accentColor}` : '3px solid transparent',
                  }}
                >
                  <span style={{ color: '#bbb', fontSize: '0.65rem', marginRight: '0.4rem' }}>{idx + 1}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Center: form content */}
          <div style={{ flex: '0 0 420px', maxWidth: 420 }}>
            {sectionRenderers[activeSection]()}

            {/* Navigation + Actions at bottom */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
              {activeSection !== 'emetteur' && (
                <button
                  onClick={() => {
                    const idx = QUOTE_SECTIONS.findIndex(s => s.key === activeSection)
                    if (idx > 0) setActiveSection(QUOTE_SECTIONS[idx - 1].key)
                  }}
                  style={{
                    padding: '0.55rem 1rem', borderRadius: 8, border: '1px solid #e0e0e0',
                    background: '#fff', color: '#555', fontSize: '0.8rem', cursor: 'pointer',
                  }}
                >
                  Precedent
                </button>
              )}
              {activeSection !== 'apparence' ? (
                <button
                  onClick={() => {
                    const idx = QUOTE_SECTIONS.findIndex(s => s.key === activeSection)
                    if (idx < QUOTE_SECTIONS.length - 1) setActiveSection(QUOTE_SECTIONS[idx + 1].key)
                  }}
                  style={{
                    padding: '0.55rem 1rem', borderRadius: 8, border: 'none',
                    background: form.accentColor, color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Suivant
                </button>
              ) : editingId ? (
                <>
                  <button
                    onClick={() => handleSubmit('save')}
                    disabled={sending}
                    style={{
                      padding: '0.75rem 1rem', borderRadius: 10, border: '1px solid #16a34a',
                      background: '#fff', color: '#16a34a', fontSize: '0.82rem', fontWeight: 600,
                      cursor: sending ? 'wait' : 'pointer', opacity: sending ? 0.6 : 1,
                    }}
                  >
                    {sending ? '...' : 'Enregistrer'}
                  </button>
                  <button
                    onClick={() => handleSubmit('save-resend')}
                    disabled={sending}
                    style={{
                      flex: 1, padding: '0.75rem', borderRadius: 10, border: 'none',
                      background: '#16a34a', color: '#fff', fontSize: '0.85rem', fontWeight: 600,
                      cursor: sending ? 'wait' : 'pointer', opacity: sending ? 0.6 : 1,
                    }}
                  >
                    {sending
                      ? 'Envoi en cours...'
                      : editingStatus === 'draft' ? 'Envoyer le devis' : 'Enregistrer + renvoyer l\'email'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleSubmit('save-draft')}
                    disabled={sending}
                    style={{
                      padding: '0.75rem 1rem', borderRadius: 10, border: '1px solid #16a34a',
                      background: '#fff', color: '#16a34a', fontSize: '0.82rem', fontWeight: 600,
                      cursor: sending ? 'wait' : 'pointer', opacity: sending ? 0.6 : 1,
                    }}
                  >
                    {sending ? '...' : 'Enregistrer sans envoyer'}
                  </button>
                  <button
                    onClick={() => handleSubmit('send')}
                    disabled={sending}
                    style={{
                      flex: 1, padding: '0.75rem', borderRadius: 10, border: 'none',
                      background: '#16a34a', color: '#fff', fontSize: '0.85rem', fontWeight: 600,
                      cursor: sending ? 'wait' : 'pointer', opacity: sending ? 0.6 : 1,
                    }}
                  >
                    {sending ? 'Envoi en cours...' : 'Envoyer le devis'}
                  </button>
                </>
              )}
              <button
                onClick={() => { resetForm(); setSubView('history') }}
                style={{
                  padding: '0.55rem 1rem', borderRadius: 8, border: '1px solid #e0e0e0',
                  background: '#fff', color: '#555', fontSize: '0.8rem', cursor: 'pointer', marginLeft: 'auto',
                }}
              >
                Annuler
              </button>
            </div>
          </div>

          {/* Right: live preview — Brand Book 2026 */}
          <div style={{ flex: 1, position: 'sticky', top: '1rem', alignSelf: 'flex-start', minWidth: 280 }}>
            <p style={{ fontFamily: Q_FM, fontSize: '0.7rem', fontWeight: 500, color: Q_SIGNAL, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
              // Aperçu du devis
            </p>
            <div style={{
              background: Q_PAPER, borderRadius: 4, border: `1px solid ${Q_BORDER}`,
              overflow: 'hidden', fontFamily: Q_FT, color: Q_INK,
            }}>
              {/* Hero band — Paper soft + dot matrix */}
              <div style={{
                background: Q_PAPER_SOFT, padding: '1.25rem 1.25rem 1.1rem',
                position: 'relative', overflow: 'hidden',
                borderBottom: `1px solid ${Q_BORDER}`,
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: `radial-gradient(circle, rgba(10,10,11,0.06) 1px, transparent 1px)`,
                  backgroundSize: '18px 18px',
                }} />
                <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.6rem' }}>
                  <span style={{ fontFamily: Q_FM, fontSize: '0.65rem', color: Q_SIGNAL, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    // Devis {form.reference}
                  </span>
                  {form.validUntil && (
                    <span style={{ fontFamily: Q_FM, fontSize: '0.62rem', color: Q_STEEL, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Valable {new Date(form.validUntil).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </span>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <span style={{ fontFamily: Q_FM, fontSize: '0.62rem', color: Q_SIGNAL, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    // Pour
                  </span>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: Q_INK, letterSpacing: '-0.02em', marginTop: '0.1rem' }}>
                    {form.clientCompany || form.clientName || '—'}
                  </div>
                  {form.offerTitle && (
                    <div style={{ marginTop: '0.5rem', color: Q_STEEL, fontSize: '0.82rem', lineHeight: 1.4 }}>
                      <span style={{ fontFamily: Q_FS, fontStyle: 'italic', color: Q_INK }}>{form.offerTitle.split(' ')[0]}</span>
                      {form.offerTitle.includes(' ') && ' ' + form.offerTitle.split(' ').slice(1).join(' ')}
                    </div>
                  )}
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: '1.25rem' }}>
                {/* Lines preview table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead>
                    <tr>
                      {['Description', 'Qté', 'Unité', 'P.U.', 'Total'].map((h, i) => (
                        <th key={i} style={{
                          padding: '0.55rem 0.4rem', color: Q_STEEL,
                          fontFamily: Q_FM, fontWeight: 500, fontSize: '0.62rem',
                          textTransform: 'uppercase', letterSpacing: '0.08em',
                          textAlign: i === 0 ? 'left' : 'right',
                          borderBottom: `1px solid ${Q_BORDER}`,
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l, i) => (
                      <tr key={i} style={{ borderBottom: i < lines.length - 1 ? `1px solid ${Q_BORDER}` : 'none' }}>
                        <td style={{ padding: '0.6rem 0.4rem', color: Q_INK, fontWeight: 600 }}>{l.description || '\u2014'}</td>
                        <td style={{ padding: '0.6rem 0.4rem', fontFamily: Q_FM, color: Q_INK, textAlign: 'right' }}>{l.quantity}</td>
                        <td style={{ padding: '0.6rem 0.4rem', color: Q_STEEL, textAlign: 'right', fontSize: '0.72rem' }}>{l.unit}</td>
                        <td style={{ padding: '0.6rem 0.4rem', fontFamily: Q_FM, color: Q_INK, textAlign: 'right' }}>{fmtEur(l.unitPrice)}</td>
                        <td style={{ padding: '0.6rem 0.4rem', fontFamily: Q_FM, color: Q_INK, textAlign: 'right', fontWeight: 600 }}>{fmtEur(computeLineTotal(l))}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} style={{ padding: '0.5rem 0.4rem', textAlign: 'right', color: Q_STEEL, fontSize: '0.74rem' }}>Sous-total HT</td>
                      <td style={{ padding: '0.5rem 0.4rem', textAlign: 'right', fontFamily: Q_FM, color: Q_INK, fontWeight: 600 }}>{fmtEur(afterGlobalDiscount)}</td>
                    </tr>
                    <tr>
                      <td colSpan={4} style={{ padding: '0.5rem 0.4rem', textAlign: 'right', color: Q_STEEL, fontSize: '0.74rem' }}>TVA</td>
                      <td style={{ padding: '0.5rem 0.4rem', textAlign: 'right', fontFamily: Q_FM, color: Q_INK }}>{fmtEur(totalTVA)}</td>
                    </tr>
                    <tr style={{ borderTop: `1px solid ${Q_BORDER}` }}>
                      <td colSpan={4} style={{ padding: '0.65rem 0.4rem', textAlign: 'right', fontFamily: Q_FM, fontSize: '0.65rem', color: Q_STEEL, letterSpacing: '0.1em', textTransform: 'uppercase' }}>// Total TTC</td>
                      <td style={{ padding: '0.65rem 0.4rem', textAlign: 'right', fontWeight: 700, color: Q_INK, fontSize: '1rem', letterSpacing: '-0.02em' }}>{fmtEur(totalTTC)}</td>
                    </tr>
                  </tfoot>
                </table>

                {(form.notes || form.paymentTerms) && (
                  <div style={{
                    marginTop: '1rem', background: Q_PAPER_SOFT, borderRadius: 4,
                    padding: '0.75rem 1rem', borderLeft: `2px solid ${Q_SIGNAL}`,
                    fontSize: '0.78rem', color: Q_GRAPHITE, lineHeight: 1.6,
                  }}>
                    {form.paymentTerms && <div style={{ marginBottom: form.notes ? '0.5rem' : 0 }}>{form.paymentTerms}</div>}
                    {form.notes && <div>{form.notes}</div>}
                  </div>
                )}
              </div>
            </div>

            {/* Email preview — plain text */}
            <p style={{ fontFamily: Q_FM, fontSize: '0.7rem', fontWeight: 500, color: Q_SIGNAL, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '1.25rem', marginBottom: '0.75rem' }}>
              // Aperçu de l'email
            </p>
            <div style={{
              background: '#ffffff', borderRadius: 4, border: `1px solid ${Q_BORDER}`,
              padding: '1.5rem 1.25rem',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              color: '#1a1a1a', fontSize: '0.85rem', lineHeight: 1.6,
            }}>
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {form.emailContent || <span style={{ color: Q_MIST, fontStyle: 'italic' }}>Contenu de l'email...</span>}
              </div>
              <div style={{ margin: '1.25rem 0' }}>
                <span style={{
                  display: 'inline-block',
                  background: '#0A0A0B', color: '#ffffff',
                  padding: '0.6rem 1.2rem', borderRadius: 6, fontWeight: 600, fontSize: '0.8rem',
                }}>
                  Consulter le devis →
                </span>
              </div>
              <div>
                {form.senderName || '...'}<br />
                <span style={{ textDecoration: 'underline' }}>{form.senderEmail || '...'}</span>
                {form.senderPhone && <><br />{form.senderPhone}</>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== HISTORY ===================== */}
      {subView === 'history' && (
        <>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#999' }}>Chargement...</div>
          ) : error ? (
            <div style={{ padding: '3rem', color: '#dc2626' }}>Erreur : {error}</div>
          ) : quotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
              <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Aucun devis pour le moment</p>
              <button onClick={() => setSubView('new')} style={{
                marginTop: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: 8, border: 'none',
                background: ACCENT, color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
              }}>
                Creer votre premier devis
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {quotes.map(q => {
                const sc = QUOTE_STATUS_COLORS[q.status] || QUOTE_STATUS_COLORS.draft
                return (
                  <div key={q.id} style={{
                    display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem',
                    background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, flexWrap: 'wrap',
                  }}>
                    <span style={{
                      background: sc.bg, color: sc.fg, fontSize: '0.7rem', fontWeight: 600,
                      padding: '0.25rem 0.65rem', borderRadius: 6, minWidth: 70, textAlign: 'center',
                    }}>
                      {QUOTE_STATUS_LABELS[q.status] || q.status}
                    </span>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#111' }}>{q.reference}</span>
                        {q.offerTitle && (
                          <span style={{ fontSize: '0.78rem', color: q.accentColor || ACCENT, fontWeight: 600, background: (q.accentColor || ACCENT) + '12', padding: '0.1rem 0.45rem', borderRadius: 4 }}>
                            {q.offerTitle}
                          </span>
                        )}
                        <span style={{ fontSize: '0.82rem', color: '#666' }}>{q.companyName}</span>
                      </div>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: '#999', marginTop: '0.15rem' }}>
                        {q.clientName} &middot; {q.clientEmail}
                        {q.validUntil && (
                          <span style={{ marginLeft: '0.5rem', color: new Date(q.validUntil) < new Date() ? '#dc2626' : '#999' }}>
                            &middot; Expire le {fmtDate(q.validUntil)}
                          </span>
                        )}
                      </span>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: ACCENT, minWidth: 100, textAlign: 'right' }}>
                      {fmtAmount(q)}
                    </span>
                    <span
                      title={
                        q.viewCount
                          ? `${q.viewCount} consultation${q.viewCount > 1 ? 's' : ''}${q.lastViewedAt ? ` — derniere le ${fmtDate(q.lastViewedAt)}` : ''}`
                          : 'Aucune consultation (hors visites admin)'
                      }
                      style={{
                        fontSize: '0.72rem',
                        color: q.viewCount ? '#111' : '#bbb',
                        fontWeight: q.viewCount ? 600 : 400,
                        minWidth: 64,
                        textAlign: 'center',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                        background: q.viewCount ? '#f4f4f5' : 'transparent',
                        padding: '0.2rem 0.55rem', borderRadius: 6,
                        letterSpacing: '0.04em',
                      }}
                    >
                      {q.viewCount ? `${q.viewCount} vue${q.viewCount > 1 ? 's' : ''}` : 'non vu'}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#999', minWidth: 80 }}>
                      {fmtDate(q.createdAt)}
                    </span>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <a href={`/devis/${q.companySlug}/${q.id}`} target="_blank" rel="noopener noreferrer"
                        style={{ padding: '0.3rem 0.6rem', borderRadius: 6, background: '#f4f4f5', border: '1px solid #e0e0e0', fontSize: '0.75rem', textDecoration: 'none', color: '#333' }}>
                        Voir
                      </a>
                      <button onClick={() => startEdit(q)} title="Modifier"
                        style={{ padding: '0.3rem 0.6rem', borderRadius: 6, background: '#fff', border: `1px solid ${ACCENT}`, fontSize: '0.75rem', cursor: 'pointer', color: ACCENT, fontWeight: 600 }}>
                        Modifier
                      </button>
                      <select value={q.status} onChange={e => updateStatus(q.id, e.target.value)}
                        style={{ padding: '0.3rem 0.5rem', borderRadius: 6, border: '1px solid #e0e0e0', fontSize: '0.75rem', background: '#fff', cursor: 'pointer' }}>
                        {Object.entries(QUOTE_STATUS_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                      <button onClick={() => deleteQuote(q.id)} title="Supprimer"
                        style={{ padding: '0.3rem 0.6rem', borderRadius: 6, background: '#fee2e2', border: '1px solid #fca5a5', fontSize: '0.75rem', cursor: 'pointer', color: '#991b1b' }}>
                        x
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
