import { useEffect, useState } from 'react'

const STORAGE_KEY = 'clempo_data_unlock'

interface Props {
  slug: string             // ex: "medecins-generalistes"
  specialiteName: string   // ex: "Médecins Généralistes"
  monthsCount: number
  totalEditeurs: number
}

function setCidCookie(email: string) {
  try {
    const cid = btoa(email.toLowerCase().trim())
    document.cookie = `clempo_cid=${cid}; max-age=${365 * 24 * 3600}; path=/; SameSite=Lax`
  } catch { /* ignore */ }
}

export default function DataDownloadGate({ slug, specialiteName, monthsCount, totalEditeurs }: Props) {
  const [unlocked, setUnlocked] = useState(false)
  // True only right after a fresh submission (not for returning visitors
  // unlocked via localStorage) — gates the "sent by email" notice.
  const [justSubmitted, setJustSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', company: '',
  })

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) setUnlocked(true)
    } catch { /* ignore */ }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.email || !form.email.includes('@')) {
      setError('Email invalide')
      return
    }
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Merci de renseigner votre prénom et votre nom')
      return
    }
    setSubmitting(true)
    try {
      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          'form-name': 'data-download',
          'first-name': form.firstName,
          'last-name': form.lastName,
          'email': form.email,
          'phone': form.phone,
          'company': form.company,
          'source': `Data ${specialiteName}`,
          'slug': slug,
        }).toString(),
      })
      setCidCookie(form.email)
      try { localStorage.setItem(STORAGE_KEY, '1') } catch { /* ignore */ }
      setJustSubmitted(true)
      setUnlocked(true)
    } catch {
      setError('Erreur réseau, réessayez')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Card containers (shared base) ───────────────────────────────
  const cardBase: React.CSSProperties = {
    background: 'var(--ink)',
    color: 'var(--paper)',
    borderRadius: 'var(--cb-radius)',
    padding: '2rem',
  }
  const eyebrowStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.62rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--signal)',
    marginBottom: '0.75rem',
  }
  const h2Style: React.CSSProperties = {
    fontFamily: 'var(--font-sans)',
    fontSize: '1.4rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
    marginBottom: '0.6rem',
  }

  // ─── UNLOCKED: show download links directly ───────────────────────
  if (unlocked) {
    return (
      <div style={cardBase}>
        <div style={eyebrowStyle}>// données brutes</div>
        <h2 style={h2Style}>Téléchargez la data</h2>
        <p style={{
          fontSize: '0.85rem',
          color: 'rgba(237,235,228,0.75)',
          lineHeight: 1.55,
          marginBottom: '1.5rem',
        }}>
          Faites votre propre analyse. {monthsCount > 0 && `${monthsCount} mois · ${totalEditeurs} progiciels.`}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <DownloadLink href={`/data/specialites/${slug}.csv`} label={`CSV — ${slug}.csv`} />
          <DownloadLink href={`/data/specialites/${slug}.xlsx`} label={`XLSX — ${slug}.xlsx`} />
        </div>
        {justSubmitted && (
          <p style={{
            fontSize: '0.78rem',
            color: 'rgba(237,235,228,0.65)',
            lineHeight: 1.5,
            marginTop: '1rem',
            marginBottom: 0,
          }}>
            📩 Les liens de téléchargement viennent aussi de vous être envoyés par email.
          </p>
        )}
      </div>
    )
  }

  // ─── LOCKED: show form ───────────────────────────────────────────
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.65rem',
    fontWeight: 500,
    marginBottom: '0.35rem',
    color: 'rgba(237,235,228,0.7)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  }
  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(237,235,228,0.06)',
    border: '1px solid rgba(237,235,228,0.18)',
    borderRadius: 'var(--cb-radius)',
    padding: '0.7rem 0.9rem',
    color: 'var(--paper)',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  }

  return (
    <div style={cardBase}>
      <div style={eyebrowStyle}>// données brutes — accès gratuit</div>
      <h2 style={h2Style}>Téléchargez la data</h2>
      <p style={{
        fontSize: '0.85rem',
        color: 'rgba(237,235,228,0.75)',
        lineHeight: 1.55,
        marginBottom: '1.5rem',
      }}>
        {monthsCount > 0 && `${monthsCount} mois · ${totalEditeurs} progiciels. `}
        Renseignez vos coordonnées pour accéder aux fichiers CSV et XLSX.
      </p>

      <form
        name="data-download"
        method="POST"
        data-netlify="true"
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}
      >
        {/* Required hidden inputs for Netlify Forms */}
        <input type="hidden" name="form-name" value="data-download" />
        <input type="hidden" name="source" value={`Data ${specialiteName}`} />
        <input type="hidden" name="slug" value={slug} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
          <div>
            <label style={labelStyle} htmlFor="dl-firstName">Prénom *</label>
            <input
              id="dl-firstName"
              name="first-name"
              type="text"
              required
              value={form.firstName}
              onChange={e => setForm({ ...form, firstName: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="dl-lastName">Nom *</label>
            <input
              id="dl-lastName"
              name="last-name"
              type="text"
              required
              value={form.lastName}
              onChange={e => setForm({ ...form, lastName: e.target.value })}
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle} htmlFor="dl-email">Email *</label>
          <input
            id="dl-email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
          <div>
            <label style={labelStyle} htmlFor="dl-phone">Téléphone</label>
            <input
              id="dl-phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="dl-company">Entreprise</label>
            <input
              id="dl-company"
              name="company"
              type="text"
              value={form.company}
              onChange={e => setForm({ ...form, company: e.target.value })}
              style={inputStyle}
            />
          </div>
        </div>

        {error && (
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: 'var(--signal-warm)',
            padding: '0.5rem 0',
          }}>
            ⚠ {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            marginTop: '0.4rem',
            padding: '0.85rem 1.2rem',
            background: 'var(--signal)',
            color: 'var(--ink)',
            border: 'none',
            borderRadius: 'var(--cb-radius)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.6 : 1,
            transition: 'opacity 0.2s, transform 0.1s',
          }}
        >
          {submitting ? 'Envoi…' : 'Accéder aux données →'}
        </button>

        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.62rem',
          color: 'rgba(237,235,228,0.5)',
          letterSpacing: '0.04em',
          lineHeight: 1.5,
          marginTop: '0.4rem',
        }}>
          Source GIE SESAM-Vitale, données publiques. Vos coordonnées restent confidentielles, utilisées uniquement pour vous tenir informé des mises à jour de cette donnée.
        </p>
      </form>
    </div>
  )
}

function DownloadLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      download
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.85rem 1rem',
        background: 'rgba(237,235,228,0.08)',
        color: 'var(--paper)',
        textDecoration: 'none',
        borderRadius: 'var(--cb-radius)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.78rem',
        letterSpacing: '0.04em',
        border: '1px solid rgba(237,235,228,0.12)',
        transition: 'background 0.2s, border-color 0.2s',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.background = 'rgba(237,235,228,0.15)'
        el.style.borderColor = 'var(--signal)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.background = 'rgba(237,235,228,0.08)'
        el.style.borderColor = 'rgba(237,235,228,0.12)'
      }}
    >
      <span>{label}</span>
      <span>↓</span>
    </a>
  )
}

// Hidden Netlify form registration — must be present in at least one
// pre-rendered HTML so Netlify detects the schema at deploy time.
export function DataDownloadNetlifyRegistration() {
  return (
    <form name="data-download" data-netlify="true" hidden>
      <input type="hidden" name="form-name" value="data-download" />
      <input type="text" name="first-name" />
      <input type="text" name="last-name" />
      <input type="email" name="email" />
      <input type="text" name="phone" />
      <input type="text" name="company" />
      <input type="text" name="source" />
      <input type="text" name="slug" />
    </form>
  )
}
