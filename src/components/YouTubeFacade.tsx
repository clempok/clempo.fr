import { useState } from 'react'

interface YouTubeFacadeProps {
  videoId: string
  title: string
  playLabel?: string
}

/**
 * Lazy YouTube embed: shows the thumbnail only until clicked, then loads the
 * iframe (youtube-nocookie). Avoids ~540 KB of YT player JS on first paint.
 */
export default function YouTubeFacade({ videoId, title, playLabel = 'Play video' }: YouTubeFacadeProps) {
  const [played, setPlayed] = useState(false)

  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    aspectRatio: '16 / 9',
    borderRadius: 'var(--cb-radius)',
    overflow: 'hidden',
    border: '1px solid rgba(10,10,11,0.08)',
    background: 'var(--ink)',
  }

  if (played) {
    return (
      <div style={wrapperStyle}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setPlayed(true)}
      aria-label={`${playLabel}: ${title}`}
      style={{
        ...wrapperStyle,
        padding: 0,
        cursor: 'pointer',
        backgroundImage: `url(https://img.youtube.com/vi/${videoId}/maxresdefault.jpg)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'block',
      }}
    >
      <span
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.35) 100%)',
        }}
        aria-hidden="true"
      />
      <span
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
        }}
        aria-hidden="true"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="var(--ink)">
          <path d="M8 5v14l11-7L8 5z" />
        </svg>
      </span>
    </button>
  )
}
