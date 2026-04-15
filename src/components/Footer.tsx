import { Link } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { bookingUrl } from '../lib/cta'

export default function Footer() {
  const { t } = useLang()

  return (
    <footer style={{
      padding: '2.5rem 4vw',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      borderTop: '1px solid rgba(0,0,0,0.06)',
      flexWrap: 'wrap', gap: '1rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700, fontSize: '0.9rem', color: '#0A0A0A', letterSpacing: '-0.02em',
        }}>
          clempo.fr
        </span>
        <span style={{ color: '#A1A1AA', fontSize: '0.72rem' }}>
          © {new Date().getFullYear()} Clément Pouget-Osmont
        </span>
      </div>
      <div style={{ display: 'flex', gap: '2rem' }}>
        <Link to="/articles"
          style={{ textDecoration: 'none', color: '#71717A', fontSize: '0.78rem', transition: 'color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#1A1A6B')}
          onMouseLeave={e => (e.currentTarget.style.color = '#71717A')}
        >
          {t('nav', 'articles')}
        </Link>
        <Link to={bookingUrl('footer')}
          style={{ textDecoration: 'none', color: '#71717A', fontSize: '0.78rem', transition: 'color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#1A1A6B')}
          onMouseLeave={e => (e.currentTarget.style.color = '#71717A')}
        >
          {t('footer', 'contact')}
        </Link>
        <a href="https://linkedin.com/in/clementpougetosmont"
          target="_blank" rel="noopener noreferrer"
          style={{ textDecoration: 'none', color: '#71717A', fontSize: '0.78rem', transition: 'color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#1A1A6B')}
          onMouseLeave={e => (e.currentTarget.style.color = '#71717A')}
        >
          LinkedIn
        </a>
      </div>
    </footer>
  )
}
