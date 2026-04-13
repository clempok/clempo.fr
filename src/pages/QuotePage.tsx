import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

/* ───────────────────────── Constants ───────────────────────── */

const DEFAULT_ACCENT = '#1A1A6B'
const BG = '#FAF8F3'
const CARD_BG = '#FFFFFF'
const TEXT = '#0A0A0A'
const MUTED = '#71717A'
const BORDER = 'rgba(0,0,0,0.06)'
const FONT_TITLE = "'Space Grotesk', sans-serif"
const FONT_BODY = "'Inter', sans-serif"

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

/* ───────────────────────── Types ───────────────────────── */

type QuoteLine = {
  description: string
  detail?: string
  quantity: number
  unit?: string
  unitPrice: number
  tva?: number
  discount?: number
}

type QuoteData = {
  reference: string
  companyName: string
  clientName: string
  prospectLogo?: string
  date: string
  dueDate: string
  validUntil?: string
  offerTitle?: string
  context?: { title: string; description: string }
  presentation?: string
  arguments?: { title: string; description: string }[]
  lines: QuoteLine[]
  globalDiscount?: number
  notes: string
  paymentTerms?: string
  accentColor: string
  senderName: string
  senderCompany: string
  senderEmail: string
  senderPhone?: string
  senderPhoto?: string
  status: string
}

/* ───────────────────────── Helpers ───────────────────────── */

function fmt(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

/** Lighten/tint a hex color for subtle backgrounds */
function tint(hex: string, opacity: number): string {
  return hex + Math.round(opacity * 255).toString(16).padStart(2, '0')
}

/* ───────────────────────── Shared styles ───────────────────────── */

const cardStyle: React.CSSProperties = {
  background: CARD_BG,
  borderRadius: 16,
  border: `1px solid ${BORDER}`,
  boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
}

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: FONT_TITLE,
  fontSize: '0.7rem',
  fontWeight: 600,
  color: MUTED,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  marginBottom: '1.25rem',
}

