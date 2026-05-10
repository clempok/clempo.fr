import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'

/* ───────────────────────── Constants ───────────────────────── */

// ── Brand Book 2026 — ClearSharpHealthcare ──
const DEFAULT_ACCENT = '#0A0A0B'      // Ink
const BG = '#EDEBE4'                  // Paper
const CARD = '#F4F4F2'                // Paper soft
const TEXT = '#0A0A0B'                // Ink
const GRAPHITE = '#2A2D35'
const MUTED = '#6B6F7A'               // Steel
const MIST = '#B8BCC4'
const SIGNAL = '#00D68F'              // Signal green — accent dot/line
const BORDER = 'rgba(10,10,11,0.08)'
const BORDER_PAPER = 'rgba(237,235,228,0.12)'
const FT = "'Inter', sans-serif"
const FB = "'Inter', sans-serif"
const FM = "'JetBrains Mono', ui-monospace, monospace"
const FS = "'Instrument Serif', Georgia, serif"

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
    const isAdmin = typeof window !== 'undefined' && localStorage.getItem('clempo_admin_authed') === '1'
    const adminParam = isAdmin ? '&admin=1' : ''
    fetch(`/.netlify/functions/get-quote?company=${encodeURIComponent(company)}&ref=${encodeURIComponent(id)}${adminParam}`)
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
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Instrument+Serif:ital@0;1&family=Dancing+Script:wght@400;700&display=swap');
      *, a, button { cursor: auto !important; }
      a, button { cursor: pointer !important; }
      @keyframes spin { to { transform: rotate(360deg) } }
      @keyframes fadeUp { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
      .q-fade { animation: fadeUp 0.6s ease-out both; }
      .q-fade-1 { animation-delay: 0.08s; }
      .q-fade-2 { animation-delay: 0.16s; }
      .q-fade-3 { animation-delay: 0.24s; }
      .q-fade-4 { animation-delay: 0.32s; }
      .q-eyebrow { font-family: ${FM}; font-weight: 500; font-size: 0.72rem; letter-spacing: 0.1em; text-transform: uppercase; }
      .q-wordmark { font-family: ${FT}; font-weight: 700; letter-spacing: -0.05em; text-transform: lowercase; display: inline-flex; align-items: baseline; }
      .q-wordmark::after { content: ''; display: inline-block; width: 0.22em; height: 0.22em; border-radius: 50%; background: ${SIGNAL}; margin-left: 0.02em; transform: translateY(-0.02em); }
      .q-dotmatrix { background-image: radial-gradient(circle, rgba(237,235,228,0.18) 1px, transparent 1px); background-size: 24px 24px; }
    `
    document.head.appendChild(s)
    return () => { document.head.removeChild(s) }
  }, [quote])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: BG, fontFamily: FB }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, border: `2px solid ${BORDER}`, borderTopColor: SIGNAL, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1.25rem' }} />
          <p style={{ fontFamily: FM, color: MUTED, fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>// Chargement du devis</p>
        </div>
      </div>
    )
  }

  if (error || !quote) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: BG, fontFamily: FB }}>
        <div style={{ textAlign: 'center', maxWidth: 440, padding: '2rem' }}>
          <div style={{ fontFamily: FM, fontSize: '0.78rem', color: SIGNAL, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>// 404</div>
          <h1 style={{ fontFamily: FT, fontSize: '2rem', fontWeight: 700, color: TEXT, letterSpacing: '-0.03em', margin: 0 }}>
            Devis <span style={{ fontFamily: FS, fontStyle: 'italic', fontWeight: 400 }}>introuvable</span>
          </h1>
          <p style={{ color: MUTED, fontSize: '0.95rem', lineHeight: 1.6, margin: '0.85rem 0 1.75rem' }}>Ce devis n'existe pas ou a expiré.</p>
          <a href="https://www.clempo.fr" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: TEXT, color: BG, padding: '0.85rem 1.5rem',
            borderRadius: 4, fontWeight: 500, fontSize: '0.9rem',
            textDecoration: 'none', fontFamily: FT,
          }}>
            Retour au site <span aria-hidden>→</span>
          </a>
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
          HERO — Ink flat bg + dot matrix, mono eyebrows
          ═══════════════════════════════════════════════════════ */}
      <div style={{
        background: DEFAULT_ACCENT,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Dot matrix pattern (brand book signature) */}
        <div className="q-dotmatrix" style={{
          position: 'absolute', inset: 0,
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
            <div className="q-eyebrow" style={{ color: SIGNAL }}>
              // Devis n° {quote.reference}
            </div>
            {quote.validUntil && (
              <div className="q-eyebrow" style={{ color: MIST }}>
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
                  width: 140, height: 140, borderRadius: 4, objectFit: 'cover',
                  border: `1px solid ${BORDER_PAPER}`,
                }}
              />
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 280 }}>
              <div className="q-eyebrow" style={{ color: SIGNAL, marginBottom: '0.85rem' }}>
                // Votre contact
              </div>
              <h1 style={{
                fontFamily: FT, fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 700,
                letterSpacing: '-0.03em',
                color: BG, margin: '0 0 0.35rem', lineHeight: 1.15,
              }}>
                {quote.senderName}
              </h1>
              <p style={{
                fontSize: '1rem', color: MIST,
                margin: '0 0 1.25rem', lineHeight: 1.5,
              }}>
                <span style={{ fontFamily: FS, fontStyle: 'italic', color: BG }}>Healthcare</span>{' '}
                Marketing Director — {quote.senderCompany}
              </p>

              {/* Contact pills */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <a href={`mailto:${quote.senderEmail}`} style={{
                  background: 'transparent',
                  padding: '0.5rem 0.95rem', borderRadius: 4,
                  fontSize: '0.8rem', color: BG, textDecoration: 'none',
                  border: `1px solid ${BORDER_PAPER}`,
                  fontFamily: FM, fontWeight: 500,
                }}>
                  {quote.senderEmail}
                </a>
                {quote.senderPhone && (
                  <span style={{
                    background: 'transparent',
                    padding: '0.5rem 0.95rem', borderRadius: 4,
                    fontSize: '0.8rem', color: BG,
                    border: `1px solid ${BORDER_PAPER}`,
                    fontFamily: FM, fontWeight: 500,
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
                  background: 'rgba(0,214,143,0.10)',
                  padding: '0.4rem 0.85rem', borderRadius: 4,
                  fontSize: '0.75rem', fontWeight: 500, color: SIGNAL,
                  letterSpacing: '0.01em',
                }}>
                  {e}
                </span>
              ))}
            </div>
          </div>

          {/* Client logos */}
          <div className="q-fade q-fade-3" style={{
            marginTop: '2rem', paddingTop: '1.75rem',
            borderTop: `1px solid ${BORDER_PAPER}`,
          }}>
            <div className="q-eyebrow" style={{ color: MIST, marginBottom: '0.85rem' }}>
              // Ils m'ont fait confiance
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.1rem', alignItems: 'center' }}>
              {CLIENTS.map(c => (
                <span key={c} style={{
                  fontFamily: FT, fontSize: '0.85rem', fontWeight: 600,
                  color: BG, letterSpacing: '-0.01em',
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
          display: 'flex', alignItems: 'center', gap: '1rem',
          marginBottom: '2.5rem',
          background: CARD, borderRadius: 4, padding: '1.25rem 1.75rem',
          border: `1px solid ${BORDER}`,
        }}>
          {quote.prospectLogo ? (
            <img src={quote.prospectLogo} alt={quote.companyName}
              style={{ height: 40, maxWidth: 120, objectFit: 'contain' }} />
          ) : (
            <div style={{
              width: 44, height: 44, borderRadius: 4, background: TEXT,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: FT, fontWeight: 700, fontSize: '1.1rem', color: BG,
            }}>
              {quote.companyName.charAt(0)}
            </div>
          )}
          <div>
            <div className="q-eyebrow" style={{ color: SIGNAL, marginBottom: '0.25rem' }}>
              // Client
            </div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: TEXT, letterSpacing: '-0.01em' }}>{quote.companyName}</div>
            <div style={{ fontSize: '0.82rem', color: MUTED }}>{quote.clientName}</div>
          </div>
        </div>

        {/* ── Offer title ── */}
        {quote.offerTitle && (
          <div className="q-fade q-fade-2" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div className="q-eyebrow" style={{ color: SIGNAL, marginBottom: '0.85rem' }}>
              // L'offre
            </div>
            <h2 style={{
              fontFamily: FT, fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 700,
              color: TEXT, margin: 0, lineHeight: 1.15, letterSpacing: '-0.03em',
            }}>
              {quote.offerTitle}
            </h2>
            <div style={{ width: 32, height: 2, background: SIGNAL, margin: '1rem auto 0' }} />
          </div>
        )}

        {/* ── Context ── */}
        {quote.context && (
          <div className="q-fade q-fade-2" style={{
            background: CARD, borderRadius: 4, padding: '2.5rem',
            border: `1px solid ${BORDER}`,
            marginBottom: '2rem',
          }}>
            <div className="q-eyebrow" style={{ color: SIGNAL, marginBottom: '0.85rem' }}>
              // Contexte
            </div>
            <h3 style={{
              fontFamily: FT, fontSize: '1.35rem', fontWeight: 700, color: TEXT,
              margin: '0 0 1.25rem', letterSpacing: '-0.02em',
            }}>
              {quote.context.title}
            </h3>
            <div
              style={{ fontSize: '0.95rem', lineHeight: 1.8, color: GRAPHITE }}
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
            background: CARD, borderRadius: 4, padding: '2rem 2.5rem',
            border: `1px solid ${BORDER}`, borderLeft: `2px solid ${SIGNAL}`,
            marginBottom: '2rem',
            display: 'flex', gap: '1.5rem', alignItems: 'flex-start',
          }}>
            <img src={photo} alt={quote.senderName} style={{
              width: 56, height: 56, borderRadius: 4, objectFit: 'cover', flexShrink: 0,
            }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: TEXT, marginBottom: '0.4rem', letterSpacing: '-0.01em' }}>
                {quote.senderName}
              </div>
              <p style={{ fontSize: '0.9rem', color: GRAPHITE, lineHeight: 1.75, margin: 0 }}>
                {quote.presentation}
              </p>
            </div>
          </div>
        )}

        {/* ═══════ VOTRE OFFRE — Products table ═══════ */}
        <div className="q-fade q-fade-3" style={{
          background: CARD, borderRadius: 4, overflow: 'hidden',
          border: `1px solid ${BORDER}`,
          marginBottom: '1.5rem',
        }}>
          {/* Table header band — flat ink */}
          <div style={{
            background: TEXT,
            padding: '1.25rem 2.5rem',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: SIGNAL, display: 'inline-block',
            }} />
            <h3 style={{
              fontFamily: FM, fontSize: '0.78rem', fontWeight: 500, color: BG, margin: 0,
              letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>
              // Votre offre
            </h3>
          </div>

          <div style={{ padding: '0 2.5rem 2rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Description', 'Qté', 'Unité', 'Prix HT', 'TVA', 'Total HT'].map((h, i) => (
                    <th key={i} style={{
                      padding: '1rem 0.75rem 0.75rem',
                      fontFamily: FM, fontSize: '0.7rem', fontWeight: 500, color: MUTED,
                      textTransform: 'uppercase', letterSpacing: '0.08em',
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
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: TEXT, letterSpacing: '-0.01em' }}>{l.description}</div>
                      {l.detail && (
                        <div
                          style={{ fontSize: '0.82rem', color: MUTED, lineHeight: 1.65, marginTop: '0.35rem' }}
                          dangerouslySetInnerHTML={{ __html: l.detail }}
                        />
                      )}
                    </td>
                    <td style={{ padding: '1.25rem 0.75rem', fontFamily: FM, fontSize: '0.85rem', textAlign: 'right', fontWeight: 500, color: TEXT }}>{l.quantity}</td>
                    <td style={{ padding: '1.25rem 0.75rem', fontSize: '0.82rem', color: MUTED, textAlign: 'right' }}>{l.unit || 'forfait'}</td>
                    <td style={{ padding: '1.25rem 0.75rem', fontFamily: FM, fontSize: '0.85rem', textAlign: 'right', color: TEXT }}>{fmt(l.unitPrice)}</td>
                    <td style={{ padding: '1.25rem 0.75rem', fontFamily: FM, fontSize: '0.8rem', color: MUTED, textAlign: 'right' }}>{l.tvaRate}%</td>
                    <td style={{ padding: '1.25rem 0.75rem', textAlign: 'right' }}>
                      {l.discountRate > 0 ? (
                        <>
                          <span style={{ textDecoration: 'line-through', color: MIST, fontSize: '0.78rem', marginRight: 6, fontFamily: FM }}>{fmt(l.rawHT)}</span>
                          <span style={{ fontWeight: 700, color: TEXT, fontFamily: FM }}>{fmt(l.lineHT)}</span>
                          <div style={{ fontFamily: FM, fontSize: '0.7rem', color: SIGNAL, marginTop: 2, fontWeight: 600 }}>−{l.discountRate}%</div>
                        </>
                      ) : (
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: FM, color: TEXT }}>{fmt(l.lineHT)}</span>
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
            background: CARD, borderRadius: 4, padding: '1.75rem 2.25rem', minWidth: 340,
            border: `1px solid ${BORDER}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.9rem' }}>
              <span style={{ color: MUTED }}>Sous-total HT</span>
              <span style={{ fontWeight: 600, fontFamily: FM, color: TEXT }}>{fmt(subtotalHT)}</span>
            </div>
            {gd > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.9rem' }}>
                <span style={{ color: SIGNAL, fontFamily: FM, fontWeight: 500 }}>Remise globale ({gd}%)</span>
                <span style={{ fontWeight: 600, color: SIGNAL, fontFamily: FM }}>−{fmt(gdAmount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.9rem' }}>
              <span style={{ color: MUTED }}>TVA</span>
              <span style={{ fontWeight: 600, fontFamily: FM, color: TEXT }}>{fmt(totalTVA)}</span>
            </div>
            <div style={{ height: 1, background: BORDER, margin: '0.75rem 0' }} />
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              padding: '0.5rem 0',
            }}>
              <span className="q-eyebrow" style={{ color: MUTED }}>// Total TTC</span>
              <span style={{ fontFamily: FT, fontWeight: 700, fontSize: '1.75rem', color: TEXT, letterSpacing: '-0.03em' }}>{fmt(totalTTC)}</span>
            </div>
          </div>
        </div>

        {/* ═══════ PAYMENT TERMS ═══════ */}
        {quote.paymentTerms && (
          <div style={{
            background: CARD, borderRadius: 4, padding: '1.75rem 2.25rem',
            border: `1px solid ${BORDER}`,
            marginBottom: '1.5rem',
          }}>
            <div className="q-eyebrow" style={{ color: SIGNAL, marginBottom: '0.65rem' }}>
              // Conditions de paiement
            </div>
            <p style={{ fontSize: '0.9rem', color: GRAPHITE, lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap' }}>
              {quote.paymentTerms}
            </p>
          </div>
        )}

        {/* ═══════ NOTES ═══════ */}
        {quote.notes && (
          <div style={{
            background: CARD, borderRadius: 4, padding: '1.75rem 2.25rem',
            border: `1px solid ${BORDER}`, borderLeft: `2px solid ${SIGNAL}`,
            marginBottom: '2rem',
          }}>
            <p style={{ fontSize: '0.9rem', color: GRAPHITE, lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap' }}>
              {quote.notes}
            </p>
          </div>
        )}

        {/* ═══════ SIGNATURE SECTION ═══════ */}
        <SignatureSection quote={quote} accent={accent} company={company!} id={id!} onSigned={(sig) => setQuote({ ...quote, signature: sig, status: 'accepted' })} />

        {/* ═══════ CTA SECTION ═══════ */}
        <div style={{
          background: TEXT, color: BG,
          borderRadius: 4, padding: '2.75rem 2.5rem',
          textAlign: 'center', marginBottom: '2rem',
          position: 'relative', overflow: 'hidden',
        }}>
          <div className="q-dotmatrix" style={{ position: 'absolute', inset: 0 }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="q-eyebrow" style={{ color: SIGNAL, marginBottom: '0.85rem' }}>
              // Une question ?
            </div>
            <h3 style={{
              fontFamily: FT, fontSize: '1.5rem', fontWeight: 700, color: BG,
              margin: '0 0 0.65rem', letterSpacing: '-0.02em',
            }}>
              On en discute <span style={{ fontFamily: FS, fontStyle: 'italic', fontWeight: 400 }}>ensemble</span> ?
            </h3>
            <p style={{ fontSize: '0.95rem', color: MIST, margin: '0 0 1.75rem', lineHeight: 1.6 }}>
              30 minutes pour répondre à toutes vos questions sur ce devis.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <a
                href="https://www.clempo.fr/booking"
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.55rem',
                  background: SIGNAL, color: TEXT,
                  padding: '0.9rem 1.6rem', borderRadius: 4, textDecoration: 'none',
                  fontWeight: 600, fontSize: '0.9rem', fontFamily: FT,
                }}
              >
                Prendre rendez-vous <span aria-hidden>→</span>
              </a>
              <a
                href={`mailto:${quote.senderEmail}?subject=Re: Devis ${encodeURIComponent(quote.reference)}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.55rem',
                  background: 'transparent', color: BG,
                  padding: '0.9rem 1.6rem', borderRadius: 4, textDecoration: 'none',
                  fontWeight: 500, fontSize: '0.9rem', fontFamily: FT,
                  border: `1px solid ${BORDER_PAPER}`,
                }}
              >
                Répondre par email
              </a>
            </div>
          </div>
        </div>

        {/* ═══════ FOOTER ═══════ */}
        <div style={{
          textAlign: 'center', paddingBottom: '2rem',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
        }}>
          <a
            href="https://www.clempo.fr"
            className="q-wordmark"
            style={{ color: TEXT, fontSize: '1rem', textDecoration: 'none' }}
          >
            clempo
          </a>
          <p style={{ fontFamily: FM, fontSize: '0.7rem', color: MUTED, letterSpacing: '0.05em', margin: 0 }}>
            © {new Date().getFullYear()} {quote.senderCompany} — www.clempo.fr
          </p>
        </div>
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

function ArgumentsTabs({ arguments: args }: {
  arguments: { title: string; description: string }[]; accent: string
}) {
  const [active, setActive] = useState(0)
  return (
    <div className="q-fade q-fade-3" style={{
      background: CARD, borderRadius: 4, overflow: 'hidden',
      border: `1px solid ${BORDER}`,
      marginBottom: '2rem',
    }}>
      {/* Section title */}
      <div style={{ padding: '2rem 2.5rem 0', textAlign: 'center' }}>
        <div className="q-eyebrow" style={{ color: SIGNAL, marginBottom: '0.85rem' }}>
          // Pourquoi moi
        </div>
        <h3 style={{
          fontFamily: FT, fontSize: 'clamp(1.3rem, 3vw, 1.7rem)', fontWeight: 700,
          color: TEXT, margin: '0 0 1.75rem', letterSpacing: '-0.02em',
        }}>
          3 raisons de collaborer{' '}
          <span style={{ fontFamily: FS, fontStyle: 'italic', fontWeight: 400 }}>ensemble</span>
        </h3>
      </div>

      {/* Tab buttons */}
      <div style={{
        display: 'flex', gap: '0.5rem', padding: '0 2.5rem', marginBottom: '1.5rem',
        flexWrap: 'wrap', justifyContent: 'center',
      }}>
        {args.map((arg, i) => (
          <button key={i} onClick={() => setActive(i)} style={{
            padding: '0.65rem 1.25rem', borderRadius: 4,
            border: `1px solid ${active === i ? TEXT : BORDER}`,
            background: active === i ? TEXT : 'transparent',
            color: active === i ? BG : TEXT,
            fontFamily: FT, fontWeight: 500, fontSize: '0.85rem',
            cursor: 'pointer', transition: 'all 0.2s',
            letterSpacing: '-0.005em',
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
            fontSize: '0.95rem', color: GRAPHITE, lineHeight: 1.8, margin: 0,
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

function SignatureSection({ quote, company, id, onSigned }: {
  quote: QuoteData; accent: string; company: string; id: string
  onSigned: (sig: QuoteSignature) => void
}) {
  const [expanded, setExpanded] = useState(false)
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
        background: CARD, borderRadius: 4, padding: '2.5rem',
        border: `1px solid ${BORDER}`, borderLeft: `2px solid ${SIGNAL}`,
        marginBottom: '2rem', textAlign: 'center',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%', background: SIGNAL,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1rem',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={TEXT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div className="q-eyebrow" style={{ color: SIGNAL, marginBottom: '0.5rem' }}>
          // Devis signé
        </div>
        <h3 style={{ fontFamily: FT, fontSize: '1.4rem', fontWeight: 700, color: TEXT, margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
          Merci <span style={{ fontFamily: FS, fontStyle: 'italic', fontWeight: 400 }}>{quote.signature.signerName.split(' ')[0]}</span>
        </h3>
        <p style={{ fontSize: '0.9rem', color: GRAPHITE, margin: '0 0 1.25rem', lineHeight: 1.6 }}>
          Devis signé le{' '}
          {new Date(quote.signature.signedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}.
        </p>
        {quote.signature.image && (
          <div style={{
            background: '#fff', borderRadius: 4, padding: '1rem',
            display: 'inline-block', border: `1px solid ${BORDER}`,
          }}>
            <img src={quote.signature.image} alt="Signature" style={{ maxWidth: 240, height: 'auto' }} />
          </div>
        )}
      </div>
    )
  }

  // Collapsed state — show big CTA to expand the signature section
  if (!expanded) {
    return (
      <div style={{
        background: CARD, borderRadius: 4, overflow: 'hidden',
        border: `1px solid ${BORDER}`,
        marginBottom: '2rem',
      }}>
        <div style={{
          background: TEXT,
          padding: '1.25rem 2.5rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: SIGNAL, display: 'inline-block',
          }} />
          <h3 style={{
            fontFamily: FM, fontSize: '0.78rem', fontWeight: 500, color: BG, margin: 0,
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            // Prêt à valider ce devis ?
          </h3>
        </div>

        <div style={{ padding: '2.75rem 2.5rem', textAlign: 'center' }}>
          <h3 style={{
            fontFamily: FT, fontSize: 'clamp(1.4rem, 3.5vw, 1.85rem)', fontWeight: 700,
            color: TEXT, margin: '0 0 0.75rem', letterSpacing: '-0.02em', lineHeight: 1.2,
          }}>
            Signez ce devis en{' '}
            <span style={{ fontFamily: FS, fontStyle: 'italic', fontWeight: 400 }}>quelques clics</span>
          </h3>
          <p style={{ fontSize: '0.95rem', color: GRAPHITE, margin: '0 0 1.75rem', lineHeight: 1.6 }}>
            Informations de facturation, conditions générales, signature : tout se passe ici, en moins d'une minute.
          </p>
          <button
            onClick={() => setExpanded(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
              padding: '1.1rem 2.25rem', borderRadius: 4, border: 'none',
              background: TEXT, color: BG,
              fontFamily: FT, fontWeight: 600, fontSize: '1rem',
              letterSpacing: '-0.005em', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={SIGNAL} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19l7-7 3 3-7 7-3-3z" />
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              <path d="M2 2l7.586 7.586" />
              <circle cx="11" cy="11" r="2" />
            </svg>
            Signer ce devis <span aria-hidden>→</span>
          </button>
          <p style={{ fontFamily: FM, fontSize: '0.7rem', color: MUTED, margin: '1rem 0 0', letterSpacing: '0.02em' }}>
            // Signature électronique sécurisée — IP & horodatage enregistrés
          </p>
        </div>
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem', borderRadius: 4,
    border: `1px solid ${BORDER}`, fontSize: '0.9rem', fontFamily: FB,
    outline: 'none', transition: 'border-color 0.2s',
    background: '#fff', color: TEXT,
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.78rem', fontWeight: 500,
    color: MUTED, marginBottom: '0.4rem',
    fontFamily: FB,
  }

  return (
    <div style={{
      background: CARD, borderRadius: 4, overflow: 'hidden',
      border: `1px solid ${BORDER}`,
      marginBottom: '2rem',
    }}>
      {/* Header — flat ink */}
      <div style={{
        background: TEXT,
        padding: '1.25rem 2.5rem',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%', background: SIGNAL, display: 'inline-block',
        }} />
        <h3 style={{
          fontFamily: FM, fontSize: '0.78rem', fontWeight: 500, color: BG, margin: 0,
          letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          // Signer ce devis
        </h3>
      </div>

      <div style={{ padding: '2rem 2.5rem' }}>
        {/* Billing info form */}
        <div style={{ marginBottom: '2rem' }}>
          <div className="q-eyebrow" style={{ color: SIGNAL, marginBottom: '1rem' }}>
            // Informations de facturation
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
          background: '#fff', borderRadius: 4, padding: '1.25rem',
          border: `1px solid ${BORDER}`, marginBottom: '2rem',
        }}>
          <label style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', cursor: 'pointer' }}>
            <input
              type="checkbox" checked={cgvAccepted}
              onChange={e => setCgvAccepted(e.target.checked)}
              style={{ marginTop: 3, width: 18, height: 18, accentColor: SIGNAL, cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.88rem', color: GRAPHITE, lineHeight: 1.6 }}>
              J'accepte les{' '}
              <button
                onClick={(e) => { e.preventDefault(); setShowCgv(!showCgv) }}
                style={{
                  background: 'none', border: 'none', color: TEXT,
                  textDecoration: 'underline', textDecorationColor: SIGNAL,
                  textDecorationThickness: 2, textUnderlineOffset: 3,
                  cursor: 'pointer', fontSize: '0.88rem',
                  fontFamily: FB, fontWeight: 600, padding: 0,
                }}
              >
                conditions générales de vente
              </button>
              {' '}et confirme la commande des prestations décrites dans ce devis.
            </span>
          </label>
          {showCgv && (
            <div style={{
              marginTop: '1rem', padding: '1.25rem', background: CARD,
              borderRadius: 4, border: `1px solid ${BORDER}`,
              maxHeight: 300, overflowY: 'auto',
              fontSize: '0.82rem', color: GRAPHITE, lineHeight: 1.7,
            }}
              dangerouslySetInnerHTML={{ __html: quote.cgvText || '<p>Les conditions générales de vente sont disponibles sur demande.</p>' }}
            />
          )}
        </div>

        {/* Signature pad */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem',
          }}>
            <div className="q-eyebrow" style={{ color: SIGNAL }}>
              // Votre signature
            </div>
            <div style={{ display: 'flex', gap: 3, background: BG, borderRadius: 4, padding: 3, border: `1px solid ${BORDER}` }}>
              {(['drawn', 'typed'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)} style={{
                  padding: '0.4rem 1rem', borderRadius: 4, border: 'none',
                  fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer',
                  fontFamily: FB,
                  background: mode === m ? TEXT : 'transparent',
                  color: mode === m ? BG : MUTED,
                  transition: 'all 0.2s',
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
                  width: '100%', height: 120, borderRadius: 4,
                  border: `1px dashed ${MUTED}`, background: '#fff',
                  cursor: 'crosshair', touchAction: 'none',
                }}
              />
              <button onClick={clearCanvas} style={{
                position: 'absolute', top: 8, right: 8,
                background: BG, border: `1px solid ${BORDER}`, borderRadius: 4,
                padding: '0.3rem 0.65rem', fontSize: '0.72rem', color: MUTED,
                cursor: 'pointer', fontFamily: FM, letterSpacing: '0.05em',
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
                  background: '#fff', borderRadius: 4, padding: '1.5rem',
                  border: `1px dashed ${MUTED}`, textAlign: 'center',
                  fontFamily: '"Dancing Script", "Brush Script MT", cursive',
                  fontSize: '2.5rem', fontStyle: 'italic', color: TEXT,
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
            background: '#fff', borderRadius: 4, padding: '0.75rem 1rem',
            fontSize: '0.85rem', color: TEXT, marginBottom: '1rem',
            border: `1px solid ${BORDER}`, borderLeft: '2px solid #DC2626',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <span style={{ fontFamily: FM, fontSize: '0.7rem', color: '#DC2626', letterSpacing: '0.08em' }}>// ERREUR —</span>
            <span>{error}</span>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit} disabled={submitting}
          style={{
            width: '100%', padding: '1rem', borderRadius: 4, border: 'none',
            background: submitting ? MUTED : TEXT, color: BG,
            fontFamily: FT, fontWeight: 600, fontSize: '0.95rem',
            letterSpacing: '-0.005em',
            cursor: submitting ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.55rem',
          }}
        >
          {submitting ? 'Signature en cours…' : <>Signer et valider le devis <span aria-hidden>→</span></>}
        </button>

        <p style={{ fontFamily: FM, fontSize: '0.7rem', color: MUTED, textAlign: 'center', marginTop: '0.85rem', lineHeight: 1.6, letterSpacing: '0.02em' }}>
          En signant, vous acceptez le devis {quote.reference}.
          Signature, IP et horodatage enregistrés.
        </p>
      </div>
    </div>
  )
}
