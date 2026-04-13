import { useState, useEffect, useCallback, useMemo } from 'react'

const REPO = 'clempok/clempo.fr'
const FILE_PATH = 'public/content.json'
const ACCENT = '#1A1A6B'
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
  type: 'booking' | 'brochure'
  ts: string
  firstName?: string
  lastName?: string
  email?: string
  company?: string
  phone?: string
  date?: string
  hour?: number
  minute?: number
  message?: string
  lang?: string
}

type AnalyticsResponse = {
  events: LeadEvent[]
  visits: Record<string, number>
}

const CRM_STATUSES = ['Non qualifié', 'Prospect', 'Lead', 'Opportunité', 'Client', 'Lost'] as const
type CrmStatus = (typeof CRM_STATUSES)[number]

type CrmContact = {
  id: string
  email: string
  firstName: string
  lastName: string
  source: string
  notes: string
  createdAt: string
  updatedAt: string
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

type CrmCompany = {
  id: string
  name: string
  status: CrmStatus
  contacts: CrmContact[]
  tasks: CrmTask[]
  notes: string
  createdAt: string
  updatedAt: string
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
  const [view, setView] = useState<'analytics' | 'crm' | 'cms' | 'seo'>('analytics')

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
        ) : view === 'seo' ? (
          <SeoView password={password} />
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [range, setRange] = useState<7 | 30 | 90>(30)
  const [diag, setDiag] = useState('')

  const refresh = useCallback(() => {
    setLoading(true)
    fetch('/.netlify/functions/admin-data', {
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

    const eventsInRange = data.events.filter(e => e.ts.slice(0, 10) >= startKey)
    const bookings = eventsInRange.filter(e => e.type === 'booking').length
    const brochures = eventsInRange.filter(e => e.type === 'brochure').length
    const conversions = bookings + brochures
    const rate = totalVisits > 0 ? (conversions / totalVisits) * 100 : 0

    return { visitsByDay, totalVisits, bookings, brochures, conversions, rate }
  }, [data, range])

  if (loading) return <div style={{ padding: '3rem' }}>Chargement...</div>
  if (error) return <div style={{ padding: '3rem', color: '#dc2626' }}>Erreur : {error}</div>
  if (!data || !stats) return null

  const maxVisits = Math.max(1, ...stats.visitsByDay.map(v => v.count))

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="Visites" value={stats.totalVisits.toString()} />
        <StatCard label="Rendez-vous" value={stats.bookings.toString()} />
        <StatCard label="Brochures" value={stats.brochures.toString()} />
        <StatCard
          label="Taux de conversion"
          value={`${stats.rate.toFixed(1)}%`}
          sub={`${stats.conversions} / ${stats.totalVisits}`}
        />
      </div>

      {/* Visits chart */}
      <div style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: '14px', padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#555', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Visites par jour
        </h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '140px' }}>
          {stats.visitsByDay.map(v => {
            const h = (v.count / maxVisits) * 100
            return (
              <div
                key={v.date}
                title={`${v.date}: ${v.count} visites`}
                style={{
                  flex: 1,
                  height: `${Math.max(2, h)}%`,
                  background: v.count > 0 ? ACCENT : '#e5e5e5',
                  borderRadius: '3px 3px 0 0',
                  cursor: 'default',
                }}
              />
            )
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#999', marginTop: '0.5rem' }}>
          <span>{stats.visitsByDay[0]?.date}</span>
          <span>{stats.visitsByDay[stats.visitsByDay.length - 1]?.date}</span>
        </div>
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
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Nom</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Détails</th>
              </tr>
            </thead>
            <tbody>
              {data.events.slice(0, 100).map(ev => (
                <tr key={ev.id} style={{ borderBottom: '1px solid #f4f4f5' }}>
                  <td style={tdStyle}>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: '6px',
                      background: ev.type === 'booking' ? '#dbeafe' : '#fef3c7',
                      color: ev.type === 'booking' ? '#1e40af' : '#92400e',
                      fontSize: '0.7rem', fontWeight: 600,
                    }}>
                      {ev.type === 'booking' ? 'RDV' : 'Brochure'}
                    </span>
                  </td>
                  <td style={tdStyle}>{new Date(ev.ts).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td style={tdStyle}>{[ev.firstName, ev.lastName].filter(Boolean).join(' ') || '—'}</td>
                  <td style={tdStyle}>
                    {ev.email ? <a href={`mailto:${ev.email}`} style={{ color: ACCENT }}>{ev.email}</a> : '—'}
                  </td>
                  <td style={{ ...tdStyle, color: '#666' }}>
                    {ev.type === 'booking'
                      ? `${ev.date || ''} ${ev.hour !== undefined ? `${String(ev.hour).padStart(2, '0')}:${String(ev.minute || 0).padStart(2, '0')}` : ''}`.trim()
                      : [ev.company, ev.phone].filter(Boolean).join(' · ') || '—'}
                  </td>
                </tr>
              ))}
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

function TaskRow({ task, isOverdue, onToggle, onDelete, onUpdateDesc }: {
  task: CrmTask
  isOverdue: boolean
  onToggle: (done: boolean) => void
  onDelete: () => void
  onUpdateDesc: (desc: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
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
          <textarea
            value={desc}
            onChange={e => setDesc(e.target.value)}
            onBlur={() => onUpdateDesc(desc)}
            placeholder="Description, CR de réunion, notes..."
            rows={3}
            style={{
              width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #e0e0e0',
              borderRadius: '7px', fontSize: '0.75rem', outline: 'none', background: '#fafafa',
              boxSizing: 'border-box', resize: 'vertical', fontFamily: "'Inter', sans-serif", lineHeight: 1.5,
            }}
          />
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

  // Sort: best position first, then alphabetical
  const sorted = [...keywords].sort((a, b) => {
    const aPos = a.history.length ? (a.history[a.history.length - 1].position ?? 999) : 999
    const bPos = b.history.length ? (b.history[b.history.length - 1].position ?? 999) : 999
    if (aPos !== bPos) return aPos - bPos
    return a.keyword.localeCompare(b.keyword)
  })

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
                <th style={thStyle}>Mot-clé</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Position</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Tendance</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Volume</th>
                <th style={thStyle}>Page cible</th>
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
  const [expandedCoId, setExpandedCoId] = useState<string | null>(null)
  const [expandedContactId, setExpandedContactId] = useState<string | null>(null)
  const [showAddCompany, setShowAddCompany] = useState(false)
  const [addContactForCo, setAddContactForCo] = useState<string | null>(null)
  const [addTaskForCo, setAddTaskForCo] = useState<string | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDate, setNewTaskDate] = useState('')
  const [newTaskDesc, setNewTaskDesc] = useState('')

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
      setCompanies(json.companies)
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

  const createCompany = async (name: string, status: CrmStatus) => {
    try {
      const res = await fetch('/.netlify/functions/admin-crm', {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ action: 'create-company', fields: { name, status } }),
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
    try {
      const res = await fetch('/.netlify/functions/admin-crm', {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ action: 'update-task', companyId, taskId, fields: { description } }),
      })
      if (!res.ok) throw new Error(await res.text())
    } catch (err) { alert(`Erreur : ${String(err)}`) }
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
    return companies
      .filter(co => statusFilter === 'all' || co.status === statusFilter)
      .filter(co => {
        if (!q) return true
        if (co.name.toLowerCase().includes(q)) return true
        return co.contacts.some(c =>
          c.email.toLowerCase().includes(q) ||
          c.firstName.toLowerCase().includes(q) ||
          c.lastName.toLowerCase().includes(q),
        )
      })
      .sort((a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1))
  }, [companies, search, statusFilter])

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
        <div style={{ display: 'flex', gap: '0.5rem' }}>
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

      {/* Status filter pills */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <FilterPill label={`Tous (${counts.all})`} active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
        {CRM_STATUSES.map(s => (
          <FilterPill key={s} label={`${s} (${counts[s] || 0})`} active={statusFilter === s} onClick={() => setStatusFilter(s)} color={STATUS_COLORS[s]} />
        ))}
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

      {/* Companies list */}
      <div style={{ border: '1px solid #eee', borderRadius: '14px', overflow: 'hidden', background: '#fff' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#999', fontSize: '0.85rem' }}>Aucune entreprise.</div>
        ) : (
          filtered.map(co => {
            const isExpanded = expandedCoId === co.id
            return (
              <div key={co.id} style={{ borderBottom: '1px solid #f4f4f5' }}>
                {/* Company row */}
                <div
                  onClick={() => { setExpandedCoId(isExpanded ? null : co.id); setExpandedContactId(null); setAddContactForCo(null) }}
                  style={{
                    display: 'grid', gridTemplateColumns: '2.5fr 1fr 1.5fr auto',
                    gap: '1rem', alignItems: 'center', padding: '0.9rem 1rem',
                    cursor: 'pointer', fontSize: '0.8rem',
                    background: isExpanded ? '#fafafa' : 'transparent',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#111', fontSize: '0.85rem' }}>{co.name}</div>
                    <div style={{ color: '#999', fontSize: '0.7rem', marginTop: '2px' }}>
                      {co.contacts.length} contact{co.contacts.length > 1 ? 's' : ''}
                    </div>
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
                            <div style={{ color: '#999', fontSize: '0.68rem' }}>{c.source}</div>
                            <div style={{ fontSize: '0.65rem', color: '#bbb' }}>{expandedContactId === c.id ? '▲' : '▼'}</div>
                          </div>

                          {expandedContactId === c.id && (
                            <div style={{ padding: '0 0.8rem 0.8rem 0.8rem', background: '#f8f8f8' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', paddingTop: '0.5rem' }}>
                                <EditField label="Prénom" value={c.firstName} onSave={v => updateContact(co.id, c.id, { firstName: v })} />
                                <EditField label="Nom" value={c.lastName} onSave={v => updateContact(co.id, c.id, { lastName: v })} />
                                <EditField label="Email" value={c.email} onSave={v => updateContact(co.id, c.id, { email: v })} />
                                <EditField label="Source" value={c.source} onSave={v => updateContact(co.id, c.id, { source: v })} />
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
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                                <p style={{ fontSize: '0.6rem', color: '#bbb', margin: 0 }}>
                                  Créé : {new Date(c.createdAt).toLocaleDateString('fr-FR')} · Maj : {new Date(c.updatedAt).toLocaleString('fr-FR')}
                                </p>
                                <button
                                  onClick={() => deleteContact(co.id, c.id)}
                                  style={{ padding: '0.3rem 0.6rem', border: '1px solid #fecaca', borderRadius: '6px', background: '#fff', color: '#dc2626', fontSize: '0.65rem', cursor: 'pointer' }}
                                >
                                  Supprimer
                                </button>
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

function NewCompanyForm({ onSave, onCancel }: { onSave: (name: string, status: CrmStatus) => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [status, setStatus] = useState<CrmStatus>('Non qualifié')
  return (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: '12px', padding: '1rem', marginBottom: '1rem', background: '#fafafa' }}>
      <p style={{ fontSize: '0.8rem', fontWeight: 600, color: ACCENT, margin: '0 0 0.75rem' }}>Nouvelle entreprise</p>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem' }}>
        <input placeholder="Nom de l'entreprise *" value={name} onChange={e => setName(e.target.value)} style={newFieldStyle} />
        <select value={status} onChange={e => setStatus(e.target.value as CrmStatus)} style={newFieldStyle}>
          {CRM_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ padding: '0.45rem 0.9rem', border: '1px solid #e0e0e0', borderRadius: '8px', background: '#fff', color: '#555', fontSize: '0.75rem', cursor: 'pointer' }}>Annuler</button>
        <button onClick={() => name.trim() && onSave(name.trim(), status)} disabled={!name.trim()}
          style={{ padding: '0.45rem 0.9rem', border: 'none', borderRadius: '8px', background: ACCENT, color: '#fff', fontSize: '0.75rem', fontWeight: 600, cursor: name.trim() ? 'pointer' : 'not-allowed', opacity: name.trim() ? 1 : 0.5 }}>
          Créer
        </button>
      </div>
    </div>
  )
}

function NewContactForm({ onSave, onCancel }: { onSave: (fields: Partial<CrmContact>) => void; onCancel: () => void }) {
  const [fields, setFields] = useState<Partial<CrmContact>>({ email: '', firstName: '', lastName: '', source: 'Manual', notes: '' })
  const upd = (k: keyof CrmContact, v: string) => setFields(p => ({ ...p, [k]: v }))
  return (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: '10px', padding: '0.75rem', marginBottom: '0.75rem', background: '#fff' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
        <input placeholder="Email *" value={fields.email} onChange={e => upd('email', e.target.value)} style={newFieldStyle} />
        <input placeholder="Prénom" value={fields.firstName} onChange={e => upd('firstName', e.target.value)} style={newFieldStyle} />
        <input placeholder="Nom" value={fields.lastName} onChange={e => upd('lastName', e.target.value)} style={newFieldStyle} />
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