/* ───────────────────────── Component ───────────────────────── */

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
    document.body.style.cursor = 'auto'
    const s = document.createElement('style')
    s.textContent = '*, a, button { cursor: auto !important; } a, button { cursor: pointer !important; }'
    document.head.appendChild(s)
    return () => { document.head.removeChild(s) }
  }, [quote])

  /* ── Loading state ── */
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: BG, fontFamily: FONT_BODY }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 44, height: 44,
            border: `3px solid ${DEFAULT_ACCENT}`, borderTopColor: 'transparent',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1.25rem',
          }} />
          <p style={{ color: MUTED, fontSize: '0.9rem' }}>Chargement du devis...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    )
  }

  /* ── Error / 404 state ── */
  if (error || !quote) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: BG, fontFamily: FONT_BODY }}>
        <div style={{ textAlign: 'center', maxWidth: 440, padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>404</div>
          <h1 style={{ fontFamily: FONT_TITLE, fontSize: '1.5rem', fontWeight: 700, color: TEXT, marginBottom: '0.5rem' }}>
            Devis introuvable
          </h1>
          <p style={{ color: MUTED, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Ce devis n'existe pas, a expiré ou le lien est incorrect.
          </p>
          <a href="https://www.clempo.fr" style={{
            display: 'inline-block', color: DEFAULT_ACCENT, fontWeight: 600,
            textDecoration: 'none', borderBottom: `1px solid ${DEFAULT_ACCENT}`,
            paddingBottom: 2,
          }}>
            Retour au site
          </a>
        </div>
      </div>
    )
  }

  /* ── Derived values ── */
  const accent = quote.accentColor || DEFAULT_ACCENT

  // Per-line calculations
  const linesComputed = quote.lines.map(l => {
    const tvaRate = l.tva ?? 20
    const discountRate = l.discount ?? 0
    const rawHT = l.quantity * l.unitPrice
    const lineHT = rawHT * (1 - discountRate / 100)
    const lineTVA = lineHT * (tvaRate / 100)
    return { ...l, tvaRate, discountRate, rawHT, lineHT, lineTVA }
  })

  const subtotalHT = linesComputed.reduce((s, l) => s + l.lineHT, 0)
  const globalDiscountRate = quote.globalDiscount ?? 0
  const globalDiscountAmount = subtotalHT * (globalDiscountRate / 100)
  const totalHTAfterDiscount = subtotalHT - globalDiscountAmount
  const totalTVA = linesComputed.reduce((s, l) => {
    const proportion = subtotalHT > 0 ? l.lineHT / subtotalHT : 0
    const adjustedHT = l.lineHT - globalDiscountAmount * proportion
    return s + adjustedHT * (l.tvaRate / 100)
  }, 0)
  const totalTTC = totalHTAfterDiscount + totalTVA

  const btnStyle: React.CSSProperties = {
    display: 'inline-block', background: accent, color: '#fff',
    padding: '0.8rem 2rem', borderRadius: 10, textDecoration: 'none',
    fontWeight: 600, fontSize: '0.9rem', border: 'none',
    transition: 'opacity 0.2s',
  }

  /* ── Render ── */
  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: FONT_BODY, color: TEXT }}>

      {/* ═══════ 1. HEADER BAR ═══════ */}
      <header style={{
        background: CARD_BG,
        borderBottom: `1px solid ${BORDER}`,
        padding: '1.25rem 2rem',
      }}>
        <div style={{
          maxWidth: 960, margin: '0 auto',
          display: 'grid', gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center', gap: '1.5rem',
        }}>
          {/* Left — sender contact */}
          <div>
            <div style={{ ...sectionTitleStyle, marginBottom: '0.5rem' }}>Votre contact</div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: TEXT }}>{quote.senderName}</div>
            <a href={`mailto:${quote.senderEmail}`} style={{ fontSize: '0.82rem', color: accent, textDecoration: 'none' }}>
              {quote.senderEmail}
            </a>
            {quote.senderPhone && (
              <div style={{ fontSize: '0.82rem', color: MUTED, marginTop: '0.15rem' }}>{quote.senderPhone}</div>
            )}
          </div>

          {/* Center — photo or initial */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {quote.senderPhoto ? (
              <img
                src={quote.senderPhoto}
                alt={quote.senderName}
                style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${tint(accent, 0.15)}` }}
              />
            ) : (
              <div style={{
                width: 64, height: 64, borderRadius: '50%', background: accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontFamily: FONT_TITLE, fontWeight: 700, fontSize: '1.5rem',
              }}>
                {quote.senderCompany.charAt(0)}
              </div>
            )}
          </div>

          {/* Right — quote ref + client */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: FONT_TITLE, fontWeight: 700, fontSize: '1rem', color: TEXT }}>
              DEVIS N° {quote.reference}
            </div>
            {quote.validUntil && (
              <div style={{ fontSize: '0.78rem', color: MUTED, marginTop: '0.2rem' }}>
                Valable jusqu'au {fmtDate(quote.validUntil)}
              </div>
            )}
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: TEXT, marginTop: '0.5rem' }}>
              {quote.clientName}
            </div>
            <div style={{ fontSize: '0.82rem', color: MUTED }}>{quote.companyName}</div>
          </div>
        </div>
      </header>

      {/* ═══════ MAIN CONTENT ═══════ */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '2.5rem 1.5rem 3rem' }}>

        {/* ═══════ 2. OFFER TITLE ═══════ */}
        {quote.offerTitle && (
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h1 style={{
              fontFamily: FONT_TITLE, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
              fontWeight: 700, color: TEXT, lineHeight: 1.15,
              margin: 0,
            }}>
              {quote.offerTitle}
            </h1>
            <div style={{ width: 60, height: 3, background: accent, borderRadius: 2, margin: '1rem auto 0' }} />
          </div>
        )}

        {/* ═══════ 3. PROSPECT LOGO ═══════ */}
        {quote.prospectLogo && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
            <div style={{
              background: CARD_BG, borderRadius: 16, padding: '1.5rem 2.5rem',
              boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
            }}>
              <img
                src={quote.prospectLogo}
                alt={`Logo ${quote.companyName}`}
                style={{ maxHeight: 80, maxWidth: 240, objectFit: 'contain' }}
              />
            </div>
          </div>
        )}

        {/* ═══════ 4. CONTEXT SECTION ═══════ */}
        {quote.context && (
          <div style={{ ...cardStyle, padding: '2rem 2.5rem', marginBottom: '2rem' }}>
            <h2 style={{ fontFamily: FONT_TITLE, fontSize: '1.3rem', fontWeight: 700, color: TEXT, marginTop: 0, marginBottom: '1rem' }}>
              {quote.context.title}
            </h2>
            <div
              style={{ fontSize: '0.95rem', lineHeight: 1.75, color: '#444' }}
              dangerouslySetInnerHTML={{ __html: quote.context.description }}
            />
          </div>
        )}

        {/* ═══════ 5. "POURQUOI COLLABORER" ═══════ */}
        {(quote.arguments && quote.arguments.length > 0) && (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ ...cardStyle, padding: '2rem 2.5rem' }}>
              <h2 style={{ fontFamily: FONT_TITLE, fontSize: '1.3rem', fontWeight: 700, color: TEXT, marginTop: 0, marginBottom: '1.5rem' }}>
                Pourquoi collaborer
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.min(quote.arguments.length, 3)}, 1fr)`,
                gap: '1.5rem',
                marginBottom: quote.presentation ? '2rem' : 0,
              }}>
                {quote.arguments.map((arg, i) => (
                  <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: tint(accent, 0.1),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: FONT_TITLE, fontWeight: 700, fontSize: '1rem',
                      color: accent, flexShrink: 0,
                    }}>
                      {i + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: TEXT, marginBottom: '0.3rem' }}>
                        {arg.title}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#555', lineHeight: 1.6 }}>
                        {arg.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Presentation / bio */}
              {quote.presentation && (
                <div style={{
                  borderTop: `1px solid ${BORDER}`, paddingTop: '1.5rem',
                  fontSize: '0.9rem', color: '#555', lineHeight: 1.75,
                }}>
                  {quote.presentation}
                </div>
              )}
            </div>
          </div>
        )}

        {/* If no arguments but presentation exists */}
        {(!quote.arguments || quote.arguments.length === 0) && quote.presentation && (
          <div style={{ ...cardStyle, padding: '2rem 2.5rem', marginBottom: '2rem' }}>
            <h2 style={{ fontFamily: FONT_TITLE, fontSize: '1.3rem', fontWeight: 700, color: TEXT, marginTop: 0, marginBottom: '1rem' }}>
              Votre consultant
            </h2>
            <div style={{ fontSize: '0.9rem', color: '#555', lineHeight: 1.75 }}>
              {quote.presentation}
            </div>
          </div>
        )}

        {/* ═══════ 6. PRODUCTS TABLE ═══════ */}
        <div style={{ ...cardStyle, overflow: 'hidden', marginBottom: '2rem' }}>
          <div style={{ padding: '1.5rem 2.5rem 0.5rem' }}>
            <h2 style={{ fontFamily: FONT_TITLE, fontSize: '1.3rem', fontWeight: 700, color: TEXT, marginTop: 0, marginBottom: 0 }}>
              Votre offre
            </h2>
          </div>
          <div style={{ padding: '0 2.5rem 2rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
              <thead>
                <tr>
                  {['Description', 'Qté', 'Unité', 'Prix HT', 'TVA', 'Total HT'].map((h, i) => (
                    <th key={i} style={{
                      padding: '0.75rem 0.75rem',
                      fontSize: '0.72rem', fontWeight: 600, color: MUTED,
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                      textAlign: i === 0 ? 'left' : 'right',
                      borderBottom: `2px solid ${TEXT}`,
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {linesComputed.map((l, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '1rem 0.75rem', maxWidth: 360 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem', color: TEXT }}>{l.description}</div>
                      {l.detail && (
                        <div
                          style={{ fontSize: '0.82rem', color: MUTED, lineHeight: 1.6, marginTop: '0.3rem' }}
                          dangerouslySetInnerHTML={{ __html: l.detail }}
                        />
                      )}
                    </td>
                    <td style={{ padding: '1rem 0.75rem', fontSize: '0.9rem', color: TEXT, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {l.quantity}
                    </td>
                    <td style={{ padding: '1rem 0.75rem', fontSize: '0.85rem', color: MUTED, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {l.unit || 'forfait'}
                    </td>
                    <td style={{ padding: '1rem 0.75rem', fontSize: '0.9rem', color: TEXT, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {fmt(l.unitPrice)}
                    </td>
                    <td style={{ padding: '1rem 0.75rem', fontSize: '0.85rem', color: MUTED, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {l.tvaRate}%
                    </td>
                    <td style={{ padding: '1rem 0.75rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {l.discountRate > 0 ? (
                        <div>
                          <span style={{ textDecoration: 'line-through', color: MUTED, fontSize: '0.8rem', marginRight: '0.5rem' }}>
                            {fmt(l.rawHT)}
                          </span>
                          <span style={{ fontWeight: 700, fontSize: '0.92rem', color: accent }}>
                            {fmt(l.lineHT)}
                          </span>
                          <div style={{ fontSize: '0.72rem', color: accent, marginTop: '0.15rem' }}>
                            -{l.discountRate}%
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontWeight: 600, fontSize: '0.92rem', color: TEXT }}>
                          {fmt(l.lineHT)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══════ 7. FINANCIAL SUMMARY ═══════ */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
          <div style={{ ...cardStyle, padding: '1.5rem 2rem', minWidth: 320 }}>
            {/* Sous-total HT */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.9rem' }}>
              <span style={{ color: MUTED }}>Sous-total HT</span>
              <span style={{ fontWeight: 600, color: TEXT }}>{fmt(subtotalHT)}</span>
            </div>

            {/* Global discount */}
            {globalDiscountRate > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.9rem' }}>
                <span style={{ color: accent }}>Remise globale ({globalDiscountRate}%)</span>
                <span style={{ fontWeight: 600, color: accent }}>-{fmt(globalDiscountAmount)}</span>
              </div>
            )}

            {/* TVA */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.9rem', borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ color: MUTED }}>TVA</span>
              <span style={{ fontWeight: 600, color: TEXT }}>{fmt(totalTVA)}</span>
            </div>

            {/* Total TTC */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0 0.5rem', alignItems: 'baseline' }}>
              <span style={{ fontFamily: FONT_TITLE, fontWeight: 700, fontSize: '1.05rem', color: TEXT }}>TOTAL TTC</span>
              <span style={{ fontFamily: FONT_TITLE, fontWeight: 700, fontSize: '1.6rem', color: accent }}>{fmt(totalTTC)}</span>
            </div>
          </div>
        </div>

        {/* ═══════ 8. PAYMENT TERMS ═══════ */}
        {quote.paymentTerms && (
          <div style={{ ...cardStyle, padding: '1.5rem 2rem', marginBottom: '2rem' }}>
            <h3 style={{ fontFamily: FONT_TITLE, fontSize: '1rem', fontWeight: 700, color: TEXT, marginTop: 0, marginBottom: '0.75rem' }}>
              Conditions de paiement
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#555', lineHeight: 1.7, margin: 0 }}>
              {quote.paymentTerms}
            </p>
          </div>
        )}

        {/* ═══════ 9. NOTES ═══════ */}
        {quote.notes && (
          <div style={{
            ...cardStyle,
            borderLeft: `4px solid ${accent}`,
            padding: '1.5rem 2rem',
            marginBottom: '2rem',
          }}>
            <p style={{ fontSize: '0.9rem', color: '#555', lineHeight: 1.75, margin: 0 }}>
              {quote.notes}
            </p>
          </div>
        )}

        {/* ═══════ 10. TRUST / REASSURANCE ═══════ */}
        <div style={{ ...cardStyle, padding: '2rem 2.5rem', marginBottom: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <h2 style={{
              fontFamily: FONT_TITLE, fontSize: '1.15rem', fontWeight: 700, color: TEXT, marginBottom: '0.4rem', marginTop: 0,
            }}>
              {quote.senderCompany} — Expert Marketing Santé
            </h2>
            <p style={{ fontSize: '0.88rem', color: MUTED, margin: 0, lineHeight: 1.6 }}>
              12 ans d'expérience dont 5 chez Doctolib. Part-time CMO & coaching pour startups santé.
            </p>
          </div>

          {/* Client names */}
          <div style={{ marginBottom: '1.75rem' }}>
            <p style={{ ...sectionTitleStyle, textAlign: 'center' }}>Ils nous ont fait confiance</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem' }}>
              {CLIENTS.map(c => (
                <span key={c} style={{
                  background: BG, padding: '0.4rem 0.9rem', borderRadius: 20,
                  fontSize: '0.8rem', fontWeight: 500, color: '#555', border: `1px solid ${BORDER}`,
                }}>
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Expertise badges */}
          <div style={{ marginBottom: '1.75rem' }}>
            <p style={{ ...sectionTitleStyle, textAlign: 'center' }}>Expertises</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem' }}>
              {EXPERTISES.map(e => (
                <span key={e} style={{
                  background: tint(accent, 0.06), padding: '0.4rem 0.9rem', borderRadius: 20,
                  fontSize: '0.8rem', fontWeight: 500, color: accent, border: `1px solid ${tint(accent, 0.15)}`,
                }}>
                  {e}
                </span>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center' }}>
            <a
              href="https://app.lemcal.com/@clementpougetosmont/30minutes"
              target="_blank"
              rel="noopener noreferrer"
              style={btnStyle}
            >
              Prendre rendez-vous
            </a>
          </div>
        </div>

        {/* ═══════ 11. FOOTER ═══════ */}
        <div style={{
          ...cardStyle,
          padding: '1.5rem 2.5rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '1rem',
        }}>
          <div style={{ fontSize: '0.88rem', color: '#666' }}>
            Des questions ? Contactez{' '}
            <a href={`mailto:${quote.senderEmail}`} style={{ color: accent, fontWeight: 600, textDecoration: 'none' }}>
              {quote.senderEmail}
            </a>
          </div>
          <a
            href={`mailto:${quote.senderEmail}?subject=Re: Devis ${encodeURIComponent(quote.reference)}`}
            style={btnStyle}
          >
            Répondre
          </a>
        </div>

        <p style={{
          textAlign: 'center', fontSize: '0.75rem', color: '#bbb',
          marginTop: '2rem', paddingBottom: '2rem',
        }}>
          &copy; {new Date().getFullYear()} {quote.senderCompany} &middot;{' '}
          <a href="https://www.clempo.fr" style={{ color: '#bbb', textDecoration: 'none' }}>www.clempo.fr</a>
        </p>
      </div>
    </div>
  )
}
