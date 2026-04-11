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
  company: string
  status: CrmStatus
  source: string
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
  const [view, setView] = useState<'analytics' | 'crm' | 'cms'>('analytics')

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

/* ---------- CRM ---------- */

function CrmView({ password }: { password: string }) {
  const [contacts, setContacts] = useState<CrmContact[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CrmStatus | 'all'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)

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
      setContacts(json.contacts)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }, [authHeaders])

  useEffect(() => { refresh() }, [refresh])

  const updateContact = async (id: string, fields: Partial<CrmContact>) => {
    // Optimistic update
    setContacts(prev => prev?.map(c => c.id === id ? { ...c, ...fields } : c) || null)
    try {
      const res = await fetch('/.netlify/functions/admin-crm', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ action: 'update', id, fields }),
      })
      if (!res.ok) throw new Error(await res.text())
    } catch (err) {
      alert(`Erreur : ${String(err)}`)
      refresh()
    }
  }

  const deleteContact = async (id: string) => {
    if (!confirm('Supprimer ce contact ?')) return
    try {
      const res = await fetch('/.netlify/functions/admin-crm', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ action: 'delete', id }),
      })
      if (!res.ok) throw new Error(await res.text())
      setContacts(prev => prev?.filter(c => c.id !== id) || null)
      if (expandedId === id) setExpandedId(null)
    } catch (err) {
      alert(`Erreur : ${String(err)}`)
    }
  }

  const createContact = async (fields: Partial<CrmContact>) => {
    try {
      const res = await fetch('/.netlify/functions/admin-crm', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ action: 'create', fields }),
      })
      const body = await res.text()
      if (!res.ok) throw new Error(body)
      const { contact } = JSON.parse(body)
      setContacts(prev => [contact, ...(prev || [])])
      setShowAdd(false)
    } catch (err) {
      alert(`Erreur : ${String(err)}`)
    }
  }

  const filtered = useMemo(() => {
    if (!contacts) return []
    const q = search.trim().toLowerCase()
    return contacts
      .filter(c => statusFilter === 'all' || c.status === statusFilter)
      .filter(c => !q ||
        c.email.toLowerCase().includes(q) ||
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q),
      )
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
  }, [contacts, search, statusFilter])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: contacts?.length || 0 }
    CRM_STATUSES.forEach(s => { c[s] = 0 })
    contacts?.forEach(ct => { c[ct.status] = (c[ct.status] || 0) + 1 })
    return c
  }, [contacts])

  if (loading && !contacts) return <div style={{ padding: '3rem' }}>Chargement...</div>
  if (error && !contacts) return <div style={{ padding: '3rem', color: '#dc2626' }}>Erreur : {error}</div>

  return (
    <div style={{ padding: '2rem 3rem', maxWidth: '1200px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111', margin: 0 }}>CRM</h2>
          <p style={{ fontSize: '0.75rem', color: '#999', margin: '0.25rem 0 0' }}>
            {contacts?.length || 0} contacts
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setShowAdd(true)}
            style={{
              padding: '0.5rem 0.9rem', border: 'none', borderRadius: '8px',
              background: ACCENT, color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            + Nouveau contact
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
        <FilterPill
          label={`Tous (${counts.all})`}
          active={statusFilter === 'all'}
          onClick={() => setStatusFilter('all')}
        />
        {CRM_STATUSES.map(s => (
          <FilterPill
            key={s}
            label={`${s} (${counts[s] || 0})`}
            active={statusFilter === s}
            onClick={() => setStatusFilter(s)}
            color={STATUS_COLORS[s]}
          />
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Rechercher par nom, email, entreprise..."
        style={{
          width: '100%', padding: '0.7rem 0.9rem', marginBottom: '1rem',
          border: '1px solid #e0e0e0', borderRadius: '10px', fontSize: '0.85rem',
          outline: 'none', background: '#fafafa', boxSizing: 'border-box',
        }}
      />

      {showAdd && (
        <NewContactForm
          onSave={createContact}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {/* Contacts list */}
      <div style={{ border: '1px solid #eee', borderRadius: '14px', overflow: 'hidden', background: '#fff' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#999', fontSize: '0.85rem' }}>
            Aucun contact.
          </div>
        ) : (
          filtered.map(c => (
            <div key={c.id} style={{ borderBottom: '1px solid #f4f4f5' }}>
              <div
                onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 2fr 2fr 1.5fr auto',
                  gap: '1rem',
                  alignItems: 'center',
                  padding: '0.9rem 1rem',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: '#111' }}>
                    {[c.firstName, c.lastName].filter(Boolean).join(' ') || '—'}
                  </div>
                  <div style={{ color: '#999', fontSize: '0.7rem' }}>{c.source}</div>
                </div>
                <div style={{ color: '#555', wordBreak: 'break-all' }}>{c.email}</div>
                <div style={{ color: '#555' }}>{c.company || '—'}</div>
                <select
                  value={c.status}
                  onClick={e => e.stopPropagation()}
                  onChange={e => updateContact(c.id, { status: e.target.value as CrmStatus })}
                  style={{
                    padding: '4px 8px', borderRadius: '6px', border: 'none',
                    background: STATUS_COLORS[c.status].bg,
                    color: STATUS_COLORS[c.status].fg,
                    fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {CRM_STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <div style={{ fontSize: '0.7rem', color: '#bbb' }}>
                  {expandedId === c.id ? '▲' : '▼'}
                </div>
              </div>

              {expandedId === c.id && (
                <div style={{ padding: '0 1rem 1rem 1rem', background: '#fafafa' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', paddingTop: '0.5rem' }}>
                    <EditField label="Prénom" value={c.firstName} onSave={v => updateContact(c.id, { firstName: v })} />
                    <EditField label="Nom" value={c.lastName} onSave={v => updateContact(c.id, { lastName: v })} />
                    <EditField label="Entreprise" value={c.company} onSave={v => updateContact(c.id, { company: v })} />
                    <EditField label="Source" value={c.source} onSave={v => updateContact(c.id, { source: v })} />
                  </div>
                  <div style={{ marginTop: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 600, color: '#666', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Notes
                    </label>
                    <textarea
                      value={c.notes}
                      onChange={e => setContacts(prev => prev?.map(x => x.id === c.id ? { ...x, notes: e.target.value } : x) || null)}
                      onBlur={e => updateContact(c.id, { notes: e.target.value })}
                      rows={3}
                      style={{
                        width: '100%', padding: '0.5rem 0.7rem', border: '1px solid #e0e0e0',
                        borderRadius: '8px', fontSize: '0.8rem', outline: 'none',
                        background: '#fff', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif",
                        resize: 'vertical',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                    <p style={{ fontSize: '0.65rem', color: '#bbb', margin: 0 }}>
                      Créé : {new Date(c.createdAt).toLocaleDateString('fr-FR')} · Maj : {new Date(c.updatedAt).toLocaleString('fr-FR')}
                    </p>
                    <button
                      onClick={() => deleteContact(c.id)}
                      style={{
                        padding: '0.4rem 0.7rem', border: '1px solid #fecaca', borderRadius: '6px',
                        background: '#fff', color: '#dc2626', fontSize: '0.7rem', cursor: 'pointer',
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function FilterPill({ label, active, onClick, color }: {
  label: string
  active: boolean
  onClick: () => void
  color?: { bg: string; fg: string }
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
      <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 600, color: '#666', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </label>
      <input
        type="text"
        value={local}
        onChange={e => setLocal(e.target.value)}
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

function NewContactForm({ onSave, onCancel }: {
  onSave: (fields: Partial<CrmContact>) => void
  onCancel: () => void
}) {
  const [fields, setFields] = useState<Partial<CrmContact>>({
    email: '', firstName: '', lastName: '', company: '',
    status: 'Non qualifié', source: 'Manual', notes: '',
  })
  const upd = (k: keyof CrmContact, v: string) => setFields(p => ({ ...p, [k]: v }))

  return (
    <div style={{
      border: '1px solid #e0e0e0', borderRadius: '12px', padding: '1rem',
      marginBottom: '1rem', background: '#fafafa',
    }}>
      <p style={{ fontSize: '0.8rem', fontWeight: 600, color: ACCENT, margin: '0 0 0.75rem' }}>
        Nouveau contact
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        <input placeholder="Email *" value={fields.email} onChange={e => upd('email', e.target.value)} style={newFieldStyle} />
        <select value={fields.status} onChange={e => upd('status', e.target.value)} style={newFieldStyle}>
          {CRM_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input placeholder="Prénom" value={fields.firstName} onChange={e => upd('firstName', e.target.value)} style={newFieldStyle} />
        <input placeholder="Nom" value={fields.lastName} onChange={e => upd('lastName', e.target.value)} style={newFieldStyle} />
        <input placeholder="Entreprise" value={fields.company} onChange={e => upd('company', e.target.value)} style={newFieldStyle} />
        <input placeholder="Source" value={fields.source} onChange={e => upd('source', e.target.value)} style={newFieldStyle} />
      </div>
      <textarea
        placeholder="Notes"
        value={fields.notes}
        onChange={e => upd('notes', e.target.value)}
        rows={2}
        style={{ ...newFieldStyle, width: '100%', marginTop: '0.5rem', fontFamily: "'Inter', sans-serif", resize: 'vertical' }}
      />
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          style={{
            padding: '0.45rem 0.9rem', border: '1px solid #e0e0e0', borderRadius: '8px',
            background: '#fff', color: '#555', fontSize: '0.75rem', cursor: 'pointer',
          }}
        >
          Annuler
        </button>
        <button
          onClick={() => fields.email && onSave(fields)}
          disabled={!fields.email}
          style={{
            padding: '0.45rem 0.9rem', border: 'none', borderRadius: '8px',
            background: ACCENT, color: '#fff', fontSize: '0.75rem', fontWeight: 600,
            cursor: fields.email ? 'pointer' : 'not-allowed',
            opacity: fields.email ? 1 : 0.5,
          }}
        >
          Créer
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
