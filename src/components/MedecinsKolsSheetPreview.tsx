/**
 * Decorative mockup of a Google Sheet preview to entice download.
 * Uses fake-but-plausible data — actual practitioners are in the linked GSheet.
 */

type Row = {
  name: string
  spec: string
  org: string
  role: string
  src: 'CHU' | 'Société savante' | 'CHU + SS'
}

const ROWS: Row[] = [
  { name: 'Pr V. Alliot',    spec: 'Cardiologie',        org: 'CHU Bordeaux',                  role: 'PU-PH · Chef de service', src: 'CHU'             },
  { name: 'Pr M. Rondeau',   spec: 'Oncologie',          org: 'Société Française du Cancer',   role: 'Président',               src: 'Société savante' },
  { name: 'Pr C. Delaunay',  spec: 'Hématologie',        org: 'AP-HP Saint-Louis',             role: 'PU-PH',                   src: 'CHU'             },
  { name: 'Dr A. Fournier',  spec: 'Biologie médicale',  org: 'CHU Nantes',                    role: 'MCU-PH',                  src: 'CHU'             },
  { name: 'Pr S. Marchetti', spec: 'Anesthésie-réa',     org: 'HCL Édouard Herriot',           role: 'Chef de service (Pr)',    src: 'CHU + SS'        },
  { name: 'Pr J. Bricourt',  spec: 'Gynéco-obstétrique', org: 'CNGOF',                         role: 'Secrétaire Général',      src: 'Société savante' },
  { name: 'Pr N. Estève',    spec: 'Neurologie',         org: 'CHU Montpellier',               role: 'PU-PH · Chef de pôle',    src: 'CHU'             },
  { name: 'Dr L. Vasseur',   spec: 'Orthodontie (ODF)',  org: 'SFODF',                         role: 'Trésorière',              src: 'Société savante' },
  { name: 'Pr P. Kerbrat',   spec: 'Pédiatrie',          org: 'CHU Toulouse',                  role: 'PU-PH',                   src: 'CHU'             },
  { name: 'Pr H. Zaoui',     spec: 'Radiologie',         org: 'Société Française de Radiologie', role: 'Membre CA',             src: 'CHU + SS'        },
]

const SRC_COLOR: Record<Row['src'], string> = {
  'CHU': '#1a73e8',
  'Société savante': '#9334e6',
  'CHU + SS': '#188038',
}

export default function MedecinsKolsSheetPreview() {
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
            4 035 médecins KOL · France
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
          gridTemplateColumns: '34px 1fr 0.95fr 1.25fr 1.05fr',
          background: '#f1f3f4',
          borderBottom: '1px solid #ddd',
          fontSize: '0.68rem',
          fontWeight: 500,
          color: '#5f6368',
        }}>
          {['', 'NOM', 'SPÉCIALITÉ', 'ÉTAB. / SOCIÉTÉ', 'FONCTION'].map((h, i) => (
            <div key={i} style={{
              padding: '0.5rem 0.55rem',
              borderRight: i < 4 ? '1px solid #ddd' : 'none',
              textAlign: i === 0 ? 'center' : 'left',
              fontFamily: '"Roboto Mono", ui-monospace, monospace',
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}>{h}</div>
          ))}
        </div>

        {/* Data rows */}
        {ROWS.map((row, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '34px 1fr 0.95fr 1.25fr 1.05fr',
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
            <div style={{ padding: '0.5rem 0.55rem', borderRight: '1px solid #eee', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.name}</div>
            <div style={{ padding: '0.5rem 0.55rem', borderRight: '1px solid #eee', color: '#5f6368', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.spec}</div>
            <div style={{ padding: '0.5rem 0.55rem', borderRight: '1px solid #eee', color: SRC_COLOR[row.src], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.org}</div>
            <div style={{
              padding: '0.5rem 0.55rem',
              color: '#202124',
              fontSize: '0.72rem',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{row.role}</div>
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
        gap: '0.5rem',
        padding: '0.4rem 0.6rem',
        background: '#f8f9fa',
        borderTop: '1px solid #e0e0e0',
        fontSize: '0.7rem',
        color: '#5f6368',
      }}>
        <span style={{
          padding: '0.25rem 0.6rem',
          background: '#fff',
          border: '1px solid #ddd',
          borderRadius: '4px 4px 0 0',
          color: '#202124',
          fontWeight: 500,
        }}>
          Praticiens
        </span>
        <span>+ Ville · + Département · + LinkedIn · + Source</span>
      </div>
    </div>
  )
}
