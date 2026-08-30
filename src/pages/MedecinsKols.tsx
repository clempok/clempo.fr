import { Link } from 'react-router-dom'
import { Linkedin, Building2, MapPin, Stethoscope, Landmark, BadgeCheck, Layers, GitMerge, BookOpen } from 'lucide-react'
import SEO from '../components/SEO'
import MedecinsKolsForm, { MedecinsKolsNetlifyRegistration } from '../components/MedecinsKolsForm'
import MedecinsKolsSheetPreview from '../components/MedecinsKolsSheetPreview'
import {
  MEDECINS_KOLS_TITLE,
  MEDECINS_KOLS_SUB,
  MEDECINS_KOLS_COUNT,
  MEDECINS_KOLS_CHU,
  MEDECINS_KOLS_SAVANTES,
  MEDECINS_KOLS_REVUES_MEMBRES,
  MEDECINS_KOLS_MULTI,
  MEDECINS_KOLS_TRIPLES,
  MEDECINS_KOLS_ETABS,
  MEDECINS_KOLS_SOCIETES,
  MEDECINS_KOLS_REVUES,
  MEDECINS_KOLS_SPECIALITES,
  MEDECINS_KOLS_SURSPECIALITES,
  MEDECINS_KOLS_LINKEDIN,
  MEDECINS_KOLS_LINKEDIN_PCT,
} from '../lib/medecins-kols'
import { bookingUrl } from '../lib/cta'

const ACCENT = '#0A0A0B'
const SIGNAL = '#00D68F'
const BORDER = 'rgba(10,10,11,0.08)'
const MUTED = '#6B6F7A'
const TEXT = '#0A0A0B'
const BG_OFF = '#F4F4F2'

const SRC = 'medecins-kols'

const fr = (n: number) => n.toLocaleString('fr-FR')

const TITLE = `${fr(MEDECINS_KOLS_COUNT)} KOL santé · PU-PH, sociétés savantes & revues médicales | Clempo`
const META = `Base de ${fr(MEDECINS_KOLS_COUNT)} médecins KOL français : PU-PH, MCU-PH, chefs de service de ${fr(MEDECINS_KOLS_ETABS)} établissements, dirigeants de ${MEDECINS_KOLS_SOCIETES} sociétés savantes et comités de rédaction de ${MEDECINS_KOLS_REVUES} revues médicales. Spécialité, établissement, fonction et LinkedIn. Téléchargement gratuit.`

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Dataset',
  'name': 'Médecins KOL (leaders d’opinion) — CHU, sociétés savantes & revues médicales, France',
  'description': META,
  'creator': {
    '@type': 'Person',
    'name': 'Clément Pouget-Osmont',
    'jobTitle': 'Healthcare Marketing Director',
    'url': 'https://www.linkedin.com/in/clementpougetosmont/',
  },
  'keywords': [
    'KOL santé',
    'leaders d\'opinion médicaux',
    'PU-PH',
    'chefs de service CHU',
    'sociétés savantes',
    'comité de rédaction revue médicale',
    'advisory board médical',
  ],
  'spatialCoverage': { '@type': 'Country', 'name': 'France' },
  'license': 'https://www.clempo.fr/medecins-kols',
  'isAccessibleForFree': true,
  'distribution': {
    '@type': 'DataDownload',
    'encodingFormat': 'application/vnd.google-apps.spreadsheet',
    'contentUrl': 'https://www.clempo.fr/medecins-kols',
  },
  'variableMeasured': [
    'Titre', 'Nom', 'Prénom', 'Spécialité médicale', 'Service / intitulé d\'origine',
    'Surspécialités', 'Établissement', 'Société savante', 'Revue médicale', 'Fonction',
    'Ville', 'Département', 'Lien LinkedIn', 'Sources',
  ],
}

/** Top spécialités du fichier (nomenclature DES, 63 spécialités au total). */
const SPECIALITES = [
  { label: 'Biologie médicale', count: 305 },
  { label: 'Hématologie', count: 203 },
  { label: 'Cardiologie', count: 188 },
  { label: 'Radiologie et imagerie médicale', count: 178 },
  { label: 'Oncologie', count: 176 },
  { label: 'Pédiatrie', count: 171 },
  { label: 'Gynécologie-obstétrique', count: 169 },
  { label: 'Maladies infectieuses et tropicales', count: 161 },
  { label: 'Endocrinologie-diabétologie-nutrition', count: 157 },
  { label: 'Chirurgie viscérale et digestive', count: 154 },
]

