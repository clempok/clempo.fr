import { useState, useEffect, useRef } from 'react'
import SEO from '../components/SEO'
import Eyebrow from '../components/Eyebrow'
import Wordmark from '../components/Wordmark'

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

const missions = [
  'Accompagner Clément dans le suivi de ses clients (Product Marketing, Growth, Contenu, Management)',
  'Participer aux réunions stratégiques avec les founders et CMO',
  'Élaborer les contenus marketing (articles, posts, newsletters, vidéos)',
  'Mettre en place et suivre les campagnes marketing (acquisition, nurturing, événementiel)',
  'Échanger avec les partenaires (agences, médias, freelances de l\'écosystème)',
  'Faire connaître l\'agence : LinkedIn, contenu, networking, événements santé',
]

const conditions = [
  {
    emoji: '📝',
    title: 'Storyteller',
    text: 'Tu as déjà créé du contenu — pour toi ou pour une entreprise. Tu sais et tu aimes raconter des histoires.',
  },
  {
    emoji: '🏥',
    title: 'Lien avec la santé',
    text: 'Un parcours, une expérience perso, une motivation qui t\'attire vraiment vers ce secteur.',
  },
  {
    emoji: '🤖',
    title: 'Maîtrise des outils IA',
    text: 'ChatGPT, Claude, Perplexity, n8n, Cursor… tu sais en faire un levier au quotidien, pas juste un gadget.',
  },
]

