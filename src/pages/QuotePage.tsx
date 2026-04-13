import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

/* ───────────────────────── Constants ───────────────────────── */

const DEFAULT_ACCENT = '#1A1A6B'
const BG = '#FAF8F3'
const CARD = '#FFFFFF'
const TEXT = '#0A0A0A'
const MUTED = '#71717A'
const BORDER = 'rgba(0,0,0,0.06)'
const FT = "'Space Grotesk', sans-serif"
const FB = "'Inter', sans-serif"

const CLIENTS = [
  'Doctolib', 'Kiro', 'Santé Académie', 'Cherry Biotech', 'Neok',
  'Médéré', 'Sorcova', 'DocCity', 'Semble', 'Andrew',
]
const EXPERTISES = [
  'Go-to-market santé', 'Growth marketing B2B', 'Part-Time CMO',
  'Stratégie digitale healthtech', 'Lead generation médical', 'Marketing pharma & medtech',
]

const DEFAULT_PHOTO = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6913248fb7d48a3e5503c26d/48d8d0835_nano-banana-2025-11-11T10-55-151.png'

/* ───────────────────────── Types ───────────────────────── */

type QuoteLine = {
  description: string; detail?: string; quantity: number
  unit?: string; unitPrice: number; tva?: number; discount?: number
}

type QuoteData = {
  reference: string; companyName: string; clientName: string
  prospectLogo?: string; date: string; dueDate: string; validUntil?: string
  offerTitle?: string; context?: { title: string; description: string }
  presentation?: string; arguments?: { title: string; description: string }[]
  lines: QuoteLine[]; globalDiscount?: number; notes: string
  paymentTerms?: string; accentColor: string
  senderName: string; senderCompany: string; senderEmail: string
  senderPhone?: string; senderPhoto?: string; status: string
}

/* ───────────────────────── Helpers ───────────────────────── */

const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

/* ───────────────────────── Component ───────────────────────── */

