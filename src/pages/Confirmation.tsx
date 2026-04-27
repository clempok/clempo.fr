import { Link } from 'react-router-dom'
import { CalendarCheck } from 'lucide-react'
import Wordmark from '../components/Wordmark'

export default function Confirmation() {
  return (
    <main style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '80px 24px',
      background: 'var(--paper)',
      color: 'var(--ink)',
      fontFamily: 'var(--font-sans)',
    }}>
      <div style={{ maxWidth: 560, textAlign: 'center' }}>
        <div style={{
          width: 72, height: 72,
          borderRadius: 'var(--cb-radius)',
          backgroundColor: 'var(--ink)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 32px',
        }}>
          <CalendarCheck size={34} color="var(--signal)" />
        </div>

        <span style={{
          display: 'inline-block',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--signal)',
          fontWeight: 500,
          marginBottom: '1rem',
        }}>
          // status · confirmed
        </span>

        <h1 style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'clamp(28px, 5vw, 40px)',
          fontWeight: 700,
          letterSpacing: '-0.03em',
          color: 'var(--ink)',
          marginBottom: 20,
          lineHeight: 1.15,
        }}>
          C'est noté, à très vite<span style={{ color: 'var(--signal)' }}>.</span>
        </h1>

        <p style={{
          fontSize: 17,
          color: 'var(--graphite)',
          lineHeight: 1.65,
          marginBottom: 12,
        }}>
          Merci d'avoir pris le temps de réserver un créneau.
        </p>
        <p style={{
          fontSize: 17,
          color: 'var(--graphite)',
          lineHeight: 1.65,
          marginBottom: 40,
        }}>
          J'ai hâte d'échanger avec vous et de découvrir votre projet.
        </p>

        <Link to="/" className="cb-btn cb-btn--primary">
          Retour à l'accueil <span className="cb-arrow">→</span>
        </Link>

        <div style={{
          marginTop: '4rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(10,10,11,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Wordmark size="0.85rem" />
          <span className="cb-page-marker">— clempo.fr · 2026</span>
        </div>
      </div>
    </main>
  )
}
