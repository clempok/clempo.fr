import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { X } from 'lucide-react'

/**
 * Sticky discreet promo that follows the visitor on the home page (desktop only).
 *
 * - Bottom-right card, ~280px wide
 * - Slides in after a short delay
 * - Hidden when the #journalistes section is in view (no point promoting what's on screen)
 * - Hidden if the visitor already converted (CID cookie present)
 * - Dismissible — sticks for 14 days
 * - Click → smooth-scrolls to #journalistes and focuses the first input
 */

const SHOW_DELAY_MS = 5_000
const DESKTOP_MIN_WIDTH = 1024
const DISMISSED_KEY = 'clempo_jo_sticky_dismissed_at'
const DISMISS_COOLDOWN_DAYS = 14

function hasCidCookie(): boolean {
  return typeof document !== 'undefined' && /(?:^|;\s*)clempo_cid=/.test(document.cookie)
}

function daysSince(iso: string): number {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return Infinity
  return (Date.now() - t) / 86_400_000
}

export default function JournalistesStickyPromo() {
  const location = useLocation()
  const [visible, setVisible] = useState(false)
  const [inSection, setInSection] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Only show on home
  const enabled = location.pathname === '/'

  useEffect(() => {
    if (!enabled) { setVisible(false); return }
    if (typeof window === 'undefined') return
    if (window.innerWidth < DESKTOP_MIN_WIDTH) return
    if (hasCidCookie()) return

    try {
      const dismissedAt = localStorage.getItem(DISMISSED_KEY)
      if (dismissedAt && daysSince(dismissedAt) < DISMISS_COOLDOWN_DAYS) return
    } catch { /* ignore */ }

    const t = setTimeout(() => setVisible(true), SHOW_DELAY_MS)

    // Observe the #journalistes section so we can hide when it's in view
    const observe = () => {
      const target = document.getElementById('journalistes')
      if (!target) return
      observerRef.current?.disconnect()
      observerRef.current = new IntersectionObserver(
        ([entry]) => setInSection(entry.isIntersecting),
        { rootMargin: '-20% 0px -20% 0px' },
      )
      observerRef.current.observe(target)
    }
    // Section may not be in DOM yet — retry once after render
    observe()
    const retry = setTimeout(observe, 1200)

    return () => {
      clearTimeout(t)
      clearTimeout(retry)
      observerRef.current?.disconnect()
    }
  }, [enabled])

  function dismiss(e: React.MouseEvent) {
    e.stopPropagation()
    try { localStorage.setItem(DISMISSED_KEY, new Date().toISOString()) } catch { /* ignore */ }
    setVisible(false)
  }

  function jumpToForm() {
    const el = document.getElementById('journalistes')
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setTimeout(() => {
      const firstInput = el.querySelector('input[name="first-name"]') as HTMLInputElement | null
      firstInput?.focus()
    }, 600)
  }

  if (!enabled || !visible) return null
  const shown = visible && !inSection

  return (
    <div
      role="complementary"
      aria-label="Liste journalistes santé"
      style={{
        position: 'fixed',
        right: '24px',
        bottom: '24px',
        zIndex: 900,
        width: '300px',
        background: 'var(--ink)',
        color: 'var(--paper)',
        borderRadius: 'var(--cb-radius)',
        boxShadow: '0 18px 40px rgba(0,0,0,0.28), 0 4px 12px rgba(0,0,0,0.12)',
        border: '1px solid rgba(255,255,255,0.08)',
        padding: '1rem 1.1rem 1.1rem',
        cursor: 'pointer',
        transform: shown ? 'translateY(0)' : 'translateY(120%)',
        opacity: shown ? 1 : 0,
        transition: 'transform 0.45s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease',
        pointerEvents: shown ? 'auto' : 'none',
        fontFamily: 'var(--font-sans)',
      }}
      onClick={jumpToForm}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
    >
      <button
        onClick={dismiss}
        aria-label="Masquer"
        style={{
          position: 'absolute',
          top: '8px', right: '8px',
          width: '24px', height: '24px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.7)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)' }}
      >
        <X size={13} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.55rem' }}>
        <span style={{
          width: '24px', height: '24px',
          background: 'var(--signal)',
          borderRadius: '5px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px',
        }}>📋</span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.62rem', fontWeight: 600,
          letterSpacing: '0.15em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.62)',
        }}>
          Ressource gratuite
        </span>
      </div>

      <p style={{
        fontFamily: 'var(--font-serif)',
        fontSize: '1.05rem',
        fontWeight: 400,
        color: 'var(--paper)',
        lineHeight: 1.25,
        margin: '0 0 0.4rem',
        letterSpacing: '-0.01em',
        paddingRight: '24px',
      }}>
        295 journalistes santé
      </p>
      <p style={{
        fontSize: '0.78rem',
        color: 'rgba(255,255,255,0.65)',
        margin: '0 0 0.85rem',
        lineHeight: 1.45,
      }}>
        Liste qualifiée FR + US, beats détaillés. Récupérez-la gratuitement.
      </p>

      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.7rem',
        fontWeight: 600,
        color: 'var(--signal)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}>
        Récupérer la liste <span style={{ fontSize: '0.9em' }}>→</span>
      </div>
    </div>
  )
}
