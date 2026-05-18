import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import Eyebrow from '../components/Eyebrow'
import { specialites } from '../data/specialites'

const PAGE_PATH = '/parts-de-marche-logiciels-medicaux'
const PAGE_URL = `https://www.clempo.fr${PAGE_PATH}`

// FAQ ciblée sur les requêtes "Quels sont les logiciels médicaux les plus utilisés"
// + "Parts de marché des éditeurs de logiciels médicaux".
const FAQ: { q: string; a: string }[] = [
  {
    q: 'Quels sont les logiciels médicaux les plus utilisés en France ?',
    a: "En 2026, les logiciels médicaux les plus utilisés en France varient selon la spécialité : Doctolib (23 % des médecins généralistes), Logos_w (45 % des dentistes), Agathe YOU (33 % des infirmiers libéraux), Vega (42 % des kinés), LGPI / ID. (40 % des pharmacies), Cosium Center (30 % des opticiens), Soins 2000 (32 % des orthophonistes) et Hexalis (32 % des laboratoires d'analyses). Source : GIE SESAM-Vitale, mars 2026.",
  },
  {
    q: 'Quelles sont les parts de marché des éditeurs de logiciels médicaux en France ?',
    a: "Les parts de marché des éditeurs sont mesurées par le pourcentage de feuilles de soins électroniques (FSE) télétransmises via leur progiciel. En 2026, Cegedim Santé est l'éditeur le plus diversifié (Crossway, Medi+4000, Maiia, Simply-Vitale, MonLogicielMedical) ; Doctolib domine sur les médecins ; Vidal France (Weda) couvre généralistes et sages-femmes ; Equasens (LGPI) règne sur les pharmacies ; Imagex (Logos_w) sur les dentistes ; CBA (Agathe YOU) sur les infirmiers ; Epsilog (Vega) sur les kinésithérapeutes ; Cosium sur l'optique et l'audioprothèse.",
  },
  {
    q: 'Comment sont calculées les parts de marché des logiciels santé ?',
    a: "Les parts de marché sont calculées à partir des feuilles de soins électroniques (FSE SESAM-Vitale) télétransmises chaque mois. C'est l'indicateur le plus fiable car il reflète l'usage réel — pas les ventes ni les déclarations d'éditeurs. Les données sont publiées mensuellement par le GIE SESAM-Vitale et agrégées ici par spécialité.",
  },
  {
    q: 'À quelle fréquence ces données sont-elles mises à jour ?',
    a: "Les données sont mises à jour mensuellement, dès publication des statistiques de télétransmission par le GIE SESAM-Vitale. Chaque page spécialité affiche le mois de référence dans son titre et permet de visualiser l'évolution mois par mois sur 7 ans (2019 → 2026).",
  },
  {
    q: 'Puis-je télécharger la donnée brute des parts de marché ?',
    a: "Oui. Chaque page spécialité propose le téléchargement gratuit de la donnée brute en format CSV et XLSX (mensuel, par éditeur, par progiciel). Le téléchargement nécessite une simple inscription (e-mail) pour permettre le suivi des cas d'usage. La source d'origine reste publique : gie-sesam-vitale.fr.",
  },
  {
    q: 'Quel est le logiciel médecin généraliste n°1 en France ?',
    a: "Doctolib est le logiciel le plus utilisé par les médecins généralistes français en 2026, avec 23,2 % des FSE télétransmises. Il est suivi par Weda (14,0 %, Vidal France), Medistory (10,1 %), HelloDoc (8,1 %) et Stellair Integral (7,3 %).",
  },
  {
    q: 'Quel est le logiciel pharmacie n°1 en France ?',
    a: "ID. (LGPI), édité par Equasens (anciennement Pharmagest), est le logiciel pharmacie le plus utilisé en France en 2026, avec 40 % de parts de marché. Il est suivi de très près par Winpharma (Everys, 36 %), qui a gagné 15 points en 7 ans.",
  },
  {
    q: 'Quel est le logiciel dentaire n°1 en France ?',
    a: "Logos_w (Imagex) est le logiciel dentaire le plus utilisé en France en 2026, avec 45,3 % de parts de marché — il a doublé Julie (Henry Schein One, 20,2 %) en 2023.",
  },
  {
    q: 'Quel est le logiciel infirmier libéral le plus utilisé ?',
    a: "Agathe YOU (gamme E.Motion) édité par CBA Informatique Libérale équipe 33,2 % des infirmiers libéraux français en 2026, devant Albus AIR (Sofia, 17,1 %) et Simply-Vitale (Cegedim, 12,3 %).",
  },
  {
    q: 'Comment ces données sont-elles utiles pour un éditeur ou un investisseur ?',
    a: "Pour un éditeur de logiciel santé, ces données permettent de benchmarker sa position concurrentielle, d'identifier les spécialités où conquérir des parts, et de mesurer l'effet de ses campagnes go-to-market. Pour un investisseur ou un acquéreur, elles donnent une vision objective de la trajectoire d'un éditeur et de sa résilience face à la concurrence (cloud, IA, plateformisation).",
  },
]