export default function QuotePage() {
  const { company, id } = useParams<{ company: string; id: string }>()
  const [quote, setQuote] = useState<QuoteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!company || !id) return
    fetch(`/.netlify/functions/get-quote?company=${encodeURIComponent(company)}&ref=${encodeURIComponent(id)}`)
      .then(r => { if (!r.ok) throw new Error('Devis introuvable'); return r.json() })
      .then(d => setQuote(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [company, id])

  useEffect(() => {
    document.title = quote ? `Devis ${quote.reference} — ${quote.senderCompany}` : 'Devis — Clempo'
    document.body.style.cursor = 'auto'
    const s = document.createElement('style')
    s.textContent = `
      *, a, button { cursor: auto !important; }
      a, button { cursor: pointer !important; }
      @keyframes spin { to { transform: rotate(360deg) } }
      @keyframes fadeUp { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
      .q-fade { animation: fadeUp 0.6s ease-out both; }
      .q-fade-1 { animation-delay: 0.1s; }
      .q-fade-2 { animation-delay: 0.2s; }
      .q-fade-3 { animation-delay: 0.3s; }
      .q-fade-4 { animation-delay: 0.4s; }
    `
    document.head.appendChild(s)
    return () => { document.head.removeChild(s) }
  }, [quote])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: BG, fontFamily: FB }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, border: `3px solid ${DEFAULT_ACCENT}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1.25rem' }} />
          <p style={{ color: MUTED, fontSize: '0.9rem' }}>Chargement du devis...</p>
        </div>
      </div>
    )
  }

  if (error || !quote) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: BG, fontFamily: FB }}>
        <div style={{ textAlign: 'center', maxWidth: 440, padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.2 }}>404</div>
          <h1 style={{ fontFamily: FT, fontSize: '1.5rem', fontWeight: 700, color: TEXT }}>Devis introuvable</h1>
          <p style={{ color: MUTED, fontSize: '0.9rem', lineHeight: 1.6, margin: '0.5rem 0 1.5rem' }}>Ce devis n'existe pas ou a expiré.</p>
          <a href="https://www.clempo.fr" style={{ color: DEFAULT_ACCENT, fontWeight: 600, textDecoration: 'none' }}>Retour au site</a>
        </div>
      </div>
    )
  }

  const accent = quote.accentColor || DEFAULT_ACCENT
  const photo = quote.senderPhoto || DEFAULT_PHOTO

  // Financial calculations
  const linesComputed = quote.lines.map(l => {
    const tvaRate = l.tva ?? 20, discountRate = l.discount ?? 0
    const rawHT = l.quantity * l.unitPrice
    const lineHT = rawHT * (1 - discountRate / 100)
    const lineTVA = lineHT * (tvaRate / 100)
    return { ...l, tvaRate, discountRate, rawHT, lineHT, lineTVA }
  })
  const subtotalHT = linesComputed.reduce((s, l) => s + l.lineHT, 0)
  const gd = quote.globalDiscount ?? 0
  const gdAmount = subtotalHT * (gd / 100)
  const totalHT = subtotalHT - gdAmount
  const totalTVA = linesComputed.reduce((s, l) => {
    const p = subtotalHT > 0 ? l.lineHT / subtotalHT : 0
    return s + (l.lineHT - gdAmount * p) * (l.tvaRate / 100)
  }, 0)
  const totalTTC = totalHT + totalTVA

  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: FB, color: TEXT }}>

      {/* ═══════════════════════════════════════════════════════
          HERO — Photo + Présentation + Expertise + Clients
          ═══════════════════════════════════════════════════════ */}
      <div style={{
        background: `linear-gradient(135deg, ${accent} 0%, ${accent}dd 50%, ${accent}bb 100%)`,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Subtle pattern overlay */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />

        <div style={{
          maxWidth: 960, margin: '0 auto', padding: '3.5rem 2rem 3rem',
          position: 'relative', zIndex: 1,
        }}>
          {/* Top bar: reference + validity */}
          <div className="q-fade" style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '2.5rem', flexWrap: 'wrap', gap: '0.5rem',
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
              padding: '0.5rem 1rem', borderRadius: 8,
              fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)',
              letterSpacing: '0.05em',
            }}>
              DEVIS N° {quote.reference}
            </div>
            {quote.validUntil && (
              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)' }}>
                Valable jusqu'au {fmtDate(quote.validUntil)}
              </div>
            )}
          </div>

          {/* Main hero content */}
          <div className="q-fade q-fade-1" style={{
            display: 'flex', gap: '2.5rem', alignItems: 'center',
            flexWrap: 'wrap',
          }}>
            {/* Photo */}
            <div style={{ flexShrink: 0 }}>
              <img
                src={photo}
                alt={quote.senderName}
                style={{
                  width: 140, height: 140, borderRadius: 20, objectFit: 'cover',
                  border: '4px solid rgba(255,255,255,0.25)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
                }}
              />
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{
                fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.12em', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem',
              }}>
                Votre contact
              </div>
              <h1 style={{
                fontFamily: FT, fontSize: '1.8rem', fontWeight: 700,
                color: '#fff', margin: '0 0 0.35rem', lineHeight: 1.2,
              }}>
                {quote.senderName}
              </h1>
              <p style={{
                fontSize: '1rem', color: 'rgba(255,255,255,0.8)',
                margin: '0 0 1rem', lineHeight: 1.5,
              }}>
                Healthcare Marketing Director — {quote.senderCompany}
              </p>

              {/* Contact pills */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <a href={`mailto:${quote.senderEmail}`} style={{
                  background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                  padding: '0.4rem 0.85rem', borderRadius: 20,
                  fontSize: '0.8rem', color: '#fff', textDecoration: 'none',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}>
                  {quote.senderEmail}
                </a>
                {quote.senderPhone && (
                  <span style={{
                    background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                    padding: '0.4rem 0.85rem', borderRadius: 20,
                    fontSize: '0.8rem', color: '#fff',
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}>
                    {quote.senderPhone}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Expertise badges */}
          <div className="q-fade q-fade-2" style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {EXPERTISES.map(e => (
                <span key={e} style={{
                  background: 'rgba(255,255,255,0.12)',
                  padding: '0.35rem 0.8rem', borderRadius: 20,
                  fontSize: '0.75rem', fontWeight: 500, color: 'rgba(255,255,255,0.85)',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}>
                  {e}
                </span>
              ))}
            </div>
          </div>

          {/* Client logos */}
          <div className="q-fade q-fade-3" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
            <div style={{
              fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.1em', color: 'rgba(255,255,255,0.45)', marginBottom: '0.75rem',
            }}>
              Ils m'ont fait confiance
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              {CLIENTS.map(c => (
                <span key={c} style={{
                  fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)',
                }}>
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          CONTENT AREA
          ═══════════════════════════════════════════════════════ */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '2.5rem 2rem 3rem' }}>

        {/* ── Client info bar ── */}
        <div className="q-fade q-fade-1" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem',
          background: CARD, borderRadius: 16, padding: '1.25rem 2rem',
          border: `1px solid ${BORDER}`, boxShadow: '0 2px 16px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {quote.prospectLogo ? (
              <img src={quote.prospectLogo} alt={quote.companyName}
                style={{ height: 40, maxWidth: 120, objectFit: 'contain' }} />
            ) : (
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: `${accent}10`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: FT, fontWeight: 700, fontSize: '1.1rem', color: accent,
              }}>
                {quote.companyName.charAt(0)}
              </div>
            )}
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: TEXT }}>{quote.companyName}</div>
              <div style={{ fontSize: '0.82rem', color: MUTED }}>{quote.clientName}</div>
            </div>
          </div>
          <div style={{
            background: `${accent}0a`, border: `1px solid ${accent}20`,
            borderRadius: 12, padding: '0.65rem 1.25rem', textAlign: 'center',
          }}>
            <div style={{ fontFamily: FT, fontWeight: 700, fontSize: '1.35rem', color: accent }}>{fmt(totalTTC)}</div>
            <div style={{ fontSize: '0.68rem', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total TTC</div>
          </div>
        </div>

        {/* ── Offer title ── */}
        {quote.offerTitle && (
          <div className="q-fade q-fade-2" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{
              fontFamily: FT, fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 700,
              color: TEXT, margin: 0, lineHeight: 1.15,
            }}>
              {quote.offerTitle}
            </h2>
            <div style={{ width: 48, height: 3, background: accent, borderRadius: 2, margin: '0.85rem auto 0' }} />
          </div>
        )}

        {/* ── Context ── */}
        {quote.context && (
          <div className="q-fade q-fade-2" style={{
            background: CARD, borderRadius: 20, padding: '2.5rem',
            border: `1px solid ${BORDER}`, boxShadow: '0 4px 24px rgba(0,0,0,0.03)',
            marginBottom: '2rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, background: `${accent}12`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2.5px solid ${accent}` }} />
              </div>
              <h3 style={{ fontFamily: FT, fontSize: '1.2rem', fontWeight: 700, color: TEXT, margin: 0 }}>
                {quote.context.title}
              </h3>
            </div>
            <div
              style={{ fontSize: '0.95rem', lineHeight: 1.8, color: '#444' }}
              dangerouslySetInnerHTML={{ __html: quote.context.description }}
            />
          </div>
        )}

        {/* ── Arguments "Pourquoi collaborer" ── */}
        {quote.arguments && quote.arguments.length > 0 && (
          <div className="q-fade q-fade-3" style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(quote.arguments.length, 3)}, 1fr)`,
            gap: '1rem', marginBottom: '2rem',
          }}>
            {quote.arguments.map((arg, i) => (
              <div key={i} style={{
                background: CARD, borderRadius: 20, padding: '2rem',
                border: `1px solid ${BORDER}`, boxShadow: '0 4px 24px rgba(0,0,0,0.03)',
                transition: 'transform 0.25s, box-shadow 0.25s',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14, marginBottom: '1rem',
                  background: `linear-gradient(135deg, ${accent}18, ${accent}08)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: FT, fontWeight: 800, fontSize: '1.1rem', color: accent,
                }}>
                  {i + 1}
                </div>
                <h4 style={{ fontFamily: FT, fontSize: '1rem', fontWeight: 700, color: TEXT, margin: '0 0 0.5rem' }}>
                  {arg.title}
                </h4>
                <p style={{ fontSize: '0.88rem', color: '#555', lineHeight: 1.65, margin: 0 }}>
                  {arg.description}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── Presentation / bio ── */}
        {quote.presentation && (
          <div className="q-fade q-fade-3" style={{
            background: CARD, borderRadius: 20, padding: '2rem 2.5rem',
            border: `1px solid ${BORDER}`, boxShadow: '0 4px 24px rgba(0,0,0,0.03)',
            marginBottom: '2rem',
            display: 'flex', gap: '1.5rem', alignItems: 'flex-start',
          }}>
            <img src={photo} alt={quote.senderName} style={{
              width: 56, height: 56, borderRadius: 14, objectFit: 'cover', flexShrink: 0,
            }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: TEXT, marginBottom: '0.4rem' }}>
                {quote.senderName}
              </div>
              <p style={{ fontSize: '0.9rem', color: '#555', lineHeight: 1.75, margin: 0 }}>
                {quote.presentation}
              </p>
            </div>
          </div>
        )}

        {/* ═══════ VOTRE OFFRE — Products table ═══════ */}
        <div className="q-fade q-fade-3" style={{
          background: CARD, borderRadius: 20, overflow: 'hidden',
          border: `1px solid ${BORDER}`, boxShadow: '0 4px 24px rgba(0,0,0,0.03)',
          marginBottom: '1.5rem',
        }}>
          {/* Table header band */}
          <div style={{
            background: `linear-gradient(135deg, ${accent}, ${accent}dd)`,
            padding: '1.25rem 2.5rem',
          }}>
            <h3 style={{ fontFamily: FT, fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>
              Votre offre
            </h3>
          </div>

          <div style={{ padding: '0 2.5rem 2rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Description', 'Qté', 'Unité', 'Prix HT', 'TVA', 'Total HT'].map((h, i) => (
                    <th key={i} style={{
                      padding: '1rem 0.75rem 0.75rem',
                      fontSize: '0.68rem', fontWeight: 700, color: MUTED,
                      textTransform: 'uppercase', letterSpacing: '0.1em',
                      textAlign: i === 0 ? 'left' : 'right',
                      borderBottom: `1px solid ${BORDER}`,
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {linesComputed.map((l, i) => (
                  <tr key={i} style={{ borderBottom: i < linesComputed.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                    <td style={{ padding: '1.25rem 0.75rem', maxWidth: 380 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: TEXT }}>{l.description}</div>
                      {l.detail && (
                        <div
                          style={{ fontSize: '0.82rem', color: MUTED, lineHeight: 1.65, marginTop: '0.35rem' }}
                          dangerouslySetInnerHTML={{ __html: l.detail }}
                        />
                      )}
                    </td>
                    <td style={{ padding: '1.25rem 0.75rem', fontSize: '0.9rem', textAlign: 'right', fontWeight: 600 }}>{l.quantity}</td>
                    <td style={{ padding: '1.25rem 0.75rem', fontSize: '0.82rem', color: MUTED, textAlign: 'right' }}>{l.unit || 'forfait'}</td>
                    <td style={{ padding: '1.25rem 0.75rem', fontSize: '0.9rem', textAlign: 'right' }}>{fmt(l.unitPrice)}</td>
                    <td style={{ padding: '1.25rem 0.75rem', fontSize: '0.82rem', color: MUTED, textAlign: 'right' }}>{l.tvaRate}%</td>
                    <td style={{ padding: '1.25rem 0.75rem', textAlign: 'right' }}>
                      {l.discountRate > 0 ? (
                        <>
                          <span style={{ textDecoration: 'line-through', color: '#ccc', fontSize: '0.78rem', marginRight: 6 }}>{fmt(l.rawHT)}</span>
                          <span style={{ fontWeight: 700, color: accent }}>{fmt(l.lineHT)}</span>
                          <div style={{ fontSize: '0.68rem', color: accent, marginTop: 2 }}>-{l.discountRate}%</div>
                        </>
                      ) : (
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{fmt(l.lineHT)}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══════ FINANCIAL SUMMARY ═══════ */}
        <div className="q-fade q-fade-4" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
          <div style={{
            background: CARD, borderRadius: 20, padding: '1.75rem 2.25rem', minWidth: 340,
            border: `1px solid ${BORDER}`, boxShadow: '0 4px 24px rgba(0,0,0,0.03)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.9rem' }}>
              <span style={{ color: MUTED }}>Sous-total HT</span>
              <span style={{ fontWeight: 600 }}>{fmt(subtotalHT)}</span>
            </div>
            {gd > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.9rem' }}>
                <span style={{ color: accent }}>Remise globale ({gd}%)</span>
                <span style={{ fontWeight: 600, color: accent }}>-{fmt(gdAmount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.9rem' }}>
              <span style={{ color: MUTED }}>TVA</span>
              <span style={{ fontWeight: 600 }}>{fmt(totalTVA)}</span>
            </div>
            <div style={{ height: 1, background: BORDER, margin: '0.75rem 0' }} />
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              padding: '0.5rem 0',
            }}>
              <span style={{ fontFamily: FT, fontWeight: 700, fontSize: '1rem' }}>TOTAL TTC</span>
              <span style={{ fontFamily: FT, fontWeight: 800, fontSize: '1.75rem', color: accent }}>{fmt(totalTTC)}</span>
            </div>
          </div>
        </div>

        {/* ═══════ PAYMENT TERMS ═══════ */}
        {quote.paymentTerms && (
          <div style={{
            background: CARD, borderRadius: 20, padding: '1.75rem 2.25rem',
            border: `1px solid ${BORDER}`, boxShadow: '0 4px 24px rgba(0,0,0,0.03)',
            marginBottom: '1.5rem',
          }}>
            <h3 style={{ fontFamily: FT, fontSize: '1rem', fontWeight: 700, margin: '0 0 0.65rem' }}>
              Conditions de paiement
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#555', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap' }}>
              {quote.paymentTerms}
            </p>
          </div>
        )}

        {/* ═══════ NOTES ═══════ */}
        {quote.notes && (
          <div style={{
            background: CARD, borderRadius: 20, padding: '1.75rem 2.25rem',
            border: `1px solid ${BORDER}`, borderLeft: `4px solid ${accent}`,
            boxShadow: '0 4px 24px rgba(0,0,0,0.03)', marginBottom: '2rem',
          }}>
            <p style={{ fontSize: '0.9rem', color: '#555', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap' }}>
              {quote.notes}
            </p>
          </div>
        )}

        {/* ═══════ CTA SECTION ═══════ */}
        <div style={{
          background: `linear-gradient(135deg, ${accent}08, ${accent}04)`,
          borderRadius: 24, padding: '2.5rem',
          border: `1px solid ${accent}15`,
          textAlign: 'center', marginBottom: '2rem',
        }}>
          <h3 style={{ fontFamily: FT, fontSize: '1.3rem', fontWeight: 700, color: TEXT, margin: '0 0 0.5rem' }}>
            Des questions sur ce devis ?
          </h3>
          <p style={{ fontSize: '0.9rem', color: MUTED, margin: '0 0 1.5rem', lineHeight: 1.6 }}>
            Planifions un échange pour en discuter ensemble.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a
              href="https://app.lemcal.com/@clementpougetosmont/30minutes"
              target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-block', background: accent, color: '#fff',
                padding: '0.85rem 2rem', borderRadius: 12, textDecoration: 'none',
                fontWeight: 700, fontSize: '0.9rem',
                boxShadow: `0 4px 16px ${accent}40`,
              }}
            >
              Prendre rendez-vous
            </a>
            <a
              href={`mailto:${quote.senderEmail}?subject=Re: Devis ${encodeURIComponent(quote.reference)}`}
              style={{
                display: 'inline-block', background: CARD, color: accent,
                padding: '0.85rem 2rem', borderRadius: 12, textDecoration: 'none',
                fontWeight: 700, fontSize: '0.9rem',
                border: `2px solid ${accent}25`,
              }}
            >
              Répondre par email
            </a>
          </div>
        </div>

        {/* ═══════ FOOTER ═══════ */}
        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#bbb', paddingBottom: '2rem' }}>
          &copy; {new Date().getFullYear()} {quote.senderCompany} &middot;{' '}
          <a href="https://www.clempo.fr" style={{ color: '#bbb', textDecoration: 'none' }}>www.clempo.fr</a>
        </p>
      </div>
    </div>
  )
}
