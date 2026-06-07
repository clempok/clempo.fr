import { Link } from 'react-router-dom'
import { Mail, Phone, Linkedin, Building2, MapPin, ShieldCheck, RefreshCw, Database } from 'lucide-react'
import SEO from '../components/SEO'
import DecideursHospitaliersForm, { DecideursHospitaliersNetlifyRegistration } from '../components/DecideursHospitaliersForm'
import DecideursHospitaliersSheetPreview from '../components/DecideursHospitaliersSheetPreview'
import {
  DECIDEURS_HOSPITALIERS_TITLE,
  DECIDEURS_HOSPITALIERS_SUB,
  DECIDEURS_HOSPITALIERS_COUNT,
  DECIDEURS_HOSPITALIERS_ETABS,
} from '../lib/decideurs-hospitaliers'
import { bookingUrl } from '../lib/cta'

const ACCENT = '#0A0A0B'
const SIGNAL = '#00D68F'
const BORDER = 'rgba(10,10,11,0.08)'
const MUTED = '#6B6F7A'
const TEXT = '#0A0A0B'
const BG_OFF = '#F4F4F2'

const SRC = 'decideurs-hospitaliers'

const TITLE = `${DECIDEURS_HOSPITALIERS_COUNT.toLocaleString('fr-FR')} décideurs hospitaliers · Base France à télécharger | Clempo`
const META = `Base de ${DECIDEURS_HOSPITALIERS_COUNT.toLocaleString('fr-FR')} décideurs hospitaliers français : directeurs, DAF, DRH, chefs de service de ${DECIDEURS_HOSPITALIERS_ETABS.toLocaleString('fr-FR')} établissements (CHU, hôpitaux publics, cliniques, EHPAD, psychiatrie). Avec email pro, téléphone et LinkedIn. Téléchargement gratuit.`

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Dataset',
  'name': 'Décideurs hospitaliers — France',
  'description': META,
  'creator': {
    '@type': 'Person',
    'name': 'Clément Pouget-Osmont',
    'jobTitle': 'Healthcare Marketing Director',
    'url': 'https://www.linkedin.com/in/clementpougetosmont/',
  },
  'keywords': [
    'décideurs hospitaliers',
    'directeurs hôpital',
    'base contacts CHU',
    'prospection hôpital',
    'B2B santé',
    'FINESS',
  ],
  'spatialCoverage': { '@type': 'Country', 'name': 'France' },
  'license': 'https://www.clempo.fr/decideurs-hospitaliers',
  'isAccessibleForFree': true,
  'distribution': {
    '@type': 'DataDownload',
    'encodingFormat': 'application/vnd.google-apps.spreadsheet',
    'contentUrl': 'https://www.clempo.fr/decideurs-hospitaliers',
  },
  'variableMeasured': [
    'Prénom', 'Nom', 'Job Title', 'Établissement', 'Email pro', 'Téléphone', 'LinkedIn',
    'Catégorie', 'Catégorie FHF', 'Statut', 'Code FINESS', 'Capacité', 'Ville', 'Code postal',
  ],
}

const CATEGORIES = [
  { label: 'Hôpital public (CH / HL)', count: 4261 },
  { label: 'EHPAD / Maisons de retraite', count: 1317 },
  { label: 'CHU / CHRU', count: 1216 },
  { label: 'Clinique privée', count: 771 },
  { label: 'Psychiatrie', count: 695 },
  { label: 'SSR / SMR / Rééducation', count: 157 },
  { label: 'Hôpital privé non lucratif (ESPIC)', count: 137 },
  { label: 'CLCC (cancer)', count: 62 },
]

const ROLES = [
  'Directeur Général', 'Directeur d\'établissement', 'Directeur adjoint',
  'DRH', 'DAF', 'DSI', 'Directeur Soins', 'Directeur Stratégie',
  'Directeur Communication', 'Chef de service', 'Responsable Achats',
]

