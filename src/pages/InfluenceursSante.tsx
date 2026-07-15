import { Link } from 'react-router-dom'
import { AtSign, Users, Stethoscope, Tag, Link2, Instagram, Music2, TrendingUp } from 'lucide-react'
import SEO from '../components/SEO'
import InfluenceursSanteForm, { InfluenceursSanteNetlifyRegistration } from '../components/InfluenceursSanteForm'
import InfluenceursSanteSheetPreview from '../components/InfluenceursSanteSheetPreview'
import {
  INFLUENCEURS_SANTE_TITLE,
  INFLUENCEURS_SANTE_SUB,
  INFLUENCEURS_SANTE_COUNT,
  INFLUENCEURS_SANTE_INSTAGRAM,
  INFLUENCEURS_SANTE_TIKTOK,
} from '../lib/influenceurs-sante'
import { bookingUrl } from '../lib/cta'

const ACCENT = '#0A0A0B'
const SIGNAL = '#00D68F'
const BORDER = 'rgba(10,10,11,0.08)'
const MUTED = '#6B6F7A'
const TEXT = '#0A0A0B'
const BG_OFF = '#F4F4F2'

const SRC = 'influenceurs-sante'

const TITLE = `${INFLUENCEURS_SANTE_COUNT} influenceurs santé · Instagram & TikTok | Clempo`
const META = `Base de ${INFLUENCEURS_SANTE_COUNT} professionnels de santé influenceurs en France : médecins, infirmiers, dentistes, kinés, sages-femmes. Pseudo, abonnés, spécialité et lien direct vers le profil. Téléchargement gratuit.`

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Dataset',
  'name': 'Influenceurs santé — professionnels de santé créateurs de contenu, France',
  'description': META,
  'creator': {
    '@type': 'Person',
    'name': 'Clément Pouget-Osmont',
    'jobTitle': 'Healthcare Marketing Director',
    'url': 'https://www.linkedin.com/in/clementpougetosmont/',
  },
  'keywords': [
    'influenceur santé',
    'influence professionnels de santé',
    'marketing d\'influence santé',
    'créateurs de contenu santé',
    'influenceur médecin',
    'influenceur kiné',
    'Instagram santé',
    'TikTok santé',
  ],
  'spatialCoverage': { '@type': 'Country', 'name': 'France' },
  'license': 'https://www.clempo.fr/influenceurs-sante',
  'isAccessibleForFree': true,
  'distribution': {
    '@type': 'DataDownload',
    'encodingFormat': 'application/vnd.google-apps.spreadsheet',
    'contentUrl': 'https://www.clempo.fr/influenceurs-sante',
  },
  'variableMeasured': [
    'Catégorie', 'Nom', 'Pseudo', 'Followers', 'Spécialité', 'Lien du profil', 'Plateforme',
  ],
}

/** Répartition réelle de la base (catégories regroupées : les libellés proches
 *  — « Ostéopathe D.O. », « Psychopraticien »… — sont fusionnés). */
const CATEGORIES = [
  { label: 'Médecins (généralistes & spécialistes)', count: 206 },
  { label: 'Infirmier·es', count: 187 },
  { label: 'Dentistes', count: 139 },
  { label: 'Chirurgiens', count: 126 },
  { label: 'Kinésithérapeutes', count: 76 },
  { label: 'Psys (psychologues, psychiatres…)', count: 47 },
  { label: 'Ostéopathes', count: 24 },
  { label: 'Sages-femmes', count: 19 },
  { label: 'Diététicien·nes-nutritionnistes', count: 16 },
  { label: 'Sexologues', count: 5 },
]

const TIERS = [
  { label: 'Plus d\'1 M d\'abonnés', count: 9 },
  { label: '500 k – 1 M', count: 15 },
  { label: '100 k – 500 k', count: 93 },
  { label: '50 k – 100 k', count: 96 },
  { label: '10 k – 50 k', count: 307 },
  { label: 'Moins de 10 k', count: 323 },
]

