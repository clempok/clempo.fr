import { useState } from 'react'
import { JOURNALISTES_SHEET_URL, JOURNALISTES_TITLE, JOURNALISTES_SUB } from '../lib/journalistes'

type Variant = 'full' | 'compact' | 'modal'
type Theme = 'light' | 'dark'

type Props = {
  variant?: Variant
  theme?: Theme  // 'dark' = section background is ink-coloured
  source?: string  // e.g. "home", "article-marketing-medtech", "exit-popup" — passed through CRM source
  onSubmitted?: () => void
}

function setCidCookie(email: string) {
  try {
    const cid = btoa(email.toLowerCase().trim())
    document.cookie = `clempo_cid=${cid}; max-age=${365 * 24 * 3600}; path=/; SameSite=Lax`
  } catch { /* ignore */ }
}

export default function JournalistesForm({ variant = 'full', theme = 'light', source = 'home', onSubmitted }: Props) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true)
    try {
      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          'form-name': 'journalistes',
          'first-name': form.firstName,
          'last-name': form.lastName,
          'email': form.email,
          'source': source,
        }).toString(),
      })
      if (form.email) setCidCookie(form.email)
      setSubmitted(true)
      onSubmitted?.()
    } catch {
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Shared styles ────────────────────────────────────────────
  const isDark = theme === 'dark'
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.7rem',
    fontWeight: 500,
    marginBottom: '0.4rem',
    color: isDark ? 'rgba(255,255,255,0.65)' : 'var(--steel)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  }
  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: isDark ? 'rgba(255,255,255,0.06)' : 'var(--paper)',
    border: isDark ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(10,10,11,0.18)',
    borderRadius: 'var(--cb-radius)',
    padding: '0.85rem 1rem',
    color: isDark ? 'var(--paper)' : 'var(--ink)',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  }

  // ─── Success state ────────────────────────────────────────────
  if (submitted) {
    return (
      <div style={{
        background: 'var(--signal)',
        border: '1px solid rgba(10,10,11,0.12)',
        borderRadius: 'var(--cb-radius)',
        padding: variant === 'compact' ? '1.5rem' : '2rem',
        textAlign: 'center',
      }}>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--ink)',
          marginBottom: '0.75rem',
          fontWeight: 600,
        }}>
          Voici votre liste 🎉
        </p>
        <p style={{
          color: 'var(--ink)',
          fontSize: variant === 'compact' ? '0.9rem' : '1rem',
          lineHeight: 1.55,
          marginBottom: '1.5rem',
          maxWidth: '400px',
          margin: '0 auto 1.5rem',
        }}>
          Bonne prospection ! Pensez à personnaliser chaque pitch — ça change tout en RP santé.
        </p>
        <p style={{
          color: 'var(--ink)',
          fontSize: '0.85rem',
          lineHeight: 1.5,
          opacity: 0.8,
          maxWidth: '400px',
          margin: '0 auto 1.5rem',
        }}>
          📩 Le lien vient aussi de vous être envoyé par email — pratique pour retrouver la liste plus tard.
        </p>
        <a
          href={JOURNALISTES_SHEET_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            padding: '0.85rem 1.6rem',
            background: 'var(--ink)',
            color: 'var(--paper)',
            borderRadius: 'var(--cb-radius)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            textDecoration: 'none',
          }}
        >
          Ouvrir la liste →
        </a>
      </div>
    )
  }

  // ─── Form layout per variant ─────────────────────────────────
  const wrapperStyle: React.CSSProperties = (() => {
    if (variant === 'compact') {
      return {
        background: 'var(--signal)',
        border: '1px solid rgba(10,10,11,0.12)',
        borderRadius: 'var(--cb-radius)',
        padding: '1.75rem',
      }
    }
    if (variant === 'modal') {
      return {
        padding: 0,
      }
    }
    return {} // full uses parent wrapper
  })()

  const showHeader = variant !== 'modal'

  return (
    <div style={wrapperStyle}>
      {showHeader && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: variant === 'compact' ? '0.75rem' : '1.5rem' }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              fontWeight: 600,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--ink)',
              background: variant === 'compact' ? 'rgba(10,10,11,0.08)' : 'rgba(10,10,11,0.06)',
              padding: '0.3rem 0.7rem',
              borderRadius: '4px',
            }}>
              🎁 Ressource gratuite
            </span>
          </div>

          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: variant === 'compact'
              ? 'clamp(1.3rem, 2.5vw, 1.6rem)'
              : 'clamp(1.8rem, 4vw, 2.6rem)',
            fontWeight: 400,
            color: 'var(--ink)',
            margin: '0 0 0.75rem',
            lineHeight: 1.15,
          }}>
            {JOURNALISTES_TITLE}
          </h2>
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: variant === 'compact' ? '0.9rem' : '1.05rem',
            color: 'var(--steel)',
            lineHeight: 1.6,
            margin: variant === 'compact' ? '0 0 1.25rem' : '0 0 2rem',
            maxWidth: '520px',
          }}>
            {JOURNALISTES_SUB}
          </p>
        </>
      )}

      <form name="journalistes" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <input type="hidden" name="form-name" value="journalistes" />
        <input type="hidden" name="source" value={source} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={labelStyle}>Prénom *</label>
            <input
              type="text" name="first-name" required
              value={form.firstName}
              onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
              style={inputStyle} placeholder="Marie" autoComplete="given-name"
            />
          </div>
          <div>
            <label style={labelStyle}>Nom *</label>
            <input
              type="text" name="last-name" required
              value={form.lastName}
              onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
              style={inputStyle} placeholder="Dupont" autoComplete="family-name"
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Email pro *</label>
          <input
            type="email" name="email" required
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            style={inputStyle} placeholder="marie@startup-sante.fr" autoComplete="email"
          />
        </div>

        <button
          type="submit" disabled={submitting}
          style={{
            marginTop: '0.4rem',
            padding: '0.95rem 1.6rem',
            background: isDark ? 'var(--signal)' : 'var(--ink)',
            color: 'var(--ink)',
            border: 'none',
            borderRadius: 'var(--cb-radius)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            cursor: submitting ? 'wait' : 'pointer',
            opacity: submitting ? 0.7 : 1,
            alignSelf: variant === 'compact' || variant === 'modal' ? 'stretch' : 'flex-start',
            width: variant === 'compact' || variant === 'modal' ? '100%' : 'auto',
            transition: 'transform 0.15s, background 0.15s',
            ...(isDark ? {} : { color: 'var(--paper)' }),
          }}
          onMouseEnter={e => { if (!submitting) (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = '' }}
        >
          {submitting ? 'Envoi…' : 'Recevoir la liste →'}
        </button>

        <p style={{
          fontSize: '0.7rem',
          color: isDark ? 'rgba(255,255,255,0.5)' : 'var(--steel)',
          margin: '0.25rem 0 0',
          fontFamily: 'var(--font-sans)',
        }}>
          Pas de spam. Vos coordonnées restent privées.
        </p>
      </form>
    </div>
  )
}

// Hidden Netlify form registration. Mount once at the app root so Netlify
// detects the form schema at deploy time (works around static-pre-render).
export function JournalistesNetlifyRegistration() {
  return (
    <form name="journalistes" data-netlify="true" hidden>
      <input type="hidden" name="form-name" value="journalistes" />
      <input type="text" name="first-name" />
      <input type="text" name="last-name" />
      <input type="email" name="email" />
      <input type="text" name="source" />
    </form>
  )
}