const USECASES = [
  {
    title: 'Cold outreach ciblé par catégorie',
    text: "Filtrez par CHU, EHPAD, clinique privée ou psychiatrie. Lancez une campagne email + LinkedIn focalisée, sans tirer dans le tas.",
  },
  {
    title: 'Mapping commercial régional',
    text: "Plus de 1 287 villes représentées. Construisez un pipeline territoire par territoire, en croisant code postal et code FINESS.",
  },
  {
    title: 'Account-based marketing santé',
    text: "Identifiez les 5 décideurs d'un établissement (DG, DAF, DRH, DSI, chef de service) pour orchestrer un ABM multi-touch.",
  },
  {
    title: 'Vérification de comptes existants',
    text: "Recoupez votre CRM : 7 000+ emails pro et 7 100+ profils LinkedIn pour nettoyer et compléter vos comptes hôpitaux.",
  },
]

const FAQ = [
  {
    q: "D'où viennent ces données ?",
    a: "Compilation manuelle à partir de sources publiques (sites des établissements, base FINESS, annuaires hospitaliers, LinkedIn). Chaque ligne est rattachée à un code FINESS officiel pour vous permettre de fiabiliser votre import CRM.",
  },
  {
    q: "Puis-je utiliser cette base pour de la prospection commerciale ?",
    a: "Oui. Les contacts professionnels listés exercent une fonction publique au sein d'établissements de santé — la base juridique RGPD est l'intérêt légitime pour de la prospection B2B. Mentionnez la source de votre prise de contact et permettez un opt-out simple dès le premier email.",
  },
  {
    q: "À quelle fréquence est-elle mise à jour ?",
    a: "Mises à jour trimestrielles. Le turnover des directions hospitalières en France est d'environ 12 à 15 % par an — prévoyez de re-télécharger la base tous les 3 mois pour conserver une donnée propre.",
  },
  {
    q: "Quel format est livré ?",
    a: "Un Google Sheet partagé en lecture (8 836 lignes, 19 colonnes). Vous pouvez le dupliquer dans votre Drive, l'exporter en CSV/XLSX, ou le brancher à un Sheets → CRM via Make / Zapier.",
  },
  {
    q: "Y a-t-il une garantie de délivrabilité email ?",
    a: "Non — les emails sont issus de sources publiques mais peuvent être obsolètes. Faites passer la base dans un outil de vérification (NeverBounce, Dropcontact) avant tout envoi en masse pour éviter un mauvais reputation score.",
  },
  {
    q: "Pourquoi gratuit ?",
    a: "Parce que je vends du temps de CMO, pas de la data. Cette base sert à qualifier les fondateurs HealthTech / MedTech qui visent l'hôpital — si vous êtes dans ce cas et bloqué sur votre go-to-market, on peut en parler.",
  },
]

