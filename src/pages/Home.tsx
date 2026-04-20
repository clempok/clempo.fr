import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { articles } from '../data/articles'
import { useLang } from '../contexts/LangContext'
import { useContent } from '../contexts/ContentContext'
import SEO from '../components/SEO'
import { bookingUrl } from '../lib/cta'
import Booking from './Booking'

const PORTRAIT_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6913248fb7d48a3e5503c26d/48d8d0835_nano-banana-2025-11-11T10-55-151.png'

const ACCENT = '#1A1A6B'
const ACCENT_LIGHT = 'rgba(26,26,107,0.07)'
const BORDER = 'rgba(0,0,0,0.06)'
const MUTED = '#71717A'
const TEXT = '#0A0A0A'
const BG_OFF = '#F8F8F6'

const defaultClients = [
  'Doctolib','Kiro','Santé Académie','Cherry Biotech','Neok',
  'Médéré','Sorcova','DocCity','Semble','Andrew','Sofia Développement',
]

function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add('visible'); obs.disconnect() }
    }, { threshold: 0.12 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

export default function Home() {
  const { t, lang } = useLang()
  const { content: c } = useContent()

  const clients = [...(c?.clients || defaultClients), ...(c?.clients || defaultClients)]
  const accomp = c?.accompagnements || null
  const secteurs = c?.secteurs || null
  const seoData = c?.seo?.[lang] || null

  const [formData, setFormData] = useState({ firstName: '', lastName: '', company: '', email: '', phone: '' })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)


  const locale = lang === 'fr' ? 'fr-FR' : 'en-GB'
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true)
    try {
      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          'form-name': 'brochure',
          'first-name': formData.firstName,
          'last-name': formData.lastName,
          'company': formData.company,
          'email': formData.email,
          'phone': formData.phone,
        }).toString(),
      })
      const link = document.createElement('a')
      link.href = '/CPO-Services-2026.pdf'
      link.download = 'CPO-Services-2026.pdf'
      document.body.appendChild(link); link.click(); document.body.removeChild(link)
      setSubmitted(true)
    } catch { setSubmitted(true) }
    finally { setSubmitting(false) }
  }

  const featuredArticles = articles.slice(0, 3)

  // Reveal refs
  const revealAbout = useReveal()
  const revealMedia = useReveal()
  const revealArticles = useReveal()
  const revealBrochure = useReveal()

  const inputStyle = {
    width: '100%', background: 'rgba(0,0,0,0.03)',
    border: `1px solid ${BORDER}`, borderRadius: '12px',
    padding: '0.9rem 1rem', color: TEXT,
    fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', outline: 'none',
  }
  const labelStyle = {
    display: 'block', fontSize: '0.75rem', fontWeight: 500,
    marginBottom: '0.4rem', color: TEXT, letterSpacing: '0.02em',
  }

  const homeTitle = seoData?.home_title || (lang === 'fr'
    ? 'Clément Pouget-Osmont — Expert Marketing Santé Freelance | HealthTech & MedTech'
    : 'Clément Pouget-Osmont — Freelance Healthcare Marketing Expert | HealthTech & MedTech')
  const homeDesc = seoData?.home_desc || (lang === 'fr'
    ? 'Directeur marketing santé freelance. J\'accompagne les entreprises healthtech, medtech et pharma dans leur stratégie de croissance. Ex-Doctolib (5 ans), 12 ans d\'expérience.'
    : 'Freelance healthcare marketing director. I help healthtech, medtech and pharma companies build their brand and scale. Ex-Doctolib (5 years), 12 years of experience.')

  return (
    <>
      <SEO
        title={homeTitle}
        description={homeDesc}
        canonical="/"
        jsonLd={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Person',
              '@id': 'https://www.clempo.fr/#person',
              name: 'Clément Pouget-Osmont',
              url: 'https://www.clempo.fr',
              jobTitle: 'Healthcare Marketing Director Freelance',
              description: 'Expert marketing santé freelance. 12 ans d\'expérience dont 5 ans chez Doctolib. Spécialisé HealthTech, MedTech et BioTech.',
              sameAs: [
                'https://www.linkedin.com/in/clementpougetosmont/',
              ],
              knowsAbout: ['Marketing santé', 'HealthTech', 'MedTech', 'Marketing digital', 'Go-to-market', 'Stratégie de croissance'],
            },
            {
              '@type': 'WebSite',
              '@id': 'https://www.clempo.fr/#website',
              url: 'https://www.clempo.fr',
              name: 'Clempo.fr',
              description: 'Site personnel de Clément Pouget-Osmont, expert marketing santé freelance',
              author: { '@id': 'https://www.clempo.fr/#person' },
            },
          ],
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ── HERO ── */}
        <section style={{ minHeight: '75vh', display: 'flex', alignItems: 'center', padding: '6rem 4vw 3rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)',
            gap: 'clamp(2rem, 5vw, 5rem)',
            alignItems: 'center',
            width: '100%',
          }} className="hero-grid">
            <div style={{ minWidth: 0 }}>
              {/* Mega name */}
              <h1 style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 'clamp(3rem, 7.5vw, 7.5rem)',
                fontWeight: 700, lineHeight: 0.95, letterSpacing: '-0.045em',
                marginBottom: '1.5rem',
              }}>
                <span className="hero-line"><span className="hero-line-inner" style={{ color: TEXT }}>Clément</span></span>
                <span className="hero-line"><span className="hero-line-inner">
                  Pouget-<span style={{ color: ACCENT }}>Osmont</span>
                </span></span>
              </h1>

              {/* Subtitle */}
              <p style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 'clamp(1.1rem, 2vw, 1.6rem)',
                fontWeight: 500, color: TEXT, marginBottom: '0.75rem', letterSpacing: '-0.01em',
              }}>
                {t('hero', 'title')}
              </p>

              {/* Tags */}
              <p style={{ fontSize: '0.78rem', color: MUTED, fontWeight: 300, marginBottom: '3rem', lineHeight: 1.6, letterSpacing: '0.02em' }}>
                Product Marketing <span style={{ opacity: 0.4, margin: '0 0.3rem' }}>·</span>
                Growth Marketing <span style={{ opacity: 0.4, margin: '0 0.3rem' }}>·</span>
                Revenue Strategy <span style={{ opacity: 0.4, margin: '0 0.3rem' }}>·</span>
                Team Management
              </p>

              {/* CTAs */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Link
                  to={bookingUrl('home-hero')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    padding: '1rem 2.2rem', background: ACCENT, color: '#fff',
                    textDecoration: 'none', borderRadius: '100px',
                    fontSize: '0.85rem', fontWeight: 500, letterSpacing: '0.01em',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#2D2D8A'; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 12px 40px rgba(26,26,107,0.2)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = ACCENT; el.style.transform = ''; el.style.boxShadow = '' }}
                >
                  📅 {t('hero', 'cta_chat')}
                </Link>
                <a
                  href="#about"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    padding: '1rem 2.2rem', background: 'transparent', color: TEXT,
                    textDecoration: 'none', borderRadius: '100px',
                    fontSize: '0.85rem', fontWeight: 500,
                    border: `1px solid ${BORDER}`, transition: 'all 0.3s',
                  }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = TEXT; el.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = BORDER; el.style.transform = '' }}
                >
                  {t('hero', 'cta_more')} ↓
                </a>
              </div>
            </div>

            {/* Portrait */}
            <div className="hero-portrait" style={{ display: 'flex', justifyContent: 'center' }}>
              <img
                src={PORTRAIT_URL}
                alt="Portrait Clément Pouget-Osmont"
                loading="eager"
                style={{
                  width: '100%',
                  maxWidth: '420px',
                  aspectRatio: '4/5',
                  objectFit: 'cover',
                  borderRadius: '24px',
                  boxShadow: '0 40px 100px rgba(0,0,0,0.08)',
                }}
              />
            </div>
          </div>

          {/* Scroll indicator */}
          <div style={{ position: 'absolute', bottom: '3rem', right: '4vw', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }} className="hidden md:flex">
            <span style={{ fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#A1A1AA' }}>Scroll</span>
            <div style={{ width: '1px', height: '50px', background: `linear-gradient(to bottom, ${ACCENT}, transparent)`, animation: 'scrollPulse 2s ease-in-out infinite' }} />
          </div>
        </section>

        {/* ── MARQUEE ── */}
        <div style={{ padding: '2.5rem 0', borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, overflow: 'hidden', background: '#fff', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '6rem', background: 'linear-gradient(to right, #fff, transparent)', zIndex: 1, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '6rem', background: 'linear-gradient(to left, #fff, transparent)', zIndex: 1, pointerEvents: 'none' }} />
          <div className="animate-scroll" style={{ display: 'flex', whiteSpace: 'nowrap' }}>
            {[...clients, ...clients].map((c, i) => (
              <span key={i} style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '0.85rem', fontWeight: 500,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                padding: '0 2.5rem', color: MUTED,
                display: 'inline-flex', alignItems: 'center', gap: '2.5rem',
              }}>
                {c}<span style={{ opacity: 0.3, fontSize: '1.2rem', color: ACCENT }}>·</span>
              </span>
            ))}
          </div>
        </div>

        {/* ── ABOUT + BOOKING ── */}
        <section id="about" style={{ padding: '6rem 4vw 4rem' }}>
          <div ref={revealAbout} className="reveal about-booking-row" style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'clamp(2rem, 4vw, 4rem)',
            alignItems: 'flex-start',
          }}>
            {/* À propos */}
            <div className="about-block" style={{
              flex: '1 1 360px',
              minWidth: 0,
              background: BG_OFF,
              borderRadius: '24px',
              padding: 'clamp(2rem, 4vw, 3rem)',
              position: 'sticky',
              top: '6rem',
            }}>
              <p style={{ fontSize: '0.68rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: ACCENT, marginBottom: '1.25rem', fontWeight: 500 }}>
                À propos
              </p>
              <h2 style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 'clamp(1.6rem, 2.6vw, 2.3rem)',
                fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '1.5rem', color: TEXT,
              }}>
                {t('about', 'title')}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '1.75rem' }}>
                {['p1','p2','p3'].map(k => (
                  <p key={k} style={{ fontSize: '0.88rem', lineHeight: 1.75, color: MUTED, fontWeight: 300 }}>
                    {t('about', k)}
                  </p>
                ))}
              </div>
              <Link
                to={bookingUrl('home-about')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                  textDecoration: 'none', color: TEXT,
                  fontSize: '0.83rem', fontWeight: 500,
                  paddingBottom: '0.3rem', borderBottom: `2px solid ${ACCENT}`,
                  transition: 'gap 0.3s',
                }}
                onMouseEnter={e => (e.currentTarget.style.gap = '1rem')}
                onMouseLeave={e => (e.currentTarget.style.gap = '0.6rem')}
              >
                {t('about', 'cta')} →
              </Link>
            </div>

            {/* Booking embed */}
            <div className="booking-block" style={{ flex: '1 1 480px', minWidth: 0 }}>
              <Booking embedded />
            </div>
          </div>
        </section>

        {/* ── ACCOMPAGNEMENTS ── */}
        <section style={{ padding: '0 4vw 8rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <p style={{ fontSize: '0.68rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: ACCENT, marginBottom: '1rem', fontWeight: 500 }}>
              {accomp?.badge_label || 'Accompagnements'}
            </p>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, letterSpacing: '-0.03em', color: TEXT }}>
              {accomp?.title || "Les entreprises que j'accompagne"}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
            {(() => {
              const accompStyles = [
                { to: bookingUrl('home-advisor'), badgeBg: 'rgba(16,185,129,0.1)', badgeColor: '#059669', starred: false },
                { to: bookingUrl('home-parttime'), badgeBg: 'rgba(26,26,107,0.08)', badgeColor: ACCENT, starred: false },
                { to: '/transition-cmo', badgeBg: 'rgba(245,158,11,0.1)', badgeColor: '#B45309', starred: true },
              ]
              const accompDefaults = [
                { badge: 'Advisory', trigger: '', title: 'Advisory', text: '', format: '1×1h30/mois + WhatsApp', price: '900 €/mois', cta_label: 'Démarrer un essai →' },
                { badge: 'Part-Time CMO', trigger: '', title: 'Part-Time CMO Santé', text: '', format: '2-3 j/semaine · 6 mois min.', price: 'TJM sur brief', cta_label: 'En parler 30 min →' },
                { badge: 'Management de Transition', trigger: '', title: 'Management de Transition Santé', text: '', format: 'Full-time · 6-12 mois', price: 'TJM transparent sur brief', cta_label: "Voir l'offre transition →" },
              ]
              const cmsCards = Array.isArray(accomp?.cards) ? accomp!.cards : accompDefaults
              type AccompItem = {
                badge: string; trigger: string; title: string; text: string;
                format: string; price: string; ctaLabel: string;
                to: string; badgeBg: string; badgeColor: string; starred: boolean;
              }
              return cmsCards.map((card: Record<string, string>, i: number): AccompItem => ({
                badge: card.badge ?? accompDefaults[i]?.badge ?? '',
                trigger: card.trigger ?? accompDefaults[i]?.trigger ?? '',
                title: card.title ?? accompDefaults[i]?.title ?? '',
                text: card.text ?? accompDefaults[i]?.text ?? '',
                format: card.format ?? accompDefaults[i]?.format ?? '',
                price: card.price ?? accompDefaults[i]?.price ?? '',
                ctaLabel: card.cta_label ?? accompDefaults[i]?.cta_label ?? '',
                to: accompStyles[i]?.to || bookingUrl('home-advisor'),
                badgeBg: accompStyles[i]?.badgeBg || 'rgba(26,26,107,0.08)',
                badgeColor: accompStyles[i]?.badgeColor || ACCENT,
                starred: !!accompStyles[i]?.starred,
              }))
            })().map((item: {
              badge: string; trigger: string; title: string; text: string;
              format: string; price: string; ctaLabel: string;
              to: string; badgeBg: string; badgeColor: string; starred: boolean;
            }, i: number) => (
              <div key={i} style={{
                background: BG_OFF, borderRadius: '24px',
                padding: '2.5rem', border: item.starred ? `1px solid rgba(26,26,107,0.25)` : `1px solid ${BORDER}`,
                display: 'flex', flexDirection: 'column', gap: '1rem',
                transition: 'all 0.3s', position: 'relative',
                boxShadow: item.starred ? '0 16px 50px rgba(26,26,107,0.08)' : 'none',
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 16px 50px rgba(0,0,0,0.08)'; el.style.borderColor = 'rgba(26,26,107,0.25)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ''; el.style.boxShadow = item.starred ? '0 16px 50px rgba(26,26,107,0.08)' : 'none'; el.style.borderColor = item.starred ? 'rgba(26,26,107,0.25)' : BORDER }}
              >
                {item.starred && (
                  <span style={{
                    position: 'absolute', top: '-12px', right: '1.5rem',
                    background: ACCENT, color: '#fff',
                    padding: '0.3rem 0.8rem', borderRadius: '100px',
                    fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                  }}>
                    ⭐ Mission préférée
                  </span>
                )}
                <span style={{
                  display: 'inline-flex', width: 'fit-content',
                  padding: '0.5rem 1.2rem', borderRadius: '100px',
                  background: item.badgeBg, color: item.badgeColor,
                  fontSize: '0.78rem', fontWeight: 700,
                  letterSpacing: '0.05em', textTransform: 'uppercase',
                }}>
                  {item.badge}
                </span>
                {item.trigger && (
                  <p style={{ fontSize: '0.88rem', color: MUTED, fontStyle: 'italic', fontWeight: 300, lineHeight: 1.5, margin: 0 }}>
                    {item.trigger}
                  </p>
                )}
                <h3 style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '1.3rem', fontWeight: 700,
                  letterSpacing: '-0.02em', lineHeight: 1.2, color: TEXT, margin: 0,
                }}>
                  {item.title}
                </h3>
                {item.text && (
                  <p style={{ fontSize: '0.88rem', color: MUTED, lineHeight: 1.6, fontWeight: 300, margin: 0, whiteSpace: 'pre-line' }}>
                    {item.text}
                  </p>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', paddingTop: '0.5rem', borderTop: `1px solid ${BORDER}` }}>
                  <div style={{ fontSize: '0.8rem', color: MUTED, fontWeight: 400 }}>{item.format}</div>
                  <div style={{ fontSize: '1rem', color: TEXT, fontWeight: 700, letterSpacing: '-0.01em' }}>{item.price}</div>
                </div>
                <Link
                  to={item.to}
                  style={{
                    marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.75rem 1.2rem',
                    background: item.starred ? ACCENT : 'transparent',
                    color: item.starred ? '#fff' : ACCENT,
                    border: item.starred ? `1px solid ${ACCENT}` : `1px solid ${ACCENT}`,
                    textDecoration: 'none', borderRadius: '100px',
                    fontSize: '0.82rem', fontWeight: 600,
                    transition: 'all 0.3s',
                    width: 'fit-content',
                  }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = ACCENT; el.style.color = '#fff' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; if (!item.starred) { el.style.background = 'transparent'; el.style.color = ACCENT } }}
                >
                  {item.ctaLabel}
                </Link>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center' }}>
            <style>{`
              @keyframes ctaPulse {
                0%, 100% { box-shadow: 0 8px 30px rgba(26,26,107,0.18), 0 0 0 0 rgba(26,26,107,0.25); }
                50% { box-shadow: 0 8px 30px rgba(26,26,107,0.18), 0 0 0 10px rgba(26,26,107,0); }
              }
              .cta-main {
                animation: ctaPulse 2.8s ease-in-out infinite;
              }
              .cta-main:hover {
                animation: none;
                background: #2D2D8A !important;
                transform: translateY(-3px);
                box-shadow: 0 20px 60px rgba(26,26,107,0.3) !important;
              }
              .cta-main .cta-arrow {
                display: inline-block;
                transition: transform 0.3s ease;
              }
              .cta-main:hover .cta-arrow {
                transform: translateX(5px);
              }
            `}</style>
            <Link
              to={bookingUrl('home-footer')}
              className="cta-main"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                padding: '1.1rem 2.8rem', background: ACCENT, color: '#fff',
                textDecoration: 'none', borderRadius: '100px',
                fontSize: '1rem', fontWeight: 600, letterSpacing: '-0.01em',
                transition: 'all 0.3s',
              }}
            >
              {accomp?.cta || 'Voyons ce que je peux faire pour vous'} <span className="cta-arrow">→</span>
            </Link>
          </div>
        </section>

        {/* ── EXPÉRIENCES SANTÉ ── */}
        <section style={{ padding: '0 4vw 8rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <p style={{ fontSize: '0.68rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: ACCENT, marginBottom: '1rem', fontWeight: 500 }}>
              {secteurs?.badge_label || 'Secteurs'}
            </p>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, letterSpacing: '-0.03em', color: TEXT }}>
              {secteurs?.title || 'Mes expériences en santé'}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {(() => {
              const secteursDefaults = [
                { icon: '🧬', title: 'Pharma & Biotech', text: "Vente de produits hautement techniques à des décideurs Pharma, Biotech et académiques.", clients: 'Cherry Biotech, Doqboard', role: "VP Marketing — Cherry Biotech (fournisseur d'organoïdes)" },
                { icon: '💻', title: 'Healthtech', text: "Vente de logiciels à des professionnels de santé et des établissements hospitaliers.", clients: 'Doctolib, Kiro, Corilus France, Andrew, Semble, MonBilanDeSanté', role: '' },
                { icon: '🏢', title: 'B2B', text: "Vente de solutions santé et RH à de grandes entreprises.", clients: 'HeyTeam, Sorcova Health, Neok', role: '' },
                { icon: '🏥', title: 'Établissements de soins', text: "Marketing pour des centres de santé afin d'attirer patients et médecins.", clients: 'DocCity, Clinique stomatologie Dr Solène Vo Quang', role: '' },
              ]
              const cmsCards = Array.isArray(secteurs?.cards) ? secteurs!.cards : secteursDefaults
              type SecteurItem = {
                icon: string; title: string; text: string; role: string; clients: string[];
              }
              return cmsCards.map((card: Record<string, string>, i: number): SecteurItem => ({
                icon: card.icon || secteursDefaults[i]?.icon || '',
                title: card.title || secteursDefaults[i]?.title || '',
                text: card.text || secteursDefaults[i]?.text || '',
                role: card.role || secteursDefaults[i]?.role || '',
                clients: String(card.clients || secteursDefaults[i]?.clients || '')
                  .split(',').map(s => s.trim()).filter(Boolean),
              }))
            })().map((item: { icon: string; title: string; text: string; role: string; clients: string[] }, i: number) => (
              <div key={i} style={{
                background: BG_OFF, borderRadius: '24px',
                padding: '2.5rem', border: `1px solid ${BORDER}`,
                display: 'flex', flexDirection: 'column', gap: '1.2rem',
                transition: 'all 0.3s',
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 16px 50px rgba(0,0,0,0.06)'; el.style.borderColor = 'rgba(26,26,107,0.15)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ''; el.style.boxShadow = ''; el.style.borderColor = BORDER }}
              >
                <span style={{ fontSize: '2rem', lineHeight: 1 }}>{item.icon}</span>
                <h3 style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '1.35rem', fontWeight: 700,
                  letterSpacing: '-0.02em', lineHeight: 1.2, color: TEXT,
                }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '0.92rem', lineHeight: 1.8, color: MUTED, fontWeight: 300 }}>
                  {item.text}
                </p>
                {item.role && (
                  <p style={{ fontSize: '0.82rem', lineHeight: 1.6, color: ACCENT, fontStyle: 'italic', fontWeight: 400 }}>
                    {item.role}
                  </p>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.4rem' }}>
                  {item.clients.map((c, j) => (
                    <span key={j} style={{
                      padding: '0.3rem 0.9rem', borderRadius: '100px',
                      background: 'rgba(26,26,107,0.07)', color: ACCENT,
                      fontSize: '0.78rem', fontWeight: 500,
                    }}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── MEDIA ── */}
        <section style={{ padding: '0 4vw 8rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div ref={revealMedia} className="reveal" style={{ width: '100%', maxWidth: '72rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <p style={{ fontSize: '0.68rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: ACCENT, marginBottom: '1rem', fontWeight: 500 }}>
                {t('media', 'badge')}
              </p>
              <h2 style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, letterSpacing: '-0.03em', color: TEXT,
              }}>
                {t('media', 'title')}
              </h2>
            </div>

            <div className="media-grid">
              {[
                {
                  href: 'https://www.youtube.com/watch?v=OR9iH07AHVQ&t',
                  img: '/media-silicon-carne.jpeg', alt: 'Silicon Carne',
                  badge: 'Podcast', badgeBg: 'rgba(220,38,38,0.85)', badgeColor: '#fff',
                  source: 'Silicon Carne', title: t('media', 'sc_title'), cta: t('media', 'watch'),
                },
                {
                  href: 'https://www.asianhhm.com/interviews/emerging-marketing-trends-in-the-healthcare-b2b-sector',
                  img: '/media-asian-hhm.jpeg', alt: 'Asian HHM',
                  badge: 'Interview', badgeBg: 'rgba(26,26,107,0.85)', badgeColor: '#fff',
                  source: 'Asian Hospital & Healthcare Management', title: t('media', 'hhm_title'), cta: t('media', 'read'),
                },
                {
                  href: 'https://app.livestorm.co/comptasante/developper-sa-patientele',
                  img: '/media-comptasante.jpeg', alt: 'ComptaSanté',
                  badge: 'Webinaire', badgeBg: 'rgba(99,102,241,0.85)', badgeColor: '#fff',
                  source: 'ComptaSanté', title: t('media', 'cs_title'), cta: t('media', 'watch'),
                },
              ].map(m => (
                <a key={m.href} href={m.href} target="_blank" rel="noopener noreferrer"
                  style={{ textDecoration: 'none', color: TEXT, display: 'flex', flexDirection: 'column',
                    borderRadius: '24px', overflow: 'hidden',
                    background: BG_OFF, border: `1px solid ${BORDER}`,
                    transition: 'all 0.4s',
                  }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-6px)'; el.style.boxShadow = '0 20px 60px rgba(0,0,0,0.06)'; el.style.borderColor = 'rgba(26,26,107,0.15)'; const img = el.querySelector('img') as HTMLElement; if (img) img.style.transform = 'scale(1.04)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ''; el.style.boxShadow = ''; el.style.borderColor = BORDER; const img = el.querySelector('img') as HTMLElement; if (img) img.style.transform = 'scale(1)' }}
                >
                  <div style={{ aspectRatio: '16/10', position: 'relative', overflow: 'hidden' }}>
                    <img src={m.img} alt={m.alt} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.3) 100%)' }} />
                    <span style={{ position: 'absolute', top: '1rem', left: '1rem', padding: '0.3rem 0.8rem', background: m.badgeBg, color: m.badgeColor, borderRadius: '100px', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600, backdropFilter: 'blur(8px)' }}>
                      {m.badge}
                    </span>
                  </div>
                  <div style={{ padding: '1.8rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <p style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#A1A1AA', marginBottom: '0.6rem', fontWeight: 500 }}>
                      {m.source}
                    </p>
                    <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.1rem', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.35, marginBottom: 'auto', color: TEXT }}>
                      {m.title}
                    </h3>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '1.2rem', fontSize: '0.8rem', color: ACCENT, fontWeight: 500 }}>
                      {m.cta} →
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ── ARTICLES TEASER ── */}
        <section style={{ padding: '0 4vw 8rem' }}>
          <div ref={revealArticles} className="reveal" style={{ background: BG_OFF, borderRadius: '24px', padding: 'clamp(2.5rem, 5vw, 5rem)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.68rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: ACCENT, marginBottom: '1rem', fontWeight: 500 }}>
                  {t('articles_section', 'badge') || 'Insights'}
                </p>
                <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, color: TEXT }}>
                  {t('articles_section', 'title')}
                </h2>
              </div>
              <p style={{ fontSize: '0.9rem', color: MUTED, maxWidth: '400px', fontWeight: 300, lineHeight: 1.6 }}>
                {t('articles_section', 'subtitle')}
              </p>
            </div>

            {/* Grid with separator lines */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1px', background: BORDER, borderRadius: '16px', overflow: 'hidden' }}>
              {featuredArticles.map(article => (
                <Link key={article.slug} to={`/articles/${article.slug}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: '#fff', padding: '2.5rem 2rem',
                    display: 'flex', flexDirection: 'column', height: '100%',
                    transition: 'background 0.3s', position: 'relative',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = ACCENT_LIGHT }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff' }}
                  >
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.3rem 0.9rem', background: ACCENT_LIGHT,
                      borderRadius: '100px', fontSize: '0.65rem', fontWeight: 600,
                      letterSpacing: '0.1em', textTransform: 'uppercase', color: ACCENT,
                      marginBottom: '1.2rem', width: 'fit-content',
                    }}>
                      {article.category}
                    </span>
                    <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.15rem', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.35, marginBottom: '1rem', color: TEXT, flexGrow: 1 }}>
                      {article.title}
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: MUTED, lineHeight: 1.7, fontWeight: 300, marginBottom: 'auto', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {article.excerpt}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: `1px solid ${BORDER}` }}>
                      <span style={{ fontSize: '0.72rem', color: '#A1A1AA' }}>{formatDate(article.date)} · {article.readingTime}</span>
                      <span style={{ fontSize: '0.78rem', color: ACCENT, fontWeight: 500 }}>
                        {t('articles_section', 'read')} →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: '3rem' }}>
              <Link to="/articles" style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.9rem 2rem', background: ACCENT, color: '#fff',
                textDecoration: 'none', borderRadius: '100px',
                fontSize: '0.85rem', fontWeight: 500, transition: 'all 0.3s',
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#2D2D8A'; el.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = ACCENT; el.style.transform = '' }}
              >
                {t('articles_section', 'see_all')} →
              </Link>
            </div>
          </div>
        </section>

        {/* ── BROCHURE FORM ── */}
        <section id="brochure" style={{ padding: '0 4vw 8rem' }}>
          <div ref={revealBrochure} className="reveal" style={{ maxWidth: '700px', margin: '0 auto' }}>

            {/* Hidden Netlify form */}
            <form name="brochure" data-netlify="true" hidden>
              <input type="hidden" name="form-name" value="brochure" />
              <input type="text" name="first-name" />
              <input type="text" name="last-name" />
              <input type="text" name="company" />
              <input type="email" name="email" />
              <input type="tel" name="phone" />
            </form>

            <div style={{
              backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
              background: 'rgba(255,255,255,0.6)',
              border: '1px solid rgba(255,255,255,0.8)',
              borderRadius: '32px', padding: 'clamp(2rem, 5vw, 4rem)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.8)',
              position: 'relative', overflow: 'hidden',
              textAlign: 'center',
            }}>
              <div style={{ position: 'absolute', top: '-30%', left: '-30%', width: '160%', height: '160%', background: 'radial-gradient(circle at 30% 30%, rgba(26,26,107,0.04), transparent 60%)', pointerEvents: 'none' }} />
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '0.8rem', color: TEXT, position: 'relative' }}>
                {t('brochure', 'title')}
              </h2>
              <p style={{ fontSize: '0.9rem', color: MUTED, fontWeight: 300, marginBottom: '2.5rem', position: 'relative' }}>
                {t('brochure', 'subtitle')}
              </p>

              {submitted ? (
                <div style={{ padding: '2rem', background: ACCENT_LIGHT, border: `1px solid rgba(26,26,107,0.15)`, borderRadius: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✓</div>
                  <p style={{ fontWeight: 600, color: ACCENT, fontSize: '1.1rem', marginBottom: '0.5rem' }}>{t('brochure', 'success_title')}</p>
                  <p style={{ color: MUTED, fontSize: '0.875rem', marginBottom: '1.25rem' }}>{t('brochure', 'success_sub')}</p>
                  <a href="/CPO-Services-2026.pdf" download style={{
                    display: 'inline-flex', alignItems: 'center',
                    padding: '0.7rem 1.5rem', background: ACCENT, color: '#fff',
                    borderRadius: '100px', textDecoration: 'none',
                    fontSize: '0.875rem', fontWeight: 500,
                  }}>{t('brochure', 'success_cta')}</a>
                </div>
              ) : (
                <form name="brochure" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left', position: 'relative' }}>
                  <input type="hidden" name="form-name" value="brochure" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={labelStyle}>{t('brochure', 'first_name')} *</label>
                      <input type="text" name="first-name" required value={formData.firstName}
                        onChange={e => setFormData(p => ({ ...p, firstName: e.target.value }))} style={inputStyle}
                        onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = '0 0 0 3px rgba(26,26,107,0.08)' }}
                        onBlur={e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = '' }}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>{t('brochure', 'last_name')} *</label>
                      <input type="text" name="last-name" required value={formData.lastName}
                        onChange={e => setFormData(p => ({ ...p, lastName: e.target.value }))} style={inputStyle}
                        onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = '0 0 0 3px rgba(26,26,107,0.08)' }}
                        onBlur={e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = '' }}
                      />
                    </div>
                  </div>
                  {([
                    { label: t('brochure', 'company'), key: 'company', name: 'company', type: 'text' },
                    { label: t('brochure', 'email'),   key: 'email',   name: 'email',   type: 'email' },
                    { label: t('brochure', 'phone'),   key: 'phone',   name: 'phone',   type: 'tel' },
                  ] as const).map(({ label, key, name, type }) => (
                    <div key={key}>
                      <label style={labelStyle}>{label} *</label>
                      <input type={type} name={name} required value={formData[key]}
                        onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))} style={inputStyle}
                        onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = '0 0 0 3px rgba(26,26,107,0.08)' }}
                        onBlur={e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = '' }}
                      />
                    </div>
                  ))}
                  <button type="submit" disabled={submitting} style={{
                    width: '100%', padding: '1.1rem', marginTop: '0.5rem',
                    background: submitting ? 'rgba(26,26,107,0.5)' : ACCENT, color: '#fff',
                    border: 'none', borderRadius: '100px',
                    fontFamily: "'Inter', sans-serif", fontSize: '0.85rem', fontWeight: 600,
                    letterSpacing: '0.02em', transition: 'all 0.3s',
                  }}
                    onMouseEnter={e => { if (!submitting) { (e.currentTarget as HTMLElement).style.background = '#2D2D8A'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' } }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ACCENT; (e.currentTarget as HTMLElement).style.transform = '' }}
                  >
                    {submitting ? t('brochure', 'submitting') : t('brochure', 'submit')}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

      </div>

      {/* scroll pulse animation */}
      <style>{`
        @keyframes scrollPulse {
          0%, 100% { opacity: 1; transform: scaleY(1); }
          50% { opacity: 0.3; transform: scaleY(0.5); }
        }
      `}</style>
    </>
  )
}
