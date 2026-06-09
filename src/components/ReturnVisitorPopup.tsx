import { useEffect, useState, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { X } from 'lucide-react'
import { useLang } from '../contexts/LangContext'
import { bookingUrl } from '../lib/cta'

/**
 * ReturnVisitorPopup
 *
 * Detects returning visitors client-side (localStorage, no cookies) and
 * shows a friendly "let's talk" modal on the 3rd distinct-day visit within
 * 14 days. LinkedIn variant triggers at 2 visits within 7 days with different
 * copy.
 *
 * Excluded routes: booking/admin/confirmation/devis/transition-cmo (those
 * already have strong primary CTAs).
 *
 * Dismissal is sticky for 7 days.
 */

const TEXT = 'var(--ink)'
const MUTED = 'var(--steel)'
const BORDER = 'rgba(10,10,11,0.15)'

const PHOTO_URL =
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6913248fb7d48a3e5503c26d/48d8d0835_nano-banana-2025-11-11T10-55-151.png'

const VISITS_KEY = 'clempo_visits'
const DISMISSED_KEY = 'clempo_popup_dismissed_at'
const SHOWN_KEY = 'clempo_popup_shown_at'

const EXCLUDED_PREFIXES = ['/booking', '/admin', '/confirmation', '/devis', '/transition-cmo']

const TRIGGER_DEFAULT = { minDistinctDays: 3, windowDays: 14 }
const TRIGGER_LINKEDIN = { minDistinctDays: 2, windowDays: 7 }
const DISMISS_COOLDOWN_DAYS = 7
const SHOW_DELAY_MS = 10_000

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysBetween(a: string, b: string): number {
  const ta = Date.parse(a)
  const tb = Date.parse(b)
  if (Number.isNaN(ta) || Number.isNaN(tb)) return Infinity
  return Math.abs(tb - ta) / 86_400_000
}

function recordVisit(today: string): string[] {
  try {
    const raw = localStorage.getItem(VISITS_KEY)
    const arr: string[] = raw ? JSON.parse(raw) : []
    const dedup = new Set(arr)
    dedup.add(today)
    // Keep last 60 days max to avoid unbounded growth
    const trimmed = Array.from(dedup)
      .filter(d => daysBetween(d, today) <= 60)
      .sort()
    localStorage.setItem(VISITS_KEY, JSON.stringify(trimmed))
    return trimmed
  } catch {
    return [today]
  }
}

function countDistinctDaysInWindow(visits: string[], windowDays: number, today: string): number {
  return visits.filter(d => daysBetween(d, today) <= windowDays).length
}

function cameFromLinkedIn(): boolean {
  try {
    const ref = document.referrer || ''
    return /(^|\.)linkedin\.com$/i.test(new URL(ref).hostname)
  } catch {
    return false
  }
}

export default function ReturnVisitorPopup() {
  const { lang } = useLang()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [variant, setVariant] = useState<'default' | 'linkedin'>('default')
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  const isFr = lang === 'fr'
  const excluded = EXCLUDED_PREFIXES.some(p => location.pathname.startsWith(p))

  useEffect(() => {
    if (excluded) return
    if (typeof window === 'undefined') return

    const today = todayISO()
    const visits = recordVisit(today)

    // Suppression windows
    const dismissedAt = localStorage.getItem(DISMISSED_KEY)
    if (dismissedAt && daysBetween(dismissedAt, today) < DISMISS_COOLDOWN_DAYS) return
    const shownAt = localStorage.getItem(SHOWN_KEY)
    if (shownAt === today) return // at most once per day

    // Pick variant: LinkedIn referrer gets the lower threshold
    const fromLi = cameFromLinkedIn()
    const trigger = fromLi ? TRIGGER_LINKEDIN : TRIGGER_DEFAULT
    const distinctDays = countDistinctDaysInWindow(visits, trigger.windowDays, today)

    if (distinctDays < trigger.minDistinctDays) return

    setVariant(fromLi ? 'linkedin' : 'default')
    const t = setTimeout(() => {
      setOpen(true)
      localStorage.setItem(SHOWN_KEY, today)
    }, SHOW_DELAY_MS)

    return () => clearTimeout(t)
  }, [excluded, location.pathname])

  useEffect(() => {
    if (!open) return
    closeBtnRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss()
    }
    document.addEventListener('keydown', onKey)
    // Prevent body scroll while open
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function dismiss() {
    try {
      localStorage.setItem(DISMISSED_KEY, todayISO())
    } catch {
      /* ignore */
    }
    setOpen(false)
  }

  if (!open) return null

  const src = variant === 'linkedin' ? 'return-visitor-linkedin' : 'return-visitor-popup'

  const copy = {
    fr: {
      default: {
        eyebrow: 'Vous hésitez ?',
        title: 'Et si on parlait directement de votre projet ?',
        sub: '30 minutes pour comprendre votre contexte et voir si je peux vraiment vous aider.',
        cta: 'Bloquer un créneau',
        dismiss: 'Pas maintenant',
      },
      linkedin: {
        eyebrow: 'Vu sur LinkedIn',
        title: 'On a sûrement des connexions en commun. Prenons 30 min ?',
        sub: "Directement, sans passer par un formulaire. Je vous pose 3 questions, vous me posez les vôtres, on voit si c'est un fit.",
        cta: 'Bloquer un créneau',
        dismiss: 'Une autre fois',
      },
    },
    en: {
      default: {
        eyebrow: '3rd time you stop by',
        title: 'Want to talk about your project directly?',
        sub: "30 minutes to understand your context and see if I can actually help. No commitment, no slide deck.",
        cta: 'Book a slot',
        dismiss: 'Not now',
      },
      linkedin: {
        eyebrow: 'Seen on LinkedIn',
        title: "We probably share connections. 30 minutes?",
        sub: "Directly, no form. I ask you 3 questions, you ask me yours, we see if it's a fit.",
        cta: 'Book a slot',
        dismiss: 'Another time',
      },
    },
  }
  const c = copy[isFr ? 'fr' : 'en'][variant]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rvp-title"
      onClick={dismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 1100,
        background: 'rgba(10,10,10,0.55)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        animation: 'rvp-fade 0.3s ease',
      }}
    >
      <style>{`
        @keyframes rvp-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes rvp-rise { from { opacity: 0; transform: translateY(16px) scale(0.98) } to { opacity: 1; transform: none } }
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
          animation: 'rvp-rise 0.4s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <button
          ref={closeBtnRef}
          onClick={dismiss}
          aria-label={isFr ? 'Fermer' : 'Close'}
          style={{
            position: 'absolute', top: '0.9rem', right: '0.9rem',
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'rgba(0,0,0,0.04)', color: TEXT,
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2,
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.08)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.04)')}
        >
          <X size={18} />
        </button>

        <div style={{ padding: '2.5rem 2rem 2rem', textAlign: 'center' }}>
          <img
            src={PHOTO_URL}
            alt="Clément Pouget-Osmont"
            loading="lazy"
            style={{
              width: '96px', height: '96px', borderRadius: 'var(--cb-radius)',
              objectFit: 'cover', margin: '0 auto 1.25rem',
              border: `2px solid ${BORDER}`,
              filter: 'grayscale(1) contrast(1.05)',
              background: 'var(--ink)',
            }}
          />
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase',
            color: 'var(--signal-deep)', fontWeight: 500, marginBottom: '0.9rem',
          }}>
            // {c.eyebrow}
          </p>
          <h2 id="rvp-title" style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(1.3rem, 3vw, 1.55rem)',
            fontWeight: 700, letterSpacing: '-0.025em', color: TEXT,
            lineHeight: 1.25, marginBottom: '0.9rem',
          }}>
            {c.title}
          </h2>
          <p style={{
            fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--graphite)', fontWeight: 400,
            marginBottom: '1.75rem',
          }}>
            {c.sub}
          </p>

          <a
            href={bookingUrl(src)}
            onClick={() => { try { localStorage.setItem(DISMISSED_KEY, todayISO()) } catch { /* ignore */ } }}
            className="cb-btn cb-btn--primary"
            style={{ fontSize: '0.9rem', padding: '0.9rem 1.6rem' }}
          >
            {c.cta} <span className="cb-arrow">→</span>
          </a>

          <div style={{ marginTop: '1rem' }}>
            <button
              onClick={dismiss}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: MUTED, fontSize: '0.85rem', fontWeight: 400,
                textDecoration: 'underline', textUnderlineOffset: '3px',
                padding: '0.5rem',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = TEXT)}
              onMouseLeave={e => (e.currentTarget.style.color = MUTED)}
            >
              {c.dismiss}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
