import { Link } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { bookingUrl } from '../lib/cta'
import Wordmark from './Wordmark'

export default function Footer() {
  const { t } = useLang()

  const linkStyle: React.CSSProperties = {
    textDecoration: 'none',
    color: 'var(--steel)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    transition: 'color 0.2s',
  }

  return (
    <footer style={{
      background: 'var(--ink)',
      color: 'var(--paper)',
      padding: '3rem 4vw 2rem',
      borderTop: '1px solid rgba(10,10,11,0.1)',
    }}>
      <div style={{
        maxWidth: '1320px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Wordmark size="1rem" color="var(--paper)" />
          <span style={{
            fontFamily: 'var(--font-mono)',
            color: 'var(--steel)',
            fontSize: '0.7rem',
            letterSpacing: '0.05em',
          }}>
            © {new Date().getFullYear()} Clément Pouget-Osmont
          </span>
        </div>

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <Link to="/articles"
            style={linkStyle}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--signal)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--steel)')}
          >
            {t('nav', 'articles')}
          </Link>
          <Link to={bookingUrl('footer')}
            style={linkStyle}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--signal)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--steel)')}
          >
            {t('footer', 'contact')}
          </Link>
          <a href="https://linkedin.com/in/clementpougetosmont"
            target="_blank" rel="noopener noreferrer"
            style={linkStyle}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--signal)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--steel)')}
          >
            LinkedIn
          </a>
        </div>
      </div>

      <div style={{
        maxWidth: '1320px',
        margin: '2rem auto 0',
        paddingTop: '1.5rem',
        borderTop: '1px solid rgba(237,235,228,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.5rem',
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.68rem',
          color: 'var(--graphite)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          // Fractional CMO · Healthcare
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.68rem',
          color: 'var(--graphite)',
          letterSpacing: '0.08em',
        }}>
          clempo.fr · Brand V1 · 2026
        </span>
      </div>
    </footer>
  )
}
