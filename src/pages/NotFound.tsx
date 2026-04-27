import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Wordmark from '../components/Wordmark'

export default function NotFound() {
  useEffect(() => {
    document.title = 'Page introuvable — Clempo.fr'
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', 'Cette page n\'existe pas ou a été déplacée.')
    window.scrollTo(0, 0)
  }, [])

  return (
    <div style={{
      paddingTop: '5rem',
      background: 'var(--paper)',
      color: 'var(--ink)',
      fontFamily: 'var(--font-sans)',
      minHeight: '100vh',
    }}>
      <div style={{ maxWidth: '40rem', margin: '0 auto', padding: '8rem 6vw' }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--signal)',
          fontWeight: 500,
        }}>
          // ERROR · 404
        </span>
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'clamp(4rem, 10vw, 7rem)',
          fontWeight: 700,
          color: 'var(--ink)',
          lineHeight: 1,
          letterSpacing: '-0.04em',
          marginTop: '1rem',
          marginBottom: '1.5rem',
        }}>
          404<span style={{ color: 'var(--signal)' }}>.</span>
        </p>
        <h1 style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
          fontWeight: 700,
          letterSpacing: '-0.025em',
          color: 'var(--ink)',
          marginBottom: '1rem',
        }}>
          Page introuvable
        </h1>
        <p style={{
          color: 'var(--graphite)',
          fontSize: '1rem',
          lineHeight: 1.6,
          marginBottom: '2.5rem',
          maxWidth: '42ch',
        }}>
          Cette page n'existe pas ou a été déplacée. Voici quelques liens utiles :
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/" className="cb-btn cb-btn--primary">
            Retour à l'accueil <span className="cb-arrow">→</span>
          </Link>
          <Link to="/articles" className="cb-btn cb-btn--ghost">
            Articles
          </Link>
        </div>

        <div style={{
          marginTop: '5rem',
          paddingTop: '2rem',
          borderTop: '1px solid rgba(10,10,11,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Wordmark size="0.85rem" />
          <span className="cb-page-marker">— 404 / ∞</span>
        </div>
      </div>
    </div>
  )
}
