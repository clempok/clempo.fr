import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { useLang } from '../contexts/LangContext'
import { bookingUrl } from '../lib/cta'
import Wordmark from './Wordmark'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { lang, setLang, t } = useLang()

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  const linkStyle = (active: boolean): React.CSSProperties => ({
    textDecoration: 'none',
    color: active ? 'var(--ink)' : 'var(--steel)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
    fontWeight: 500,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    transition: 'color 0.2s',
  })

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      padding: '0.9rem 4vw',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      backdropFilter: 'blur(20px) saturate(1.3)',
      WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
      background: 'rgba(237,235,228,0.82)',
      borderBottom: '1px solid rgba(10,10,11,0.06)',
    }}>
      {/* Left: logo + links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
        <Link to="/" style={{ color: 'var(--ink)', textDecoration: 'none' }} aria-label="clempo.">
          <Wordmark size="1.1rem" />
        </Link>

        <div className="hidden md:flex" style={{ gap: '2rem' }}>
          <Link to="/"
            style={linkStyle(isActive('/'))}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink)')}
            onMouseLeave={e => { if (!isActive('/')) e.currentTarget.style.color = 'var(--steel)' }}
          >
            {t('nav', 'home')}
          </Link>
          <Link to="/articles"
            style={linkStyle(isActive('/articles'))}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink)')}
            onMouseLeave={e => { if (!isActive('/articles')) e.currentTarget.style.color = 'var(--steel)' }}
          >
            {t('nav', 'articles')}
          </Link>
          <Link to="/parts-de-marche-logiciels-medicaux"
            style={linkStyle(isActive('/parts-de-marche-logiciels-medicaux') || isActive('/specialites'))}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink)')}
            onMouseLeave={e => {
              if (!isActive('/parts-de-marche-logiciels-medicaux') && !isActive('/specialites'))
                e.currentTarget.style.color = 'var(--steel)'
            }}
          >
            Data
          </Link>
        </div>
      </div>

      {/* Right: lang toggle + CTA */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Lang toggle — minimal, no pill */}
        <div className="hidden md:flex" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          fontFamily: 'var(--font-mono)',
        }}>
          {(['fr', 'en'] as const).map((l, i) => (
            <div key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <button onClick={() => setLang(l)} style={{
                padding: '0.15rem 0.1rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                fontWeight: 500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                background: 'transparent',
                color: lang === l ? 'var(--ink)' : 'var(--mist)',
                border: 'none',
                borderBottom: lang === l ? '1.5px solid var(--signal)' : '1.5px solid transparent',
                cursor: 'pointer',
                transition: 'color 0.2s, border-color 0.2s',
              }}>
                {l}
              </button>
              {i === 0 && <span style={{ color: 'var(--mist)', fontSize: '0.7rem' }}>/</span>}
            </div>
          ))}
        </div>

        {/* CTA button */}
        <Link
          to={bookingUrl('navbar')}
          className="hidden md:inline-flex cb-btn cb-btn--primary"
          style={{ fontSize: '0.75rem', padding: '0.55rem 1.1rem' }}
        >
          Let's talk <span className="cb-arrow">→</span>
        </Link>

        {/* Mobile burger */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{ background: 'none', border: 'none', color: 'var(--ink)', padding: '0.25rem', cursor: 'pointer' }}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'rgba(237,235,228,0.98)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(10,10,11,0.06)',
          padding: '1.25rem 5vw',
          display: 'flex', flexDirection: 'column', gap: '1.25rem',
        }}>
          <Link to="/" onClick={() => setMobileOpen(false)}
            style={{
              color: 'var(--ink)', textDecoration: 'none',
              fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 500,
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
            {t('nav', 'home')}
          </Link>
          <Link to="/articles" onClick={() => setMobileOpen(false)}
            style={{
              color: 'var(--ink)', textDecoration: 'none',
              fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 500,
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
            {t('nav', 'articles')}
          </Link>
          <Link to="/parts-de-marche-logiciels-medicaux" onClick={() => setMobileOpen(false)}
            style={{
              color: 'var(--ink)', textDecoration: 'none',
              fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 500,
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
            Data
          </Link>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {(['fr', 'en'] as const).map(l => (
              <button key={l} onClick={() => { setLang(l); setMobileOpen(false) }}
                style={{
                  background: lang === l ? 'var(--ink)' : 'transparent',
                  color: lang === l ? 'var(--paper)' : 'var(--steel)',
                  border: '1px solid ' + (lang === l ? 'var(--ink)' : 'rgba(10,10,11,0.15)'),
                  borderRadius: 'var(--cb-radius)',
                  padding: '0.3rem 0.9rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem', fontWeight: 600,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  cursor: 'pointer',
                }}>
                {l}
              </button>
            ))}
          </div>
          <Link
            to={bookingUrl('navbar')}
            onClick={() => setMobileOpen(false)}
            className="cb-btn cb-btn--primary"
            style={{ justifyContent: 'center' }}
          >
            Let's talk <span className="cb-arrow">→</span>
          </Link>
        </div>
      )}
    </nav>
  )
}