export default function Hiring() {
  const clients = [...defaultClients, ...defaultClients]

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    school: '', startDate: '', durationMonths: '3', linkedin: '',
    contentLinks: '', healthLink: '', aiLinks: '', message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true)
    try {
      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          'form-name': 'hiring',
          'first-name': formData.firstName,
          'last-name': formData.lastName,
          'email': formData.email,
          'phone': formData.phone,
          'school': formData.school,
          'start-date': formData.startDate,
          'duration-months': formData.durationMonths,
          'linkedin': formData.linkedin,
          'content-links': formData.contentLinks,
          'health-link': formData.healthLink,
          'ai-links': formData.aiLinks,
          'message': formData.message,
        }).toString(),
      })
      setSubmitted(true)
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: document.getElementById('apply')?.offsetTop || 0, behavior: 'smooth' })
      }
    } catch { setSubmitted(true) }
    finally { setSubmitting(false) }
  }

  const revealAgency = useReveal()
  const revealJob = useReveal()
  const revealProfile = useReveal()
  const revealForm = useReveal()

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
  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    minHeight: '110px',
    resize: 'vertical',
    lineHeight: 1.55,
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

  return (
    <>
      <SEO
        title="On recrute — Stage Assistant Direction Marketing | Clempo"
        description="Clempo Consulting recrute un·e stagiaire Assistant Direction Marketing — 3 mois minimum, full remote, début juillet 2026. Profil storyteller, lien santé, maîtrise IA."
        canonical="/hiring"
      />

      {/* Hidden Netlify form registration */}
      <form name="hiring" data-netlify="true" hidden>
        <input type="hidden" name="form-name" value="hiring" />
        <input type="text" name="first-name" />
        <input type="text" name="last-name" />
        <input type="email" name="email" />
        <input type="tel" name="phone" />
        <input type="text" name="school" />
        <input type="date" name="start-date" />
        <input type="number" name="duration-months" />
        <input type="url" name="linkedin" />
        <textarea name="content-links"></textarea>
        <textarea name="health-link"></textarea>
        <textarea name="ai-links"></textarea>
        <textarea name="message"></textarea>
      </form>

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
          padding: 'clamp(7rem, 12vh, 9rem) 6vw 5rem',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative' }}>
            <div style={{ marginBottom: '2rem' }}>
              <Eyebrow>// 01 — Recrutement</Eyebrow>
            </div>

            <h1 style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(3rem, 7.5vw, 6.5rem)',
              fontWeight: 700,
              lineHeight: 0.98,
              letterSpacing: '-0.045em',
              marginBottom: '1.5rem',
              color: 'var(--ink)',
            }}>
              On recrute.<br />
              <span style={{ color: 'var(--graphite)' }}>Assistant·e Direction Marketing.</span>
            </h1>

            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(1.05rem, 1.6vw, 1.35rem)',
              color: 'var(--graphite)',
              maxWidth: '60ch',
              lineHeight: 1.5,
              marginBottom: '2rem',
              fontWeight: 400,
            }}>
              Stage de <strong style={{ color: 'var(--ink)' }}>3 mois minimum</strong> · Full remote · Horaires flexibles · Début <strong style={{ color: 'var(--ink)' }}>juillet 2026</strong>.
            </p>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.55rem 1rem',
              background: 'var(--paper-soft)',
              border: '1px solid rgba(10,10,11,0.1)',
              borderRadius: '999px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              color: 'var(--ink)',
              marginBottom: '2.5rem',
            }}>
              🎯 École de commerce · marketing · communication
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <a href="#apply" className="cb-btn cb-btn--primary">
                Postuler <span className="cb-arrow">↓</span>
              </a>
              <a href="#job" className="cb-btn cb-btn--ghost">
                Voir les missions <span className="cb-arrow">↓</span>
              </a>
            </div>
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
            {clients.map((c, i) => (
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
        {/* AGENCE                                                  */}
        {/* ═════════════════════════════════════════════════════ */}
        <section style={{ padding: '6rem 6vw 4rem' }}>
          <div ref={revealAgency} className="cb-reveal" style={{
            maxWidth: '900px',
            margin: '0 auto',
          }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <Eyebrow>// 02 — L'agence</Eyebrow>
            </div>
            <h2 style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              marginBottom: '1.5rem',
              color: 'var(--ink)',
            }}>
              Clempo Consulting, agence de marketing spécialisée santé.
            </h2>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              fontSize: '1rem',
              lineHeight: 1.65,
              color: 'var(--graphite)',
            }}>
              <p>
                Depuis 3 ans, j'ai accompagné <strong style={{ color: 'var(--ink)' }}>plus de 20 clients</strong> du secteur santé — startups, scaleups, ETI — sur leur stratégie et leurs opérations marketing. Parmi eux : <strong style={{ color: 'var(--ink)' }}>Doctolib, Kiro, Santé Académie, Cherry Biotech, Neok, Médéré, Sorcova, DocCity, Semble, Andrew, Sofia Développement</strong>.
              </p>
              <p>
                Les métiers exercés au quotidien : <strong style={{ color: 'var(--ink)' }}>Product Marketing, Growth Marketing, Création de contenu, Management d'équipe</strong>. Ce stage, c'est l'occasion de toucher à toutes les dimensions du marketing en accompagnant des entreprises de tailles très variées.
              </p>
              <p>
                Et surtout, c'est l'occasion de bosser dans un secteur qui a du sens : <strong style={{ color: 'var(--ink)' }}>contribuer à améliorer la vie des patients et des soignants</strong>.
              </p>
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════ */}
        {/* LE POSTE — MISSIONS                                     */}
        {/* ═════════════════════════════════════════════════════ */}
        <section id="job" style={{
          padding: '6rem 6vw',
          background: 'var(--ink)',
          color: 'var(--paper)',
        }}>
          <div ref={revealJob} className="cb-reveal" style={{
            maxWidth: '1100px',
            margin: '0 auto',
          }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <Eyebrow tone="signal">// 03 — Missions</Eyebrow>
            </div>
            <h2 style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              marginBottom: '2.5rem',
              color: 'var(--paper)',
            }}>
              Ce que tu feras au quotidien.
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
              marginBottom: '3rem',
            }}>
              {missions.map((m, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 'var(--cb-radius)',
                  padding: '1.5rem',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    color: 'var(--signal)',
                    fontWeight: 600,
                    marginTop: '0.15rem',
                    flexShrink: 0,
                  }}>
                    0{i + 1}
                  </span>
                  <p style={{
                    fontSize: '0.95rem',
                    lineHeight: 1.55,
                    color: 'var(--paper)',
                    margin: 0,
                  }}>
                    {m}
                  </p>
                </div>
              ))}
            </div>

            {/* Conditions de travail */}
            <div style={{
              background: 'var(--signal)',
              color: 'var(--ink)',
              borderRadius: 'var(--cb-radius)',
              padding: '1.75rem 2rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1.25rem',
            }}>
              {[
                { label: 'Format', value: 'Stage de fin d\'études ou césure' },
                { label: 'Durée', value: '3 mois minimum' },
                { label: 'Lieu', value: 'Full remote' },
                { label: 'Horaires', value: 'Flexibles (je suis cool tant que le travail est fait)' },
                { label: 'Début', value: 'Juillet 2026' },
              ].map((it) => (
                <div key={it.label}>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--ink)',
                    opacity: 0.7,
                    marginBottom: '0.4rem',
                  }}>
                    {it.label}
                  </div>
                  <div style={{
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    lineHeight: 1.35,
                  }}>
                    {it.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════ */}
        {/* 3 CONDITIONS REQUISES                                   */}
        {/* ═════════════════════════════════════════════════════ */}
        <section style={{
          padding: '6rem 6vw',
          background: 'var(--paper-soft)',
        }}>
          <div ref={revealProfile} className="cb-reveal" style={{
            maxWidth: '1100px',
            margin: '0 auto',
          }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <Eyebrow>// 04 — Profil</Eyebrow>
            </div>
            <h2 style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              marginBottom: '1rem',
              color: 'var(--ink)',
            }}>
              3 conditions <em style={{ fontStyle: 'italic', fontFamily: 'var(--font-serif, "Instrument Serif", serif)' }}>requises</em>.
            </h2>
            <p style={{
              fontSize: '1rem',
              color: 'var(--graphite)',
              maxWidth: '55ch',
              lineHeight: 1.55,
              marginBottom: '3rem',
            }}>
              Si tu coches les 3, on a sûrement quelque chose à faire ensemble. Si tu n'en coches que 2, candidate quand même — mais explique-moi pourquoi.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
            }}>
              {conditions.map((c, i) => (
                <div key={i} style={{
                  background: 'var(--paper)',
                  border: '1px solid rgba(10,10,11,0.08)',
                  borderRadius: 'var(--cb-radius)',
                  padding: '2rem 1.75rem',
                  transition: 'transform 0.3s ease, border-color 0.3s ease',
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--ink)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(10,10,11,0.08)';
                  }}
                >
                  <div style={{
                    fontSize: '2rem',
                    marginBottom: '1rem',
                    lineHeight: 1,
                  }}>
                    {c.emoji}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--steel)',
                    marginBottom: '0.5rem',
                  }}>
                    Condition 0{i + 1}
                  </div>
                  <h3 style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                    marginBottom: '0.75rem',
                    color: 'var(--ink)',
                  }}>
                    {c.title}
                  </h3>
                  <p style={{
                    fontSize: '0.92rem',
                    lineHeight: 1.55,
                    color: 'var(--graphite)',
                    margin: 0,
                  }}>
                    {c.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════ */}
        {/* FORMULAIRE DE CANDIDATURE                               */}
        {/* ═════════════════════════════════════════════════════ */}
        <section id="apply" style={{
          background: 'var(--signal)',
          padding: '7rem 6vw',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div className="cb-dotmatrix" aria-hidden style={{
            position: 'absolute', inset: 0, opacity: 0.1, pointerEvents: 'none',
          }} />

          <div ref={revealForm} className="cb-reveal" style={{
            maxWidth: '760px', margin: '0 auto', position: 'relative',
          }}>
            <div style={{ marginBottom: '2rem' }}>
              <Eyebrow tone="ink">// 05 — Postuler</Eyebrow>
            </div>

            <h2 style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(2rem, 4.5vw, 3.2rem)',
              fontWeight: 700,
              letterSpacing: '-0.035em',
              lineHeight: 1.05,
              marginBottom: '1rem',
              color: 'var(--ink)',
            }}>
              Candidater au stage.
            </h2>
            <p style={{
              fontSize: '1rem',
              color: 'var(--ink)',
              fontWeight: 400,
              marginBottom: '2.5rem',
              lineHeight: 1.55,
              maxWidth: '55ch',
            }}>
              Remplis ce formulaire avec attention. Les 3 réponses sur le contenu, la santé et l'IA sont celles que je vais vraiment lire — colle de vrais liens, pas des promesses.
            </p>

            {submitted ? (
              <div style={{
                padding: '2.5rem',
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
                  fontSize: '1.35rem',
                  marginBottom: '0.75rem',
                  color: 'var(--paper)',
                  lineHeight: 1.25,
                }}>
                  Candidature reçue ✓
                </p>
                <p style={{ color: 'var(--mist)', fontSize: '0.95rem', lineHeight: 1.55, margin: 0 }}>
                  Merci pour ta candidature. Je lis chaque réponse personnellement et je reviens vers toi par email sous <strong style={{ color: 'var(--paper)' }}>7 jours</strong> — que ce soit positif ou non.
                </p>
              </div>
            ) : (
              <form name="hiring" onSubmit={handleSubmit} style={{
                display: 'flex', flexDirection: 'column', gap: '1rem',
                background: 'var(--paper)',
                border: '1px solid var(--ink)',
                borderRadius: 'var(--cb-radius)',
                padding: 'clamp(1.75rem, 4vw, 2.5rem)',
              }}>
                <input type="hidden" name="form-name" value="hiring" />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>Prénom *</label>
                    <input type="text" name="first-name" required value={formData.firstName}
                      onChange={e => setFormData(p => ({ ...p, firstName: e.target.value }))} style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = 'var(--ink)' }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(10,10,11,0.12)' }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Nom *</label>
                    <input type="text" name="last-name" required value={formData.lastName}
                      onChange={e => setFormData(p => ({ ...p, lastName: e.target.value }))} style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = 'var(--ink)' }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(10,10,11,0.12)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>Email *</label>
                    <input type="email" name="email" required value={formData.email}
                      onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = 'var(--ink)' }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(10,10,11,0.12)' }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Téléphone *</label>
                    <input type="tel" name="phone" required value={formData.phone}
                      onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = 'var(--ink)' }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(10,10,11,0.12)' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>École / formation *</label>
                  <input type="text" name="school" required placeholder="Ex : HEC, ESSEC, Sciences Po Comm, EM Lyon…"
                    value={formData.school}
                    onChange={e => setFormData(p => ({ ...p, school: e.target.value }))} style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = 'var(--ink)' }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(10,10,11,0.12)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>Date de début souhaitée *</label>
                    <input type="date" name="start-date" required min="2026-06-01"
                      value={formData.startDate}
                      onChange={e => setFormData(p => ({ ...p, startDate: e.target.value }))} style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = 'var(--ink)' }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(10,10,11,0.12)' }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Durée (mois) *</label>
                    <input type="number" name="duration-months" required min={3} max={12}
                      value={formData.durationMonths}
                      onChange={e => setFormData(p => ({ ...p, durationMonths: e.target.value }))} style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = 'var(--ink)' }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(10,10,11,0.12)' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>LinkedIn (optionnel)</label>
                  <input type="url" name="linkedin" placeholder="https://www.linkedin.com/in/ton-profil"
                    value={formData.linkedin}
                    onChange={e => setFormData(p => ({ ...p, linkedin: e.target.value }))} style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = 'var(--ink)' }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(10,10,11,0.12)' }}
                  />
                </div>

                {/* Condition 1 */}
                <div style={{ marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px dashed rgba(10,10,11,0.12)' }}>
                  <label style={labelStyle}>📝 Condition 1 — Liens vers du contenu que tu as créé *</label>
                  <textarea name="content-links" required
                    placeholder="Colle ici 2-3 liens vers du contenu que tu as produit (article, post LinkedIn, vidéo, podcast, newsletter, site perso…). Précise rapidement le contexte."
                    value={formData.contentLinks}
                    onChange={e => setFormData(p => ({ ...p, contentLinks: e.target.value }))} style={textareaStyle}
                    onFocus={e => { e.target.style.borderColor = 'var(--ink)' }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(10,10,11,0.12)' }}
                  />
                </div>

                {/* Condition 2 */}
                <div>
                  <label style={labelStyle}>🏥 Condition 2 — Ton lien avec le monde de la santé *</label>
                  <textarea name="health-link" required
                    placeholder="Raconte en 3-5 lignes ce qui te pousse vers le secteur de la santé (parcours perso, expérience, conviction, projet associatif…)."
                    value={formData.healthLink}
                    onChange={e => setFormData(p => ({ ...p, healthLink: e.target.value }))} style={textareaStyle}
                    onFocus={e => { e.target.style.borderColor = 'var(--ink)' }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(10,10,11,0.12)' }}
                  />
                </div>

                {/* Condition 3 */}
                <div>
                  <label style={labelStyle}>🤖 Condition 3 — Liens / preuves de ta maîtrise des outils IA *</label>
                  <textarea name="ai-links" required
                    placeholder="Colle des liens, captures (URL imgur, Notion, Loom…), ou décris un projet concret où tu as utilisé l'IA (ChatGPT, Claude, n8n, Cursor, Perplexity, etc.). Plus c'est concret, mieux c'est."
                    value={formData.aiLinks}
                    onChange={e => setFormData(p => ({ ...p, aiLinks: e.target.value }))} style={textareaStyle}
                    onFocus={e => { e.target.style.borderColor = 'var(--ink)' }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(10,10,11,0.12)' }}
                  />
                </div>

                {/* Message libre */}
                <div style={{ paddingTop: '1.5rem', borderTop: '1px dashed rgba(10,10,11,0.12)' }}>
                  <label style={labelStyle}>Message libre (optionnel)</label>
                  <textarea name="message"
                    placeholder="Tout ce que tu veux ajouter."
                    value={formData.message}
                    onChange={e => setFormData(p => ({ ...p, message: e.target.value }))} style={{ ...textareaStyle, minHeight: '90px' }}
                    onFocus={e => { e.target.style.borderColor = 'var(--ink)' }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(10,10,11,0.12)' }}
                  />
                </div>

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
                  {submitting ? 'Envoi en cours...' : 'Envoyer ma candidature →'}
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
              <span className="cb-page-marker" style={{ color: 'var(--ink)' }}>— 05 / 05 · clempo.fr 2026 · /hiring</span>
            </div>
          </div>
        </section>

      </div>
    </>
  )
}