// Top éditeurs avec leur footprint cumulé sur les principales spécialités.
// Ordonnés par poids stratégique global. Les % sont les leaders par spécialité.
const TOP_EDITORS: { name: string; footprint: string; products: string }[] = [
  {
    name: 'Cegedim Santé',
    footprint: "Présent sur 8 spécialités sur 14 — l'éditeur le plus diversifié du marché français.",
    products: 'Crossway, MonLogicielMedical.com, Medi+4000, Simply-Vitale, Maiia Gestion, MEDICLICK',
  },
  {
    name: 'Doctolib',
    footprint: "Leader des médecins généralistes (23 %) et spécialistes (15 %), 3ᵉ chez les kinés (15 %). Croissance la plus rapide du marché.",
    products: 'Doctolib Logiciel (gestion de cabinet intégrée à la prise de RDV)',
  },
  {
    name: 'Sofia Développement',
    footprint: "Force majeure chez les infirmiers, kinés, orthophonistes, orthoptistes, pédicures-podologues. ~22 % cumulés en IDEL.",
    products: 'Albus AIR, Topaze AIR, Orthomax, Televitale, Infimax',
  },
  {
    name: 'Equasens (ex-Pharmagest)',
    footprint: "Leader stable du marché pharmacie depuis plus de 20 ans, intégré à un écosystème (groupements Pharmavie, Optipharm…).",
    products: 'ID. (LGPI)',
  },
  {
    name: 'Imagex',
    footprint: "Leader incontesté du marché dentaire avec Logos_w (45 %) — a doublé Julie en 2023.",
    products: 'Logos_w',
  },
  {
    name: 'CBA Informatique Libérale',
    footprint: "Numéro 1 absolu du marché infirmier libéral (33 %) — éditeur historique 100 % spécialisé sur l'IDEL.",
    products: 'Agathe YOU (E.Motion), Agathe (legacy)',
  },
  {
    name: 'Epsilog',
    footprint: "Leader des kinés (42 %), 2ᵉ des orthophonistes (21 %), 2ᵉ des orthoptistes (15 %). Position dominante sur la rééducation.",
    products: 'Vega',
  },
  {
    name: 'Cosium',
    footprint: "Double leader sur l'optique (30 %) et l'audioprothèse (45 %) — éditeur spécialisé sur le commerce de détail santé.",
    products: 'Cosium Center',
  },
  {
    name: "Logisur'M",
    footprint: "Premier des orthophonistes (32 %) — a multiplié sa part par 6 en 7 ans grâce à une bascule cloud précoce.",
    products: 'Soins 2000',
  },
  {
    name: 'Visiodent',
    footprint: "Présent en dentaire (Veasy 4 %) et leader de la nouvelle gamme cloud chez les centres de santé (17 %).",
    products: 'Veasy, Visiodent Ligne 100/500',
  },
  {
    name: 'Henry Schein One',
    footprint: "Numéro 2 du marché dentaire avec Julie (20 %) — éditeur global du groupe Henry Schein.",
    products: 'Julie',
  },
  {
    name: 'Dedalus Healthcare',
    footprint: "Leader du marché logiciel laboratoire d'analyses médicales (Hexalis 32 %).",
    products: 'Hexalis',
  },
  {
    name: 'Orisha Healthcare France',
    footprint: "Présent sur 4 spécialités (médecins spé, pédicures, centres de santé, audio). Numéro 1 des centres de santé (24 %).",
    products: 'Intellio, Intellio Editeurs',
  },
  {
    name: 'Olaqin',
    footprint: "Acteur transverse chez les médecins (généralistes 7 %, spécialistes 5 %) — a su capter une partie des bascules dans le segment médecins.",
    products: 'Stellair Integral',
  },
]

