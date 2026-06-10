import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, Stethoscope, Network, Target, TrendingUp, FileText, Users, Cpu, LineChart } from 'lucide-react'
import { useLang } from '../contexts/LangContext'
import SEO from '../components/SEO'
import { bookingUrl } from '../lib/cta'

// ── Brand Book 2026 — Ink / Paper / Signal ──
const ACCENT = '#0A0A0B'              // Ink (primary)
const SIGNAL = '#00D68F'              // Signal Green
const BORDER = 'rgba(10,10,11,0.08)'
const MUTED = '#6B6F7A'               // Steel
const TEXT = '#0A0A0B'                // Ink
const BG_OFF = '#F4F4F2'              // Paper soft

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

const SRC = 'consultant-marketing-sante'

export default function ConsultantMarketingSante() {
  const { lang } = useLang()

  const revealWhy = useReveal()
  const revealOffers = useReveal()
  const revealScope = useReveal()
  const revealTable = useReveal()
  const revealFaq = useReveal()
  const revealLinks = useReveal()

  const isFr = lang === 'fr'

  const title = isFr
    ? 'Consultant Marketing Santé Freelance · Ex-Doctolib | Clempo'
    : 'Freelance Healthcare Marketing Consultant · Ex-Doctolib'
  const metaDescription = isFr
    ? "Consultant marketing santé freelance, 12 ans d'expérience dont 5 chez Doctolib. Advisory, Part-Time CMO ou transition pour HealthTech, MedTech et pharma."
    : "Freelance healthcare marketing consultant, 12 years in the sector including 5 at Doctolib. Advisory, Part-Time CMO or interim for HealthTech, MedTech and pharma."

  const why = isFr ? [
    { icon: ShieldCheck, title: 'Le réglementaire ne se devine pas',
      text: "Loi anti-cadeaux, publicité encadrée des dispositifs médicaux, hébergement HDS, RGPD santé : un marketeur généraliste découvre ces contraintes en cours de mission. Moi, je construis les funnels avec, dès le premier jour." },
    { icon: Stethoscope, title: 'Vendre aux médecins est un métier',
      text: "Les professionnels de santé n'achètent pas comme des DSI ou des DRH. Cycles longs, prescripteurs multiples, méfiance envers le discours commercial. 12 ans à leur parler, dont 5 chez Doctolib, ça ne se rattrape pas en un trimestre." },
    { icon: Network, title: 'Le réseau fait gagner des mois',
      text: "Journalistes santé, KOLs, décideurs hospitaliers, fondateurs HealthTech : je sais qui appeler pour tester un positionnement, obtenir une citation presse ou ouvrir une porte commerciale." },
  ] : [
    { icon: ShieldCheck, title: 'Healthcare regulation cannot be improvised',
      text: "Anti-gift law, regulated medical device advertising, HDS hosting, healthcare GDPR: a generalist marketer discovers these constraints mid-engagement. I build funnels with them from day one." },
    { icon: Stethoscope, title: 'Selling to physicians is a craft',
      text: "Healthcare professionals don't buy like CIOs or HR directors. Long cycles, multiple prescribers, distrust of sales talk. 12 years speaking to them, including 5 at Doctolib, cannot be caught up in a quarter." },
    { icon: Network, title: 'The network saves you months',
      text: "Healthcare journalists, KOLs, hospital decision-makers, HealthTech founders: I know who to call to test a positioning, get press coverage or open a commercial door." },
  ]

  const offers = isFr ? [
    { badge: 'Advisory', title: 'Advisory', format: '1×1h30/mois + WhatsApp', price: '900 €/mois',
      text: "Un sparring partner senior pour vos décisions marketing. Vous gardez l'exécution, je challenge la stratégie, le positionnement et les priorités chaque mois.",
      to: bookingUrl(SRC), cta: 'Démarrer un essai →', starred: false },
    { badge: 'Part-Time CMO', title: 'Part-Time CMO Santé', format: '2-3 j/semaine · 6 mois min.', price: 'TJM sur brief',
      text: "Je prends la direction marketing à temps partiel : stratégie, exécution, recrutement et management de l'équipe. Le format idéal entre 1 et 20 M€ de CA.",
      to: bookingUrl(SRC), cta: 'En parler 30 min →', starred: true },
    { badge: 'Management de Transition', title: 'Management de Transition Santé', format: 'Full-time · 6-12 mois', price: 'TJM transparent sur brief',
      text: "Votre CMO part (congé, démission, recrutement qui traîne) ? Je prends le relais à temps plein, COMEX inclus, sans ramp-up secteur.",
      to: '/transition-cmo', cta: "Voir l'offre transition →", starred: false },
  ] : [
    { badge: 'Advisory', title: 'Advisory', format: '1×1h30/month + WhatsApp', price: '€900/month',
      text: "A senior sparring partner for your marketing decisions. You keep execution, I challenge strategy, positioning and priorities every month.",
      to: bookingUrl(SRC), cta: 'Start a trial →', starred: false },
    { badge: 'Part-Time CMO', title: 'Part-Time Healthcare CMO', format: '2-3 days/week · 6 months min.', price: 'Rate on brief',
      text: "I run marketing part-time: strategy, execution, hiring and team management. The ideal format between €1M and €20M revenue.",
      to: bookingUrl(SRC), cta: 'Discuss it in 30 min →', starred: true },
    { badge: 'Interim Management', title: 'Interim Healthcare CMO', format: 'Full-time · 6-12 months', price: 'Transparent rate on brief',
      text: "Your CMO is leaving (leave, resignation, slow hire)? I take over full-time, exec committee included, with zero industry ramp-up.",
      to: '/transition-cmo', cta: 'See the interim offer →', starred: false },
  ]

  const scope = isFr ? [
    { icon: Target, title: 'Positionnement et messaging', text: "Trouver l'angle qui différencie votre produit santé sur un marché saturé, et le décliner pour chaque audience : médecins, établissements, payeurs." },
    { icon: TrendingUp, title: "Acquisition et funnels B2B santé", text: "Construire un pipeline qui parle aux professionnels de santé et passe les filtres réglementaires. SEO, outbound, événements, partenariats." },
    { icon: FileText, title: 'Contenu et autorité', text: "Études, baromètres, presse spécialisée : installer votre marque comme référence auprès des HCPs et des décideurs hospitaliers." },
    { icon: Users, title: "Recrutement et structuration d'équipe", text: "Définir les rôles, recruter les bons profils marketing santé, mettre en place les rituels et les KPIs. Je l'ai fait chez Doctolib en hypercroissance." },
    { icon: Cpu, title: 'Stack IA et automation', text: "Scoring de prospects, enrichissement, workflows d'outreach, contenu assisté : la stack 2026 que la plupart des équipes santé n'ont pas encore adoptée." },
    { icon: LineChart, title: 'Audit et reporting', text: "Auditer l'existant, fixer les bons KPIs, tenir un reporting que le board comprend. Pas de vanity metrics." },
  ] : [
    { icon: Target, title: 'Positioning and messaging', text: "Find the angle that differentiates your healthcare product in a saturated market, declined for each audience: physicians, facilities, payers." },
    { icon: TrendingUp, title: 'B2B healthcare acquisition and funnels', text: "Build a pipeline that speaks to healthcare professionals and passes regulatory filters. SEO, outbound, events, partnerships." },
    { icon: FileText, title: 'Content and authority', text: "Studies, barometers, trade press: establish your brand as a reference with HCPs and hospital decision-makers." },
    { icon: Users, title: 'Hiring and team structure', text: "Define roles, hire the right healthcare marketing profiles, set up rituals and KPIs. I did it at Doctolib during hypergrowth." },
    { icon: Cpu, title: 'AI stack and automation', text: "Prospect scoring, enrichment, outreach workflows, assisted content: the 2026 stack most healthcare teams haven't adopted yet." },
    { icon: LineChart, title: 'Audit and reporting', text: "Audit what exists, set the right KPIs, run reporting the board understands. No vanity metrics." },
  ]

  type Row = { label: string; agency: string; hire: string; me: string }
  const rows: Row[] = isFr ? [
    { label: 'Connaissance du secteur santé', agency: 'Variable selon le chef de projet', hire: 'Selon le profil recruté', me: '12 ans dans le secteur, dont 5 chez Doctolib' },
    { label: 'Délai de démarrage', agency: '3-6 semaines de cadrage', hire: '6-9 mois de recrutement', me: 'Brief de 30 min, démarrage selon dispo' },
    { label: 'Coût annuel indicatif', agency: '60-150 k€ de fees', hire: '120-180 k€ chargés + equity', me: "De 10,8 k€/an (Advisory) au TJM sur brief" },
    { label: 'Niveau de séniorité réel', agency: 'Senior au pitch, junior en exécution', hire: 'Celui que vous recrutez', me: 'Le même du premier au dernier jour' },
    { label: 'Engagement', agency: 'Contrat 6-12 mois', hire: 'CDI', me: 'Mensuel (Advisory) ou mission 6-12 mois' },
  ] : [
    { label: 'Healthcare sector knowledge', agency: 'Depends on the project lead', hire: 'Depends on the hire', me: '12 years in the sector, 5 at Doctolib' },
    { label: 'Time to start', agency: '3-6 weeks of scoping', hire: '6-9 months of hiring', me: '30-min brief, start subject to availability' },
    { label: 'Indicative annual cost', agency: '€60-150k in fees', hire: '€120-180k loaded + equity', me: 'From €10.8k/year (Advisory) to rate on brief' },
    { label: 'Actual seniority level', agency: 'Senior at the pitch, junior in execution', hire: 'Whoever you hire', me: 'The same from day one to the last day' },
    { label: 'Commitment', agency: '6-12 month contract', hire: 'Permanent contract', me: 'Monthly (Advisory) or 6-12 month engagement' },
  ]

  const faq = isFr ? [
    { q: "Qu'est-ce qu'un consultant marketing santé ?", a: "C'est un spécialiste qui conçoit et exécute la stratégie marketing d'entreprises du secteur de la santé : HealthTech, MedTech, pharma, éditeurs de logiciels médicaux. À la différence d'un marketeur généraliste, il maîtrise les contraintes propres au secteur — réglementation de la communication, cycles de vente auprès des médecins et des hôpitaux, environnement remboursement — et les intègre dès la conception des campagnes." },
    { q: 'Combien coûte un consultant marketing santé freelance ?', a: "Tout dépend du format. Mon offre Advisory démarre à 900 €/mois (une session stratégique mensuelle + accès WhatsApp). Pour un Part-Time CMO (2-3 jours par semaine) ou un management de transition à temps plein, le TJM est donné après un brief de 30 minutes, aligné sur le marché des directeurs marketing santé expérimentés. Dans tous les cas, c'est 2 à 4 fois moins engageant qu'un recrutement CDI chargé." },
    { q: 'Consultant freelance ou agence marketing santé ?', a: "Une agence vend de l'exécution multi-comptes : vous avez un senior au pitch et des juniors au quotidien. Un consultant freelance senior vous donne le niveau d'un CMO expérimenté, en direct, sans couche d'account management. Le bon choix dépend du besoin : production de volume → agence ; stratégie, structuration et résultats business → consultant. Les deux se combinent d'ailleurs très bien." },
    { q: "Pour quels types d'entreprises travaillez-vous ?", a: "Startups HealthTech early stage, scaleups santé en hypercroissance, éditeurs de logiciels médicaux, MedTech et laboratoires. Le format s'adapte au stade : Advisory pour les fondateurs qui gardent l'exécution, Part-Time CMO entre 1 et 20 M€ de CA, management de transition pour les organisations qui perdent temporairement leur CMO." },
    { q: 'Comment démarre une mission ?', a: "Par un brief de 30 minutes, gratuit. Vous exposez le contexte, je vous dis honnêtement si je peux aider — et si ce n'est pas le cas, je vous oriente vers quelqu'un de mon réseau. Si c'est un fit, vous recevez une proposition écrite sous 48h avec scope, format et tarif." },
    { q: 'Travaillez-vous à distance ou sur site ?', a: "Les deux. Je suis basé en région parisienne : les missions Part-Time CMO et transition incluent généralement de la présence sur site (COMEX, rituels d'équipe), l'Advisory se fait en visio. Le rythme exact se cale au brief." },
  ] : [
    { q: 'What does a healthcare marketing consultant do?', a: "A specialist who designs and executes marketing strategy for healthcare companies: HealthTech, MedTech, pharma, medical software vendors. Unlike a generalist marketer, they master the sector's specific constraints — regulated communication, sales cycles with physicians and hospitals, reimbursement environment — and build campaigns with them from the start." },
    { q: 'How much does a freelance healthcare marketing consultant cost?', a: "It depends on the format. My Advisory offer starts at €900/month (one monthly strategy session + WhatsApp access). For a Part-Time CMO (2-3 days a week) or full-time interim management, the day rate is shared after a 30-minute brief, aligned with the market for experienced healthcare marketing directors. In every case, it's 2 to 4 times less committing than a loaded full-time hire." },
    { q: 'Freelance consultant or healthcare marketing agency?', a: "An agency sells multi-account execution: a senior at the pitch, juniors in the day-to-day. A senior freelance consultant gives you experienced-CMO level, directly, with no account management layer. The right choice depends on the need: volume production → agency; strategy, structure and business results → consultant. The two actually combine very well." },
    { q: 'What types of companies do you work with?', a: "Early-stage HealthTech startups, hypergrowth healthcare scaleups, medical software vendors, MedTech and labs. The format adapts to the stage: Advisory for founders who keep execution, Part-Time CMO between €1M and €20M revenue, interim management for organizations temporarily losing their CMO." },
    { q: 'How does an engagement start?', a: "With a free 30-minute brief. You lay out the context, I tell you honestly whether I can help — and if not, I point you to someone in my network. If it's a fit, you get a written proposal within 48 hours with scope, format and rate." },
    { q: 'Do you work remotely or on site?', a: "Both. I'm based in the Paris area: Part-Time CMO and interim engagements usually include on-site presence (exec committee, team rituals), Advisory runs over video. The exact cadence is set at the brief." },
  ]

  const moreLinks = isFr ? [
    { to: '/transition-cmo', label: 'CMO de transition santé : je prends le relais' },
    { to: '/articles/generer-leads-ia-healthtech-2025', label: "Générer des leads avec l'IA en HealthTech" },
    { to: '/articles/17-outils-generer-leads-startup-sante', label: '17 outils pour générer des leads en startup santé' },
    { to: '/articles/capter-attention-scientifiques-hcps-linkedin', label: "Capter l'attention des HCPs sur LinkedIn" },
    { to: '/parts-de-marche-logiciels-medicaux', label: 'Parts de marché des logiciels médicaux' },
  ] : [
    { to: '/transition-cmo', label: 'Interim healthcare CMO: I take over' },
    { to: '/articles/generer-leads-ia-healthtech-2025', label: 'Generating leads with AI in HealthTech' },
    { to: '/articles/17-outils-generer-leads-startup-sante', label: '17 tools to generate leads as a healthcare startup' },
    { to: '/articles/capter-attention-scientifiques-hcps-linkedin', label: "Capturing HCPs' attention on LinkedIn" },
    { to: '/parts-de-marche-logiciels-medicaux', label: 'Medical software market shares' },
  ]

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'ProfessionalService',
      'name': 'Clempo — Consultant Marketing Santé',
      'description': metaDescription,
      'url': 'https://www.clempo.fr/consultant-marketing-sante',
      'founder': {
        '@type': 'Person',
        'name': 'Clément Pouget-Osmont',
        'jobTitle': 'Healthcare Marketing Director',
        'url': 'https://www.linkedin.com/in/clementpougetosmont/',
      },
      'areaServed': { '@type': 'Country', 'name': 'France' },
      'address': { '@type': 'PostalAddress', 'addressLocality': 'Saint-Ouen-sur-Seine', 'addressCountry': 'FR' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': faq.map(item => ({
        '@type': 'Question',
        'name': item.q,
        'acceptedAnswer': { '@type': 'Answer', 'text': item.a },
      })),
    },
  ]

  const ctaLabel = isFr ? 'Réserver un brief de 30 minutes' : 'Book a 30-minute brief'
  const stickyLabel = 'Brief 30 min →'

  return (
    <>
      <SEO
        title={title}
        description={metaDescription}
        canonical="/consultant-marketing-sante"
        jsonLd={jsonLd}
      />

      <main style={{ paddingTop: '6rem' }}>
        {/* ── HERO ── */}
        <section style={{ padding: '4rem 4vw 6rem', maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: SIGNAL, marginBottom: '1.25rem', fontWeight: 500 }}>
            // {isFr ? 'Consultant · Marketing Santé' : 'Consultant · Healthcare Marketing'}
          </p>
          <h1 style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(2rem, 4.5vw, 3.6rem)',
            fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1,
            color: TEXT, marginBottom: '1.5rem',
          }}>
            {isFr
              ? 'Consultant marketing santé freelance'
              : 'Freelance healthcare marketing consultant'}
          </h1>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: MUTED, fontWeight: 400, maxWidth: '720px', marginBottom: '2.5rem' }}>
            {isFr
              ? "12 ans de marketing dans la santé, dont 5 chez Doctolib. J'aide les HealthTech, MedTech et éditeurs de logiciels médicaux à positionner leur produit, construire leur acquisition et structurer leur équipe — en Advisory, Part-Time CMO ou management de transition."
              : "12 years of healthcare marketing, including 5 at Doctolib. I help HealthTech, MedTech and medical software companies position their product, build acquisition and structure their team — as Advisory, Part-Time CMO or interim management."}
          </p>
          <Link
            to={bookingUrl(SRC)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
              padding: '1.1rem 2.4rem', background: ACCENT, color: '#fff',
              textDecoration: 'none', borderRadius: '4px',
              fontSize: '0.95rem', fontWeight: 600, letterSpacing: '-0.01em',
              transition: 'all 0.3s', boxShadow: '0 8px 30px rgba(10,10,11,0.18)',
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#16181D'; el.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = ACCENT; el.style.transform = '' }}
          >
            📅 {ctaLabel} →
          </Link>
        </section>

        {/* ── 1. POURQUOI UN SPÉCIALISTE ── */}
        <section style={{ padding: '0 4vw 6rem', maxWidth: '1200px', margin: '0 auto' }}>
          <div ref={revealWhy} className="reveal">
            <h2 style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(1.6rem, 3vw, 2.4rem)',
              fontWeight: 700, letterSpacing: '-0.025em', color: TEXT,
              marginBottom: '3rem', textAlign: 'center',
            }}>
              {isFr ? 'Pourquoi un consultant spécialisé santé' : 'Why a healthcare-specialized consultant'}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {why.map((w, i) => {
                const Icon = w.icon
                return (
                  <div key={i} style={{
                    background: BG_OFF, borderRadius: '6px', padding: '2.2rem',
                    border: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', gap: '1rem',
                  }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '4px',
                      background: 'rgba(0,214,143,0.12)', color: ACCENT,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={22} strokeWidth={1.8} />
                    </div>
                    <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '1.15rem', fontWeight: 700, color: TEXT, letterSpacing: '-0.02em' }}>
                      {w.title}
                    </h3>
                    <p style={{ fontSize: '0.92rem', lineHeight: 1.7, color: MUTED, fontWeight: 300 }}>
                      {w.text}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── 2. LES 3 FORMATS ── */}
        <section style={{ padding: '0 4vw 6rem', maxWidth: '1200px', margin: '0 auto' }}>
          <div ref={revealOffers} className="reveal">
            <h2 style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(1.6rem, 3vw, 2.4rem)',
              fontWeight: 700, letterSpacing: '-0.025em', color: TEXT,
              marginBottom: '1rem', textAlign: 'center',
            }}>
              {isFr ? 'Trois formats, un même niveau d\'exigence' : 'Three formats, one level of rigor'}
            </h2>
            <p style={{ fontSize: '1rem', color: MUTED, textAlign: 'center', maxWidth: '640px', margin: '0 auto 3rem' }}>
              {isFr ? "Du sparring mensuel au temps plein, selon votre stade et votre urgence." : "From monthly sparring to full-time, depending on your stage and urgency."}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {offers.map((o, i) => (
                <div key={i} style={{
                  background: o.starred ? ACCENT : BG_OFF,
                  color: o.starred ? '#fff' : TEXT,
                  borderRadius: '6px', padding: '2.2rem',
                  border: `1px solid ${o.starred ? ACCENT : BORDER}`,
                  display: 'flex', flexDirection: 'column', gap: '1rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem',
                      letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600,
                      color: o.starred ? SIGNAL : MUTED,
                    }}>
                      — {o.badge}
                    </span>
                    {o.starred && (
                      <span style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, color: SIGNAL }}>
                        ⭐ {isFr ? 'Mission préférée' : 'Preferred engagement'}
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
                    {o.title}
                  </h3>
                  <p style={{ fontSize: '0.92rem', lineHeight: 1.7, fontWeight: 300, color: o.starred ? 'rgba(255,255,255,0.8)' : MUTED, flexGrow: 1 }}>
                    {o.text}
                  </p>
                  <div style={{ borderTop: `1px solid ${o.starred ? 'rgba(255,255,255,0.15)' : BORDER}`, paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.82rem', color: o.starred ? 'rgba(255,255,255,0.7)' : MUTED }}>{o.format}</span>
                    <span style={{ fontSize: '1rem', fontWeight: 700 }}>{o.price}</span>
                  </div>
                  <Link
                    to={o.to}
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0.85rem 1.5rem',
                      background: o.starred ? '#fff' : ACCENT,
                      color: o.starred ? ACCENT : '#fff',
                      textDecoration: 'none', borderRadius: '4px',
                      fontSize: '0.88rem', fontWeight: 600,
                      transition: 'transform 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = '')}
                  >
                    {o.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3. CE QUE JE PRENDS EN CHARGE ── */}
        <section style={{ padding: '0 4vw 6rem', maxWidth: '1200px', margin: '0 auto' }}>
          <div ref={revealScope} className="reveal">
            <h2 style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(1.6rem, 3vw, 2.4rem)',
              fontWeight: 700, letterSpacing: '-0.025em', color: TEXT,
              marginBottom: '3rem', textAlign: 'center',
            }}>
              {isFr ? 'Ce que je prends en charge' : 'What I take on'}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
              {scope.map((s, i) => {
                const Icon = s.icon
                return (
                  <div key={i} style={{
                    padding: '1.75rem', border: `1px solid ${BORDER}`, borderRadius: '4px',
                    background: '#fff', display: 'flex', gap: '1rem', alignItems: 'flex-start',
                  }}>
                    <div style={{ flexShrink: 0, color: ACCENT, marginTop: '2px' }}>
                      <Icon size={20} strokeWidth={1.8} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: TEXT, marginBottom: '0.5rem' }}>{s.title}</h3>
                      <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: MUTED, fontWeight: 300 }}>{s.text}</p>
                    </div>
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

        {/* ── 4. TABLEAU COMPARATIF ── */}
        <section style={{ padding: '0 4vw 6rem', maxWidth: '1100px', margin: '0 auto' }}>
          <div ref={revealTable} className="reveal">
            <h2 style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(1.6rem, 3vw, 2.4rem)',
              fontWeight: 700, letterSpacing: '-0.025em', color: TEXT,
              marginBottom: '3rem', textAlign: 'center',
            }}>
              {isFr ? 'Agence, recrutement CDI, consultant freelance' : 'Agency, full-time hire, freelance consultant'}
            </h2>
            <div style={{ overflowX: 'auto', border: `1px solid ${BORDER}`, borderRadius: '4px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', minWidth: '720px' }}>
                <thead>
                  <tr style={{ background: BG_OFF }}>
                    <th style={thStyle}>{isFr ? 'Critère' : 'Criterion'}</th>
                    <th style={thStyle}>{isFr ? 'Agence marketing santé' : 'Healthcare marketing agency'}</th>
                    <th style={thStyle}>{isFr ? 'Recrutement CDI' : 'Full-time hire'}</th>
                    <th style={{ ...thStyle, color: ACCENT }}>{isFr ? 'Moi' : 'Me'}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} style={{ borderTop: `1px solid ${BORDER}` }}>
                      <td style={{ ...tdStyle, fontWeight: 600, color: TEXT }}>{r.label}</td>
                      <td style={tdStyle}>{r.agency}</td>
                      <td style={tdStyle}>{r.hire}</td>
                      <td style={{ ...tdStyle, color: TEXT, fontWeight: 500, background: 'rgba(0,214,143,0.08)' }}>{r.me}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── 5. FAQ ── */}
        <section style={{ padding: '0 4vw 6rem', maxWidth: '900px', margin: '0 auto' }}>
          <div ref={revealFaq} className="reveal">
            <h2 style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(1.6rem, 3vw, 2.4rem)',
              fontWeight: 700, letterSpacing: '-0.025em', color: TEXT,
              marginBottom: '3rem', textAlign: 'center',
            }}>
              {isFr ? 'Questions fréquentes' : 'Frequently asked'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {faq.map((item, i) => (
                <details key={i} style={{
                  border: `1px solid ${BORDER}`, borderRadius: '4px',
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

        {/* ── 6. POUR ALLER PLUS LOIN (maillage interne) ── */}
        <section style={{ padding: '0 4vw 6rem', maxWidth: '900px', margin: '0 auto' }}>
          <div ref={revealLinks} className="reveal">
            <h2 style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(1.3rem, 2.4vw, 1.8rem)',
              fontWeight: 700, letterSpacing: '-0.025em', color: TEXT,
              marginBottom: '1.75rem',
            }}>
              {isFr ? 'Pour aller plus loin' : 'Going further'}
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {moreLinks.map((l, i) => (
                <li key={i}>
                  <Link to={l.to} style={{ color: TEXT, fontSize: '0.95rem', fontWeight: 500, textDecoration: 'none', borderBottom: `1px solid ${SIGNAL}` }}>
                    {l.label} →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section style={{ padding: '0 4vw 8rem', maxWidth: '900px', margin: '0 auto' }}>
          <div style={{
            background: ACCENT, color: '#fff', borderRadius: '6px',
            padding: 'clamp(2.5rem, 5vw, 4rem)', textAlign: 'center',
          }}>
            <h2 style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
              fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '1rem',
            }}>
              {isFr ? 'Un sujet marketing santé à débloquer ?' : 'A healthcare marketing problem to unblock?'}
            </h2>
            <p style={{ fontSize: '1rem', lineHeight: 1.7, opacity: 0.85, marginBottom: '2rem', maxWidth: '560px', margin: '0 auto 2rem' }}>
              {isFr
                ? "30 minutes de brief, gratuites. Si c'est un fit, vous recevez une proposition écrite sous 48h."
                : "A free 30-minute brief. If it's a fit, you get a written proposal within 48 hours."}
            </p>
            <Link
              to={bookingUrl(SRC)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                padding: '1.1rem 2.4rem', background: '#fff', color: ACCENT,
                textDecoration: 'none', borderRadius: '4px',
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
            padding: '0.9rem 1.5rem', borderRadius: '4px',
            textDecoration: 'none', fontWeight: 600, fontSize: '0.88rem',
            boxShadow: '0 12px 40px rgba(10,10,11,0.25)',
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
  textDecoration: 'none', borderRadius: '4px',
  fontSize: '0.9rem', fontWeight: 600, letterSpacing: '-0.01em',
  boxShadow: '0 8px 30px rgba(10,10,11,0.18)',
}
