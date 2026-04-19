import { useEffect } from 'react'
import { Link } from 'react-router-dom'

const ACCENT = '#1A1A6B'
const MUTED = '#71717A'
const TEXT = '#0A0A0A'

export default function NotFound() {
  useEffect(() => {
    document.title = 'Page introuvable — Clempo.fr'
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', 'Cette page n\'existe pas ou a été déplacée.')
    window.scrollTo(0, 0)
  }, [])

  return (
    <div style={{ paddingTop: '5rem', background: '#fff', minHeight: '100vh' }}>
      <div style={{ maxWidth: '40rem', margin: '0 auto', padding: '8rem 4vw', textAlign: 'center' }}>
        <p style={{ fontSize: '5rem', fontWeight: 700, color: ACCENT, lineHeight: 1, marginBottom: '1rem', fontFamily: "'Space Grotesk', sans-serif" }}>
          404
        </p>
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 'clamp(1.5rem, 3vw, 2rem)',
          fontWeight: 700, color: TEXT, marginBottom: '1rem',
        }}>
          Page introuvable
        </h1>
        <p style={{ color: MUTED, fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '2.5rem' }}>
          Cette page n'existe pas ou a été déplacée. Voici quelques liens utiles :
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
          <Link to="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            backgroundColor: ACCENT, color: '#fff',
            padding: '0.75rem 1.75rem', borderRadius: '100px',
            fontSize: '0.9375rem', fontWeight: 600, textDecoration: 'none',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#2D2D8A'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = ACCENT; e.currentTarget.style.transform = '' }}
          >
            Retour à l'accueil
          </Link>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
            <Link to="/articles" style={{ color: ACCENT, fontSize: '0.9375rem', fontWeight: 500, textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
            >
              Articles
            </Link>
            <Link to="/#accompagnements" style={{ color: ACCENT, fontSize: '0.9375rem', fontWeight: 500, textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
            >
              Services
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
