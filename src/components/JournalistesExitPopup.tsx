import { useEffect, useState, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { X } from 'lucide-react'
import JournalistesForm from './JournalistesForm'

/**
 * Exit-intent popup that promotes the journalistes resource.
 * - Triggers on mouse leaving viewport from the top (desktop) OR
 *   on a fast scroll-up after >25% page depth (mobile fallback)
 * - Only shows once per visitor (localStorage flag)
 * - Suppressed if visitor already has the CID cookie (already converted)
 * - Suppressed on admin / booking / quote / confirmation routes
 */

const SHOWN_KEY = 'clempo_jo_popup_shown'
const DISMISSED_KEY = 'clempo_jo_popup_dismissed_at'
const COOLDOWN_DAYS = 30
const ARM_DELAY_MS = 8_000 // wait this long before arming the trigger

const EXCLUDED_PREFIXES = ['/booking', '/admin', '/confirmation', '/devis']

function hasCidCookie(): boolean {
  return typeof document !== 'undefined' && /(?:^|;\s*)clempo_cid=/.test(document.cookie)
}

function daysSince(iso: string): number {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return Infinity
  return (Date.now() - t) / 86_400_000
}

export default function JournalistesExitPopup() {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const armed = useRef(false)
  const lastScrollY = useRef(0)

  const excluded = EXCLUDED_PREFIXES.some(p => location.pathname.startsWith(p))

  useEffect(() => {
    if (excluded) return
    if (typeof window === 'undefined') return

    // Already converted (has CID cookie)? Don't pester.
    if (hasCidCookie()) return

    try {
      const shown = localStorage.getItem(SHOWN_KEY)
      if (shown === '1') return
      const dismissedAt = localStorage.getItem(DISMISSED_KEY)
      if (dismissedAt && daysSince(dismissedAt) < COOLDOWN_DAYS) return
    } catch { /* ignore */ }

    let armTimer: ReturnType<typeof setTimeout> | null = null

    armTimer = setTimeout(() => { armed.current = true }, ARM_DELAY_MS)

    function trigger() {
      if (!armed.current || open) return
      // Re-check at trigger time — visitor may have converted while popup was armed
      if (hasCidCookie()) return
      setOpen(true)
      try { localStorage.setItem(SHOWN_KEY, '1') } catch { /* ignore */ }
    }

    function onMouseOut(e: MouseEvent) {
      // Mouse leaves through the top of the viewport
      if (!e.relatedTarget && e.clientY <= 0) trigger()
    }

    function onScroll() {
      const y = window.scrollY
      const dy = y - lastScrollY.current
      lastScrollY.current = y
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const depth = docHeight > 0 ? y / docHeight : 0
      // Fast upward scroll after 25% depth = likely-to-leave on mobile
      if (depth > 0.25 && dy < -40) trigger()
    }

    document.addEventListener('mouseout', onMouseOut)
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      if (armTimer) clearTimeout(armTimer)
      document.removeEventListener('mouseout', onMouseOut)
      window.removeEventListener('scroll', onScroll)
    }
  }, [excluded, location.pathname, open])

  useEffect(() => {
    if (!open) return
    closeBtnRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function dismiss() {
    try { localStorage.setItem(DISMISSED_KEY, new Date().toISOString()) } catch { /* ignore */ }
    setOpen(false)
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="jop-title"
      onClick={dismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 1100,
        background: 'rgba(10,10,10,0.55)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        animation: 'jop-fade 0.3s ease',
      }}
    >
      <style>{`
        @keyframes jop-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes jop-rise { from { opacity: 0; transform: translateY(16px) scale(0.98) } to { opacity: 1; transform: none } }
      `}</style>

      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%', maxWidth: '520px',
          background: 'var(--paper)',
          border: '1px solid var(--ink)',
          borderRadius: 'var(--cb-radius)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          animation: 'jop-rise 0.4s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <button
          ref={closeBtnRef}
          onClick={dismiss}
          aria-label="Fermer"
          style={{
            position: 'absolute', top: '0.9rem', right: '0.9rem',
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'rgba(0,0,0,0.04)', color: 'var(--ink)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2,
          }}
        >
          <X size={18} />
        </button>

        <div style={{ padding: '2.25rem 2rem 1.75rem' }}>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase',
            color: 'var(--signal-deep, #166534)', fontWeight: 600, margin: '0 0 0.75rem',
          }}>
            🎁 Avant de partir…
          </p>
          <h2 id="jop-title" style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.4rem, 3vw, 1.7rem)',
            fontWeight: 400, letterSpacing: '-0.01em', color: 'var(--ink)',
            lineHeight: 1.2, margin: '0 0 0.75rem',
          }}>
            Récupérez ma liste de 295 journalistes santé
          </h2>
          <p style={{
            fontSize: '0.92rem', lineHeight: 1.55, color: 'var(--steel)',
            margin: '0 0 1.5rem',
          }}>
            Presse géné, médias santé, pro, podcasts. Avec les beats de chaque journaliste.
          </p>

          <JournalistesForm variant="modal" source="exit-popup" />
        </div>
      </div>
    </div>
  )
}
