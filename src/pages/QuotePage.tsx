import { useState, useEffect, useRef, useCallback } from 'react'
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

type QuoteSignature = {
  image: string; type: 'drawn' | 'typed'
  signerName: string; signerEmail: string; signerCompany: string
  signerEmailCompta?: string; signerTva?: string
  signedAt: string; cgvAccepted: boolean
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
  signature?: QuoteSignature; cgvText?: string
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
      @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap');
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

        {/* ── Arguments "Pourquoi collaborer" — Qwoty-style tabs ── */}
        {quote.arguments && quote.arguments.length > 0 && (
          <ArgumentsTabs arguments={quote.arguments} accent={accent} />
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

        {/* ═══════ SIGNATURE SECTION ═══════ */}
        <SignatureSection quote={quote} accent={accent} company={company!} id={id!} onSigned={(sig) => setQuote({ ...quote, signature: sig, status: 'accepted' })} />

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

/* ═══════════════════════════════════════════════════════════════
   SIGNATURE SECTION — Billing form, CGV, Draw/Type signature
   ═══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════
   ARGUMENTS TABS — Qwoty-style click-to-reveal
   ═══════════════════════════════════════════════════════════════ */

function ArgumentsTabs({ arguments: args, accent }: {
  arguments: { title: string; description: string }[]; accent: string
}) {
  const [active, setActive] = useState(0)
  return (
    <div className="q-fade q-fade-3" style={{
      background: CARD, borderRadius: 20, overflow: 'hidden',
      border: `1px solid ${BORDER}`, boxShadow: '0 4px 24px rgba(0,0,0,0.03)',
      marginBottom: '2rem',
    }}>
      {/* Section title */}
      <div style={{ padding: '2rem 2.5rem 0' }}>
        <h3 style={{
          fontFamily: FT, fontSize: 'clamp(1.2rem, 3vw, 1.6rem)', fontWeight: 700,
          color: TEXT, margin: '0 0 1.5rem', textAlign: 'center',
        }}>
          3 raisons de collaborer ensemble
        </h3>
      </div>

      {/* Tab buttons */}
      <div style={{
        display: 'flex', gap: '0.5rem', padding: '0 2.5rem', marginBottom: '1.5rem',
        flexWrap: 'wrap', justifyContent: 'center',
      }}>
        {args.map((arg, i) => (
          <button key={i} onClick={() => setActive(i)} style={{
            padding: '0.6rem 1.25rem', borderRadius: 10, border: 'none',
            background: active === i ? accent : '#f4f4f2',
            color: active === i ? '#fff' : MUTED,
            fontFamily: FT, fontWeight: 600, fontSize: '0.85rem',
            cursor: 'pointer', transition: 'all 0.25s',
            boxShadow: active === i ? `0 4px 12px ${accent}30` : 'none',
          }}>
            {arg.title}
          </button>
        ))}
      </div>

      {/* Active content */}
      <div style={{ padding: '0 2.5rem 2.5rem' }}>
        <div key={active} style={{
          animation: 'fadeUp 0.35s ease-out both',
        }}>
          <p style={{
            fontSize: '0.95rem', color: '#444', lineHeight: 1.8, margin: 0,
          }}>
            {args[active].description}
          </p>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SIGNATURE SECTION — Billing form, CGV, Draw/Type signature
   ═══════════════════════════════════════════════════════════════ */

function SignatureSection({ quote, accent, company, id, onSigned }: {
  quote: QuoteData; accent: string; company: string; id: string
  onSigned: (sig: QuoteSignature) => void
}) {
  const [mode, setMode] = useState<'drawn' | 'typed'>('drawn')
  const [typedName, setTypedName] = useState('')
  const [form, setForm] = useState({
    signerName: '', signerEmail: '', signerCompany: quote.companyName || '',
    signerEmailCompta: '', signerAddress: '', signerPostalCode: '',
    signerCity: '', signerCountry: 'France', signerTva: '',
  })
  const [cgvAccepted, setCgvAccepted] = useState(false)
  const [showCgv, setShowCgv] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  // Canvas drawing handlers
  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY }
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }, [])

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    isDrawing.current = true
    lastPos.current = getPos(e)
  }, [getPos])

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current || !canvasRef.current) return
    e.preventDefault()
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx || !lastPos.current) return
    const pos = getPos(e)
    ctx.strokeStyle = '#111'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    lastPos.current = pos
  }, [getPos])

  const stopDraw = useCallback(() => {
    isDrawing.current = false
    lastPos.current = null
  }, [])

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const getSignatureImage = (): string => {
    if (mode === 'drawn') {
      return canvasRef.current?.toDataURL('image/png') || ''
    }
    // Render typed name to canvas
    const c = document.createElement('canvas')
    c.width = 500; c.height = 120
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, 500, 120)
    ctx.font = 'italic 42px "Dancing Script", "Brush Script MT", cursive'
    ctx.fillStyle = '#111'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(typedName, 250, 60)
    return c.toDataURL('image/png')
  }

  const isCanvasEmpty = (): boolean => {
    const canvas = canvasRef.current
    if (!canvas) return true
    const ctx = canvas.getContext('2d')
    if (!ctx) return true
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] !== 0) return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!form.signerName || !form.signerEmail) {
      setError('Veuillez renseigner votre nom et email.')
      return
    }
    if (!cgvAccepted) {
      setError('Veuillez accepter les conditions générales de vente.')
      return
    }
    if (mode === 'drawn' && isCanvasEmpty()) {
      setError('Veuillez dessiner votre signature.')
      return
    }
    if (mode === 'typed' && !typedName.trim()) {
      setError('Veuillez saisir votre nom pour la signature.')
      return
    }

    setError('')
    setSubmitting(true)
    try {
      const image = getSignatureImage()
      const res = await fetch('/.netlify/functions/sign-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company, ref: id,
          signature: {
            image, type: mode,
            signerName: form.signerName,
            signerEmail: form.signerEmail,
            signerCompany: form.signerCompany,
            signerEmailCompta: form.signerEmailCompta || undefined,
            signerAddress: form.signerAddress || undefined,
            signerPostalCode: form.signerPostalCode || undefined,
            signerCity: form.signerCity || undefined,
            signerCountry: form.signerCountry || undefined,
            signerTva: form.signerTva || undefined,
            cgvAccepted,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la signature')
      onSigned({
        image, type: mode,
        signerName: form.signerName, signerEmail: form.signerEmail,
        signerCompany: form.signerCompany, signerTva: form.signerTva || undefined,
        signerEmailCompta: form.signerEmailCompta || undefined,
        signedAt: data.signedAt, cgvAccepted,
      })
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e))
    } finally {
      setSubmitting(false)
    }
  }

  // Already signed — show signed state
  if (quote.signature) {
    return (
      <div style={{
        background: '#f0fdf4', borderRadius: 20, padding: '2.5rem',
        border: '1px solid #bbf7d0', marginBottom: '2rem', textAlign: 'center',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', background: '#16a34a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1rem',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 style={{ fontFamily: FT, fontSize: '1.3rem', fontWeight: 700, color: '#15803d', margin: '0 0 0.5rem' }}>
          Devis signé
        </h3>
        <p style={{ fontSize: '0.9rem', color: '#166534', margin: '0 0 1rem', lineHeight: 1.6 }}>
          Ce devis a été signé par <strong>{quote.signature.signerName}</strong> le{' '}
          {new Date(quote.signature.signedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}.
        </p>
        {quote.signature.image && (
          <div style={{
            background: '#fff', borderRadius: 12, padding: '1rem',
            display: 'inline-block', border: '1px solid #dcfce7',
          }}>
            <img src={quote.signature.image} alt="Signature" style={{ maxWidth: 240, height: 'auto' }} />
          </div>
        )}
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.7rem 1rem', borderRadius: 10,
    border: `1px solid ${BORDER}`, fontSize: '0.9rem', fontFamily: FB,
    outline: 'none', transition: 'border-color 0.2s',
    background: '#fff',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.78rem', fontWeight: 600,
    color: MUTED, marginBottom: '0.35rem',
  }

  return (
    <div style={{
      background: CARD, borderRadius: 20, overflow: 'hidden',
      border: `1px solid ${BORDER}`, boxShadow: '0 4px 24px rgba(0,0,0,0.03)',
      marginBottom: '2rem',
    }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${accent}, ${accent}dd)`,
        padding: '1.25rem 2.5rem',
      }}>
        <h3 style={{ fontFamily: FT, fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>
          Signer ce devis
        </h3>
      </div>

      <div style={{ padding: '2rem 2.5rem' }}>
        {/* Billing info form */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.1em', color: MUTED, marginBottom: '1rem',
          }}>
            Informations de facturation
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Nom complet *</label>
              <input style={inputStyle} value={form.signerName}
                onChange={e => setForm({ ...form, signerName: e.target.value })}
                placeholder="Prénom Nom" />
            </div>
            <div>
              <label style={labelStyle}>Email *</label>
              <input style={inputStyle} type="email" value={form.signerEmail}
                onChange={e => setForm({ ...form, signerEmail: e.target.value })}
                placeholder="email@entreprise.com" />
            </div>
            <div>
              <label style={labelStyle}>Société</label>
              <input style={inputStyle} value={form.signerCompany}
                onChange={e => setForm({ ...form, signerCompany: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Email comptabilité</label>
              <input style={inputStyle} type="email" value={form.signerEmailCompta}
                onChange={e => setForm({ ...form, signerEmailCompta: e.target.value })}
                placeholder="compta@entreprise.com" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Adresse</label>
              <input style={inputStyle} value={form.signerAddress}
                onChange={e => setForm({ ...form, signerAddress: e.target.value })}
                placeholder="Rue, numéro" />
            </div>
            <div>
              <label style={labelStyle}>Code postal</label>
              <input style={inputStyle} value={form.signerPostalCode}
                onChange={e => setForm({ ...form, signerPostalCode: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Ville</label>
              <input style={inputStyle} value={form.signerCity}
                onChange={e => setForm({ ...form, signerCity: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Pays</label>
              <input style={inputStyle} value={form.signerCountry}
                onChange={e => setForm({ ...form, signerCountry: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>N° TVA intracommunautaire</label>
              <input style={inputStyle} value={form.signerTva}
                onChange={e => setForm({ ...form, signerTva: e.target.value })}
                placeholder="FR12345678901" />
            </div>
          </div>
        </div>

        {/* CGV acceptance */}
        <div style={{
          background: '#fafaf8', borderRadius: 12, padding: '1.25rem',
          border: `1px solid ${BORDER}`, marginBottom: '2rem',
        }}>
          <label style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', cursor: 'pointer' }}>
            <input
              type="checkbox" checked={cgvAccepted}
              onChange={e => setCgvAccepted(e.target.checked)}
              style={{ marginTop: 3, width: 18, height: 18, accentColor: accent, cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.88rem', color: '#444', lineHeight: 1.6 }}>
              J'accepte les{' '}
              <button
                onClick={(e) => { e.preventDefault(); setShowCgv(!showCgv) }}
                style={{
                  background: 'none', border: 'none', color: accent,
                  textDecoration: 'underline', cursor: 'pointer', fontSize: '0.88rem',
                  fontFamily: FB, padding: 0,
                }}
              >
                conditions générales de vente
              </button>
              {' '}et confirme la commande des prestations décrites dans ce devis.
            </span>
          </label>
          {showCgv && (
            <div style={{
              marginTop: '1rem', padding: '1.25rem', background: '#fff',
              borderRadius: 10, border: `1px solid ${BORDER}`,
              maxHeight: 300, overflowY: 'auto',
              fontSize: '0.82rem', color: '#555', lineHeight: 1.7,
            }}
              dangerouslySetInnerHTML={{ __html: quote.cgvText || '<p>Les conditions générales de vente sont disponibles sur demande.</p>' }}
            />
          )}
        </div>

        {/* Signature pad */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '1rem',
          }}>
            <div style={{
              fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.1em', color: MUTED,
            }}>
              Votre signature
            </div>
            <div style={{ display: 'flex', gap: '0.25rem', background: '#f4f4f2', borderRadius: 8, padding: 3 }}>
              {(['drawn', 'typed'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)} style={{
                  padding: '0.4rem 1rem', borderRadius: 6, border: 'none',
                  fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                  fontFamily: FB,
                  background: mode === m ? '#fff' : 'transparent',
                  color: mode === m ? TEXT : MUTED,
                  boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                }}>
                  {m === 'drawn' ? 'Dessiner' : 'Saisir'}
                </button>
              ))}
            </div>
          </div>

          {mode === 'drawn' ? (
            <div style={{ position: 'relative' }}>
              <canvas
                ref={canvasRef}
                width={500} height={120}
                onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
                style={{
                  width: '100%', height: 120, borderRadius: 12,
                  border: `2px dashed ${BORDER}`, background: '#fff',
                  cursor: 'crosshair', touchAction: 'none',
                }}
              />
              <button onClick={clearCanvas} style={{
                position: 'absolute', top: 8, right: 8,
                background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: 6,
                padding: '0.3rem 0.6rem', fontSize: '0.72rem', color: MUTED,
                cursor: 'pointer', fontFamily: FB,
              }}>
                Effacer
              </button>
            </div>
          ) : (
            <div>
              <input
                value={typedName} onChange={e => setTypedName(e.target.value)}
                placeholder="Votre nom complet"
                style={{ ...inputStyle, marginBottom: '0.75rem' }}
              />
              {typedName && (
                <div style={{
                  background: '#fff', borderRadius: 12, padding: '1.5rem',
                  border: `2px dashed ${BORDER}`, textAlign: 'center',
                  fontFamily: '"Dancing Script", "Brush Script MT", cursive',
                  fontSize: '2.5rem', fontStyle: 'italic', color: '#111',
                }}>
                  {typedName}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            background: '#fef2f2', borderRadius: 10, padding: '0.75rem 1rem',
            fontSize: '0.85rem', color: '#dc2626', marginBottom: '1rem',
            border: '1px solid #fecaca',
          }}>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit} disabled={submitting}
          style={{
            width: '100%', padding: '1rem', borderRadius: 12, border: 'none',
            background: submitting ? '#aaa' : accent, color: '#fff',
            fontFamily: FT, fontWeight: 700, fontSize: '1rem', cursor: submitting ? 'not-allowed' : 'pointer',
            boxShadow: submitting ? 'none' : `0 4px 16px ${accent}40`,
            transition: 'all 0.2s',
          }}
        >
          {submitting ? 'Signature en cours...' : 'Signer et valider le devis'}
        </button>

        <p style={{ fontSize: '0.72rem', color: '#aaa', textAlign: 'center', marginTop: '0.75rem', lineHeight: 1.5 }}>
          En signant, vous acceptez le devis {quote.reference} pour un montant total indiqué ci-dessus.
          Votre signature, adresse IP et horodatage seront enregistrés.
        </p>
      </div>
    </div>
  )
}
