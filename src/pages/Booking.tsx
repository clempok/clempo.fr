import { useState, useMemo, useEffect } from 'react'
import { useLang } from '../contexts/LangContext'
import { Calendar, Clock, ChevronLeft, ChevronRight, Check, User, Mail, MessageSquare, ArrowLeft } from 'lucide-react'

const ACCENT = '#1A1A6B'
const ACCENT_HOVER = '#2D2D8A'
const BORDER = 'rgba(0,0,0,0.06)'
const MUTED = '#71717A'
const TEXT = '#0A0A0A'
const BG_OFF = '#F8F8F6'
const SLOT_DURATION = 30 // minutes

type Step = 'select' | 'form' | 'confirmed'

interface Slot {
  date: Date
  hour: number
  minute: number
}

// Availability rules (hours in Europe/Paris time)
const AVAILABILITY: Record<number, [number, number][]> = {
  1: [[18, 22]], // Monday 18-22
  3: [[11, 15]], // Wednesday 11-15
  4: [[11, 15]], // Thursday 11-15
  5: [[11, 13]], // Friday 11-13
}

const DAY_NAMES_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const DAY_NAMES_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
const MONTH_NAMES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const FULL_DAY_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const FULL_DAY_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

interface BusyInterval {
  start: Date
  end: Date
}

function getSlotsForDay(date: Date, busy: BusyInterval[] = []): Slot[] {
  const dow = date.getDay()
  const ranges = AVAILABILITY[dow]
  if (!ranges) return []

  const now = new Date()
  const slots: Slot[] = []
  for (const [startH, endH] of ranges) {
    for (let h = startH; h < endH; h++) {
      for (const m of [0, 30]) {
        if (h === endH - 1 && m === 30 && SLOT_DURATION === 30) continue
        const slotStart = new Date(date)
        slotStart.setHours(h, m, 0, 0)
        // Don't show past slots
        if (slotStart <= now) continue

        const slotEnd = new Date(slotStart.getTime() + SLOT_DURATION * 60 * 1000)

        // Skip if overlaps with any busy interval
        const isBusy = busy.some(b => slotStart < b.end && slotEnd > b.start)
        if (isBusy) continue

        slots.push({ date: new Date(date), hour: h, minute: m })
      }
    }
  }
  return slots
}