const FONCTIONS = [
  'PU-PH', 'MCU-PH', 'Chef de service', 'Chef de pôle', 'Président',
  'Vice-Président', 'Secrétaire Général', 'Trésorier', 'Membre du CA',
  'Rédacteur en chef', 'Comité de rédaction',
]

const USECASES = [
  {
    title: 'Constituer un advisory board',
    text: "Croisez spécialité et fonction pour identifier 8 à 10 profils crédibles sur votre indication — un mix PU-PH de CHU et de dirigeants de société savante, plutôt que les trois noms que tout le monde sollicite.",
  },
  {
    title: 'Cartographier les KOL d\'une spécialité',
    text: `${MEDECINS_KOLS_SPECIALITES} spécialités segmentées. Sortez la liste complète des leaders d'une aire thérapeutique, avec l'établissement et la société savante de rattachement.`,
  },
  {
    title: 'Préparer un congrès ou un symposium',
    text: `Les ${MEDECINS_KOLS_SOCIETES} sociétés savantes couvertes sont celles qui organisent les congrès de spécialité. Vous savez à qui parler du programme scientifique avant que le call for papers ne sorte.`,
  },
  {
    title: 'Viser les comités de rédaction',
    text: `Les membres des comités de ${MEDECINS_KOLS_REVUES} revues médicales décident de ce qui se publie dans leur spécialité. C'est le levier le plus direct pour faire exister une donnée clinique auprès des prescripteurs.`,
  },
  {
    title: 'Recruter des investigateurs',
    text: "Filtrez par département et par service pour cibler les centres capables de porter votre étude clinique — le chef de service est nommé, avec son intitulé de service d'origine.",
  },
]

const FAQ = [
  {
    q: "D'où viennent ces données ?",
    a: `Trois sources publiques, fusionnées et dédoublonnées : l'annuaire de la Fédération Hospitalière de France (relevé en août 2026) pour les PU-PH, MCU-PH et chefs de service des CHU et CLCC ; les pages « bureau » et « conseil d'administration » des sites officiels des ${MEDECINS_KOLS_SOCIETES} sociétés savantes ; les ours des ${MEDECINS_KOLS_REVUES} revues médicales françaises qui publient leur comité de rédaction, pour leurs rédacteurs en chef et membres de comité.`,
  },
  {
    q: "Que veut dire « profil multi-sources » ?",
    a: `${fr(MEDECINS_KOLS_MULTI)} praticiens apparaissent dans au moins deux des trois sources, et ${MEDECINS_KOLS_TRIPLES} dans les trois à la fois : hospitalo-universitaire, dirigeant d'une société savante et membre d'un comité de rédaction. Ce sont statistiquement les profils les plus influents du fichier. Ils occupent une seule ligne, toutes colonnes remplies — filtrez la colonne « Sources » sur celles qui contiennent un « + » pour les isoler.`,
  },
  {
    q: "Ma spécialité paraît sous-représentée, pourquoi ?",
    a: `Les spécialités transversales et récentes sont désavantagées par les sources : l'allergologie, par exemple, n'a pas de CNU, donc ses PU-PH sont titrés en pneumologie, dermatologie ou pédiatrie dans l'annuaire hospitalier. C'est pour ça qu'existe la colonne « Surspécialités » : ${fr(MEDECINS_KOLS_SURSPECIALITES)} praticiens y portent une seconde casquette détectée dans leur intitulé de service, leur société savante ou leur revue. Filtrez-la en plus de la spécialité principale — un allergologue titré pneumologue y apparaît. Si votre spécialité reste mal couverte, écrivez-moi le nom de sa société savante : je l'ajoute.`,
  },
  {
    q: "Est-ce que la couverture est exhaustive ?",
    a: "Non, et c'est assumé. L'annuaire FHF est très inégal selon les CHU : quelques grands centres y publient peu ou pas leurs équipes. La base couvre 324 établissements et reste la vue la plus large disponible publiquement, mais recoupez toujours avec le site du CHU avant un envoi nominatif.",
  },
  {
    q: "Puis-je contacter ces praticiens pour de la prospection ?",
    a: "Ce sont des contacts professionnels exerçant une fonction publique, la base juridique RGPD est l'intérêt légitime. Mais un KOL n'est pas un lead : passez par LinkedIn ou par une introduction, avec une raison scientifique de le contacter. Une séquence de cold email automatisée sur ce fichier vous grillera durablement dans la spécialité.",
  },
  {
    q: "Y a-t-il des emails ?",
    a: `Non — volontairement. Le fichier donne le nom, la spécialité, l'établissement, la fonction et le profil LinkedIn (${fr(MEDECINS_KOLS_LINKEDIN)} profils rattachés, soit ${MEDECINS_KOLS_LINKEDIN_PCT} % des lignes). L'approche d'un leader d'opinion se fait par LinkedIn, par un congrès ou par une introduction, pas par une adresse trouvée dans un fichier.`,
  },
  {
    q: "Quel format est livré ?",
    a: `Un Google Sheet partagé en lecture (${fr(MEDECINS_KOLS_COUNT)} lignes, 14 colonnes, un onglet couverture et un onglet base). Dupliquez-le dans votre Drive pour le filtrer librement, ou exportez-le en CSV/XLSX.`,
  },
  {
    q: "Pourquoi gratuit ?",
    a: "Parce que je vends du temps de CMO, pas de la data. Cette base sert à qualifier les fondateurs HealthTech, MedTech et pharma qui construisent une stratégie médicale — si c'est votre cas et que vous êtes bloqué sur votre go-to-market, on peut en parler.",
  },
]

