import { Link } from 'react-router-dom'
import { CalendarCheck } from 'lucide-react'

const ACCENT = '#1A1A6B'

export default function Confirmation() {
  return (
    <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
      <div style={{ maxWidth: 560, textAlign: 'center' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          backgroundColor: 'rgba(26,26,107,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 32px',
        }}>
          <CalendarCheck size={34} color={ACCENT} />
        </div>

        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 'clamp(28px, 5vw, 40px)',
          fontWeight: 700,
          color: '#0A0A0A',
          marginBottom: 20,
          lineHeight: 1.2,
        }}>
          C'est noté, à très vite !
        </h1>

        <p style={{
          fontSize: 18,
          color: '#71717A',
          lineHeight: 1.7,
          marginBottom: 12,
        }}>
          Merci d'avoir pris le temps de réserver un créneau.
        </p>
        <p style={{
          fontSize: 18,
          color: '#71717A',
          lineHeight: 1.7,
          marginBottom: 48,
        }}>
          J'ai hâte d'échanger avec vous et de découvrir votre projet.
        </p>

        <Link
          to="/"
          style={{
            display: 'inline-block',
            backgroundColor: ACCENT,
            color: '#fff',
            padding: '14px 32px',
            borderRadius: 12,
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 600,
            fontSize: 15,
            textDecoration: 'none',
            letterSpacing: '0.01em',
          }}
        >
          Retour à l'accueil
        </Link>
      </div>
    </main>
  )
}
