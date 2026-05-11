import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { articles } from '../data/articles'
import { useLang } from '../contexts/LangContext'
import { useContent } from '../contexts/ContentContext'
import SEO from '../components/SEO'
import Eyebrow from '../components/Eyebrow'
import Wordmark from '../components/Wordmark'
import JournalistesForm, { JournalistesNetlifyRegistration } from '../components/JournalistesForm'
import JournalistesSheetPreview from '../components/JournalistesSheetPreview'
import { JOURNALISTES_TITLE, JOURNALISTES_SUB } from '../lib/journalistes'
import { bookingUrl } from '../lib/cta'
import Booking from './Booking'

/* ──────────────────────────────────────────────────────────── *
 * Home — content preserved verbatim, re-skinned with the       *
 * clempo. Brand Book V1 · 2026 (ClearSharpHealthcare).         *
 * Palette : Ink · Paper · Signal Green                         *
 * Typos   : Inter · Instrument Serif · JetBrains Mono          *
 * ──────────────────────────────────────────────────────────── */

const PORTRAIT_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6913248fb7d48a3e5503c26d/48d8d0835_nano-banana-2025-11-11T10-55-151.png'

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

  function setCidCookie(email: string) {
    try {
      const cid = btoa(email.toLowerCase().trim())
      document.cookie = `clempo_cid=${cid}; max-age=${365 * 24 * 3600}; path=/; SameSite=Lax`
    } catch { /* ignore */ }
  }

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
      if (formData.email) setCidCookie(formData.email)
      const link = document.createElement('a')
      link.href = '/CPO-Services-2026.pdf'
      link.download = 'CPO-Services-2026.pdf'
      document.body.appendChild(link); link.click(); document.body.removeChild(link)
      setSubmitted(true)
    } catch { setSubmitted(true) }
    finally { setSubmitting(false) }
  }


  const featuredArticles = articles.slice(0, 3)

  const revealAbout = useReveal()
  const revealAccomp = useReveal()
  const revealSect = useReveal()
  const revealMedia = useReveal()
  const revealArticles = useReveal()
  const revealJo = useReveal()
  const revealBrochure = useReveal()

  // Form input styling — brand-book flat fields, radius 4px
  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--paper)',
    border: '1px solid rgba(10,10,11,0.12)',
    borderRadius: 'var(--cb-radius)',
    padding: '0.9rem 1rem',
    color: 'var(--ink)',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.7rem',
    fontWeight: 500,
    marginBottom: '0.4rem',
    color: 'var(--steel)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  }

  const homeTitle = seoData?.home_title || (lang === 'fr'
    ? 'Clément Pouget-Osmont — Expert Marketing Santé Freelance | HealthTech & MedTech'
    : 'Clément Pouget-Osmont — Freelance Healthcare Marketing Expert | HealthTech & MedTech')
  const homeDesc = seoData?.home_desc || (lang === 'fr'
    ? 'Consultant marketing santé freelance · Fractional CMO HealthTech. J\'aide startups, scaleups et grands groupes santé à transformer leur stratégie marketing. Ex-Doctolib, 12 ans d\'expérience.'
    : 'Freelance healthcare marketing consultant · Fractional CMO HealthTech. I help startups, scaleups and enterprises in healthcare turn marketing into a growth engine. Ex-Doctolib, 12 years.')

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
              sameAs: ['https://www.linkedin.com/in/clementpougetosmont/'],
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

      <div style={{
        position: 'relative',
        zIndex: 1,
        background: 'var(--paper)',
        color: 'var(--ink)',
        fontFamily: 'var(--font-sans)',
      }}>

        {/* ═════════════════════════════════════════════════════ */}
        {/* HERO                                                    */}
        {/* ═════════════════════════════════════════════════════ */}
        <section style={{
          minHeight: '78vh',
          display: 'flex',
          alignItems: 'center',
          padding: 'clamp(7rem, 12vh, 9rem) 6vw 4rem',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div className="cb-dotmatrix" aria-hidden style={{
            position: 'absolute', right: 0, top: '15%',
            width: '28%', height: '60%', pointerEvents: 'none',
          }} />

          <div className="hero-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)',
            gap: 'clamp(2rem, 5vw, 5rem)',
            alignItems: 'center',
            width: '100%',
            maxWidth: '1320px',
            margin: '0 auto',
            position: 'relative',
          }}>
            <div style={{ minWidth: 0 }}>
              {/* Mega name */}
              <h1 style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'clamp(3rem, 7.5vw, 7.5rem)',
                fontWeight: 700,
                lineHeight: 0.95,
                letterSpacing: '-0.045em',
                marginBottom: '1.75rem',
                color: 'var(--ink)',
              }}>
                <span className="hero-line"><span className="hero-line-inner" style={{ color: 'var(--ink)' }}>Clément</span></span>
                <span className="hero-line"><span className="hero-line-inner">
                  Pouget-Osmont<span style={{ color: 'var(--signal)' }}>.</span>
                </span></span>
              </h1>

              {/* Subtitle — h2 sémantique pour SEO (mots-clés métier juste sous le h1) */}
              <h2 style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'clamp(1.1rem, 2vw, 1.5rem)',
                fontWeight: 500,
                color: 'var(--ink)',
                marginTop: 0,
                marginBottom: '1rem',
                letterSpacing: '-0.015em',
              }}>
                {t('hero', 'title')}
              </h2>

              {/* Tagline tags — now in JetBrains Mono */}
              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--steel)',
                fontWeight: 400,
                marginBottom: '2.75rem',
                lineHeight: 1.6,
                letterSpacing: '0.02em',
              }}>
                Product Marketing <span style={{ color: 'var(--signal)', margin: '0 0.35rem' }}>·</span>
                Growth Marketing <span style={{ color: 'var(--signal)', margin: '0 0.35rem' }}>·</span>
                Revenue Strategy <span style={{ color: 'var(--signal)', margin: '0 0.35rem' }}>·</span>
                Team Management
              </p>

              {/* CTAs */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <Link to={bookingUrl('home-hero')} className="cb-btn cb-btn--primary">
                  {t('hero', 'cta_chat')} <span className="cb-arrow">→</span>
                </Link>
                <a href="#about" className="cb-btn cb-btn--ghost">
                  {t('hero', 'cta_more')} ↓
                </a>
              </div>
            </div>

            {/* Portrait (kept) — N&B high-contrast per brand book p.11 */}
            <div className="hero-portrait" style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
              <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '420px',
                aspectRatio: '4/5',
                background: 'var(--ink)',
                borderRadius: 'var(--cb-radius)',
                overflow: 'hidden',
              }}>
                <img
                  src={PORTRAIT_URL}
                  alt="Clément Pouget-Osmont, consultant marketing santé freelance et Fractional CMO HealthTech"
                  loading="eager"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: 'grayscale(1) contrast(1.08)',
                    mixBlendMode: 'luminosity',
                    opacity: 0.95,
                  }}
                />
                {/* Corner eyebrow — brand book signature */}
                <span style={{
                  position: 'absolute',
                  top: '1rem',
                  left: '1rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.65rem',
                  fontWeight: 500,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--signal)',
                }}>
                  // Fractional CMO
                </span>
                <span style={{
                  position: 'absolute',
                  bottom: '1rem',
                  right: '1rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.6rem',
                  letterSpacing: '0.08em',
                  color: 'var(--mist)',
                }}>
                  CPO · 2026
                </span>
              </div>
            </div>
          </div>

          {/* Wordmark + page marker */}
          <div style={{
            position: 'absolute', bottom: '1.5rem', left: '6vw',
          }}>
            <Wordmark size="0.85rem" />
          </div>
          <div style={{
            position: 'absolute', bottom: '1.5rem', right: '6vw',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
              letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--steel)',
            }}>Scroll</span>
            <div style={{
              width: '1px', height: '32px',
              background: 'linear-gradient(to bottom, var(--ink), transparent)',
              animation: 'scrollPulse 2s ease-in-out infinite',
            }} />
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════ */}
        {/* MARQUEE CLIENTS                                         */}
        {/* ═════════════════════════════════════════════════════ */}
        <div style={{
          padding: '2rem 0',
          borderTop: '1px solid rgba(10,10,11,0.08)',
          borderBottom: '1px solid rgba(10,10,11,0.08)',
          overflow: 'hidden',
          background: 'var(--paper)',
          position: 'relative',
        }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '6rem', background: 'linear-gradient(to right, var(--paper), transparent)', zIndex: 1, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '6rem', background: 'linear-gradient(to left, var(--paper), transparent)', zIndex: 1, pointerEvents: 'none' }} />
          <div className="animate-scroll" style={{ display: 'flex', whiteSpace: 'nowrap' }}>
            {[...clients, ...clients].map((c, i) => (
              <span key={i} style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.95rem',
                fontWeight: 500,
                letterSpacing: '-0.01em',
                padding: '0 2.25rem',
                color: 'var(--ink)',
                display: 'inline-flex', alignItems: 'center', gap: '2.25rem',
              }}>
                {c}<span style={{ color: 'var(--signal)', fontSize: '0.6rem' }}>●</span>
              </span>
            ))}
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════ */}
        {/* POSITIONING — SEO content (mots-clés métier)            */}
        {/* ═════════════════════════════════════════════════════ */}
        <section style={{ padding: 'clamp(4rem, 7vw, 6rem) 6vw 1rem' }}>
          <div style={{ maxWidth: '780px', margin: '0 auto' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <Eyebrow>// 00 — Positionnement</Eyebrow>
            </div>
            <h2 style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(1.5rem, 2.4vw, 2rem)',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              lineHeight: 1.15,
              marginTop: 0,
              marginBottom: '2rem',
              color: 'var(--ink)',
            }}>
              {lang === 'fr'
                ? 'Marketing santé moderne : IA, Growth & Product Marketing.'
                : 'Modern healthcare marketing: AI, Growth & Product Marketing.'}
            </h2>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              fontFamily: 'var(--font-sans)',
              fontSize: '1rem',
              lineHeight: 1.7,
              color: 'var(--graphite)',
            }}>
              {lang === 'fr' ? (
                <>
                  <p>Je suis <strong>consultant marketing santé freelance</strong> basé en France, et j'aide les startups, scaleups et grands groupes du secteur à transformer leur stratégie marketing en moteur de croissance. Pendant 5 ans, j'ai dirigé une partie du marketing de <strong>Doctolib</strong> au moment où l'entreprise est passée de scaleup à licorne européenne. Aujourd'hui, j'interviens en <strong>Fractional CMO</strong> ou en advisory pour les équipes <strong>HealthTech, MedTech, BioTech et pharma</strong> qui veulent accélérer sans recruter un CMO senior à temps plein.</p>
                  <p>Mon approche n'est pas celle d'un marketeur classique. Je combine <strong>IA générative</strong>, <strong>Product Marketing</strong> et <strong>Growth Marketing</strong> pour produire en quelques semaines ce qui mobilisait une équipe entière il y a deux ans : contenus longs sourcés, funnels d'acquisition outillés, scoring de leads, automatisations sur tout le cycle commercial. Une personne bien outillée peut aujourd'hui rivaliser avec un département entier, à condition de maîtriser à la fois les outils et le secteur.</p>
                  <p>Et c'est là que le marketing santé devient particulier. Il exige une compréhension fine de trois écosystèmes qui ne se parlent pas : les professionnels de santé, les patients, et les payeurs (assurances, hôpitaux, mutuelles). Sans ça, les meilleures campagnes tombent à plat. C'est ce que j'ai construit en 12 ans de go-to-market sur des produits B2B santé, des SaaS médicaux aux dispositifs connectés.</p>
                  <p>Concrètement, je vous aide à positionner un produit santé sur son marché, à construire un funnel d'acquisition qui parle aux médecins (et qui passe les filtres réglementaires), à recruter et structurer une équipe marketing, ou à auditer ce que vous avez déjà mis en place. Selon votre stade (early stage, scaleup, ETI), l'accompagnement va de quelques jours par mois à un mandat <strong>Part-Time CMO</strong> sur 6 à 12 mois.</p>
                </>
              ) : (
                <>
                  <p>I'm a <strong>freelance healthcare marketing consultant</strong> based in France, helping startups, scaleups and enterprises in the sector turn marketing into a growth engine. For 5 years I led part of marketing at <strong>Doctolib</strong>, while it scaled from startup to European unicorn. Today I work as a <strong>Fractional CMO</strong> or advisor for <strong>HealthTech, MedTech, BioTech and pharma</strong> teams that need to accelerate without hiring a full-time CMO.</p>
                  <p>My approach isn't traditional marketing. I combine <strong>generative AI</strong>, <strong>Product Marketing</strong> and <strong>Growth Marketing</strong> to ship in weeks what used to take a full team months: deeply sourced long-form content, instrumented acquisition funnels, lead scoring, full-cycle sales automation. A single well-equipped person can now match a full department, provided they master both the tools and the industry.</p>
                  <p>And healthcare marketing is its own world. It requires a sharp understanding of three ecosystems that rarely speak to each other: healthcare professionals, patients, and payers (insurers, hospitals, mutuelles). Without that, even the best campaigns fall flat. That's what I've built over 12 years of go-to-market work on B2B healthcare products, from medical SaaS to connected devices.</p>
                  <p>Concretely, I help you position a healthcare product, build acquisition funnels that speak to physicians (and pass regulatory filters), recruit and structure a marketing team, or audit what you've already deployed. Depending on your stage (early stage, scaleup, large company), the engagement ranges from a few days per month to a <strong>Part-Time CMO</strong> mandate of 6 to 12 months.</p>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════ */}
        {/* ABOUT + BOOKING                                         */}
        {/* ═════════════════════════════════════════════════════ */}
        <section id="about" style={{ padding: '6rem 6vw 4rem' }}>
          <div ref={revealAbout} className="cb-reveal about-booking-row" style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'clamp(2rem, 4vw, 4rem)',
            alignItems: 'flex-start',
            maxWidth: '1320px',
            margin: '0 auto',
          }}>
            {/* À propos */}
            <div className="about-block" style={{
              flex: '1 1 360px',
              minWidth: 0,
              background: 'var(--paper-soft)',
              border: '1px solid rgba(10,10,11,0.08)',
              borderRadius: 'var(--cb-radius)',
              padding: 'clamp(2rem, 4vw, 3rem)',
              position: 'sticky',
              top: '6rem',
            }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <Eyebrow>// 01 — À propos</Eyebrow>
              </div>
              <h2 style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'clamp(1.6rem, 2.6vw, 2.3rem)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
                marginBottom: '1.5rem',
                color: 'var(--ink)',
              }}>
                {t('about', 'title')}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '1.75rem' }}>
                {(['p1','p2','p3'] as const).map(k => (
                  <p key={k} style={{
                    fontSize: '0.9rem',
                    lineHeight: 1.7,
                    color: 'var(--graphite)',
                    fontWeight: 400,
                  }}>
                    {t('about', k)}
                  </p>
                ))}
              </div>
              <Link
                to={bookingUrl('home-about')}
                className="cb-ulink"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.82rem',
                  letterSpacing: '0.02em',
                  color: 'var(--ink)',
                }}
              >
                {t('about', 'cta')}
              </Link>
            </div>

            {/* Booking embed kept */}
            <div className="booking-block" style={{ flex: '1 1 480px', minWidth: 0 }}>
              <Booking embedded />
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════ */}
        {/* ACCOMPAGNEMENTS                                         */}
        {/* ═════════════════════════════════════════════════════ */}
        <section style={{
          background: 'var(--ink)',
          color: 'var(--paper)',
          padding: '7rem 6vw',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div className="cb-dotmatrix cb-dotmatrix--signal" aria-hidden style={{
            position: 'absolute', left: 0, top: 0,
            width: '18%', height: '40%', pointerEvents: 'none',
          }} />

          <div ref={revealAccomp} className="cb-reveal" style={{ maxWidth: '1320px', margin: '0 auto', position: 'relative' }}>
            <div style={{ marginBottom: '4rem', maxWidth: '48ch' }}>
              <Eyebrow>// 02 — {accomp?.badge_label || 'Accompagnements'}</Eyebrow>
              <h2 style={{
                marginTop: '1.25rem',
                fontFamily: 'var(--font-sans)',
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 700,
                letterSpacing: '-0.035em',
                lineHeight: 1.1,
                color: 'var(--paper)',
              }}>
                {accomp?.title || "Les entreprises que j'accompagne"}
              </h2>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.25rem',
              marginBottom: '4rem',
            }}>
              {(() => {
                const accompStyles = [
                  { to: bookingUrl('home-advisor'), starred: false },
                  { to: bookingUrl('home-parttime'), starred: true },
                  { to: '/transition-cmo', starred: false },
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
                  to: string; starred: boolean; idx: string;
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
                  starred: !!accompStyles[i]?.starred,
                  idx: `// 0${i + 1}`,
                }))
              })().map((item: {
                badge: string; trigger: string; title: string; text: string;
                format: string; price: string; ctaLabel: string;
                to: string; starred: boolean; idx: string;
              }, i: number) => {
                const cardBg = item.starred ? 'var(--paper)' : 'var(--ink-soft)'
                const cardFg = item.starred ? 'var(--ink)' : 'var(--paper)'
                const cardMuted = item.starred ? 'var(--graphite)' : 'var(--mist)'
                const cardBorder = item.starred ? 'var(--paper)' : 'rgba(237,235,228,0.12)'
                const divider = item.starred ? 'rgba(10,10,11,0.1)' : 'rgba(237,235,228,0.12)'
                return (
                  <article key={i} style={{
                    background: cardBg,
                    color: cardFg,
                    border: `1px solid ${cardBorder}`,
                    borderRadius: 'var(--cb-radius)',
                    padding: '2rem 1.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    position: 'relative',
                    transition: 'transform 0.3s ease, border-color 0.3s ease',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = '' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="cb-eyebrow" style={{ color: item.starred ? 'var(--signal-deep)' : 'var(--signal)' }}>
                        {item.idx}
                      </span>
                      {item.starred && (
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.62rem',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: 'var(--signal-deep)',
                          fontWeight: 600,
                        }}>
                          ⭐ Mission préférée
                        </span>
                      )}
                    </div>

                    <p style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: cardMuted,
                      margin: 0,
                    }}>
                      — {item.badge}
                    </p>

                    {item.trigger && (
                      <p style={{
                        fontFamily: 'var(--font-serif)',
                        fontStyle: 'italic',
                        fontSize: '0.95rem',
                        color: cardMuted,
                        lineHeight: 1.45,
                        margin: 0,
                      }}>
                        {item.trigger}
                      </p>
                    )}

                    <h3 style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '1.2rem',
                      fontWeight: 600,
                      letterSpacing: '-0.015em',
                      lineHeight: 1.25,
                      color: cardFg,
                      margin: 0,
                    }}>
                      {item.title}
                    </h3>

                    {item.text && (
                      <p style={{
                        fontSize: '0.88rem',
                        color: cardMuted,
                        lineHeight: 1.6,
                        margin: 0,
                        whiteSpace: 'pre-line',
                        flexGrow: 1,
                      }}>
                        {item.text}
                      </p>
                    )}

                    <div style={{
                      display: 'flex', flexDirection: 'column', gap: '0.25rem',
                      paddingTop: '1rem',
                      borderTop: `1px solid ${divider}`,
                    }}>
                      <div style={{ fontSize: '0.8rem', color: cardMuted }}>{item.format}</div>
                      <div style={{
                        fontSize: '1rem',
                        color: cardFg,
                        fontWeight: 700,
                        letterSpacing: '-0.01em',
                      }}>{item.price}</div>
                    </div>

                    <Link
                      to={item.to}
                      className="cb-btn"
                      style={{
                        marginTop: '0.5rem',
                        background: item.starred ? 'var(--ink)' : 'var(--signal)',
                        color: item.starred ? 'var(--paper)' : 'var(--ink)',
                        width: 'fit-content',
                        fontSize: '0.8rem',
                        padding: '0.65rem 1.1rem',
                      }}
                    >
                      {item.ctaLabel.replace(/\s*→\s*$/, '')} <span className="cb-arrow">→</span>
                    </Link>
                  </article>
                )
              })}
            </div>

            {/* Main CTA under cards (wording kept) */}
            <div>
              <Link
                to={bookingUrl('home-footer')}
                className="cb-btn cb-btn--signal"
                style={{ fontSize: '0.95rem', padding: '1rem 1.6rem' }}
              >
                {accomp?.cta || 'Voyons ce que je peux faire pour vous'} <span className="cb-arrow">→</span>
              </Link>
            </div>

            <div style={{
              marginTop: '4rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Wordmark size="0.85rem" color="var(--paper)" />
              <span className="cb-page-marker" style={{ color: 'var(--steel)' }}>— 02 / 06</span>
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════ */}
        {/* SECTEURS                                                */}
        {/* ═════════════════════════════════════════════════════ */}
        <section style={{
          background: 'var(--paper)',
          padding: '7rem 6vw',
        }}>
          <div ref={revealSect} className="cb-reveal" style={{ maxWidth: '1320px', margin: '0 auto' }}>
            <div style={{ marginBottom: '4rem', maxWidth: '48ch' }}>
              <Eyebrow>// 03 — {secteurs?.badge_label || 'Secteurs'}</Eyebrow>
              <h2 style={{
                marginTop: '1.25rem',
                fontFamily: 'var(--font-sans)',
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 700,
                letterSpacing: '-0.035em',
                lineHeight: 1.1,
                color: 'var(--ink)',
              }}>
                {secteurs?.title || 'Mes expériences en santé'}
              </h2>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.25rem',
            }}>
              {(() => {
                const secteursDefaults = [
                  { icon: '🧬', title: 'Pharma & Biotech', text: "Vente de produits hautement techniques à des décideurs Pharma, Biotech et académiques.", clients: 'Cherry Biotech, Doqboard, MSD', role: '' },
                  { icon: '💻', title: 'Healthtech', text: "Vente de logiciels à des professionnels de santé et des établissements hospitaliers.", clients: 'Doctolib, Kiro, Corilus France, Andrew, Semble, MonBilanDeSanté', role: '' },
                  { icon: '🏢', title: 'B2B', text: "Vente de solutions santé et RH à de grandes entreprises.", clients: 'HeyTeam, Sorcova Health, Neok', role: '' },
                  { icon: '🏥', title: 'Établissements de soins', text: "Marketing pour des centres de santé afin d'attirer patients et médecins.", clients: 'DocCity, Clinique stomatologie Dr Solène Vo Quang', role: '' },
                ]
                const cmsCards = Array.isArray(secteurs?.cards) ? secteurs!.cards : secteursDefaults
                type SecteurItem = {
                  icon: string; title: string; text: string; role: string; clients: string[]; idx: string;
                }
                return cmsCards.map((card: Record<string, string>, i: number): SecteurItem => ({
                  icon: card.icon || secteursDefaults[i]?.icon || '',
                  title: card.title || secteursDefaults[i]?.title || '',
                  text: card.text || secteursDefaults[i]?.text || '',
                  role: card.role || secteursDefaults[i]?.role || '',
                  clients: String(card.clients || secteursDefaults[i]?.clients || '')
                    .split(',').map(s => s.trim()).filter(Boolean),
                  idx: `// 0${i + 1}`,
                }))
              })().map((item: {
                icon: string; title: string; text: string; role: string; clients: string[]; idx: string;
              }, i: number) => (
                <article key={i} style={{
                  background: 'var(--paper-soft)',
                  border: '1px solid rgba(10,10,11,0.08)',
                  borderRadius: 'var(--cb-radius)',
                  padding: '2rem 1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  transition: 'transform 0.3s ease, border-color 0.3s ease',
                }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-2px)'; el.style.borderColor = 'var(--ink)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ''; el.style.borderColor = 'rgba(10,10,11,0.08)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="cb-eyebrow" style={{ color: 'var(--signal-deep)' }}>{item.idx}</span>
                    <span style={{ fontSize: '1.5rem', lineHeight: 1, filter: 'grayscale(0.4)' }}>{item.icon}</span>
                  </div>

                  <h3 style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    letterSpacing: '-0.015em',
                    lineHeight: 1.25,
                    color: 'var(--ink)',
                    margin: 0,
                  }}>
                    {item.title}
                  </h3>

                  <p style={{
                    fontSize: '0.88rem',
                    lineHeight: 1.65,
                    color: 'var(--graphite)',
                    margin: 0,
                  }}>
                    {item.text}
                  </p>

                  {item.role && (
                    <p style={{
                      fontFamily: 'var(--font-serif)',
                      fontStyle: 'italic',
                      fontSize: '0.9rem',
                      lineHeight: 1.5,
                      color: 'var(--signal-deep)',
                      margin: 0,
                    }}>
                      {item.role}
                    </p>
                  )}

                  <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: '0.35rem 0.75rem',
                    marginTop: 'auto',
                    paddingTop: '1rem',
                    borderTop: '1px solid rgba(10,10,11,0.08)',
                  }}>
                    {item.clients.map((c: string, j: number) => (
                      <span key={j} style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.72rem',
                        color: 'var(--ink)',
                        letterSpacing: '0.01em',
                      }}>
                        {c}{j < item.clients.length - 1 && <span style={{ color: 'var(--signal)', marginLeft: '0.75rem' }}>·</span>}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            <div style={{
              marginTop: '4rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Wordmark size="0.85rem" color="var(--ink)" />
              <span className="cb-page-marker">— 03 / 06</span>
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════ */}
        {/* MÉDIAS                                                  */}
        {/* ═════════════════════════════════════════════════════ */}
        <section style={{
          background: 'var(--paper-soft)',
          padding: '7rem 6vw',
        }}>
          <div ref={revealMedia} className="cb-reveal" style={{ maxWidth: '1320px', margin: '0 auto' }}>
            <div style={{ marginBottom: '4rem', maxWidth: '48ch' }}>
              <Eyebrow>// 04 — {t('media', 'badge')}</Eyebrow>
              <h2 style={{
                marginTop: '1.25rem',
                fontFamily: 'var(--font-sans)',
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 700,
                letterSpacing: '-0.035em',
                lineHeight: 1.1,
                color: 'var(--ink)',
              }}>
                {t('media', 'title')}
              </h2>
            </div>

            <div className="media-grid">
              {[
                {
                  href: 'https://www.youtube.com/watch?v=OR9iH07AHVQ&t',
                  img: '/media-silicon-carne.jpeg', alt: 'Podcast Silicon Carne — IA dans la santé pour les startups, intervention de Clément Pouget-Osmont',
                  badge: 'Podcast',
                  source: 'Silicon Carne', title: t('media', 'sc_title'), cta: t('media', 'watch'),
                },
                {
                  href: 'https://www.asianhhm.com/interviews/emerging-marketing-trends-in-the-healthcare-b2b-sector',
                  img: '/media-asian-hhm.jpeg', alt: 'Asian Hospital & Healthcare Management — interview tendances marketing santé B2B',
                  badge: 'Interview',
                  source: 'Asian Hospital & Healthcare Management', title: t('media', 'hhm_title'), cta: t('media', 'read'),
                },
                {
                  href: 'https://comptasante.fr/ressources/webinaires/developper-votre-patientele-en-12-leviers',
                  img: '/media-comptasante.jpeg', alt: 'Webinaire ComptaSanté — 12 leviers pour développer la patientèle des pros de santé',
                  badge: 'Webinaire',
                  source: 'ComptaSanté', title: t('media', 'cs_title'), cta: t('media', 'watch'),
                },
              ].map(m => (
                <a key={m.href} href={m.href} target="_blank" rel="noopener noreferrer"
                  style={{
                    textDecoration: 'none',
                    color: 'var(--ink)',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 'var(--cb-radius)',
                    overflow: 'hidden',
                    background: 'var(--paper)',
                    border: '1px solid rgba(10,10,11,0.08)',
                    transition: 'transform 0.3s ease, border-color 0.3s ease',
                  }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-2px)'; el.style.borderColor = 'var(--ink)'; const img = el.querySelector('img') as HTMLElement; if (img) img.style.transform = 'scale(1.03)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ''; el.style.borderColor = 'rgba(10,10,11,0.08)'; const img = el.querySelector('img') as HTMLElement; if (img) img.style.transform = 'scale(1)' }}
                >
                  <div style={{ aspectRatio: '16/10', position: 'relative', overflow: 'hidden', background: 'var(--ink)' }}>
                    <img src={m.img} alt={m.alt} style={{
                      width: '100%', height: '100%', objectFit: 'cover',
                      filter: 'grayscale(1) contrast(1.05)',
                      transition: 'transform 0.4s ease',
                    }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(10,10,11,0.55) 100%)' }} />
                    <span style={{
                      position: 'absolute', top: '1rem', left: '1rem',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.62rem',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      fontWeight: 500,
                      color: 'var(--signal)',
                    }}>
                      // {m.badge}
                    </span>
                  </div>
                  <div style={{ padding: '1.6rem 1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <p style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.65rem',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--steel)',
                      marginBottom: '0.75rem',
                      fontWeight: 500,
                    }}>
                      — {m.source}
                    </p>
                    <h3 style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '1.05rem',
                      fontWeight: 600,
                      letterSpacing: '-0.015em',
                      lineHeight: 1.35,
                      marginBottom: 'auto',
                      color: 'var(--ink)',
                    }}>
                      {m.title}
                    </h3>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      marginTop: '1.25rem',
                      fontSize: '0.82rem',
                      color: 'var(--ink)',
                      fontWeight: 500,
                    }}>
                      {m.cta} →
                    </span>
                  </div>
                </a>
              ))}
            </div>

            <div style={{
              marginTop: '4rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Wordmark size="0.85rem" color="var(--ink)" />
              <span className="cb-page-marker">— 04 / 06</span>
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════ */}
        {/* ARTICLES TEASER                                         */}
        {/* ═════════════════════════════════════════════════════ */}
        <section style={{
          background: 'var(--paper)',
          padding: '7rem 6vw',
        }}>
          <div ref={revealArticles} className="cb-reveal" style={{ maxWidth: '1320px', margin: '0 auto' }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
              marginBottom: '3.5rem', flexWrap: 'wrap', gap: '1.5rem',
            }}>
              <div style={{ maxWidth: '48ch' }}>
                <Eyebrow>// 05 — {t('articles_section', 'badge') || 'Insights'}</Eyebrow>
                <h2 style={{
                  marginTop: '1.25rem',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'clamp(2rem, 3.5vw, 3rem)',
                  fontWeight: 700,
                  letterSpacing: '-0.035em',
                  lineHeight: 1.1,
                  color: 'var(--ink)',
                }}>
                  {t('articles_section', 'title')}
                </h2>
              </div>
              <p style={{
                fontSize: '0.9rem',
                color: 'var(--graphite)',
                maxWidth: '400px',
                fontWeight: 400,
                lineHeight: 1.6,
              }}>
                {t('articles_section', 'subtitle')}
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.25rem',
            }}>
              {featuredArticles.map((article, i) => (
                <Link key={article.slug} to={`/articles/${article.slug}`} style={{ textDecoration: 'none' }}>
                  <article style={{
                    background: 'var(--paper-soft)',
                    border: '1px solid rgba(10,10,11,0.08)',
                    borderRadius: 'var(--cb-radius)',
                    padding: '2rem 1.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    height: '100%',
                    transition: 'transform 0.3s ease, border-color 0.3s ease',
                  }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-2px)'; el.style.borderColor = 'var(--ink)' }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ''; el.style.borderColor = 'rgba(10,10,11,0.08)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="cb-eyebrow" style={{ color: 'var(--signal-deep)', fontSize: '0.68rem' }}>
                        — {article.category}
                      </span>
                      <span className="cb-page-marker">— 0{i + 1}</span>
                    </div>

                    <h3 style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      letterSpacing: '-0.015em',
                      lineHeight: 1.3,
                      color: 'var(--ink)',
                      margin: 0,
                      flexGrow: 1,
                    }}>
                      {article.title}
                    </h3>

                    <p style={{
                      fontSize: '0.82rem',
                      color: 'var(--graphite)',
                      lineHeight: 1.6,
                      margin: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {article.excerpt}
                    </p>

                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      marginTop: 'auto',
                      paddingTop: '1rem',
                      borderTop: '1px solid rgba(10,10,11,0.08)',
                    }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.72rem',
                        color: 'var(--steel)',
                      }}>
                        {formatDate(article.date)} · {article.readingTime}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--ink)', fontWeight: 500 }}>
                        {t('articles_section', 'read')}
                      </span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            <div style={{ marginTop: '3rem' }}>
              <Link to="/articles" className="cb-btn cb-btn--primary">
                {t('articles_section', 'see_all').replace(/\s*→\s*$/, '')} <span className="cb-arrow">→</span>
              </Link>
            </div>

            <div style={{
              marginTop: '4rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Wordmark size="0.85rem" color="var(--ink)" />
              <span className="cb-page-marker">— 05 / 06</span>
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════ */}
        {/* JOURNALISTES SANTÉ FORM                                 */}
        {/* ═════════════════════════════════════════════════════ */}
        <section id="journalistes" style={{
          background: 'var(--ink)',
          color: 'var(--paper)',
          padding: 'clamp(4rem, 9vw, 7rem) 6vw',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Hidden Netlify form registration so the build picks up the schema */}
          <JournalistesNetlifyRegistration />

          {/* Subtle dotmatrix accent */}
          <div className="cb-dotmatrix cb-dotmatrix--signal" aria-hidden style={{
            position: 'absolute', top: 0, right: 0,
            width: '38%', height: '60%',
            opacity: 0.18, pointerEvents: 'none',
          }} />

          <div
            ref={revealJo}
            className="cb-reveal jo-grid"
            style={{
              maxWidth: '1180px',
              margin: '0 auto',
              position: 'relative',
            }}
          >
            {/* Left col: title + form */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 600,
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: 'var(--ink)', background: 'var(--signal)',
                  padding: '0.35rem 0.75rem', borderRadius: '4px',
                }}>
                  🎁 Ressource gratuite
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 500,
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.7)',
                  padding: '0.35rem 0',
                }}>
                  France 🇫🇷 + États-Unis 🇺🇸
                </span>
              </div>

              <h2 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.9rem, 4.5vw, 2.9rem)',
                fontWeight: 400,
                color: 'var(--paper)',
                margin: '0 0 1rem',
                lineHeight: 1.1,
                letterSpacing: '-0.01em',
              }}>
                {JOURNALISTES_TITLE}
              </h2>
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '1.05rem',
                color: 'rgba(255,255,255,0.72)',
                lineHeight: 1.65,
                margin: '0 0 2.25rem',
                maxWidth: '520px',
              }}>
                {JOURNALISTES_SUB}
              </p>

              <JournalistesForm variant="modal" theme="dark" source="home" />
            </div>

            {/* Right col: GSheet preview */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <JournalistesSheetPreview />
            </div>
          </div>

          <style>{`
            .jo-grid {
              display: grid;
              grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
              gap: clamp(2rem, 4vw, 4.5rem);
              align-items: center;
            }
            @media (max-width: 880px) {
              .jo-grid { grid-template-columns: 1fr; gap: 2.5rem; }
              .jo-grid > div:last-child { order: -1; }
            }
          `}</style>
        </section>

        {/* ═════════════════════════════════════════════════════ */}
        {/* BROCHURE FORM                                           */}
        {/* ═════════════════════════════════════════════════════ */}
        <section id="brochure" style={{
          background: 'var(--signal)',
          padding: '7rem 6vw',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div className="cb-dotmatrix" aria-hidden style={{
            position: 'absolute', inset: 0, opacity: 0.1, pointerEvents: 'none',
          }} />

          <div ref={revealBrochure} className="cb-reveal" style={{
            maxWidth: '720px', margin: '0 auto', position: 'relative',
          }}>
            {/* Hidden Netlify form registration */}
            <form name="brochure" data-netlify="true" hidden>
              <input type="hidden" name="form-name" value="brochure" />
              <input type="text" name="first-name" />
              <input type="text" name="last-name" />
              <input type="text" name="company" />
              <input type="email" name="email" />
              <input type="tel" name="phone" />
            </form>

            <div style={{ marginBottom: '2.5rem' }}>
              <Eyebrow tone="ink">// 06 — Brochure</Eyebrow>
            </div>

            <h2 style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(2rem, 4.5vw, 3.5rem)',
              fontWeight: 700,
              letterSpacing: '-0.035em',
              lineHeight: 1.05,
              marginBottom: '1rem',
              color: 'var(--ink)',
            }}>
              {t('brochure', 'title')}
            </h2>
            <p style={{
              fontSize: '1rem',
              color: 'var(--ink)',
              fontWeight: 400,
              marginBottom: '2.5rem',
              lineHeight: 1.55,
              maxWidth: '50ch',
            }}>
              {t('brochure', 'subtitle')}
            </p>

            {submitted ? (
              <div style={{
                padding: '2rem',
                background: 'var(--ink)',
                color: 'var(--paper)',
                borderRadius: 'var(--cb-radius)',
              }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--signal)',
                  marginBottom: '0.75rem',
                }}>
                  // status · ok
                </div>
                <p style={{
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 600,
                  fontSize: '1.2rem',
                  marginBottom: '0.5rem',
                  color: 'var(--paper)',
                }}>{t('brochure', 'success_title')}</p>
                <p style={{ color: 'var(--mist)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
                  {t('brochure', 'success_sub')}
                </p>
                <a href="/CPO-Services-2026.pdf" download className="cb-btn cb-btn--signal">
                  {t('brochure', 'success_cta')}
                </a>
              </div>
            ) : (
              <form name="brochure" onSubmit={handleSubmit} style={{
                display: 'flex', flexDirection: 'column', gap: '1rem',
                background: 'var(--paper)',
                border: '1px solid var(--ink)',
                borderRadius: 'var(--cb-radius)',
                padding: 'clamp(1.75rem, 4vw, 2.5rem)',
              }}>
                <input type="hidden" name="form-name" value="brochure" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>{t('brochure', 'first_name')} *</label>
                    <input type="text" name="first-name" required value={formData.firstName}
                      onChange={e => setFormData(p => ({ ...p, firstName: e.target.value }))} style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = 'var(--ink)' }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(10,10,11,0.12)' }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>{t('brochure', 'last_name')} *</label>
                    <input type="text" name="last-name" required value={formData.lastName}
                      onChange={e => setFormData(p => ({ ...p, lastName: e.target.value }))} style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = 'var(--ink)' }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(10,10,11,0.12)' }}
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
                      onFocus={e => { e.target.style.borderColor = 'var(--ink)' }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(10,10,11,0.12)' }}
                    />
                  </div>
                ))}
                <button type="submit" disabled={submitting} style={{
                  width: '100%',
                  padding: '1rem',
                  marginTop: '0.5rem',
                  background: submitting ? 'var(--graphite)' : 'var(--ink)',
                  color: 'var(--paper)',
                  border: 'none',
                  borderRadius: 'var(--cb-radius)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  letterSpacing: '-0.005em',
                  transition: 'background 0.2s',
                  cursor: 'none',
                }}
                  onMouseEnter={e => { if (!submitting) (e.currentTarget as HTMLElement).style.background = 'var(--ink-soft)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = submitting ? 'var(--graphite)' : 'var(--ink)' }}
                >
                  {submitting ? t('brochure', 'submitting') : t('brochure', 'submit')}
                </button>
              </form>
            )}

            <div style={{
              marginTop: '4rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '1.5rem',
              borderTop: '1px solid rgba(10,10,11,0.2)',
            }}>
              <Wordmark size="0.85rem" color="var(--ink)" />
              <span className="cb-page-marker" style={{ color: 'var(--ink)' }}>— 06 / 06 · clempo.fr 2026</span>
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
