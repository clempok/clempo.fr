import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

const ACCENT = '#1A1A6B'
const BORDER = 'rgba(0,0,0,0.06)'
const BG_OFF = '#F8F8F6'
const MUTED = '#71717A'

const CLIENTS = [
  'Doctolib', 'Kiro', 'Santé Académie', 'Cherry Biotech', 'Neok',
  'Médéré', 'Sorcova', 'DocCity', 'Semble', 'Andrew',
]

const EXPERTISES = [
  'Go-to-market santé',
  'Growth marketing B2B',
  'Part-Time CMO',
  'Stratégie digitale healthtech',
  'Lead generation médical',
  'Marketing pharma & medtech',
]

type QuoteLine = { description: string; quantity: number; unitPrice: number }

type QuoteData = {
  reference: string
  companyName: string
  clientName: string
  date: string
  dueDate: string
  lines: QuoteLine[]
  notes: string
  accentColor: string
  senderName: string
  senderCompany: string
  senderEmail: string
  status: string
}

function fmt(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function QuotePage() {
  const { company, id } = useParams<{ company: string; id: string }>()
  const [quote, setQuote] = useState<QuoteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!company || !id) return
    fetch(`/.netlify/functions/get-quote?company=${encodeURIComponent(company)}&ref=${encodeURIComponent(id)}`)
      .then(r => {
        if (!r.ok) throw new Error('Devis introuvable')
        return r.json()
      })
      .then(d => setQuote(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [company, id])

  useEffect(() => {
    document.title = quote
      ? `Devis ${quote.reference} — ${quote.senderCompany}`
      : 'Devis — Clempo'
    // Hide cursor effect
    document.body.style.cursor = 'auto'
    const s = document.createElement('style')
    s.textContent = '*, a, button { cursor: auto !important; } a, button { cursor: pointer !important; }'
    document.head.appendChild(s)
    return () => { document.head.removeChild(s) }
  }, [quote])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${ACCENT}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: MUTED, fontSize: '0.9rem' }}>Chargement du devis...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    )
  }

  if (error || !quote) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0A0A0A', marginBottom: '0.5rem' }}>Devis introuvable</h1>
          <p style={{ color: MUTED, fontSize: '0.9rem' }}>Ce devis n'existe pas ou a expiré.</p>
          <a href="https://www.clempo.fr" style={{ display: 'inline-block', marginTop: '1.5rem', color: ACCENT, fontWeight: 600, textDecoration: 'none' }}>
            Retour au site
          </a>
        </div>
      </div>
    )
  }

  const accent = quote.accentColor || ACCENT
  const totalHT = quote.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0)
  const tva = totalHT * 0.2
  const totalTTC = totalHT + tva

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      {/* Header bar */}
      <header style={{
        background: '#fff', borderBottom: '1px solid #e5e5e5',
        padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', background: accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: '0.85rem',
          }}>
            {quote.senderCompany.charAt(0)}
          </div>
          <div>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111' }}>{quote.senderCompany}</span>
            <span style={{ display: 'block', fontSize: '0.75rem', color: MUTED }}>{quote.senderName}</span>
          </div>
        </div>
        <a href="https://www.clempo.fr" style={{ fontSize: '0.8rem', color: accent, textDecoration: 'none', fontWeight: 600 }}>
          www.clempo.fr
        </a>
      </header>

      {/* Main content */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Quote card */}
        <div style={{
          background: '#fff', borderRadius: 16, border: `1px solid ${BORDER}`,
          boxShadow: '0 4px 24px rgba(0,0,0,0.04)', overflow: 'hidden',
        }}>
          {/* Quote header */}
          <div style={{ padding: '2rem 2.5rem', borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '1.6rem', fontWeight: 700, color: '#0A0A0A', marginBottom: '0.25rem',
                }}>
                  Devis {quote.reference}
                </h1>
                <p style={{ fontSize: '0.9rem', color: MUTED }}>
                  Pour {quote.companyName}
                </p>
              </div>
              <div style={{
                background: accent + '12', border: `1px solid ${accent}30`,
                borderRadius: 10, padding: '1rem 1.25rem', textAlign: 'right',
              }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: accent }}>{fmt(totalTTC)}</span>
                <span style={{ display: 'block', fontSize: '0.78rem', color: MUTED, marginTop: '0.15rem' }}>TTC</span>
              </div>
            </div>

            {/* Meta info */}
            <div style={{ display: 'flex', gap: '2rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
              {[
                { label: 'Date', value: fmtDate(quote.date) },
                { label: 'Échéance', value: fmtDate(quote.dueDate) },
                { label: 'Client', value: quote.clientName },
              ].map((m, i) => (
                <div key={i}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</span>
                  <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#333', marginTop: '0.15rem' }}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Lines table */}
          <div style={{ padding: '0 2.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1.5rem 0' }}>
              <thead>
                <tr style={{ background: accent }}>
                  {['Description', 'Qté', 'Prix unitaire', 'Total'].map((h, i) => (
                    <th key={i} style={{
                      padding: '0.75rem 1rem', color: '#fff', fontSize: '0.78rem', fontWeight: 600,
                      textAlign: i === 0 ? 'left' : 'right', letterSpacing: '0.03em',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {quote.lines.map((l, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.9rem', color: '#333' }}>{l.description}</td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.9rem', color: '#333', textAlign: 'right' }}>{l.quantity}</td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.9rem', color: '#333', textAlign: 'right' }}>{fmt(l.unitPrice)}</td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.9rem', color: '#333', textAlign: 'right', fontWeight: 600 }}>{fmt(l.quantity * l.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ padding: '0.6rem 1rem', textAlign: 'right', fontSize: '0.85rem', color: '#666' }}>Total HT</td>
                  <td style={{ padding: '0.6rem 1rem', textAlign: 'right', fontSize: '0.9rem', fontWeight: 600, color: '#333' }}>{fmt(totalHT)}</td>
                </tr>
                <tr>
                  <td colSpan={3} style={{ padding: '0.6rem 1rem', textAlign: 'right', fontSize: '0.85rem', color: '#666' }}>TVA (20%)</td>
                  <td style={{ padding: '0.6rem 1rem', textAlign: 'right', fontSize: '0.9rem', color: '#333' }}>{fmt(tva)}</td>
                </tr>
                <tr style={{ background: BG_OFF }}>
                  <td colSpan={3} style={{ padding: '1rem', textAlign: 'right', fontSize: '1rem', fontWeight: 700, color: '#111' }}>Total TTC</td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontSize: '1.1rem', fontWeight: 700, color: accent }}>{fmt(totalTTC)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div style={{ padding: '0 2.5rem 2rem' }}>
              <div style={{
                background: BG_OFF, borderRadius: 10, padding: '1rem 1.25rem',
                borderLeft: `3px solid ${accent}`, fontSize: '0.88rem', color: '#555', lineHeight: 1.7,
              }}>
                {quote.notes}
              </div>
            </div>
          )}

          {/* Contact */}
          <div style={{
            padding: '1.5rem 2.5rem', borderTop: `1px solid ${BORDER}`, background: '#fafafa',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
          }}>
            <div style={{ fontSize: '0.85rem', color: '#666' }}>
              Des questions ? Contactez{' '}
              <a href={`mailto:${quote.senderEmail}`} style={{ color: accent, fontWeight: 600, textDecoration: 'none' }}>
                {quote.senderEmail}
              </a>
            </div>
            <a
              href={`mailto:${quote.senderEmail}?subject=Re: ${encodeURIComponent(quote.reference)}`}
              style={{
                display: 'inline-block', background: accent, color: '#fff',
                padding: '0.7rem 1.5rem', borderRadius: 8, textDecoration: 'none',
                fontWeight: 600, fontSize: '0.85rem',
              }}
            >
              Répondre
            </a>
          </div>
        </div>

        {/* Trust section */}
        <div style={{
          marginTop: '2rem', background: '#fff', borderRadius: 16, border: `1px solid ${BORDER}`,
          padding: '2rem 2.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '1.1rem', fontWeight: 700, color: '#0A0A0A', marginBottom: '0.35rem',
            }}>
              {quote.senderCompany} — Expert Marketing Santé
            </h2>
            <p style={{ fontSize: '0.85rem', color: MUTED }}>
              12 ans d'expérience dont 5 chez Doctolib. Part-time CMO & coaching pour startups santé.
            </p>
          </div>

          {/* Client logos */}
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem', textAlign: 'center' }}>
              Ils nous ont fait confiance
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem' }}>
              {CLIENTS.map(c => (
                <span key={c} style={{
                  background: BG_OFF, padding: '0.4rem 0.85rem', borderRadius: 20,
                  fontSize: '0.78rem', fontWeight: 500, color: '#555', border: `1px solid ${BORDER}`,
                }}>
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Expertises */}
          <div>
            <p style={{ fontSize: '0.7rem', fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem', textAlign: 'center' }}>
              Expertises
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem' }}>
              {EXPERTISES.map(e => (
                <span key={e} style={{
                  background: accent + '0a', padding: '0.4rem 0.85rem', borderRadius: 20,
                  fontSize: '0.78rem', fontWeight: 500, color: accent, border: `1px solid ${accent}20`,
                }}>
                  {e}
                </span>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <a
              href="https://app.lemcal.com/@clementpougetosmont/30minutes"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block', background: accent, color: '#fff',
                padding: '0.75rem 2rem', borderRadius: 10, textDecoration: 'none',
                fontWeight: 600, fontSize: '0.85rem',
              }}
            >
              Prendre rendez-vous
            </a>
          </div>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#bbb', marginTop: '2rem', paddingBottom: '2rem' }}>
          &copy; {new Date().getFullYear()} {quote.senderCompany} &middot;{' '}
          <a href="https://www.clempo.fr" style={{ color: '#bbb' }}>www.clempo.fr</a>
        </p>
      </div>
    </div>
  )
}