function formatTime(h: number, m: number): string {
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

export default function Booking() {
  const { lang } = useLang()
  const isFr = lang === 'fr'

  const dayNames = isFr ? DAY_NAMES_FR : DAY_NAMES_EN
  const monthNames = isFr ? MONTH_NAMES_FR : MONTH_NAMES_EN
  const fullDayNames = isFr ? FULL_DAY_FR : FULL_DAY_EN

  const t = {
    badge: isFr ? 'Réservation' : 'Booking',
    title: isFr ? 'Réservez un créneau' : 'Book a slot',
    subtitle: isFr ? '30 minutes pour discuter de votre projet' : '30 minutes to discuss your project',
    selectDay: isFr ? 'Choisissez un jour' : 'Choose a day',
    selectTime: isFr ? 'Choisissez un horaire' : 'Choose a time',
    noSlots: isFr ? 'Aucun créneau disponible cette semaine' : 'No available slots this week',
    next: isFr ? 'Suivant' : 'Next',
    prev: isFr ? 'Précédent' : 'Previous',
    yourInfo: isFr ? 'Vos coordonnées' : 'Your details',
    firstName: isFr ? 'Prénom' : 'First name',
    lastName: isFr ? 'Nom' : 'Last name',
    email: 'Email',
    message: isFr ? 'Message (optionnel)' : 'Message (optional)',
    confirm: isFr ? 'Confirmer la réservation' : 'Confirm booking',
    confirming: isFr ? 'Confirmation en cours...' : 'Confirming...',
    confirmedTitle: isFr ? 'Rendez-vous confirmé !' : 'Meeting confirmed!',
    confirmedSub: isFr
      ? 'Vous allez recevoir une invitation par email.'
      : 'You will receive a calendar invitation by email.',
    back: isFr ? 'Retour' : 'Back',
    duration: '30 min',
    timezone: 'Europe/Paris (CET)',
    bookAnother: isFr ? 'Réserver un autre créneau' : 'Book another slot',
  }

  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [step, setStep] = useState<Step>('select')
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', message: '' })
  const [busy, setBusy] = useState<BusyInterval[]>([])
  const submitting = false

  // Fetch busy slots from Google Calendar (refetch on week change + focus)
  useEffect(() => {
    let cancelled = false
    const load = () => {
      fetch('/.netlify/functions/get-busy-slots', { cache: 'no-store' })
        .then(r => r.json())
        .then(data => {
          if (cancelled) return
          if (data?.success && Array.isArray(data.busy)) {
            setBusy(
              data.busy.map((b: { start: string; end: string }) => ({
                start: new Date(b.start),
                end: new Date(b.end),
              }))
            )
          }
        })
        .catch(() => {})
    }
    load()
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => {
      cancelled = true
      window.removeEventListener('focus', onFocus)
    }
  }, [weekStart.getTime()])

  // Build week days
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  }, [weekStart.getTime()])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Available days in this week
  const availableDays = useMemo(() => {
    return weekDays.filter(d => {
      const slots = getSlotsForDay(d, busy)
      return slots.length > 0
    })
  }, [weekDays, busy])

  const slotsForSelectedDay = useMemo(() => {
    if (!selectedDay) return []
    return getSlotsForDay(selectedDay, busy)
  }, [selectedDay, busy])

  const canGoPrev = weekStart > today

  const goNextWeek = () => setWeekStart(addDays(weekStart, 7))
  const goPrevWeek = () => {
    const prev = addDays(weekStart, -7)
    if (prev >= today || isSameDay(getMonday(today), prev)) {
      setWeekStart(prev)
    }
  }

  const handleDayClick = (day: Date) => {
    setSelectedDay(day)
    setSelectedSlot(null)
  }

  const handleSlotClick = (slot: Slot) => {
    setSelectedSlot(slot)
  }

  const goToForm = () => {
    if (selectedSlot) setStep('form')
  }

  const goBackToSelect = () => {
    setStep('select')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlot) return

    // Show confirmation immediately, send email in background
    setStep('confirmed')

    fetch('/.netlify/functions/book-meeting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: `${selectedSlot.date.getFullYear()}-${String(selectedSlot.date.getMonth() + 1).padStart(2, '0')}-${String(selectedSlot.date.getDate()).padStart(2, '0')}`,
        hour: selectedSlot.hour,
        minute: selectedSlot.minute,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        message: form.message,
        lang,
      }),
    }).catch(() => {})
  }

  const resetBooking = () => {
    setStep('select')
    setSelectedSlot(null)
    setSelectedDay(null)
    setForm({ firstName: '', lastName: '', email: '', message: '' })
  }

  const formatSelectedDate = () => {
    if (!selectedSlot) return ''
    const d = selectedSlot.date
    return `${fullDayNames[d.getDay()]} ${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`
  }

  const formatSelectedTime = () => {
    if (!selectedSlot) return ''
    const endH = selectedSlot.minute + 30 >= 60 ? selectedSlot.hour + 1 : selectedSlot.hour
    const endM = (selectedSlot.minute + 30) % 60
    return `${formatTime(selectedSlot.hour, selectedSlot.minute)} — ${formatTime(endH, endM)}`
  }

  const weekLabel = `${monthNames[weekStart.getMonth()]} ${weekStart.getFullYear()}`

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(0,0,0,0.03)',
    border: `1px solid ${BORDER}`,
    borderRadius: '12px',
    padding: '0.9rem 1rem',
    color: TEXT,
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  }

  return (
    <main style={{ paddingTop: '7rem', paddingBottom: '6rem', minHeight: '100vh' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 5vw' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{
            display: 'inline-block',
            padding: '0.35rem 1rem',
            background: 'rgba(26,26,107,0.07)',
            borderRadius: '100px',
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: ACCENT,
            marginBottom: '1.5rem',
          }}>
            {t.badge}
          </span>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: TEXT,
            lineHeight: 1.15,
            marginBottom: '0.75rem',
          }}>
            {t.title}
          </h1>
          <p style={{ color: MUTED, fontSize: '1rem', lineHeight: 1.6 }}>
            {t.subtitle}
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#fff',
          border: `1px solid ${BORDER}`,
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
        }}>

          {/* ─── STEP: SELECT ─── */}
          {step === 'select' && (
            <div style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
              {/* Week navigation */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.5rem',
              }}>
                <button
                  onClick={goPrevWeek}
                  disabled={!canGoPrev}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '36px', height: '36px',
                    borderRadius: '10px',
                    border: `1px solid ${BORDER}`,
                    background: '#fff',
                    color: canGoPrev ? TEXT : '#ddd',
                    cursor: canGoPrev ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                  }}
                >
                  <ChevronLeft size={18} />
                </button>
                <span style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  color: TEXT,
                }}>
                  {weekLabel}
                </span>
                <button
                  onClick={goNextWeek}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '36px', height: '36px',
                    borderRadius: '10px',
                    border: `1px solid ${BORDER}`,
                    background: '#fff',
                    color: TEXT,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Day grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '6px',
                marginBottom: '2rem',
              }}>
                {weekDays.map((day, i) => {
                  const hasSlots = availableDays.some(d => isSameDay(d, day))
                  const isSelected = selectedDay && isSameDay(selectedDay, day)
                  const isPast = day < today && !isSameDay(day, today)
                  const isToday = isSameDay(day, new Date())

                  return (
                    <button
                      key={i}
                      onClick={() => hasSlots ? handleDayClick(day) : undefined}
                      disabled={!hasSlots || isPast}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '0.65rem 0.25rem',
                        borderRadius: '12px',
                        border: isSelected ? `2px solid ${ACCENT}` : `1px solid ${BORDER}`,
                        background: isSelected ? 'rgba(26,26,107,0.07)' : hasSlots ? '#fff' : BG_OFF,
                        cursor: hasSlots && !isPast ? 'pointer' : 'default',
                        opacity: isPast || !hasSlots ? 0.35 : 1,
                        transition: 'all 0.2s',
                      }}
                    >
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 500,
                        color: MUTED,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}>
                        {dayNames[day.getDay()]}
                      </span>
                      <span style={{
                        fontSize: '1.05rem',
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? ACCENT : TEXT,
                      }}>
                        {day.getDate()}
                      </span>
                      {isToday && (
                        <div style={{
                          width: '4px', height: '4px',
                          borderRadius: '50%',
                          background: ACCENT,
                        }} />
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Time slots */}
              {selectedDay && (
                <>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                  }}>
                    <Clock size={14} color={MUTED} />
                    <span style={{ fontSize: '0.8rem', color: MUTED, fontWeight: 500 }}>
                      {t.selectTime} — {fullDayNames[selectedDay.getDay()]} {selectedDay.getDate()}
                    </span>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                    gap: '8px',
                    marginBottom: '2rem',
                  }}>
                    {slotsForSelectedDay.map((slot, i) => {
                      const isSelected = selectedSlot &&
                        slot.hour === selectedSlot.hour &&
                        slot.minute === selectedSlot.minute &&
                        isSameDay(slot.date, selectedSlot.date)

                      return (
                        <button
                          key={i}
                          onClick={() => handleSlotClick(slot)}
                          style={{
                            padding: '0.7rem 0.5rem',
                            borderRadius: '10px',
                            border: isSelected ? `2px solid ${ACCENT}` : `1px solid ${BORDER}`,
                            background: isSelected ? ACCENT : '#fff',
                            color: isSelected ? '#fff' : TEXT,
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            fontFamily: "'Space Grotesk', sans-serif",
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = ACCENT
                              e.currentTarget.style.background = 'rgba(26,26,107,0.04)'
                            }
                          }}
                          onMouseLeave={e => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = BORDER
                              e.currentTarget.style.background = '#fff'
                            }
                          }}
                        >
                          {formatTime(slot.hour, slot.minute)}
                        </button>
                      )
                    })}
                  </div>
                </>
              )}

              {!selectedDay && availableDays.length === 0 && (
                <p style={{
                  textAlign: 'center',
                  color: MUTED,
                  fontSize: '0.9rem',
                  padding: '2rem 0',
                }}>
                  {t.noSlots}
                </p>
              )}

              {/* CTA */}
              {selectedSlot && (
                <button
                  onClick={goToForm}
                  style={{
                    width: '100%',
                    padding: '0.9rem',
                    background: ACCENT,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '14px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    fontFamily: "'Inter', sans-serif",
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = ACCENT_HOVER)}
                  onMouseLeave={e => (e.currentTarget.style.background = ACCENT)}
                >
                  {t.next} →
                </button>
              )}
            </div>
          )}

          {/* ─── STEP: FORM ─── */}
          {step === 'form' && (
            <div style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
              {/* Back button */}
              <button
                onClick={goBackToSelect}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  background: 'none', border: 'none',
                  color: MUTED, fontSize: '0.8rem', fontWeight: 500,
                  cursor: 'pointer', marginBottom: '1.5rem',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = TEXT)}
                onMouseLeave={e => (e.currentTarget.style.color = MUTED)}
              >
                <ArrowLeft size={14} />
                {t.back}
              </button>

              {/* Recap */}
              <div style={{
                background: BG_OFF,
                borderRadius: '14px',
                padding: '1.25rem',
                marginBottom: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={15} color={ACCENT} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: TEXT }}>
                    {formatSelectedDate()}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={15} color={ACCENT} />
                  <span style={{ fontSize: '0.9rem', color: TEXT }}>
                    {formatSelectedTime()}
                  </span>
                  <span style={{
                    marginLeft: 'auto',
                    fontSize: '0.75rem',
                    color: MUTED,
                    background: 'rgba(0,0,0,0.04)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '100px',
                  }}>
                    {t.duration}
                  </span>
                </div>
                <div style={{ fontSize: '0.7rem', color: MUTED, marginTop: '0.25rem' }}>
                  {t.timezone}
                </div>
              </div>

              {/* Form */}
              <h3 style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '1.1rem',
                fontWeight: 600,
                color: TEXT,
                marginBottom: '1.25rem',
              }}>
                {t.yourInfo}
              </h3>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div style={{ position: 'relative' }}>
                    <User size={14} color={MUTED} style={{
                      position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                    }} />
                    <input
                      required
                      placeholder={t.firstName}
                      value={form.firstName}
                      onChange={e => setForm({ ...form, firstName: e.target.value })}
                      style={{ ...inputStyle, paddingLeft: '2.5rem' }}
                      onFocus={e => (e.currentTarget.style.borderColor = ACCENT)}
                      onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
                    />
                  </div>
                  <div>
                    <input
                      required
                      placeholder={t.lastName}
                      value={form.lastName}
                      onChange={e => setForm({ ...form, lastName: e.target.value })}
                      style={inputStyle}
                      onFocus={e => (e.currentTarget.style.borderColor = ACCENT)}
                      onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
                    />
                  </div>
                </div>

                <div style={{ position: 'relative' }}>
                  <Mail size={14} color={MUTED} style={{
                    position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                  }} />
                  <input
                    required
                    type="email"
                    placeholder={t.email}
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    style={{ ...inputStyle, paddingLeft: '2.5rem' }}
                    onFocus={e => (e.currentTarget.style.borderColor = ACCENT)}
                    onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
                  />
                </div>

                <div style={{ position: 'relative' }}>
                  <MessageSquare size={14} color={MUTED} style={{
                    position: 'absolute', left: '1rem', top: '1rem',
                  }} />
                  <textarea
                    placeholder={t.message}
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    rows={3}
                    style={{
                      ...inputStyle,
                      paddingLeft: '2.5rem',
                      resize: 'none',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = ACCENT)}
                    onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: '100%',
                    padding: '0.9rem',
                    background: ACCENT,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '14px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    fontFamily: "'Inter', sans-serif",
                    cursor: submitting ? 'default' : 'pointer',
                    opacity: submitting ? 0.7 : 1,
                    transition: 'all 0.2s',
                    marginTop: '0.5rem',
                  }}
                  onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = ACCENT_HOVER }}
                  onMouseLeave={e => (e.currentTarget.style.background = ACCENT)}
                >
                  {submitting ? t.confirming : t.confirm}
                </button>
              </form>
            </div>
          )}

          {/* ─── STEP: CONFIRMED ─── */}
          {step === 'confirmed' && (
            <div style={{
              padding: 'clamp(2rem, 5vw, 3.5rem)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
            }}>
              <div style={{
                width: '56px', height: '56px',
                borderRadius: '50%',
                background: 'rgba(26,26,107,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.5rem',
              }}>
                <Check size={28} color={ACCENT} strokeWidth={2.5} />
              </div>

              <h2 style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '1.5rem',
                fontWeight: 700,
                color: TEXT,
                letterSpacing: '-0.02em',
              }}>
                {t.confirmedTitle}
              </h2>

              <div style={{
                background: BG_OFF,
                borderRadius: '14px',
                padding: '1.25rem',
                width: '100%',
                maxWidth: '360px',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
              }}>
                <span style={{ fontWeight: 600, color: TEXT, fontSize: '0.9rem' }}>
                  {formatSelectedDate()}
                </span>
                <span style={{ color: ACCENT, fontSize: '0.9rem', fontWeight: 500 }}>
                  {formatSelectedTime()}
                </span>
              </div>

              <p style={{ color: MUTED, fontSize: '0.9rem', lineHeight: 1.6, maxWidth: '340px' }}>
                {t.confirmedSub}
              </p>

              <button
                onClick={resetBooking}
                style={{
                  marginTop: '1rem',
                  padding: '0.7rem 1.8rem',
                  background: 'transparent',
                  color: ACCENT,
                  border: `1px solid ${ACCENT}`,
                  borderRadius: '100px',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = ACCENT
                  e.currentTarget.style.color = '#fff'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = ACCENT
                }}
              >
                {t.bookAnother}
              </button>
            </div>
          )}
        </div>

        {/* Info footer */}
        <div style={{
          marginTop: '2rem',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: MUTED,
          lineHeight: 1.6,
        }}>
          Clément Pouget-Osmont · clement.pougetosmont@gmail.com
        </div>
      </div>
    </main>
  )
}