export default function MedecinsKols() {
  return (
    <>
      <SEO
        title={TITLE}
        description={META}
        canonical="/medecins-kols"
        ogImage="https://www.clempo.fr/og-medecins-kols.png"
        jsonLd={JSON_LD}
      />

      <MedecinsKolsNetlifyRegistration />

      <main style={{ paddingTop: '6rem' }}>
        {/* ── HERO + FORM ── */}
        <section style={{
          background: ACCENT,
          color: '#fff',
          padding: 'clamp(3rem, 7vw, 6rem) 4vw clamp(4rem, 8vw, 7rem)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div className="cb-dotmatrix cb-dotmatrix--signal" aria-hidden style={{
            position: 'absolute', top: 0, right: 0,
            width: '38%', height: '60%',
            opacity: 0.18, pointerEvents: 'none',
          }} />

          <div className="mk-grid" style={{
            maxWidth: '1180px',
            margin: '0 auto',
            position: 'relative',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 600,
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: ACCENT, background: SIGNAL,
                  padding: '0.35rem 0.75rem', borderRadius: '4px',
                }}>
                  🎓 Ressource gratuite
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 500,
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.7)',
                  padding: '0.35rem 0',
                }}>
                  France 🇫🇷 · {fr(MEDECINS_KOLS_ETABS)} établissements · {MEDECINS_KOLS_SOCIETES} sociétés savantes · {MEDECINS_KOLS_REVUES} revues
                </span>
              </div>

              <h1 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.95rem, 4.5vw, 3rem)',
                fontWeight: 400,
                color: '#fff',
                margin: '0 0 1rem',
                lineHeight: 1.08,
                letterSpacing: '-0.01em',
              }}>
                {MEDECINS_KOLS_TITLE}
              </h1>
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '1.05rem',
                color: 'rgba(255,255,255,0.78)',
                lineHeight: 1.65,
                margin: '0 0 2.25rem',
                maxWidth: '560px',
              }}>
                {MEDECINS_KOLS_SUB}
              </p>

              <MedecinsKolsForm variant="modal" theme="dark" source="page-hero" />
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <MedecinsKolsSheetPreview />
            </div>
          </div>
        </section>

        {/* ── STATS BAR ── */}
        <section style={{ background: BG_OFF, padding: '3rem 4vw', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1.5rem',
            }}>
              {[
                { n: fr(MEDECINS_KOLS_COUNT), l: 'Médecins KOL', sub: 'PU-PH, chefs de service, sociétés savantes, comités de rédaction' },
                { n: fr(MEDECINS_KOLS_CHU), l: 'Hospitalo-universitaires', sub: `CHU et CLCC — ${fr(MEDECINS_KOLS_ETABS)} établissements` },
                { n: fr(MEDECINS_KOLS_SAVANTES), l: 'Dirigeants de société savante', sub: `${MEDECINS_KOLS_SOCIETES} sociétés couvertes` },
                { n: fr(MEDECINS_KOLS_REVUES_MEMBRES), l: 'Comités de rédaction', sub: `${MEDECINS_KOLS_REVUES} revues médicales` },
                { n: fr(MEDECINS_KOLS_MULTI), l: 'Profils multi-sources', sub: `Dont ${MEDECINS_KOLS_TRIPLES} présents dans les trois` },
                { n: String(MEDECINS_KOLS_SPECIALITES), l: 'Spécialités', sub: 'Nomenclature DES + odontologie' },
                { n: fr(MEDECINS_KOLS_LINKEDIN), l: 'Profils LinkedIn', sub: `${MEDECINS_KOLS_LINKEDIN_PCT} % des lignes` },
              ].map((s, i) => (
                <div key={i}>
                  <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 'clamp(1.6rem, 3vw, 2.1rem)',
                    fontWeight: 700, letterSpacing: '-0.02em',
                    color: TEXT, margin: '0 0 0.25rem', lineHeight: 1,
                  }}>{s.n}</p>
                  <p style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: TEXT, margin: '0 0 0.25rem', fontWeight: 600,
                  }}>{s.l}</p>
                  <p style={{ fontSize: '0.8rem', color: MUTED, margin: 0, lineHeight: 1.4 }}>{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── COLONNES DISPONIBLES ── */}
        <section style={{ padding: 'clamp(4rem, 7vw, 6rem) 4vw', maxWidth: '1180px', margin: '0 auto' }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: SIGNAL, marginBottom: '1rem', fontWeight: 500 }}>
            // 14 colonnes par ligne
          </p>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.7rem, 3.2vw, 2.4rem)',
            fontWeight: 400, letterSpacing: '-0.015em', color: TEXT,
            margin: '0 0 2.5rem', maxWidth: '720px', lineHeight: 1.15,
          }}>
            Assez de contexte pour savoir qui approcher, et pourquoi.
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '1rem',
          }}>
            {[
              { icon: BadgeCheck,  t: 'Titre et identité',     s: 'Pr, Dr, M., Mme + nom et prénom' },
              { icon: Stethoscope, t: 'Spécialité médicale',   s: `${MEDECINS_KOLS_SPECIALITES} spécialités normalisées, filtrables directement` },
              { icon: GitMerge,    t: 'Surspécialités',         s: `${fr(MEDECINS_KOLS_SURSPECIALITES)} praticiens portent une seconde casquette (allergologie, sommeil, addictologie…)` },
              { icon: Layers,      t: "Service d'origine",     s: "L'intitulé brut du service, plus fin que la spécialité" },
              { icon: Building2,   t: 'Établissement',         s: `CHU, CHRU, CLCC — ${fr(MEDECINS_KOLS_ETABS)} établissements nommés` },
              { icon: Landmark,    t: 'Société savante',       s: `${MEDECINS_KOLS_SOCIETES} sociétés, collèges et académies` },
              { icon: BookOpen,    t: 'Revue médicale',        s: `${MEDECINS_KOLS_REVUES} revues — rédacteurs en chef et comités` },
              { icon: BadgeCheck,  t: 'Fonction',              s: 'PU-PH, MCU-PH, chef de service, président, rédacteur en chef…' },
              { icon: MapPin,      t: 'Ville et département',  s: 'Pour cibler un territoire ou un centre investigateur' },
              { icon: Linkedin,    t: 'Profil LinkedIn',       s: `${fr(MEDECINS_KOLS_LINKEDIN)} URL vérifiées sur le nom de famille` },
            ].map((c, i) => {
              const Icon = c.icon
              return (
                <div key={i} style={{
                  background: '#fff',
                  border: `1px solid ${BORDER}`,
                  borderRadius: '8px',
                  padding: '1.25rem',
                  display: 'flex', flexDirection: 'column', gap: '0.6rem',
                }}>
                  <Icon size={20} color={SIGNAL} strokeWidth={1.7} />
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.95rem', fontWeight: 600, color: TEXT, margin: 0 }}>{c.t}</p>
                  <p style={{ fontSize: '0.82rem', color: MUTED, margin: 0, lineHeight: 1.5 }}>{c.s}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── SPÉCIALITÉS + FONCTIONS ── */}
        <section style={{ background: BG_OFF, padding: 'clamp(4rem, 7vw, 6rem) 4vw' }}>
          <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '3rem',
            }}>
              <div>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: SIGNAL, marginBottom: '1rem', fontWeight: 500 }}>
                  // Top 10 des spécialités
                </p>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.4rem, 2.6vw, 1.9rem)', fontWeight: 400, color: TEXT, margin: '0 0 1.5rem', letterSpacing: '-0.015em' }}>
                  {MEDECINS_KOLS_SPECIALITES} spécialités, de la cardiologie à l'odontologie.
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {SPECIALITES.map((c, i) => (
                    <li key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                      padding: '0.6rem 0', borderBottom: `1px solid ${BORDER}`,
                    }}>
                      <span style={{ fontSize: '0.92rem', color: TEXT }}>{c.label}</span>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem',
                        color: MUTED, fontWeight: 500,
                      }}>{fr(c.count)}</span>
                    </li>
                  ))}
                </ul>
                <p style={{ marginTop: '1.25rem', fontSize: '0.85rem', color: MUTED, lineHeight: 1.6 }}>
                  Et {MEDECINS_KOLS_SPECIALITES - SPECIALITES.length} autres, dont les six sous-spécialités odontologiques (ODF, endodontie,
                  parodontologie, chirurgie orale, odontologie pédiatrique, médecine bucco-dentaire).
                </p>
              </div>

              <div>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: SIGNAL, marginBottom: '1rem', fontWeight: 500 }}>
                  // Fonctions représentées
                </p>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.4rem, 2.6vw, 1.9rem)', fontWeight: 400, color: TEXT, margin: '0 0 1.5rem', letterSpacing: '-0.015em' }}>
                  Le titre universitaire et le poste, séparément.
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {FONCTIONS.map((r, i) => (
                    <span key={i} style={{
                      background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '999px',
                      padding: '0.45rem 0.9rem', fontSize: '0.82rem', color: TEXT,
                      fontFamily: "'Inter', sans-serif",
                    }}>{r}</span>
                  ))}
                </div>
                <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: MUTED, lineHeight: 1.6 }}>
                  300+ libellés au total : un PU-PH qui dirige aussi un pôle, siège au bureau d'une
                  société savante et signe l'édito d'une revue porte toutes ces mentions sur la même ligne.
                </p>

                <div style={{
                  marginTop: '2rem',
                  background: '#fff',
                  border: `1px solid ${BORDER}`,
                  borderRadius: '8px',
                  padding: '1.5rem',
                  display: 'flex', flexDirection: 'column', gap: '0.7rem',
                }}>
                  <GitMerge size={20} color={SIGNAL} strokeWidth={1.7} />
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '1rem', fontWeight: 600, color: TEXT, margin: 0 }}>
                    {fr(MEDECINS_KOLS_MULTI)} profils multi-sources
                  </p>
                  <p style={{ fontSize: '0.88rem', color: MUTED, margin: 0, lineHeight: 1.6 }}>
                    Hospitalo-universitaires, dirigeants d'une société savante <em>ou</em> membres d'un
                    comité de rédaction — présents dans au moins deux de ces rôles, et {MEDECINS_KOLS_TRIPLES} dans
                    les trois à la fois. Une seule ligne, toutes les colonnes remplies. C'est par eux
                    qu'on commence une cartographie KOL.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── USE CASES ── */}
        <section style={{ padding: 'clamp(4rem, 7vw, 6rem) 4vw', maxWidth: '1180px', margin: '0 auto' }}>
          <div>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: SIGNAL, marginBottom: '1rem', fontWeight: 500 }}>
              // 5 façons de l'utiliser
            </p>
            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.7rem, 3.2vw, 2.4rem)',
              fontWeight: 400, letterSpacing: '-0.015em', color: TEXT,
              margin: '0 0 2.5rem', maxWidth: '720px', lineHeight: 1.15,
            }}>
              Une base de travail pour votre stratégie médicale, pas un fichier de prospection.
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.25rem',
            }}>
              {USECASES.map((u, i) => (
                <div key={i} style={{
                  background: BG_OFF,
                  borderRadius: '6px',
                  padding: '1.75rem',
                  border: `1px solid ${BORDER}`,
                }}>
                  <p style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem',
                    letterSpacing: '0.1em', textTransform: 'uppercase', color: SIGNAL,
                    fontWeight: 600, margin: '0 0 0.75rem',
                  }}>{String(i + 1).padStart(2, '0')}</p>
                  <h4 style={{
                    fontFamily: "'Inter', sans-serif", fontSize: '1.05rem', fontWeight: 600,
                    color: TEXT, margin: '0 0 0.65rem', letterSpacing: '-0.01em',
                  }}>{u.title}</h4>
                  <p style={{ fontSize: '0.92rem', color: MUTED, lineHeight: 1.6, margin: 0 }}>{u.text}</p>
                </div>
              ))}
            </div>

            <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: MUTED, lineHeight: 1.7, maxWidth: '720px' }}>
              Vous cherchez plutôt les directions d'établissement (DG, DAF, DRH, DSI) ?{' '}
              <Link to="/decideurs-hospitaliers" style={{ color: TEXT, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                La base des décideurs hospitaliers
              </Link>{' '}
              est faite pour ça. Et pour la voix grand public des soignants,{' '}
              <Link to="/influenceurs-sante" style={{ color: TEXT, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                la base des influenceurs santé
              </Link>.
            </p>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section style={{ background: BG_OFF, padding: 'clamp(4rem, 7vw, 6rem) 4vw' }}>
          <div style={{ maxWidth: '820px', margin: '0 auto' }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: SIGNAL, marginBottom: '1rem', fontWeight: 500 }}>
              // FAQ
            </p>
            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.7rem, 3.2vw, 2.4rem)',
              fontWeight: 400, letterSpacing: '-0.015em', color: TEXT,
              margin: '0 0 2.5rem', lineHeight: 1.15,
            }}>
              Questions fréquentes
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {FAQ.map((f, i) => (
                <details key={i} style={{
                  background: '#fff',
                  border: `1px solid ${BORDER}`,
                  borderRadius: '6px',
                  padding: '1.1rem 1.4rem',
                }}>
                  <summary style={{
                    fontFamily: "'Inter', sans-serif", fontSize: '1rem', fontWeight: 600,
                    color: TEXT, cursor: 'pointer', listStyle: 'none',
                  }}>
                    {f.q}
                  </summary>
                  <p style={{
                    fontSize: '0.93rem', color: MUTED, lineHeight: 1.65,
                    margin: '0.85rem 0 0',
                  }}>
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── BOTTOM FORM REMINDER ── */}
        <section style={{ background: ACCENT, color: '#fff', padding: 'clamp(4rem, 7vw, 6rem) 4vw' }}>
          <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.7rem, 3.2vw, 2.4rem)',
              fontWeight: 400, letterSpacing: '-0.015em', color: '#fff',
              margin: '0 0 1rem', lineHeight: 1.15,
            }}>
              Récupérez la base maintenant
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', lineHeight: 1.6, margin: '0 0 2.5rem' }}>
              Vos coordonnées ne servent qu'à vous envoyer le lien et, si vous le souhaitez,
              les mises à jour. Pas de spam, pas de revente.
            </p>
            <div style={{ maxWidth: '480px', margin: '0 auto' }}>
              <MedecinsKolsForm variant="modal" theme="dark" source="page-bottom" />
            </div>

            <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', margin: '0 0 1rem' }}>
                Besoin d'une stratégie KOL, pas seulement d'un fichier ?
              </p>
              <Link
                to={bookingUrl(SRC)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                  padding: '0.9rem 1.8rem', background: SIGNAL, color: ACCENT,
                  textDecoration: 'none', borderRadius: '4px',
                  fontSize: '0.9rem', fontWeight: 600, letterSpacing: '-0.01em',
                }}
              >
                📅 Brief 30 minutes →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <style>{`
        .mk-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: clamp(2rem, 4vw, 4.5rem);
          align-items: center;
        }
        @media (max-width: 880px) {
          .mk-grid { grid-template-columns: 1fr; gap: 2.5rem; }
          .mk-grid > div:last-child { order: -1; }
        }
      `}</style>
    </>
  )
}
