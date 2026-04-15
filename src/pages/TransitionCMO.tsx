import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, UserMinus, Hourglass, Users, LineChart, Briefcase, Workflow, Zap } from 'lucide-react'
import { useLang } from '../contexts/LangContext'
import SEO from '../components/SEO'
import { bookingUrl } from '../lib/cta'

const ACCENT = '#1A1A6B'
const BORDER = 'rgba(0,0,0,0.06)'
const MUTED = '#71717A'
const TEXT = '#0A0A0A'
const BG_OFF = '#F8F8F6'

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

const SRC = 'transition-cmo'

export default function TransitionCMO() {
  const { lang } = useLang()

  const revealTriggers = useReveal()
  const revealWeek1 = useReveal()
  const revealTable = useReveal()
  const revealCases = useReveal()
  const revealFaq = useReveal()

  const isFr = lang === 'fr'

  const title = isFr
    ? 'CMO Transition Santé · Je prends le relais | Clempo'
    : 'Interim Healthcare CMO · I take over | Clempo'
  const metaDescription = isFr
    ? "CMO santé en congé ou en transition ? Directeur marketing freelance, ex-Doctolib 5 ans. Je couvre votre COMEX et vos équipes 6 à 12 mois. Zéro ramp-up secteur."
    : "Healthcare CMO on leave or in transition? Freelance marketing director, ex-Doctolib. I cover your C-suite and teams for 6 to 12 months. Zero industry ramp-up."

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    'name': isFr ? 'CMO de transition santé' : 'Interim Healthcare CMO',
    'serviceType': isFr ? 'Directeur Marketing de transition' : 'Interim Chief Marketing Officer',
    'provider': {
      '@type': 'Person',
      'name': 'Clément Pouget-Osmont',
      'jobTitle': 'Healthcare Marketing Director',
      'url': 'https://www.linkedin.com/in/clementpougetosmont/',
    },
    'areaServed': { '@type': 'Country', 'name': 'France' },
    'description': metaDescription,
    'url': 'https://www.clempo.fr/transition-cmo',
  }

  const triggers = isFr ? [
    { icon: CalendarClock, title: 'Congé maternité ou longue maladie',
      text: "Votre CMO part 4 à 9 mois. Vous ne pouvez pas geler le marketing pendant ce temps. Il faut une continuité opérationnelle, pas un intérim qui improvise." },
    { icon: UserMinus, title: 'Démission soudaine',
      text: "Le CMO s'en va, l'équipe flotte, les comités de direction posent des questions. Besoin immédiat : tenir les engagements en cours et stabiliser l'équipe pendant le recrutement." },
    { icon: Hourglass, title: 'Recrutement CDI qui traîne',
      text: "Le CDI idéal met 6 à 9 mois à signer. Pendant ce temps, le pipeline ralentit et les équipes perdent des repères. Un CMO de transition comble le vide, sans compromettre le recrutement final." },
  ] : [
    { icon: CalendarClock, title: 'Maternity or long-term leave',
      text: "Your CMO is out for 4 to 9 months. Marketing cannot freeze. You need operational continuity, not an interim figuring it out." },
    { icon: UserMinus, title: 'Sudden resignation',
      text: "The CMO is gone, the team is drifting, the board has questions. Immediate need: deliver in-flight commitments and stabilize the team during the search." },
    { icon: Hourglass, title: 'Slow full-time hire',
      text: "Hiring the right full-time CMO takes 6 to 9 months. Meanwhile pipeline slows and teams lose their bearings. An interim CMO fills the gap without compromising the final hire." },
  ]

  const week1 = isFr ? [
    { icon: Users, title: 'COMEX et board', text: "Je prends votre place au COMEX dès la première semaine. Reporting CEO/board maintenu, aucun trou de gouvernance." },
    { icon: Users, title: '1:1 équipe marketing', text: "Rencontre chaque membre de l'équipe la première semaine. Je nomme leurs priorités et débloque ce qui traînait." },
    { icon: Workflow, title: 'Continuité roadmap', text: "Je reprends le plan produit/marketing existant. Pas de remise à plat. Les chantiers en cours continuent." },
    { icon: LineChart, title: 'Reporting et KPIs', text: "Les tableaux de bord hebdo sont tenus. Le board reçoit les mêmes chiffres, au même rythme." },
    { icon: Briefcase, title: 'Agences et prestataires', text: "Je reprends les relations agences, freelances et prestataires en cours. Aucun contrat ne tombe." },
    { icon: Zap, title: 'Stack 2026', text: "Product Marketing, Growth, IA. J'apporte la stack que la plupart des CMO sortants n'ont pas encore adoptée." },
  ] : [
    { icon: Users, title: 'C-suite and board', text: "I take your seat on the exec team in week one. CEO/board reporting continues, no governance gap." },
    { icon: Users, title: '1:1s with the marketing team', text: "I meet every team member in week one. I name their priorities and unblock what was stuck." },
    { icon: Workflow, title: 'Roadmap continuity', text: "I pick up the existing product/marketing plan. No reset. Work in progress keeps moving." },
    { icon: LineChart, title: 'Reporting and KPIs', text: "Weekly dashboards are maintained. The board gets the same numbers at the same cadence." },
    { icon: Briefcase, title: 'Agencies and vendors', text: "I take over live agency, freelance and vendor relationships. No contract slips." },
    { icon: Zap, title: '2026 stack', text: "Product Marketing, Growth, AI. I bring the stack most outgoing CMOs have not adopted yet." },
  ]

  type Row = { label: string; cabinet: string; generic: string; me: string }
  const rows: Row[] = isFr ? [
    { label: 'Ramp-up secteur santé', cabinet: '4-6 semaines', generic: '2-3 mois', me: 'Zéro — 12 ans dans le secteur dont 5 ans chez Doctolib' },
    { label: 'Stack marketing 2026', cabinet: 'Frameworks génériques', generic: 'Marketing traditionnel', me: 'Product Marketing, Growth, IA, automation' },
    { label: 'Disponibilité', cabinet: 'Partagée avec 3-5 clients', generic: 'Temps plein', me: 'Temps plein, démarrage rapide selon dispo' },
    { label: 'TJM indicatif', cabinet: '2 500 - 4 000 €', generic: '1 500 - 2 200 €', me: 'Sur brief (aligné marché transition CMO santé)' },
    { label: 'Durée mission', cabinet: '3-6 mois, puis rotation', generic: '3-12 mois', me: '6 à 12 mois, au-delà selon contexte' },
  ] : [
    { label: 'Healthcare ramp-up', cabinet: '4-6 weeks', generic: '2-3 months', me: 'Zero. 12 years in the sector, 5 at Doctolib' },
    { label: '2026 marketing stack', cabinet: 'Generic frameworks', generic: 'Traditional marketing', me: 'Product Marketing, Growth, AI, automation' },
    { label: 'Availability', cabinet: 'Split across 3-5 clients', generic: 'Full-time', me: 'Full-time, fast start subject to availability' },
    { label: 'Indicative rate', cabinet: '€2,500 - €4,000/day', generic: '€1,500 - €2,200/day', me: 'On brief (aligned with healthcare interim CMO market)' },
    { label: 'Engagement length', cabinet: '3-6 months, then rotate', generic: '3-12 months', me: '6 to 12 months, longer if context justifies' },
  ]

  const cases = isFr ? [
    { tag: 'ETI', title: "Éditeur de logiciel médical",
      bullets: [
        'Profil : 300 personnes, 35 M€ de CA, équipe marketing de 15 personnes',
        'Durée : 9 mois, temps plein',
      ] },
    { tag: 'Scaleup', title: 'HR Tech',
      bullets: [
        'Profil : 50 personnes, 10 M€ de CA, équipe marketing de 5 personnes',
        'Durée : 12 mois, temps plein',
      ] },
  ] : [
    { tag: 'Mid-market', title: 'Medical software vendor',
      bullets: [
        'Profile: 300 people, €35M revenue, 15-person marketing team',
        'Duration: 9 months, full-time',
      ] },
    { tag: 'Scaleup', title: 'HR Tech',
      bullets: [
        'Profile: 50 people, €10M revenue, 5-person marketing team',
        'Duration: 12 months, full-time',
      ] },
  ]

  const faq = isFr ? [
    { q: 'Quel est votre TJM ?', a: "Je m'aligne sur le marché CMO de transition santé (fourchette haute, car zéro ramp-up). Tarif précis donné après le brief de 30 minutes, en fonction du scope et de la durée." },
    { q: 'Quelle durée minimum et maximum ?', a: "Minimum 4 mois pour que l'impact soit réel. Le format naturel tourne autour de 6 à 12 mois, mais si le contexte le justifie (recrutement CDI qui s'étire, transformation en cours, projet international) on peut prolonger au-delà. On en parle au brief." },
    { q: 'Quel statut juridique ?', a: "SASU française, facturation directe. Portage salarial possible si votre grille interne l'exige. Contrat de prestation standard, NDA systématique." },
    { q: 'Travaillez-vous sous NDA ?', a: "Toujours. Les cas publiés sur cette page sont anonymisés. Les clients du passé peuvent fournir des références sur demande après signature du NDA." },
    { q: 'À quelle vitesse démarrez-vous ?', a: "Démarrage rapide selon ma disponibilité. Si je ne suis pas déjà en poste, je peux enchaîner sous quelques jours ; sinon, on cale la date de bascule au brief." },
    { q: 'Comment gérez-vous le handoff au CMO permanent ?', a: "Documentation écrite (roadmap, 1:1 team, stack outils, contrats agences, KPIs). 2 à 4 semaines de recouvrement selon la complexité. Zéro trou de mémoire organisationnelle." },
  ] : [
    { q: 'What is your day rate?', a: "Aligned with the healthcare interim CMO market (upper range, because zero ramp-up). Precise rate shared after the 30-minute brief, based on scope and duration." },
    { q: 'Minimum and maximum engagement length?', a: "Minimum 4 months for real impact. The natural window is 6 to 12 months, but if context justifies it (slow full-time hire, ongoing transformation, international project) we can extend further. We discuss it at the brief." },
    { q: 'Legal structure?', a: "French SASU, direct invoicing. Umbrella company (portage salarial) possible if your internal grid requires it. Standard services contract, NDA always." },
    { q: 'Do you work under NDA?', a: "Always. Cases on this page are anonymized. Past clients can provide references on request after NDA signature." },
    { q: 'How fast can you start?', a: "Fast start subject to availability. If I'm between engagements I can start within days; otherwise we align on a handover date at the brief." },
    { q: 'How do you handle handoff to the permanent CMO?', a: "Written documentation (roadmap, 1:1 team, tools stack, agency contracts, KPIs). 2 to 4 weeks of overlap depending on complexity. Zero institutional memory loss." },
  ]

  const ctaLabel = isFr ? 'Organiser un brief de 30 minutes' : 'Schedule a 30-minute brief'
  const stickyLabel = isFr ? 'Brief 30 min →' : 'Brief 30 min →'

  return (
    <>
      <SEO
        title={title}
        description={metaDescription}
        canonical="/transition-cmo"
        jsonLd={jsonLd}
      />

      <main style={{ paddingTop: '6rem' }}>
        {/* ── HERO ── */}
        <section style={{ padding: '4rem 4vw 6rem', maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{ fontSize: '0.68rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: ACCENT, marginBottom: '1.25rem', fontWeight: 500 }}>
            {isFr ? 'CMO de transition · Santé' : 'Interim CMO · Healthcare'}
          </p>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(2rem, 4.5vw, 3.6rem)',
            fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1,
            color: TEXT, marginBottom: '1.5rem',
          }}>
            {isFr
              ? 'CMO santé en congé ou en transition ? Je prends le relais lundi.'
              : 'Healthcare CMO on leave or in transition? I take over on Monday.'}
          </h1>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: MUTED, fontWeight: 400, maxWidth: '720px', marginBottom: '2.5rem' }}>
            {isFr
              ? "Directeur marketing freelance, ex-Doctolib. Je couvre votre COMEX, vos équipes et votre roadmap pendant 6 à 12 mois. Zéro ramp-up secteur."
              : "Freelance marketing director, ex-Doctolib. I cover your C-suite, your teams and your roadmap for 6 to 12 months. Zero industry ramp-up."}
          </p>
          <Link
            to={bookingUrl(SRC)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
              padding: '1.1rem 2.4rem', background: ACCENT, color: '#fff',
              textDecoration: 'none', borderRadius: '100px',
              fontSize: '0.95rem', fontWeight: 600, letterSpacing: '-0.01em',
              transition: 'all 0.3s', boxShadow: '0 8px 30px rgba(26,26,107,0.18)',
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#2D2D8A'; el.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = ACCENT; el.style.transform = '' }}
          >
            📅 {ctaLabel} →
          </Link>
        </section>

        {/* ── 1. DÉCLENCHEUR ── */}
        <section style={{ padding: '0 4vw 6rem', maxWidth: '1200px', margin: '0 auto' }}>
          <div ref={revealTriggers} className="reveal">
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 'clamp(1.6rem, 3vw, 2.4rem)',
              fontWeight: 700, letterSpacing: '-0.025em', color: TEXT,
              marginBottom: '3rem', textAlign: 'center',
            }}>
              {isFr ? 'Trois déclencheurs, un seul besoin' : 'Three triggers, one need'}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {triggers.map((tr, i) => {
                const Icon = tr.icon
                return (
                  <div key={i} style={{
                    background: BG_OFF, borderRadius: '24px', padding: '2.2rem',
                    border: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', gap: '1rem',
                  }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '12px',
                      background: 'rgba(26,26,107,0.08)', color: ACCENT,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={22} strokeWidth={1.8} />
                    </div>
                    <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.15rem', fontWeight: 700, color: TEXT, letterSpacing: '-0.02em' }}>
                      {tr.title}
                    </h3>
                    <p style={{ fontSize: '0.92rem', lineHeight: 1.7, color: MUTED, fontWeight: 300 }}>
                      {tr.text}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Inline CTA #1 */}
        <div style={{ textAlign: 'center', padding: '0 4vw 6rem' }}>
          <Link to={bookingUrl(SRC)} style={inlineCtaStyle}>
            {ctaLabel} →
          </Link>
        </div>

        {/* ── 2. SEMAINE 1 ── */}
        <section style={{ padding: '0 4vw 6rem', maxWidth: '1200px', margin: '0 auto' }}>
          <div ref={revealWeek1} className="reveal">
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 'clamp(1.6rem, 3vw, 2.4rem)',
              fontWeight: 700, letterSpacing: '-0.025em', color: TEXT,
              marginBottom: '1rem', textAlign: 'center',
            }}>
              {isFr ? 'Ce que je prends en charge dès la semaine 1' : 'What I own from week 1'}
            </h2>
            <p style={{ fontSize: '1rem', color: MUTED, textAlign: 'center', marginBottom: '3rem', maxWidth: '640px', margin: '0 auto 3rem' }}>
              {isFr ? "Aucun mois de ramp-up. Lundi matin, je suis opérationnel." : "No ramp-up month. Operational from Monday."}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
              {week1.map((w, i) => {
                const Icon = w.icon
                return (
                  <div key={i} style={{
                    padding: '1.75rem', border: `1px solid ${BORDER}`, borderRadius: '16px',
                    background: '#fff', display: 'flex', gap: '1rem', alignItems: 'flex-start',
                  }}>
                    <div style={{ flexShrink: 0, color: ACCENT, marginTop: '2px' }}>
                      <Icon size={20} strokeWidth={1.8} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: TEXT, marginBottom: '0.5rem' }}>{w.title}</h3>
                      <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: MUTED, fontWeight: 300 }}>{w.text}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── 3. TABLEAU COMPARATIF ── */}
        <section style={{ padding: '0 4vw 6rem', maxWidth: '1100px', margin: '0 auto' }}>
          <div ref={revealTable} className="reveal">
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 'clamp(1.6rem, 3vw, 2.4rem)',
              fontWeight: 700, letterSpacing: '-0.025em', color: TEXT,
              marginBottom: '3rem', textAlign: 'center',
            }}>
              {isFr ? 'Cabinet conseil, intérim générique, moi' : 'Consulting firm, generic interim, me'}
            </h2>
            <div style={{ overflowX: 'auto', border: `1px solid ${BORDER}`, borderRadius: '16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', minWidth: '720px' }}>
                <thead>
                  <tr style={{ background: BG_OFF }}>
                    <th style={thStyle}>{isFr ? 'Critère' : 'Criterion'}</th>
                    <th style={thStyle}>{isFr ? 'Cabinet conseil' : 'Consulting firm'}</th>
                    <th style={thStyle}>{isFr ? 'CMO intérim générique' : 'Generic interim CMO'}</th>
                    <th style={{ ...thStyle, color: ACCENT }}>{isFr ? 'Moi' : 'Me'}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} style={{ borderTop: `1px solid ${BORDER}` }}>
                      <td style={{ ...tdStyle, fontWeight: 600, color: TEXT }}>{r.label}</td>
                      <td style={tdStyle}>{r.cabinet}</td>
                      <td style={tdStyle}>{r.generic}</td>
                      <td style={{ ...tdStyle, color: TEXT, fontWeight: 500, background: 'rgba(26,26,107,0.04)' }}>{r.me}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Inline CTA #2 */}
        <div style={{ textAlign: 'center', padding: '0 4vw 6rem' }}>
          <Link to={bookingUrl(SRC)} style={inlineCtaStyle}>
            {ctaLabel} →
          </Link>
        </div>

        {/* ── 4. CAS CONCRETS ── */}
        <section style={{ padding: '0 4vw 6rem', maxWidth: '1100px', margin: '0 auto' }}>
          <div ref={revealCases} className="reveal">
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 'clamp(1.6rem, 3vw, 2.4rem)',
              fontWeight: 700, letterSpacing: '-0.025em', color: TEXT,
              marginBottom: '1rem', textAlign: 'center',
            }}>
              {isFr ? 'Deux missions récentes, anonymisées (NDA)' : 'Two recent engagements, anonymized (NDA)'}
            </h2>
            <p style={{ fontSize: '0.9rem', color: MUTED, textAlign: 'center', marginBottom: '3rem', fontStyle: 'italic' }}>
              {isFr ? 'Références nominatives fournies après signature du NDA.' : 'Named references provided after NDA signature.'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {cases.map((cs, i) => (
                <div key={i} style={{
                  background: BG_OFF, borderRadius: '24px', padding: '2.2rem',
                  border: `1px solid ${BORDER}`,
                }}>
                  <span style={{
                    display: 'inline-flex', padding: '0.35rem 0.9rem', borderRadius: '100px',
                    background: 'rgba(26,26,107,0.08)', color: ACCENT,
                    fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                    marginBottom: '1rem',
                  }}>
                    {cs.tag}
                  </span>
                  <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.2rem', fontWeight: 700, color: TEXT, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
                    {cs.title}
                  </h3>
                  <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {cs.bullets.map((b, j) => (
                      <li key={j} style={{ fontSize: '0.9rem', lineHeight: 1.65, color: MUTED, fontWeight: 300, paddingLeft: '1rem', position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 0, color: ACCENT, fontWeight: 700 }}>·</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. FAQ ── */}
        <section style={{ padding: '0 4vw 6rem', maxWidth: '900px', margin: '0 auto' }}>
          <div ref={revealFaq} className="reveal">
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 'clamp(1.6rem, 3vw, 2.4rem)',
              fontWeight: 700, letterSpacing: '-0.025em', color: TEXT,
              marginBottom: '3rem', textAlign: 'center',
            }}>
              {isFr ? 'Questions fréquentes' : 'Frequently asked'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {faq.map((item, i) => (
                <details key={i} style={{
                  border: `1px solid ${BORDER}`, borderRadius: '16px',
                  padding: '1.25rem 1.5rem', background: '#fff',
                }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 600, color: TEXT, fontSize: '0.98rem', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {item.q}
                    <span style={{ color: ACCENT, fontWeight: 400, fontSize: '1.3rem' }}>+</span>
                  </summary>
                  <p style={{ fontSize: '0.92rem', lineHeight: 1.7, color: MUTED, fontWeight: 300, marginTop: '1rem' }}>
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Inline CTA #3 (final) */}
        <section style={{ padding: '0 4vw 8rem', maxWidth: '900px', margin: '0 auto' }}>
          <div style={{
            background: ACCENT, color: '#fff', borderRadius: '24px',
            padding: 'clamp(2.5rem, 5vw, 4rem)', textAlign: 'center',
          }}>
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
              fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '1rem',
            }}>
              {isFr ? 'Un siège CMO à couvrir ?' : 'A CMO seat to cover?'}
            </h2>
            <p style={{ fontSize: '1rem', lineHeight: 1.7, opacity: 0.85, marginBottom: '2rem', maxWidth: '560px', margin: '0 auto 2rem' }}>
              {isFr
                ? "30 minutes de brief. Si c'est un fit, je vous envoie un plan sous 48h."
                : "30-minute brief. If it's a fit, I send you a plan within 48 hours."}
            </p>
            <Link
              to={bookingUrl(SRC)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                padding: '1.1rem 2.4rem', background: '#fff', color: ACCENT,
                textDecoration: 'none', borderRadius: '100px',
                fontSize: '0.95rem', fontWeight: 700, letterSpacing: '-0.01em',
                transition: 'transform 0.3s',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = '')}
            >
              📅 {ctaLabel} →
            </Link>
          </div>
        </section>

        {/* ── STICKY CTA ── */}
        <Link
          to={bookingUrl(SRC)}
          aria-label={ctaLabel}
          style={{
            position: 'fixed', right: '1.5rem', bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))',
            zIndex: 40, background: ACCENT, color: '#fff',
            padding: '0.9rem 1.5rem', borderRadius: '100px',
            textDecoration: 'none', fontWeight: 600, fontSize: '0.88rem',
            boxShadow: '0 12px 40px rgba(26,26,107,0.3)',
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = '')}
        >
          📅 {stickyLabel}
        </Link>
      </main>
    </>
  )
}

const thStyle: React.CSSProperties = {
  padding: '1rem 1.2rem', textAlign: 'left',
  fontSize: '0.75rem', fontWeight: 700, color: TEXT,
  letterSpacing: '0.06em', textTransform: 'uppercase',
}

const tdStyle: React.CSSProperties = {
  padding: '1rem 1.2rem',
  fontSize: '0.9rem', color: MUTED, lineHeight: 1.5,
  verticalAlign: 'top',
}

const inlineCtaStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
  padding: '1rem 2.2rem', background: ACCENT, color: '#fff',
  textDecoration: 'none', borderRadius: '100px',
  fontSize: '0.9rem', fontWeight: 600, letterSpacing: '-0.01em',
  boxShadow: '0 8px 30px rgba(26,26,107,0.18)',
}