export default function Specialites() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const title = 'Parts de marché des logiciels médicaux en France (2026) | Clempo'
  const description = "Quels sont les logiciels médicaux les plus utilisés en France ? Parts de marché des éditeurs de logiciels santé par spécialité (médecins, pharmacies, dentistes, IDEL, kinés, opticiens…). Données GIE SESAM-Vitale 2019-2026, téléchargement CSV/XLSX gratuit."

  // JSON-LD : CollectionPage + Datasets + FAQPage (3 entités riches pour le SERP)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${PAGE_URL}#page`,
        name: 'Parts de marché des logiciels médicaux en France',
        description,
        url: PAGE_URL,
        inLanguage: 'fr-FR',
        author: { '@type': 'Person', name: 'Clément Pouget-Osmont', url: 'https://www.clempo.fr' },
        publisher: { '@type': 'Person', name: 'Clément Pouget-Osmont', url: 'https://www.clempo.fr' },
        about: [
          { '@type': 'Thing', name: 'Logiciel médical' },
          { '@type': 'Thing', name: 'Édition logiciel santé' },
          { '@type': 'Thing', name: 'Système de santé français' },
        ],
        hasPart: specialites.map(s => ({
          '@type': 'Dataset',
          name: `Parts de marché logiciels — ${s.name}`,
          description: s.metaDescription,
          url: `https://www.clempo.fr/specialites/${s.slug}`,
          creator: { '@type': 'Organization', name: 'GIE SESAM-Vitale' },
          temporalCoverage: '2019/2026',
          spatialCoverage: { '@type': 'Place', name: 'France' },
        })),
      },
      {
        '@type': 'FAQPage',
        '@id': `${PAGE_URL}#faq`,
        mainEntity: FAQ.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://www.clempo.fr/' },
          { '@type': 'ListItem', position: 2, name: 'Parts de marché des logiciels médicaux', item: PAGE_URL },
        ],
      },
    ],
  }

  return (
    <>
      <SEO title={title} description={description} canonical={PAGE_PATH} jsonLd={jsonLd} />

      <div style={{
        background: 'var(--paper)',
        color: 'var(--ink)',
        fontFamily: 'var(--font-sans)',
        minHeight: '100vh',
        paddingTop: '5rem',
      }}>
        {/* HEADER */}
        <header style={{
          padding: '5rem 6vw 3rem',
          maxWidth: '1320px',
          margin: '0 auto',
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <Eyebrow>// data — parts de marché logiciels santé</Eyebrow>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
            fontWeight: 700,
            letterSpacing: '-0.035em',
            lineHeight: 1.05,
            color: 'var(--ink)',
            marginBottom: '1.5rem',
            maxWidth: '24ch',
          }}>
            Parts de marché des logiciels médicaux en France
          </h1>
          <p style={{
            color: 'var(--graphite)',
            fontSize: '1.05rem',
            lineHeight: 1.6,
            fontWeight: 400,
            maxWidth: '68ch',
            marginBottom: '1.25rem',
          }}>
            Quels sont les logiciels médicaux les plus utilisés en France et qui sont les éditeurs leaders du marché santé&nbsp;? Cette base de données couvre <strong>14 spécialités</strong> (médecins généralistes et spécialistes, dentistes, pharmacies, infirmiers libéraux, kinésithérapeutes, opticiens, audioprothésistes, orthophonistes, orthoptistes, sages-femmes, pédicures-podologues, centres de santé, laboratoires d'analyses) et <strong>plus de 100 progiciels santé</strong> mesurés mensuellement sur <strong>7 ans (2019-2026)</strong>.
          </p>
          <p style={{
            color: 'var(--graphite)',
            fontSize: '1.05rem',
            lineHeight: 1.6,
            fontWeight: 400,
            maxWidth: '68ch',
            marginBottom: '1.25rem',
          }}>
            Les parts de marché sont calculées à partir des <strong>feuilles de soins électroniques télétransmises au GIE SESAM-Vitale</strong> — la mesure la plus objective de l'usage réel d'un logiciel santé sur le terrain (à l'inverse des chiffres de vente ou des déclarations d'éditeurs). Chaque visualisation est interactive, animée et accompagnée d'un téléchargement gratuit de la donnée brute (CSV / XLSX) pour vos analyses internes, pitchs investisseurs, due-diligence ou veille concurrentielle.
          </p>
          <p style={{
            color: 'var(--graphite)',
            fontSize: '1.05rem',
            lineHeight: 1.6,
            fontWeight: 400,
            maxWidth: '68ch',
          }}>
            Cette page est maintenue par <a href="https://www.linkedin.com/in/clementpougetosmont/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ink)', textDecoration: 'underline' }}>Clément Pouget-Osmont</a>, consultant marketing spécialisé HealthTech (12 ans d'expérience, dont 5 chez Doctolib). Pour échanger sur la stratégie go-to-market d'un éditeur santé ou un projet d'acquisition, <Link to="/booking" style={{ color: 'var(--ink)', textDecoration: 'underline' }}>réservez un créneau</Link>.
          </p>

          {/* PILLS */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginTop: '2rem',
          }}>
            {[
              'Source : GIE SESAM-Vitale',
              '14 spécialités',
              '100+ progiciels',
              '7 ans de données mensuelles',
              'CSV / XLSX gratuit',
            ].map(label => (
              <span key={label} style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--ink)',
                padding: '0.4rem 0.8rem',
                border: '1px solid rgba(10,10,11,0.12)',
                borderRadius: '999px',
                background: 'var(--paper-soft)',
              }}>{label}</span>
            ))}
          </div>
        </header>

        <div style={{
          height: '1px',
          background: 'rgba(10,10,11,0.08)',
          maxWidth: '1320px',
          marginLeft: '6vw',
          marginRight: '6vw',
          marginTop: 0,
          marginBottom: '4rem',
        }} />

        {/* SECTION 1 — TOP 1 PAR SPÉCIALITÉ */}
        <section style={{
          maxWidth: '1320px',
          margin: '0 auto 5rem',
          padding: '0 6vw',
        }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <Eyebrow>// classement — mars 2026</Eyebrow>
          </div>
          <h2 style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(1.8rem, 3.6vw, 2.6rem)',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            lineHeight: 1.15,
            marginBottom: '1.25rem',
            maxWidth: '22ch',
          }}>
            Quels sont les logiciels médicaux les plus utilisés en France&nbsp;?
          </h2>
          <p style={{
            color: 'var(--graphite)',
            fontSize: '1rem',
            lineHeight: 1.6,
            maxWidth: '68ch',
            marginBottom: '2rem',
          }}>
            Voici le logiciel n°1 par spécialité en mars 2026, mesuré en part de feuilles de soins électroniques télétransmises. Cliquez sur une ligne pour ouvrir le classement complet (top 5, évolution mensuelle, données téléchargeables).
          </p>

          <div style={{
            border: '1px solid rgba(10,10,11,0.08)',
            borderRadius: 'var(--cb-radius)',
            overflow: 'hidden',
            background: 'var(--paper-soft)',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(180px, 1.2fr) minmax(180px, 1.2fr) minmax(220px, 1.6fr) minmax(80px, 0.6fr) minmax(60px, 0.4fr)',
              gap: '1rem',
              padding: '0.85rem 1.25rem',
              background: 'var(--ink)',
              color: 'var(--paper)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              <span>Spécialité</span>
              <span>Logiciel n°1</span>
              <span className="hidden md:inline">Éditeur</span>
              <span style={{ textAlign: 'right' }}>Part</span>
              <span style={{ textAlign: 'right' }}>↗</span>
            </div>
            {specialites.map((s, idx) => {
              const top = s.topPlayers[0]
              return (
                <Link
                  key={s.slug}
                  to={`/specialites/${s.slug}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(180px, 1.2fr) minmax(180px, 1.2fr) minmax(220px, 1.6fr) minmax(80px, 0.6fr) minmax(60px, 0.4fr)',
                    gap: '1rem',
                    padding: '1.1rem 1.25rem',
                    borderTop: idx === 0 ? 'none' : '1px solid rgba(10,10,11,0.06)',
                    color: 'var(--ink)',
                    textDecoration: 'none',
                    fontSize: '0.92rem',
                    transition: 'background 0.15s ease',
                    alignItems: 'center',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(10,10,11,0.025)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <span style={{ fontWeight: 500 }}>{s.name}</span>
                  <span style={{ fontWeight: 600 }}>{top?.name ?? '—'}</span>
                  <span className="hidden md:inline" style={{ color: 'var(--graphite)' }}>{top?.editor ?? '—'}</span>
                  <span style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{top?.share ?? '—'}</span>
                  <span style={{ textAlign: 'right', color: 'var(--steel)' }}>→</span>
                </Link>
              )
            })}
          </div>

          <p style={{
            color: 'var(--steel)',
            fontSize: '0.82rem',
            lineHeight: 1.55,
            maxWidth: '68ch',
            marginTop: '1rem',
          }}>
            Données mars 2026 — Source : GIE SESAM-Vitale. Part = % des feuilles de soins électroniques télétransmises par cette spécialité utilisant ce progiciel sur le mois de référence.
          </p>
        </section>

        {/* SECTION 2 — TOP ÉDITEURS */}
        <section style={{
          maxWidth: '1320px',
          margin: '0 auto 5rem',
          padding: '0 6vw',
        }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <Eyebrow>// éditeurs — panorama 2026</Eyebrow>
          </div>
          <h2 style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(1.8rem, 3.6vw, 2.6rem)',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            lineHeight: 1.15,
            marginBottom: '1.25rem',
            maxWidth: '22ch',
          }}>
            Top des éditeurs de logiciels médicaux en France
          </h2>
          <p style={{
            color: 'var(--graphite)',
            fontSize: '1rem',
            lineHeight: 1.6,
            maxWidth: '68ch',
            marginBottom: '2.5rem',
          }}>
            Le marché français du logiciel santé est structuré autour d'une quinzaine d'éditeurs majeurs. Certains sont <strong>généralistes multi-spécialités</strong> (Cegedim Santé, Sofia Développement, Doctolib), d'autres sont <strong>verticaux mono-spécialité</strong> (Imagex en dentaire, CBA en infirmier libéral, Equasens en pharmacie, Cosium en optique/audio). Voici le panorama 2026, ordonné par poids stratégique sur le marché libéral français.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem',
          }}>
            {TOP_EDITORS.map((e, i) => (
              <article key={e.name} style={{
                padding: '1.5rem',
                borderRadius: 'var(--cb-radius)',
                background: 'var(--paper-soft)',
                border: '1px solid rgba(10,10,11,0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.62rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--signal-deep)',
                  fontWeight: 500,
                }}>
                  // {String(i + 1).padStart(2, '0')} / {String(TOP_EDITORS.length).padStart(2, '0')}
                </div>
                <h3 style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '1.15rem',
                  fontWeight: 600,
                  letterSpacing: '-0.015em',
                  lineHeight: 1.25,
                  margin: 0,
                  color: 'var(--ink)',
                }}>
                  {e.name}
                </h3>
                <p style={{
                  fontSize: '0.88rem',
                  color: 'var(--graphite)',
                  lineHeight: 1.5,
                  margin: 0,
                }}>
                  {e.footprint}
                </p>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  color: 'var(--steel)',
                  letterSpacing: '0.04em',
                  marginTop: 'auto',
                  paddingTop: '0.5rem',
                  borderTop: '1px solid rgba(10,10,11,0.06)',
                  lineHeight: 1.5,
                }}>
                  Progiciels : {e.products}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* SECTION 3 — GRID DES SPÉCIALITÉS (mini bar-chart race teaser par carte) */}
        <section style={{
          maxWidth: '1320px',
          margin: '0 auto 5rem',
          padding: '0 6vw',
        }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <Eyebrow>// 14 marchés — bar chart race 2019→2026</Eyebrow>
          </div>
          <h2 style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(1.8rem, 3.6vw, 2.6rem)',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            lineHeight: 1.15,
            marginBottom: '1.25rem',
            maxWidth: '24ch',
          }}>
            Explorez l'évolution de chaque marché en animation
          </h2>
          <p style={{
            color: 'var(--graphite)',
            fontSize: '1.05rem',
            lineHeight: 1.6,
            maxWidth: '68ch',
            marginBottom: '2.5rem',
          }}>
            Cliquez sur une spécialité pour ouvrir la <strong>bar chart race interactive</strong> qui rejoue mois par mois 7 ans de bouleversements concurrentiels — le recul d'AxiSanté, la conquête de Doctolib, la bascule cloud chez les infirmiers, le basculement Julie → Logos_w en dentaire. Chaque page contient le top 5 détaillé, l'analyse des grandes tendances et le téléchargement gratuit de la donnée brute.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem',
          }}>
            {specialites.map((s, i) => {
              const top3 = s.topPlayers.slice(0, 3)
              const parsePct = (str: string) => parseFloat(str.replace(',', '.').replace('%', '').trim()) || 0
              const maxPct = Math.max(...top3.map(p => parsePct(p.share)), 1)

              return (
                <Link
                  key={s.slug}
                  to={`/specialites/${s.slug}`}
                  style={{ textDecoration: 'none' }}
                  aria-label={`Voir l'animation ${s.name} 2019-2026`}
                >
                  <article
                    style={{
                      display: 'flex', flexDirection: 'column', height: '100%',
                      borderRadius: 'var(--cb-radius)',
                      padding: '1.5rem 1.5rem 1.25rem',
                      background: 'var(--paper-soft)',
                      border: '1px solid rgba(10,10,11,0.08)',
                      transition: 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
                      color: 'var(--ink)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.transform = 'translateY(-3px)'
                      el.style.borderColor = 'var(--signal)'
                      el.style.boxShadow = '0 14px 32px -16px rgba(82,184,73,0.35)'
                      const cta = el.querySelector('[data-cta]') as HTMLElement | null
                      if (cta) { cta.style.background = 'var(--ink)'; cta.style.color = 'var(--signal)' }
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.transform = ''
                      el.style.borderColor = 'rgba(10,10,11,0.08)'
                      el.style.boxShadow = ''
                      const cta = el.querySelector('[data-cta]') as HTMLElement | null
                      if (cta) { cta.style.background = ''; cta.style.color = '' }
                    }}
                  >
                    {/* HEADER — index + as-of */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.75rem',
                    }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.62rem',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'var(--signal-deep)',
                        fontWeight: 500,
                      }}>
                        // {String(i + 1).padStart(2, '0')} / {String(specialites.length).padStart(2, '0')}
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.6rem',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--steel)',
                      }}>
                        {s.asOf}
                      </span>
                    </div>

                    <h3 style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      letterSpacing: '-0.02em',
                      lineHeight: 1.2,
                      margin: 0,
                      marginBottom: '1rem',
                      color: 'var(--ink)',
                    }}>
                      {s.name}
                    </h3>

                    {/* MINI BAR CHART — top 3 */}
                    <ol style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.6rem',
                      marginBottom: '1.1rem',
                    }}>
                      {top3.map(p => {
                        const pct = parsePct(p.share)
                        const barWidth = Math.max((pct / maxPct) * 100, 4)
                        const isLeader = p.rank === 1
                        return (
                          <li key={p.rank} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'baseline',
                              gap: '0.5rem',
                            }}>
                              <span style={{
                                fontSize: '0.85rem',
                                fontWeight: isLeader ? 600 : 500,
                                color: 'var(--ink)',
                                lineHeight: 1.3,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}>
                                <span style={{
                                  display: 'inline-block',
                                  width: '1.1rem',
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: '0.7rem',
                                  color: 'var(--steel)',
                                }}>{p.rank}.</span>
                                {p.name}
                              </span>
                              <span style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                color: isLeader ? 'var(--ink)' : 'var(--graphite)',
                                whiteSpace: 'nowrap',
                              }}>
                                {p.share}
                              </span>
                            </div>
                            <div style={{
                              height: '5px',
                              background: 'rgba(10,10,11,0.06)',
                              borderRadius: '999px',
                              overflow: 'hidden',
                            }}>
                              <div style={{
                                width: `${barWidth}%`,
                                height: '100%',
                                background: isLeader ? 'var(--signal)' : 'rgba(10,10,11,0.35)',
                                borderRadius: '999px',
                                transition: 'width 0.4s ease',
                              }} />
                            </div>
                          </li>
                        )
                      })}
                    </ol>

                    {/* CTA — bar chart race + données brutes */}
                    <div
                      data-cta
                      style={{
                        marginTop: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        padding: '0.85rem 1.1rem',
                        borderRadius: '14px',
                        background: 'var(--signal)',
                        color: 'var(--ink)',
                        border: '1px solid var(--signal)',
                        fontFamily: 'var(--font-sans)',
                        transition: 'background 0.2s ease, color 0.2s ease',
                      }}
                    >
                      <span style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', lineHeight: 1.2 }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                        }}>
                          <span aria-hidden="true" style={{ fontSize: '0.65rem' }}>▶</span>
                          Voir l'animation 2019→2026
                        </span>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          opacity: 0.85,
                        }}>
                          + télécharger la donnée brute (CSV/XLSX)
                        </span>
                      </span>
                      <span aria-hidden="true" style={{ fontSize: '1.1rem', fontWeight: 700 }}>→</span>
                    </div>
                  </article>
                </Link>
              )
            })}
          </div>
        </section>

        {/* SECTION 4 — MÉTHODOLOGIE */}
        <section style={{
          maxWidth: '1320px',
          margin: '0 auto 5rem',
          padding: '0 6vw',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
          }}>
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <Eyebrow>// méthodologie</Eyebrow>
              </div>
              <h2 style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
                fontWeight: 700,
                letterSpacing: '-0.025em',
                lineHeight: 1.2,
                marginBottom: '1.25rem',
                maxWidth: '22ch',
              }}>
                Comment sont mesurées les parts de marché&nbsp;?
              </h2>
              <p style={{
                color: 'var(--graphite)',
                fontSize: '0.95rem',
                lineHeight: 1.6,
                marginBottom: '1rem',
              }}>
                Les parts de marché publiées sur cette page proviennent du <strong>GIE SESAM-Vitale</strong>, l'organisme qui opère la télétransmission des feuilles de soins électroniques (FSE) en France. Chaque mois, le GIE publie le volume de FSE émises par chaque progiciel agréé — par profession de santé.
              </p>
              <p style={{
                color: 'var(--graphite)',
                fontSize: '0.95rem',
                lineHeight: 1.6,
                marginBottom: '1rem',
              }}>
                Cette mesure est <strong>plus fiable que les chiffres de vente</strong> ou les déclarations d'éditeurs, car elle reflète l'usage réel sur le terrain&nbsp;: un logiciel installé mais non utilisé n'apparaît pas. Elle exclut en revanche les actes non télétransmis (tiers payant intégral, certains actes hospitaliers) et les éditeurs sans agrément SESAM-Vitale (rares en libéral).
              </p>
              <p style={{
                color: 'var(--graphite)',
                fontSize: '0.95rem',
                lineHeight: 1.6,
              }}>
                Les données sont retraitées pour&nbsp;: (1) regrouper les versions d'un même produit (ex.&nbsp;: AGATHE et AGATHE YOU), (2) attribuer correctement chaque progiciel à son éditeur actuel après rachat (ex.&nbsp;: Pharmagest → Equasens), (3) consolider les "Autres" (longue traîne d'éditeurs &lt;0,5 %) dans une catégorie agrégée.
              </p>
            </div>

            <div style={{
              background: 'var(--paper-soft)',
              border: '1px solid rgba(10,10,11,0.08)',
              borderRadius: 'var(--cb-radius)',
              padding: '2rem',
            }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.62rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--signal-deep)',
                marginBottom: '1rem',
              }}>
                // fiche technique
              </div>
              <dl style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: '0.6rem 1.25rem',
                fontSize: '0.88rem',
                color: 'var(--graphite)',
                lineHeight: 1.5,
                margin: 0,
              }}>
                <dt style={{ color: 'var(--steel)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Source</dt>
                <dd style={{ margin: 0 }}>GIE SESAM-Vitale</dd>
                <dt style={{ color: 'var(--steel)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Périmètre</dt>
                <dd style={{ margin: 0 }}>Santé libérale française</dd>
                <dt style={{ color: 'var(--steel)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Métrique</dt>
                <dd style={{ margin: 0 }}>% FSE télétransmises</dd>
                <dt style={{ color: 'var(--steel)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Période</dt>
                <dd style={{ margin: 0 }}>Janvier 2019 → Mars 2026</dd>
                <dt style={{ color: 'var(--steel)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Granularité</dt>
                <dd style={{ margin: 0 }}>Mensuelle</dd>
                <dt style={{ color: 'var(--steel)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Spécialités</dt>
                <dd style={{ margin: 0 }}>{specialites.length}</dd>
                <dt style={{ color: 'var(--steel)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Format</dt>
                <dd style={{ margin: 0 }}>JSON / CSV / XLSX</dd>
                <dt style={{ color: 'var(--steel)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Licence</dt>
                <dd style={{ margin: 0 }}>Données publiques GIE</dd>
              </dl>
            </div>
          </div>
        </section>

        {/* SECTION 5 — FAQ */}
        <section style={{
          maxWidth: '900px',
          margin: '0 auto 5rem',
          padding: '0 6vw',
        }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <Eyebrow>// faq</Eyebrow>
          </div>
          <h2 style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(1.8rem, 3.6vw, 2.6rem)',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            lineHeight: 1.15,
            marginBottom: '2rem',
            maxWidth: '22ch',
          }}>
            Foire aux questions
          </h2>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
          }}>
            {FAQ.map((f, i) => (
              <details key={i} style={{
                background: 'var(--paper-soft)',
                border: '1px solid rgba(10,10,11,0.08)',
                borderRadius: 'var(--cb-radius)',
                padding: '1.1rem 1.4rem',
              }}>
                <summary style={{
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '1rem',
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  color: 'var(--ink)',
                  listStyle: 'none',
                }}>
                  {f.q}
                </summary>
                <p style={{
                  marginTop: '0.85rem',
                  marginBottom: 0,
                  color: 'var(--graphite)',
                  fontSize: '0.93rem',
                  lineHeight: 1.6,
                }}>
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* SECTION 6 — CTA */}
        <section style={{
          maxWidth: '1320px',
          margin: '0 auto 6rem',
          padding: '0 6vw',
        }}>
          <div style={{
            background: 'var(--ink)',
            color: 'var(--paper)',
            borderRadius: 'var(--cb-radius)',
            padding: 'clamp(2rem, 5vw, 3.5rem)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem',
            alignItems: 'center',
          }}>
            <div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--signal)',
                marginBottom: '1rem',
              }}>
                // vous éditez un logiciel santé&nbsp;?
              </div>
              <h2 style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
                fontWeight: 700,
                letterSpacing: '-0.025em',
                lineHeight: 1.2,
                margin: 0,
                marginBottom: '1rem',
                maxWidth: '22ch',
              }}>
                Discutons de votre stratégie go-to-market sur le marché santé français
              </h2>
              <p style={{
                color: 'rgba(255,255,255,0.75)',
                fontSize: '1rem',
                lineHeight: 1.6,
                margin: 0,
              }}>
                Croissance, pricing, positionnement vs Cegedim/Doctolib/Sofia, distribution syndicats/groupements — 30 minutes pour faire le point.
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: '0.75rem' }}>
              <Link
                to="/booking?src=specialites"
                className="cb-btn cb-btn--primary"
                style={{ background: 'var(--paper)', color: 'var(--ink)', borderColor: 'var(--paper)' }}
              >
                Réserver 30 min <span className="cb-arrow">→</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
