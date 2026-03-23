import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { articles } from '../data/articles'
import { useLang } from '../contexts/LangContext'
import SEO from '../components/SEO'

const ACCENT = '#1A1A6B'
const ACCENT_LIGHT = 'rgba(26,26,107,0.07)'
const BORDER = 'rgba(0,0,0,0.06)'
const MUTED = '#71717A'
const TEXT = '#0A0A0A'
const BG_OFF = '#F8F8F6'

const clients = [
  'Doctolib','Kiro','Santé Académie','Cherry Biotech','Neok',
  'Médéré','Sorcova','DocCity','Semble','Andrew','Sofia Développement',
  'Doctolib','Kiro','Santé Académie','Cherry Biotech','Neok',
  'Médéré','Sorcova','DocCity','Semble','Andrew','Sofia Développement',
]

const COMPANIES = [
  'Doctolib', 'Kiro', 'Cherry Biotech', 'Santé Académie', 'DocCity', 'Corilus France',
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
  const [formData, setFormData] = useState({ firstName: '', lastName: '', company: '', email: '', phone: '' })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [loaderCompanyIdx, setLoaderCompanyIdx] = useState(0)
  const [loaderCompanyExiting, setLoaderCompanyExiting] = useState(false)
  const [loaderDone, setLoaderDone] = useState(false)
  const loaderAdvancing = useRef(false)
  const loaderCount = useRef(0)
  const touchStartY = useRef(0)

  const advanceLoader = useRef(() => {})
  advanceLoader.current = () => {
    if (loaderAdvancing.current || loaderDone) return
    loaderAdvancing.current = true
    setLoaderCompanyExiting(true)
    setTimeout(() => {
      loaderCount.current += 1
      if (loaderCount.current >= COMPANIES.length) {
        document.body.style.overflow = ''
        window.scrollTo(0, 0)
        setLoaderDone(true)
        loaderAdvancing.current = false
        return
      }
      setLoaderCompanyIdx(prev => (prev + 1) % COMPANIES.length)
      setLoaderCompanyExiting(false)
      setTimeout(() => { loaderAdvancing.current = false }, 400)
    }, 300)
  }

  useEffect(() => {
    // Lock page scroll while loader is active
    document.body.style.overflow = 'hidden'
    let wheelAccum = 0
    const onWheel = (e: WheelEvent) => {
      wheelAccum += Math.abs(e.deltaY) + Math.abs(e.deltaX)
      if (wheelAccum > 30) { wheelAccum = 0; advanceLoader.current() }
    }
    const onTouchStart = (e: TouchEvent) => { touchStartY.current = e.touches[0].clientY }
    const onTouchMove = (e: TouchEvent) => {
      const dy = touchStartY.current - e.touches[0].clientY
      if (dy > 20) { touchStartY.current = e.touches[0].clientY; advanceLoader.current() }
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    const fallback = setTimeout(() => {
      document.body.style.overflow = ''
      window.scrollTo(0, 0)
      setLoaderDone(true)
    }, 8000)
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      clearTimeout(fallback)
    }
  }, [])

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

  const homeTitle = lang === 'fr'
    ? 'Clément Pouget-Osmont — Expert Marketing Santé Freelance | HealthTech & MedTech'
    : 'Clément Pouget-Osmont — Freelance Healthcare Marketing Expert | HealthTech & MedTech'
  const homeDesc = lang === 'fr'
    ? 'Directeur marketing santé freelance. J\'accompagne les entreprises healthtech, medtech et pharma dans leur stratégie de croissance. Ex-Doctolib (5 ans), 12 ans d\'expérience.'
    : 'Freelance healthcare marketing director. I help healthtech, medtech and pharma companies build their brand and scale. Ex-Doctolib (5 years), 12 years of experience.'

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
      {/* Loader */}
      <div className={`loader${loaderDone ? ' loader-exit' : ''}`}>
        <div className="loader-tagline">Marketing · Strategy · Growth</div>
        <div className="loader-phrase">Working with the shapers of healthcare</div>
        <div className="loader-company-wrap">
          <span
            key={loaderCompanyIdx}
            className={loaderCompanyExiting ? 'company-out' : 'company-in'}
            style={{ position: 'absolute', whiteSpace: 'nowrap' }}
          >
            {COMPANIES[loaderCompanyIdx]}
          </span>
        </div>
        <div className="loader-line" />
        <div className="loader-scroll-hint">scroll ↓</div>
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ── HERO ── */}
        <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '8rem 4vw 4rem' }}>
          {/* Profile photo */}
          <div className="reveal" ref={undefined} style={{ opacity: 1, transform: 'none' }}>
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6913248fb7d48a3e5503c26d/d9c4651cb_Profile-Nano-Clem.png"
              alt="Clément Pouget-Osmont"
              style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', marginBottom: '2rem', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
            />
          </div>

          {/* Mega name */}
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(3.5rem, 9vw, 9rem)',
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
            <a
              href="https://app.lemcal.com/@clementpougetosmont/30minutes"
              target="_blank" rel="noopener noreferrer"
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
            </a>
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

        {/* ── ABOUT ── */}
        <section id="about" style={{ padding: '8rem 4vw' }}>
          <div ref={revealAbout} className="reveal" style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '5rem', alignItems: 'center',
            background: BG_OFF, borderRadius: '24px', padding: 'clamp(2.5rem, 5vw, 5rem)',
          }}>
            <div>
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6913248fb7d48a3e5503c26d/48d8d0835_nano-banana-2025-11-11T10-55-151.png"
                alt="Portrait Clément Pouget-Osmont"
                style={{ width: '100%', maxWidth: '320px', aspectRatio: '3/4', objectFit: 'cover', borderRadius: '16px', boxShadow: '0 30px 80px rgba(0,0,0,0.06)' }}
              />
            </div>
            <div>
              <p style={{ fontSize: '0.68rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: ACCENT, marginBottom: '1.5rem', fontWeight: 500 }}>
                À propos
              </p>
              <h2 style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 'clamp(1.8rem, 3vw, 2.8rem)',
                fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '2rem', color: TEXT,
              }}>
                I'm not a marketer
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                {['p1','p2','p3'].map(k => (
                  <p key={k} style={{ fontSize: '0.92rem', lineHeight: 1.8, color: MUTED, fontWeight: 300 }}>
                    {t('about', k)}
                  </p>
                ))}
              </div>
              <a
                href="https://app.lemcal.com/@clementpougetosmont/30minutes"
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
                  textDecoration: 'none', color: TEXT,
                  fontSize: '0.85rem', fontWeight: 500,
                  paddingBottom: '0.3rem', borderBottom: `2px solid ${ACCENT}`,
                  transition: 'gap 0.3s',
                }}
                onMouseEnter={e => (e.currentTarget.style.gap = '1.2rem')}
                onMouseLeave={e => (e.currentTarget.style.gap = '0.75rem')}
              >
                {t('about', 'cta')} →
              </a>
            </div>
          </div>
        </section>

        {/* ── ACCOMPAGNEMENTS ── */}
        <section style={{ padding: '0 4vw 8rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <p style={{ fontSize: '0.68rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: ACCENT, marginBottom: '1rem', fontWeight: 500 }}>
              Accompagnements
            </p>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, letterSpacing: '-0.03em', color: TEXT }}>
              Les entreprises que j'accompagne
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
            {[
              {
                badge: 'Early Stage',
                badgeBg: 'rgba(16,185,129,0.1)',
                badgeColor: '#059669',
                title: 'Trouver vos premiers clients.',
                text: "Vous avez un produit, quelques early adopters, mais pas encore de moteur d'acquisition qui tourne. Je vous aide à identifier ce qui convertit et à l'activer vite.",
              },
              {
                badge: 'Scaleup',
                badgeBg: 'rgba(26,26,107,0.08)',
                badgeColor: ACCENT,
                title: 'Maintenir un rythme de croissance soutenu.',
                text: "La croissance est là, mais elle doit être préparée pour passer à l'échelle. Je vous aide à structurer ce qui existe pour que ça tienne dans la durée, sans perdre de vitesse.",
              },
              {
                badge: 'ETI · Grand groupe',
                badgeBg: 'rgba(245,158,11,0.1)',
                badgeColor: '#B45309',
                title: 'Garder son avance.',
                text: "Votre CMO actuel s'en va ? Je le / la remplace en apportant ma connaissance du secteur santé et les méthodes de marketing innovantes pour garder votre avance face aux nouveaux entrants.",
              },
            ].map((item, i) => (
              <div key={i} style={{
                background: BG_OFF, borderRadius: '24px',
                padding: '2.5rem', border: `1px solid ${BORDER}`,
                display: 'flex', flexDirection: 'column', gap: '1.2rem',
                transition: 'all 0.3s',
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 16px 50px rgba(0,0,0,0.06)'; el.style.borderColor = 'rgba(26,26,107,0.15)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ''; el.style.boxShadow = ''; el.style.borderColor = BORDER }}
              >
                <span style={{
                  display: 'inline-flex', width: 'fit-content',
                  padding: '0.5rem 1.2rem', borderRadius: '100px',
                  background: item.badgeBg, color: item.badgeColor,
                  fontSize: '1rem', fontWeight: 700,
                  letterSpacing: '0.05em', textTransform: 'uppercase',
                }}>
                  {item.badge}
                </span>
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
            <a
              href="https://app.lemcal.com/@clementpougetosmont/30minutes"
              target="_blank" rel="noopener noreferrer"
              className="cta-main"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                padding: '1.1rem 2.8rem', background: ACCENT, color: '#fff',
                textDecoration: 'none', borderRadius: '100px',
                fontSize: '1rem', fontWeight: 600, letterSpacing: '-0.01em',
                transition: 'all 0.3s',
              }}
            >
              Voyons ce que je peux faire pour vous <span className="cta-arrow">→</span>
            </a>
          </div>
        </section>

        {/* ── EXPÉRIENCES SANTÉ ── */}
        <section style={{ padding: '0 4vw 8rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <p style={{ fontSize: '0.68rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: ACCENT, marginBottom: '1rem', fontWeight: 500 }}>
              Secteurs
            </p>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, letterSpacing: '-0.03em', color: TEXT }}>
              Mes expériences en santé
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {[
              {
                icon: '🧬',
                title: 'Pharma & Biotech',
                text: "Vente de produits hautement techniques à des décideurs Pharma, Biotech et académiques.",
                clients: ['Cherry Biotech'],
                role: "VP Marketing — Cherry Biotech (fournisseur d'organoïdes)",
              },
              {
                icon: '💻',
                title: 'Healthtech',
                text: "Vente de logiciels à des professionnels de santé et des établissements hospitaliers.",
                clients: ['Doctolib', 'Kiro', 'Corilus France', 'Andrew', 'Semble', 'MonBilanDeSanté'],
              },
              {
                icon: '🏢',
                title: 'B2B',
                text: "Vente de solutions santé et RH à de grandes entreprises.",
                clients: ['HeyTeam', 'Sorcova Health', 'Neok'],
              },
              {
                icon: '🏥',
                title: 'Établissements de soins',
                text: "Marketing pour des centres de santé afin d'attirer patients et médecins.",
                clients: ['DocCity', 'Clinique stomatologie Dr Solène Vo Quang'],
              },
            ].map((item, i) => (
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
