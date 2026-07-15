/**
 * Decorative mockup of the Google Sheet preview to entice download.
 * Unlike the décideurs preview (fake names — hospital directors are personal
 * data), these are public creator accounts taken from the actual base: showing
 * the best-known ones is a credibility signal, and it gives away ~1% of 845.
 */

type Job = 'Médecin' | 'Kinésithérapeute' | 'Ostéopathe D.O.' | 'Diététicien' | 'Dentiste'
type Row = { name: string; handle: string; followers: string; job: Job }

/** Top de l'onglet Instagram, trié par audience — comme dans le fichier.
 *  L'onglet actif du footer étant « Instagram », les lignes ne mélangent pas
 *  les deux plateformes. */
const ROWS: Row[] = [
  { name: 'Dr Jimmy Mohamed',     handle: '@dr.jimmy.mohamed',    followers: '2 000 000', job: 'Médecin' },
  { name: 'Dr Olivier Marpeau',   handle: '@mon.gyneco',          followers: '1 200 000', job: 'Médecin' },
  { name: 'Major Mouvement',      handle: '@majormouvement',      followers: '1 100 000', job: 'Kinésithérapeute' },
  { name: 'Marine Lorphelin',     handle: '@marinelorphelin_off', followers: '1 100 000', job: 'Médecin' },
  { name: 'David Yaiche',         handle: '@yaicheosteo',         followers: '660 000',   job: 'Ostéopathe D.O.' },
  { name: 'Ysaline Benakli',      handle: '@ysalinediet',         followers: '624 000',   job: 'Diététicien' },
  { name: 'Dr Never',             handle: '@dr.never',            followers: '617 100',   job: 'Dentiste' },
  { name: 'Dr Baptiste Beaulieu', handle: '@baptistebeaulieu',    followers: '541 000',   job: 'Médecin' },
  { name: 'Carla Valette',        handle: '@carlavalette',        followers: '509 000',   job: 'Médecin' },
  { name: 'Dr Michel Cymes',      handle: '@drmichelcymes',       followers: '488 000',   job: 'Médecin' },
]

/** Une couleur par métier — même parti pris que l'aperçu décideurs, où la
 *  dernière colonne est colorée par catégorie. */
const JOB_COLOR: Record<Job, string> = {
  'Médecin': '#1a73e8',
  'Kinésithérapeute': '#188038',
  'Ostéopathe D.O.': '#9334e6',
  'Diététicien': '#e37400',
  'Dentiste': '#d93025',
}

export default function InfluenceursSanteSheetPreview() {
  return (
    <div
      aria-hidden
      style={{
        background: '#fff',
        borderRadius: '10px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.15)',
        overflow: 'hidden',
        border: '1px solid rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '560px',
        fontFamily: '"Roboto", "Inter", system-ui, sans-serif',
        transform: 'rotate(-1.2deg)',
        transition: 'transform 0.3s ease',
      }}
    >
      {/* Sheets-style top toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.55rem 0.85rem',
        background: '#f8f9fa',
        borderBottom: '1px solid #e0e0e0',
      }}>
        <div style={{
          width: '20px',
          height: '20px',
          background: '#0f9d58',
          borderRadius: '3px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '11px',
          fontWeight: 700,
          flexShrink: 0,
        }}>
          ▦
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
          <span style={{
            fontSize: '0.78rem',
            fontWeight: 500,
            color: '#202124',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            845 influenceurs santé · Instagram &amp; TikTok
          </span>
          <span style={{ fontSize: '0.65rem', color: '#5f6368' }}>
            Google Sheets · partagé
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f57' }} />
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e' }} />
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#28ca42' }} />
        </div>
      </div>

      {/* Spreadsheet body */}
      <div style={{ position: 'relative', background: '#fff' }}>
        {/* Header row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '34px 1.1fr 1.15fr 0.75fr 0.85fr',
          background: '#f1f3f4',
          borderBottom: '1px solid #ddd',
          fontSize: '0.68rem',
          fontWeight: 500,
          color: '#5f6368',
        }}>
          {['', 'NOM', 'PSEUDO', 'ABONNÉS', 'MÉTIER'].map((h, i) => (
            <div key={i} style={{
              padding: '0.5rem 0.55rem',
              borderRight: i < 4 ? '1px solid #ddd' : 'none',
              textAlign: i === 0 ? 'center' : i === 3 ? 'right' : 'left',
              fontFamily: '"Roboto Mono", ui-monospace, monospace',
              letterSpacing: '0.04em',
            }}>{h}</div>
          ))}
        </div>

        {/* Data rows */}
        {ROWS.map((row, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '34px 1.1fr 1.15fr 0.75fr 0.85fr',
              borderBottom: '1px solid #eee',
              fontSize: '0.76rem',
              color: '#202124',
              opacity: i >= 7 ? 1 - (i - 6) * 0.28 : 1,
            }}
          >
            <div style={{
              padding: '0.5rem 0.55rem',
              background: '#f8f9fa',
              borderRight: '1px solid #eee',
              color: '#5f6368',
              fontSize: '0.68rem',
              textAlign: 'center',
              fontFamily: '"Roboto Mono", ui-monospace, monospace',
            }}>{i + 2}</div>
            <div style={{
              padding: '0.5rem 0.55rem',
              borderRight: '1px solid #eee',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>{row.name}</div>
            <div style={{
              padding: '0.5rem 0.55rem',
              borderRight: '1px solid #eee',
              color: '#1a73e8',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>{row.handle}</div>
            <div style={{
              padding: '0.5rem 0.55rem',
              borderRight: '1px solid #eee',
              textAlign: 'right',
              fontFamily: '"Roboto Mono", ui-monospace, monospace',
              fontSize: '0.72rem',
              color: '#202124',
            }}>{row.followers}</div>
            <div style={{
              padding: '0.5rem 0.55rem',
              fontWeight: 500,
              color: JOB_COLOR[row.job],
              fontSize: '0.7rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>{row.job}</div>
          </div>
        ))}

        {/* Fade-out gradient at the bottom suggesting more rows */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0, height: '60px',
          background: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,1))',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Sheet tab footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.4rem 0.6rem',
        background: '#f8f9fa',
        borderTop: '1px solid #e0e0e0',
        fontSize: '0.7rem',
        color: '#5f6368',
      }}>
        {['Instagram', 'TikTok'].map((label, i) => (
          <span key={label} style={{
            padding: '0.25rem 0.6rem',
            background: i === 0 ? '#fff' : 'transparent',
            border: i === 0 ? '1px solid #ddd' : '1px solid transparent',
            borderRadius: '4px 4px 0 0',
            color: i === 0 ? '#202124' : '#5f6368',
            fontWeight: 500,
          }}>
            {label}
          </span>
        ))}
        <span style={{ marginLeft: '0.2rem' }}>+ Spécialité · + Lien profil</span>
      </div>
    </div>
  )
}