const USECASES = [
  {
    title: 'Distribuer un lead magnet en commentaire',
    text: "Le créateur poste un reel utile, l'appel à commenter déclenche un envoi automatique en DM via ManyChat. Environ 50 % des personnes qui commentent remplissent le formulaire.",
  },
  {
    title: 'Baisser votre coût par lead face aux ads',
    text: "Sur ce canal, le coût par lead tourne entre 5 et 15 € — souvent sous un lead santé sur Meta, avec des prospects déjà en confiance. Un vrai second pilier d'acquisition.",
  },
  {
    title: 'Toucher une audience de pairs, pas le grand public',
    text: "Filtrez les comptes qui parlent aux soignants plutôt qu'aux patients. 15 000 abonnés kinés valent mieux qu'une star du bien-être pour vendre un dispositif aux kinés.",
  },
  {
    title: 'Contacter en volume pour cadrer un partenariat',
    text: "Un DM simple avec une proposition claire dès le premier échange. Beaucoup passent par une agence, d'autres se gèrent en direct — parfois moins cher.",
  },
]

const FAQ = [
  {
    q: "Qu'est-ce qu'un influenceur santé ?",
    a: "Un professionnel de santé en exercice — médecin, infirmier, kiné, dentiste, sage-femme… — qui produit du contenu sur Instagram ou TikTok pour le grand public ou pour ses pairs. Contrairement à un créateur lifestyle, sa légitimité vient de sa pratique : c'est ce qui rend sa recommandation crédible, et c'est aussi ce qui le rend exigeant sur ce qu'il accepte de porter.",
  },
  {
    q: "D'où viennent ces données ?",
    a: "D'un scraping de plusieurs sources croisé avec un outil de discovery d'influenceurs (type Modash), puis d'une qualification manuelle compte par compte : métier réel, spécialité, ordre de grandeur d'audience. Chaque ligne pointe vers le profil public d'origine, vous pouvez tout vérifier en un clic.",
  },
  {
    q: "Combien coûte une collaboration avec un influenceur santé ?",
    a: "De quelques centaines d'euros pour un reel chez un profil de niche, jusqu'à plusieurs milliers pour les plus gros comptes. C'est encore l'un des meilleurs ratios coût/lead du marché en santé, précisément parce que la confiance est déjà installée.",
  },
  {
    q: "Les professionnels de santé acceptent-ils les partenariats ?",
    a: "Oui, mais pas à n'importe quelle condition. Leur crédibilité auprès de leurs pairs et de leurs patients est leur capital : un message qui « sonne pub » sera refusé, ou publié sans conviction — donc sans effet. Arrivez avec une proposition claire, laissez-leur la main sur le ton, et respectez le cadre (mention de partenariat obligatoire, pas de promesse de résultat thérapeutique).",
  },
  {
    q: "Quel format est livré ?",
    a: `Un Google Sheet partagé en lecture : deux onglets (${INFLUENCEURS_SANTE_INSTAGRAM} profils Instagram, ${INFLUENCEURS_SANTE_TIKTOK} profils TikTok), 6 colonnes — catégorie, nom, pseudo, abonnés, spécialité, lien du profil. Dupliquez-le dans votre Drive, filtrez, exportez en CSV.`,
  },
  {
    q: "Pourquoi gratuit ?",
    a: "Parce que je vends du temps de CMO, pas de la data. Cette base sert à qualifier les équipes santé qui veulent tester l'influence — si vous êtes dans ce cas et que vous ne savez pas par où commencer, on peut en parler.",
  },
]

