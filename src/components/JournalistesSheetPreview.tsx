/**
 * Decorative mockup of a Google Sheet preview to entice download.
 * Uses fake-but-plausible data — actual contacts are in the linked GSheet.
 */

const ROWS: { name: string; media: string; beat: string; country: 'FR' | 'US' }[] = [
  { name: 'A. Martin',     media: 'Le Figaro Santé',     beat: 'Politique de santé',  country: 'FR' },
  { name: 'M. Dubois',     media: 'France Inter',        beat: 'Médecine',            country: 'FR' },
  { name: 'S. Rousseau',   media: 'Sciences et Avenir',  beat: 'Recherche',           country: 'FR' },
  { name: 'P. Lefèvre',    media: 'Doctissimo',          beat: 'Innovations',         country: 'FR' },
  { name: 'C. Bernard',    media: 'Les Échos',           beat: 'Healthtech',          country: 'FR' },
  { name: 'J. Smith',      media: 'STAT News',           beat: 'Biotech',             country: 'US' },
  { name: 'E. Chen',       media: 'Axios Health',        beat: 'Digital health',      country: 'US' },
  { name: 'R. Brown',      media: 'TechCrunch',          beat: 'Health startups',     country: 'US' },
  { name: 'L. Davis',      media: 'Fierce Healthcare',   beat: 'Pharma',              country: 'US' },
  { name: 'T. Wilson',     media: 'MedCity News',        beat: 'Medtech',             country: 'US' },
]

export default function JournalistesSheetPreview() {
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
        maxWidth: '520px',
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
        {/* Sheets icon (CSS-rendered) */}
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
            295 journalistes santé · FR + US
          </span>
          <span style={{ fontSize: '0.65rem', color: '#5f6368' }}>
            Google Sheets · partagé
          </span>
        </div>
        {/* Window dots */}
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
          gridTemplateColumns: '40px 1.1fr 1.3fr 1.2fr 0.5fr',
          background: '#f1f3f4',
          borderBottom: '1px solid #ddd',
          fontSize: '0.7rem',
          fontWeight: 500,
          color: '#5f6368',
        }}>
          {['', 'NOM', 'MÉDIA', 'BEAT', 'PAYS'].map((h, i) => (
            <div key={i} style={{
              padding: '0.5rem 0.6rem',
              borderRight: i < 4 ? '1px solid #ddd' : 'none',
              textAlign: i === 0 ? 'center' : 'left',
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
              gridTemplateColumns: '40px 1.1fr 1.3fr 1.2fr 0.5fr',
              borderBottom: '1px solid #eee',
              fontSize: '0.78rem',
              color: '#202124',
              opacity: i >= 7 ? 1 - (i - 6) * 0.28 : 1,
            }}
          >
            <div style={{
              padding: '0.5rem 0.6rem',
              background: '#f8f9fa',
              borderRight: '1px solid #eee',
              color: '#5f6368',
              fontSize: '0.7rem',
              textAlign: 'center',
              fontFamily: '"Roboto Mono", ui-monospace, monospace',
            }}>{i + 2}</div>
            <div style={{ padding: '0.5rem 0.6rem', borderRight: '1px solid #eee' }}>{row.name}</div>
            <div style={{ padding: '0.5rem 0.6rem', borderRight: '1px solid #eee', color: '#1a73e8' }}>{row.media}</div>
            <div style={{ padding: '0.5rem 0.6rem', borderRight: '1px solid #eee', color: '#5f6368' }}>{row.beat}</div>
            <div style={{
              padding: '0.5rem 0.6rem',
              fontWeight: 500,
              color: row.country === 'FR' ? '#1a73e8' : '#d93025',
              fontSize: '0.72rem',
            }}>{row.country}</div>
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
          Journalistes
        </span>
        <span>+ FR · + US · + Beats</span>
      </div>
    </div>
  )
}