export default function DecideursHospitaliers() {
  return (
    <>
      <SEO
        title={TITLE}
        description={META}
        canonical="/decideurs-hospitaliers"
        jsonLd={JSON_LD}
      />

      <DecideursHospitaliersNetlifyRegistration />

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

          <div className="dh-grid" style={{
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
                  🏥 Ressource gratuite
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 500,
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.7)',
                  padding: '0.35rem 0',
                }}>
                  France 🇫🇷 · {DECIDEURS_HOSPITALIERS_ETABS.toLocaleString('fr-FR')} établissements
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
                {DECIDEURS_HOSPITALIERS_TITLE}
              </h1>
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '1.05rem',
                color: 'rgba(255,255,255,0.78)',
                lineHeight: 1.65,
                margin: '0 0 2.25rem',
                maxWidth: '560px',
              }}>
                {DECIDEURS_HOSPITALIERS_SUB}
              </p>

              <DecideursHospitaliersForm variant="modal" theme="dark" source="page-hero" />
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <DecideursHospitaliersSheetPreview />
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
                { n: '8 836', l: 'Décideurs hospitaliers', sub: 'Directeurs, DAF, DRH, chefs de service' },
                { n: '1 849', l: 'Établissements', sub: 'CHU, CH, cliniques, EHPAD, psychiatrie, SSR' },
                { n: '7 051', l: 'Emails pro', sub: '79,8 % des lignes' },
                { n: '7 163', l: 'Profils LinkedIn', sub: '81 % des lignes' },
                { n: '3 449', l: 'Téléphones directs', sub: '39 % des lignes' },
                { n: '1 287', l: 'Villes couvertes', sub: 'France métropolitaine + DOM' },
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
            // 19 colonnes par ligne
          </p>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.7rem, 3.2vw, 2.4rem)',
            fontWeight: 400, letterSpacing: '-0.015em', color: TEXT,
            margin: '0 0 2.5rem', maxWidth: '720px', lineHeight: 1.15,
          }}>
            Tout ce qu'il vous faut pour ouvrir le dialogue.
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '1rem',
          }}>
            {[
              { icon: Mail,         t: 'Email professionnel',  s: '7 051 contacts, domaine établissement quand disponible' },
              { icon: Phone,        t: 'Téléphone direct',     s: 'Numéro ligne directe ou standard du service' },
              { icon: Linkedin,     t: 'Profil LinkedIn',      s: '7 163 URL vers le profil du décideur' },
              { icon: Building2,    t: 'Établissement',        s: 'Nom complet + catégorie + statut public/privé' },
              { icon: MapPin,       t: 'Adresse complète',     s: 'Rue, ville, code postal — pour campagnes territoriales' },
              { icon: Database,     t: 'Code FINESS',          s: 'Identifiant officiel pour matcher votre CRM/BI' },
              { icon: ShieldCheck,  t: 'Capacité d\'accueil',  s: 'Nombre de lits, places — pour qualifier le potentiel' },
              { icon: RefreshCw,    t: 'Catégorie FHF',        s: 'CH, CHU, CHRU, HL, CHS, MR, CLCC, MS, INS' },
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

        {/* ── CATÉGORIES + POSTES ── */}
        <section style={{ background: BG_OFF, padding: 'clamp(4rem, 7vw, 6rem) 4vw' }}>
          <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '3rem',
            }}>
              <div>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: SIGNAL, marginBottom: '1rem', fontWeight: 500 }}>
                  // Catégories d'établissements
                </p>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.4rem, 2.6vw, 1.9rem)', fontWeight: 400, color: TEXT, margin: '0 0 1.5rem', letterSpacing: '-0.015em' }}>
                  Public, privé, EHPAD, psy, SSR — tout est segmenté.
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {CATEGORIES.map((c, i) => (
                    <li key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                      padding: '0.6rem 0', borderBottom: `1px solid ${BORDER}`,
                    }}>
                      <span style={{ fontSize: '0.92rem', color: TEXT }}>{c.label}</span>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem',
                        color: MUTED, fontWeight: 500,
                      }}>{c.count.toLocaleString('fr-FR')}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: SIGNAL, marginBottom: '1rem', fontWeight: 500 }}>
                  // Postes représentés
                </p>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.4rem, 2.6vw, 1.9rem)', fontWeight: 400, color: TEXT, margin: '0 0 1.5rem', letterSpacing: '-0.015em' }}>
                  Vous parlez au bon niveau de décision.
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {ROLES.map((r, i) => (
                    <span key={i} style={{
                      background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '999px',
                      padding: '0.45rem 0.9rem', fontSize: '0.82rem', color: TEXT,
                      fontFamily: "'Inter', sans-serif",
                    }}>{r}</span>
                  ))}
                </div>
                <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: MUTED, lineHeight: 1.6 }}>
                  Et 250+ libellés de fonction plus précis (Directeur Stratégie, Directeur Investissements,
                  Responsable Achats, Coordonnateur Général des Soins, etc.).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── USE CASES ── */}
        <section style={{ padding: 'clamp(4rem, 7vw, 6rem) 4vw', maxWidth: '1180px', margin: '0 auto' }}>
          <div>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: SIGNAL, marginBottom: '1rem', fontWeight: 500 }}>
              // 4 façons de l'utiliser
            </p>
            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.7rem, 3.2vw, 2.4rem)',
              fontWeight: 400, letterSpacing: '-0.015em', color: TEXT,
              margin: '0 0 2.5rem', maxWidth: '720px', lineHeight: 1.15,
            }}>
              Plus utile qu'une base brute : un point de départ pour 4 plays B2B santé.
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
              les mises à jour trimestrielles. Pas de spam, pas de revente.
            </p>
            <div style={{ maxWidth: '480px', margin: '0 auto' }}>
              <DecideursHospitaliersForm variant="modal" theme="dark" source="page-bottom" />
            </div>

            <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', margin: '0 0 1rem' }}>
                Bloqué sur votre go-to-market hôpital ?
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
        .dh-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: clamp(2rem, 4vw, 4.5rem);
          align-items: center;
        }
        @media (max-width: 880px) {
          .dh-grid { grid-template-columns: 1fr; gap: 2.5rem; }
          .dh-grid > div:last-child { order: -1; }
        }
      `}</style>
    </>
  )
}