export default function InfluenceursSante() {
  return (
    <>
      <SEO
        title={TITLE}
        description={META}
        canonical="/influenceurs-sante"
        jsonLd={JSON_LD}
      />

      <InfluenceursSanteNetlifyRegistration />

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

          <div className="is-grid" style={{
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
                  📱 Ressource gratuite
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 500,
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.7)',
                  padding: '0.35rem 0',
                }}>
                  France 🇫🇷 · {INFLUENCEURS_SANTE_INSTAGRAM} Instagram · {INFLUENCEURS_SANTE_TIKTOK} TikTok
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
                {INFLUENCEURS_SANTE_TITLE}
              </h1>
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '1.05rem',
                color: 'rgba(255,255,255,0.78)',
                lineHeight: 1.65,
                margin: '0 0 2.25rem',
                maxWidth: '560px',
              }}>
                {INFLUENCEURS_SANTE_SUB}
              </p>

              <InfluenceursSanteForm variant="modal" theme="dark" source="page-hero" />
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <InfluenceursSanteSheetPreview />
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
                { n: '845', l: 'Soignants créateurs', sub: 'Tous professionnels de santé en exercice' },
                { n: '519', l: 'Profils Instagram', sub: '61 % de la base' },
                { n: '326', l: 'Profils TikTok', sub: '39 % de la base' },
                { n: '58,1 M', l: 'Abonnés cumulés', sub: 'Portée totale de la base' },
                { n: '10', l: 'Métiers couverts', sub: 'Médecins, IDE, dentistes, kinés, sages-femmes…' },
                { n: '16 100', l: 'Abonnés médians', sub: 'Le cœur de base est en micro-influence' },
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
            // 6 colonnes par ligne
          </p>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.7rem, 3.2vw, 2.4rem)',
            fontWeight: 400, letterSpacing: '-0.015em', color: TEXT,
            margin: '0 0 2.5rem', maxWidth: '720px', lineHeight: 1.15,
          }}>
            De quoi filtrer, shortlister et contacter dans la foulée.
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '1rem',
          }}>
            {[
              { icon: Stethoscope, t: 'Catégorie métier',   s: 'Médecin, infirmier, dentiste, kiné, sage-femme, psy…' },
              { icon: AtSign,      t: 'Pseudo',             s: 'Le handle exact du compte, prêt à copier' },
              { icon: Users,       t: 'Nombre d\'abonnés',  s: 'Pour trier par palier et calibrer votre budget' },
              { icon: Tag,         t: 'Spécialité',         s: 'La thématique réelle du compte, pas la bio' },
              { icon: Link2,       t: 'Lien du profil',     s: 'URL directe — vérifiez le compte en un clic' },
              { icon: Instagram,   t: 'Onglet Instagram',   s: `${INFLUENCEURS_SANTE_INSTAGRAM} profils, triés par audience` },
              { icon: Music2,      t: 'Onglet TikTok',      s: `${INFLUENCEURS_SANTE_TIKTOK} profils, triés par audience` },
              { icon: TrendingUp,  t: 'Tri par audience',   s: 'De 2,7 M d\'abonnés aux micro-comptes de niche' },
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

        {/* ── MÉTIERS + PALIERS ── */}
        <section style={{ background: BG_OFF, padding: 'clamp(4rem, 7vw, 6rem) 4vw' }}>
          <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '3rem',
            }}>
              <div>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: SIGNAL, marginBottom: '1rem', fontWeight: 500 }}>
                  // Métiers représentés
                </p>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.4rem, 2.6vw, 1.9rem)', fontWeight: 400, color: TEXT, margin: '0 0 1.5rem', letterSpacing: '-0.015em' }}>
                  Tout le soin, pas seulement les médecins.
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
                      }}>{c.count}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: SIGNAL, marginBottom: '1rem', fontWeight: 500 }}>
                  // Paliers d'audience
                </p>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.4rem, 2.6vw, 1.9rem)', fontWeight: 400, color: TEXT, margin: '0 0 1.5rem', letterSpacing: '-0.015em' }}>
                  Des stars aux micro-comptes ultra-qualifiés.
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {TIERS.map((t, i) => (
                    <li key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                      padding: '0.6rem 0', borderBottom: `1px solid ${BORDER}`,
                    }}>
                      <span style={{ fontSize: '0.92rem', color: TEXT }}>{t.label}</span>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem',
                        color: MUTED, fontWeight: 500,
                      }}>{t.count}</span>
                    </li>
                  ))}
                </ul>
                <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: MUTED, lineHeight: 1.6 }}>
                  Le gros de la base est en micro-influence — c'est souvent là que ça convertit
                  le mieux : une audience plus petite, mais composée de vrais pairs.
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
              L'influence santé, c'est comme le s*xe au lycée : tout le monde en parle, personne n'en fait.
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
              les mises à jour. Pas de spam, pas de revente.
            </p>
            <div style={{ maxWidth: '480px', margin: '0 auto' }}>
              <InfluenceursSanteForm variant="modal" theme="dark" source="page-bottom" />
            </div>

            <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', margin: '0 0 1rem' }}>
                Vous voulez lancer une campagne d'influence santé et ne savez pas par où commencer ?
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
        .is-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: clamp(2rem, 4vw, 4.5rem);
          align-items: center;
        }
        @media (max-width: 880px) {
          .is-grid { grid-template-columns: 1fr; gap: 2.5rem; }
          .is-grid > div:last-child { order: -1; }
        }
      `}</style>
    </>
  )
}
