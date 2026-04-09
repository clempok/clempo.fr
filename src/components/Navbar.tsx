import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { useLang } from '../contexts/LangContext'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { lang, setLang, t } = useLang()

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      padding: '0.9rem 4vw',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      backdropFilter: 'blur(20px) saturate(1.3)',
      WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
      background: 'rgba(255,255,255,0.8)',
      borderBottom: '1px solid rgba(0,0,0,0.06)',
    }}>
      {/* Left: logo + links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
        <Link to="/" style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.02em',
          color: '#0A0A0A', textDecoration: 'none',
        }}>
          clempo.fr
        </Link>

        <div className="hidden md:flex" style={{ gap: '2rem' }}>
          <Link to="/" style={{
            textDecoration: 'none',
            color: isActive('/') ? '#0A0A0A' : '#71717A',
            fontSize: '0.8rem', fontWeight: 400, letterSpacing: '0.03em',
            transition: 'color 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = '#0A0A0A')}
            onMouseLeave={e => { if (!isActive('/')) e.currentTarget.style.color = '#71717A' }}
          >
            {t('nav', 'home')}
          </Link>
          <Link to="/articles" style={{
            textDecoration: 'none',
            color: isActive('/articles') ? '#0A0A0A' : '#71717A',
            fontSize: '0.8rem', fontWeight: 400, letterSpacing: '0.03em',
            transition: 'color 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = '#0A0A0A')}
            onMouseLeave={e => { if (!isActive('/articles')) e.currentTarget.style.color = '#71717A' }}
          >
            {t('nav', 'articles')}
          </Link>
        </div>
      </div>

      {/* Right: lang toggle + CTA */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {/* Lang toggle */}
        <div className="hidden md:flex" style={{
          border: '1px solid rgba(0,0,0,0.08)', borderRadius: '100px', overflow: 'hidden',
        }}>
          {(['fr', 'en'] as const).map(l => (
            <button key={l} onClick={() => setLang(l)} style={{
              padding: '0.35rem 0.8rem',
              fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.05em',
              textTransform: 'uppercase',
              background: lang === l ? '#1A1A6B' : 'transparent',
              color: lang === l ? '#fff' : '#71717A',
              border: 'none', transition: 'all 0.2s',
            }}>
              {l}
            </button>
          ))}
        </div>

        {/* CTA button */}
        <Link
          to="/booking"
          className="hidden md:inline-flex"
          style={{
            alignItems: 'center', gap: '0.4rem',
            padding: '0.6rem 1.4rem',
            background: '#0A0A0A', color: '#fff',
            textDecoration: 'none', borderRadius: '100px',
            fontSize: '0.78rem', fontWeight: 500, letterSpacing: '0.02em',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#1A1A6B' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#0A0A0A' }}
        >
          Let's talk →
        </Link>

        {/* Mobile burger */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{ background: 'none', border: 'none', color: '#0A0A0A', padding: '0.25rem' }}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          padding: '1.25rem 5vw',
          display: 'flex', flexDirection: 'column', gap: '1.25rem',
        }}>
          <Link to="/" onClick={() => setMobileOpen(false)}
            style={{ color: '#0A0A0A', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>
            {t('nav', 'home')}
          </Link>
          <Link to="/articles" onClick={() => setMobileOpen(false)}
            style={{ color: '#0A0A0A', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>
            {t('nav', 'articles')}
          </Link>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {(['fr', 'en'] as const).map(l => (
              <button key={l} onClick={() => { setLang(l); setMobileOpen(false) }}
                style={{
                  background: lang === l ? '#1A1A6B' : 'transparent',
                  color: lang === l ? '#fff' : '#71717A',
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: '100px', padding: '0.3rem 0.8rem',
                  fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase',
                }}>
                {l}
              </button>
            ))}
          </div>
          <Link
            to="/booking"
            onClick={() => setMobileOpen(false)}
            style={{
              display: 'inline-flex', justifyContent: 'center',
              padding: '0.75rem 1.5rem', background: '#0A0A0A', color: '#fff',
              borderRadius: '100px', textDecoration: 'none',
              fontSize: '0.85rem', fontWeight: 500,
            }}
          >
            Let's talk →
          </Link>
        </div>
      )}
    </nav>
  )
}
