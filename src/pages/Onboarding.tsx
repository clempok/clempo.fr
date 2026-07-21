import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  MULTI_SEP,
  sectionProgress, overallProgress, slotsForSection, resolveSections,
} from '../lib/onboarding-schema'
import type { OnboardingField, OnboardingSection, UploadSlot } from '../lib/onboarding-schema'
import {
  chunkCount, readChunkBase64, downloadChunkedFile,
  formatBytes, fileIcon, MAX_FILE_BYTES,
} from '../lib/onboarding-files'

/**
 * Espace d'onboarding client — clempo.fr/<slug>.
 *
 * Protégé par un code à six caractères, mémorisé dans le navigateur : le client
 * ne le saisit qu'une fois et revient autant de fois qu'il veut. Tout est
 * enregistré au fil de la frappe, il n'y a pas de bouton « sauvegarder ».
 *
 * Page privée, servie hors du shell marketing (voir App.tsx) : ni navbar, ni
 * popups, ni curseur custom — d'où la restauration du curseur natif ci-dessous,
 * comme sur /devis.
 */

/* ── Brand Book 2026 — ClearSharpHealthcare ── */
const INK = '#0A0A0B'
const BG = '#EDEBE4'          // Paper
const CARD = '#FFFFFF'
const FIELD = '#F4F4F2'       // Paper soft
const MUTED = '#6B6F7A'       // Steel
const SIGNAL = '#00D68F'
const SIGNAL_DEEP = '#009E68'
const BORDER = 'rgba(10,10,11,0.08)'
const BORDER_STRONG = 'rgba(10,10,11,0.16)'
const R = '4px'

const FT = "'Inter', sans-serif"
const FM = "'JetBrains Mono', ui-monospace, monospace"
const FS = "'Instrument Serif', Georgia, serif"

const API = '/.netlify/functions/onboarding'

type ClientFile = {
  id: string
  slot: string
  name: string
  size: number
  mimeType: string
  chunks: number
  uploadedAt: string
}

type ClientData = {
  companyName: string
  contactName: string
  answers: Record<string, string>
  /** Questionnaire personnalisé ; null → le client voit le standard. */
  schema?: OnboardingSection[] | null
  /** Résumé du contexte, affiché en tête de la 1re section. */
  contextSummary?: string
  /** Clés pré-remplies par l'IA, à faire valider au client. */
  prefilledKeys?: string[]
  /** URL du logo du client, s'il a été renseigné (en-tête de la page). */
  logoUrl?: string
  files: ClientFile[]
  status: 'draft' | 'in_progress' | 'submitted'
  updatedAt?: string
  submittedAt?: string
}

type Phase = 'loading' | 'notfound' | 'gate' | 'ready'
type SaveState = 'idle' | 'saving' | 'saved' | 'error'

const storageKey = (slug: string) => `clempo_onb_${slug}`

export default function Onboarding() {
  const { slug = '' } = useParams<{ slug: string }>()

  const [phase, setPhase] = useState<Phase>('loading')
  const [code, setCode] = useState('')
  const [codeInput, setCodeInput] = useState('')
  const [gateError, setGateError] = useState('')
  const [gateBusy, setGateBusy] = useState(false)

  const [data, setData] = useState<ClientData | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [files, setFiles] = useState<ClientFile[]>([])
  // Vide au départ : l'index se rabat sur la 1re section tant qu'aucune n'est
  // choisie, ce qui marche quel que soit le schéma (standard ou personnalisé).
  const [activeSection, setActiveSection] = useState<string>('')

  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [savedAt, setSavedAt] = useState('')

  // Clés modifiées pas encore envoyées. Un ref, pas un state : la valeur doit
  // être lue par le timer de sauvegarde sans provoquer de rendu.
  const pendingRef = useRef<Set<string>>(new Set())
  const answersRef = useRef<Record<string, string>>({})
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const codeRef = useRef('')

  useEffect(() => { answersRef.current = answers }, [answers])
  useEffect(() => { codeRef.current = code }, [code])

  // Curseur natif : LiquidCursor n'est pas monté sur cette page, et index.css
  // met `cursor: none` sur le body.
  useEffect(() => {
    const previous = document.body.style.cursor
    document.body.style.cursor = 'auto'
    const s = document.createElement('style')
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap');
      *, a, button, input, textarea, select { cursor: auto !important; }
      a, button, select, [role="button"] { cursor: pointer !important; }
    `
    document.head.appendChild(s)
    return () => {
      document.body.style.cursor = previous
      s.remove()
    }
  }, [])

  /* ── Appel API : les identifiants voyagent à chaque requête ─────────────── */
  const api = useCallback(async (action: string, payload: Record<string, unknown> = {}) => {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, slug, code: codeRef.current, ...payload }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw Object.assign(new Error(json.error || 'Erreur'), { status: res.status })
    return json
  }, [slug])

  const openSpace = useCallback(async (withCode: string) => {
    codeRef.current = withCode
    const json = (await api('open')) as ClientData
    setCode(withCode)
    setData(json)
    setAnswers(json.answers || {})
    setFiles(json.files || [])
    localStorage.setItem(storageKey(slug), withCode)
    setPhase('ready')
  }, [api, slug])

  /* ── Amorçage : le slug existe-t-il, et a-t-on déjà le code ? ──────────── */
  useEffect(() => {
    let cancelled = false
    document.title = 'Espace client — Clempo'
    ;(async () => {
      try {
        const res = await fetch(`${API}?slug=${encodeURIComponent(slug)}`)
        const json = await res.json().catch(() => ({ found: false }))
        if (cancelled) return
        if (!json.found) {
          document.title = 'Page introuvable — Clempo'
          setPhase('notfound')
          return
        }

        const saved = localStorage.getItem(storageKey(slug))
        if (saved) {
          try {
            await openSpace(saved)
            return
          } catch {
            // Code révoqué ou régénéré côté admin : on repasse par la porte.
            localStorage.removeItem(storageKey(slug))
          }
        }
        if (!cancelled) setPhase('gate')
      } catch {
        if (!cancelled) setPhase('notfound')
      }
    })()
    return () => { cancelled = true }
  }, [slug, openSpace])

  useEffect(() => {
    if (data) document.title = `Onboarding — ${data.companyName}`
  }, [data])

  /* ── Sauvegarde automatique ────────────────────────────────────────────── */
  const flush = useCallback(async () => {
    if (!pendingRef.current.size) return
    const keys = [...pendingRef.current]
    pendingRef.current = new Set()
    const patch: Record<string, string> = {}
    for (const k of keys) patch[k] = answersRef.current[k] ?? ''

    setSaveState('saving')
    try {
      await api('save', { answers: patch })
      setSaveState('saved')
      setSavedAt(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
    } catch (err) {
      // Les clés repartent dans la file : la prochaine frappe retentera.
      for (const k of keys) pendingRef.current.add(k)
      setSaveState('error')
      if ((err as { status?: number }).status === 401) {
        localStorage.removeItem(storageKey(slug))
        setPhase('gate')
        setGateError('Votre code a été modifié. Demandez le nouveau à Clément.')
      }
    }
  }, [api, slug])

  const setAnswer = useCallback((key: string, value: string) => {
    setAnswers(prev => ({ ...prev, [key]: value }))
    pendingRef.current.add(key)
    setSaveState('saving')
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => { void flush() }, 900)
  }, [flush])

  // Filet de sécurité : on n'attend pas le debounce si l'onglet passe en
  // arrière-plan ou si la page se ferme.
  useEffect(() => {
    if (phase !== 'ready') return
    const onHide = () => { if (document.visibilityState === 'hidden') void flush() }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', onHide)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', onHide)
    }
  }, [phase, flush])

  const goToSection = useCallback((id: string) => {
    void flush()
    setActiveSection(id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [flush])

  /* ── Rendu ─────────────────────────────────────────────────────────────── */

  if (phase === 'loading') {
    return <Centered><p style={{ color: MUTED, fontSize: '0.85rem', fontFamily: FM }}>Chargement…</p></Centered>
  }

  if (phase === 'notfound') {
    return (
      <Centered>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <p className="onb-eyebrow" style={{ color: MUTED, marginBottom: '1rem' }}>Erreur 404</p>
          <h1 style={{ fontFamily: FS, fontWeight: 400, fontSize: '2rem', color: INK, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
            Cette page n’existe pas
          </h1>
          <p style={{ color: MUTED, fontSize: '0.9rem', lineHeight: 1.65, marginBottom: '1.75rem' }}>
            Vérifiez le lien qui vous a été transmis, ou revenez à l’accueil.
          </p>
          <a href="/" style={{
            display: 'inline-block', background: INK, color: BG, padding: '0.8rem 1.35rem',
            borderRadius: R, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500,
          }}>
            Retour à clempo.fr
          </a>
        </div>
      </Centered>
    )
  }

  if (phase === 'gate') {
    const submitCode = async (e: React.FormEvent) => {
      e.preventDefault()
      setGateError('')
      setGateBusy(true)
      try {
        await openSpace(codeInput.trim().toUpperCase())
      } catch (err) {
        setGateError((err as Error).message || 'Code incorrect')
      } finally {
        setGateBusy(false)
      }
    }
    const ready = codeInput.trim().length >= 4
    return (
      <Centered>
        <form onSubmit={submitCode} style={{
          background: CARD, border: `1px solid ${BORDER}`, borderRadius: R,
          padding: '2.5rem', width: '100%', maxWidth: 400,
        }}>
          <p className="onb-eyebrow" style={{ color: SIGNAL_DEEP, marginBottom: '0.9rem' }}>Espace client</p>
          <h1 style={{ fontFamily: FS, fontWeight: 400, fontSize: '1.85rem', color: INK, marginBottom: '0.75rem', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            Votre code d’accès
          </h1>
          <p style={{ color: MUTED, fontSize: '0.875rem', lineHeight: 1.65, marginBottom: '1.75rem' }}>
            Clément vous a transmis un code à six caractères. Vous ne le saisirez
            qu’une fois sur cet appareil.
          </p>
          <input
            value={codeInput}
            onChange={e => setCodeInput(e.target.value.toUpperCase())}
            autoFocus
            autoComplete="off"
            spellCheck={false}
            maxLength={8}
            placeholder="XXXXXX"
            style={{
              width: '100%', padding: '0.9rem 1rem', fontSize: '1.35rem', fontWeight: 500,
              letterSpacing: '0.35em', textAlign: 'center', textTransform: 'uppercase',
              border: `1px solid ${gateError ? '#dc2626' : BORDER_STRONG}`, borderRadius: R,
              outline: 'none', background: FIELD, boxSizing: 'border-box',
              fontFamily: FM, color: INK,
            }}
          />
          <button type="submit" disabled={gateBusy || !ready} style={{
            width: '100%', marginTop: '1rem', padding: '0.85rem', border: 'none', borderRadius: R,
            background: !ready || gateBusy ? BORDER_STRONG : INK, color: BG,
            fontSize: '0.85rem', fontWeight: 500, fontFamily: FT,
          }}>
            {gateBusy ? 'Vérification…' : 'Accéder à mon espace'}
          </button>
          {gateError && (
            <p style={{ marginTop: '0.9rem', fontSize: '0.8rem', color: '#dc2626', textAlign: 'center' }}>{gateError}</p>
          )}
          <p style={{ marginTop: '1.75rem', fontSize: '0.78rem', color: MUTED, textAlign: 'center', lineHeight: 1.65 }}>
            Code égaré ? Écrivez à{' '}
            <a href="mailto:clement.pougetosmont@gmail.com" style={{ color: INK }}>Clément</a>.
          </p>
        </form>
      </Centered>
    )
  }

  return (
    <OnboardingForm
      data={data!}
      answers={answers}
      files={files}
      setFiles={setFiles}
      setAnswer={setAnswer}
      activeSection={activeSection}
      goToSection={goToSection}
      saveState={saveState}
      savedAt={savedAt}
      api={api}
      flush={flush}
    />
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Formulaire
   ────────────────────────────────────────────────────────────────────────── */

type ApiFn = (action: string, payload?: Record<string, unknown>) => Promise<Record<string, unknown>>

function OnboardingForm({
  data, answers, files, setFiles, setAnswer,
  activeSection, goToSection, saveState, savedAt, api, flush,
}: {
  data: ClientData
  answers: Record<string, string>
  files: ClientFile[]
  setFiles: React.Dispatch<React.SetStateAction<ClientFile[]>>
  setAnswer: (key: string, value: string) => void
  activeSection: string
  goToSection: (id: string) => void
  saveState: SaveState
  savedAt: string
  api: ApiFn
  flush: () => Promise<void>
}) {
  // Questionnaire personnalisé du client, ou standard à défaut.
  const sections = useMemo(() => resolveSections(data.schema), [data.schema])
  const prefilledSet = useMemo(() => new Set(data.prefilledKeys || []), [data.prefilledKeys])
  const progress = useMemo(() => overallProgress(answers, sections), [answers, sections])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(data.status === 'submitted')
  const [submittedAt, setSubmittedAt] = useState(data.submittedAt || '')

  const navItems = useMemo(
    () => sections.map(s => ({
      id: s.id,
      title: s.title,
      ...sectionProgress(answers, s),
      docs: files.filter(f => (s.uploads || []).includes(f.slot)).length,
    })),
    [answers, files, sections],
  )

  const index = Math.max(0, sections.findIndex(s => s.id === activeSection))
  const section = sections[index]
  const isLast = index === sections.length - 1
  const prevId = index > 0 ? sections[index - 1].id : null
  const nextId = isLast ? null : sections[index + 1].id

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await flush()
      const res = await api('submit')
      setSubmitted(true)
      setSubmittedAt((res.submittedAt as string) || new Date().toISOString())
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      /* l'indicateur d'enregistrement signale déjà l'échec */
    } finally {
      setSubmitting(false)
    }
  }

  const uploader = useUploads({ api, setFiles })

  const remainingEssential = progress.essentialTotal - progress.essentialFilled
  const plural = remainingEssential > 1 ? 's' : ''

  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: FT, color: INK }}>
      <style>{`
        .onb-eyebrow { font-family: ${FM}; font-weight: 500; font-size: 0.68rem;
                       letter-spacing: 0.12em; text-transform: uppercase; }
        .onb-shell { display: grid; grid-template-columns: 250px minmax(0, 1fr); gap: 3rem;
                     max-width: 1140px; margin: 0 auto; padding: 2.5rem 1.5rem 6rem; align-items: start; }
        /* Sans ça, la barre de sections mobile (scroll horizontal interne)
           élargit sa piste de grille — min-width vaut auto par défaut — et
           fait déborder toute la page vers la droite. */
        .onb-shell > nav, .onb-shell > main { min-width: 0; }
        .onb-nav-desktop { position: sticky; top: 96px; display: flex; flex-direction: column; gap: 1px; }
        .onb-nav-mobile { display: none; }
        .onb-input { transition: border-color 0.2s ease, background 0.2s ease; }
        .onb-input:focus { border-color: ${INK}; background: ${CARD}; }
        .onb-card { background: ${CARD}; border: 1px solid ${BORDER}; border-radius: ${R}; }
        .onb-btn { border-radius: ${R}; font-family: ${FT}; font-weight: 500; font-size: 0.85rem;
                   transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease; }
        .onb-btn:not(:disabled):hover { transform: translateY(-1px); }
        @media (max-width: 900px) {
          .onb-shell { grid-template-columns: 1fr; gap: 1.25rem; padding: 1rem 1rem 4rem; }
          .onb-nav-desktop { display: none; }
          .onb-nav-mobile { display: flex; gap: 4px; overflow-x: auto; padding-bottom: 4px;
                            scrollbar-width: none; -webkit-overflow-scrolling: touch; }
          .onb-nav-mobile::-webkit-scrollbar { display: none; }
        }
      `}</style>

      {/* En-tête */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 20, background: 'rgba(237,235,228,0.9)',
        backdropFilter: 'blur(12px)', borderBottom: `1px solid ${BORDER}`,
      }}>
        <div style={{
          maxWidth: 1140, margin: '0 auto', padding: '0.9rem 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
            {data.logoUrl && (
              <img
                src={data.logoUrl}
                alt={data.companyName}
                style={{ height: 40, width: 'auto', maxWidth: 120, objectFit: 'contain', flexShrink: 0 }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
            )}
            <div style={{ minWidth: 0 }}>
              <p className="onb-eyebrow" style={{ color: SIGNAL_DEEP }}>Onboarding</p>
              <p style={{
                fontFamily: FS, fontSize: '1.15rem', fontWeight: 400, letterSpacing: '-0.015em',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1,
              }}>
                {data.companyName}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexShrink: 0 }}>
            <SaveIndicator state={saveState} savedAt={savedAt} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: 84, height: 4, background: 'rgba(10,10,11,0.1)', overflow: 'hidden' }}>
                <div style={{ width: `${progress.percent}%`, height: '100%', background: SIGNAL, transition: 'width 0.4s ease' }} />
              </div>
              <span style={{ fontFamily: FM, fontSize: '0.72rem', color: MUTED, minWidth: 34 }}>
                {progress.percent}%
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="onb-shell">
        {/* Navigation */}
        <nav>
          <div className="onb-nav-desktop">
            {navItems.map((item, i) => (
              <NavButton key={item.id} item={item} n={i + 1} active={activeSection === item.id} onClick={() => goToSection(item.id)} />
            ))}
            <p style={{ fontSize: '0.72rem', color: MUTED, lineHeight: 1.7, marginTop: '1.5rem', paddingLeft: '0.6rem' }}>
              Tout est enregistré au fur et à mesure. Vous pouvez fermer cette page
              et revenir quand vous voulez.
            </p>
          </div>
          <div className="onb-nav-mobile">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => goToSection(item.id)}
                className="onb-btn"
                style={{
                  flexShrink: 0, padding: '0.5rem 0.85rem', fontSize: '0.78rem', whiteSpace: 'nowrap',
                  border: `1px solid ${activeSection === item.id ? INK : BORDER}`,
                  background: activeSection === item.id ? INK : CARD,
                  color: activeSection === item.id ? BG : INK,
                }}
              >
                {item.title}
              </button>
            ))}
          </div>
        </nav>

        {/* Contenu */}
        <main style={{ minWidth: 0 }}>
          {submitted && (
            <div style={{
              background: 'rgba(0,214,143,0.08)', border: `1px solid rgba(0,214,143,0.35)`,
              borderRadius: R, padding: '1rem 1.25rem', marginBottom: '1.5rem',
            }}>
              <p style={{ fontWeight: 600, fontSize: '0.88rem', color: SIGNAL_DEEP }}>Questionnaire finalisé</p>
              <p style={{ fontSize: '0.83rem', color: MUTED, lineHeight: 1.65, marginTop: 3 }}>
                Clément a été prévenu. Rien n’est figé pour autant : vous pouvez
                continuer à compléter et à déposer des documents, tout lui parvient
                automatiquement.
              </p>
            </div>
          )}

          {/* Réponses pré-remplies : prévenir une seule fois, en tête. */}
          {index === 0 && prefilledSet.size > 0 && !submitted && (
            <div style={{
              background: 'rgba(0,214,143,0.07)', border: `1px solid rgba(0,214,143,0.3)`,
              borderRadius: R, padding: '0.9rem 1.15rem', marginBottom: '1.5rem',
            }}>
              <p style={{ fontSize: '0.83rem', color: INK, lineHeight: 1.6 }}>
                <strong>J’ai pré-rempli certaines réponses</strong> à partir de nos
                échanges et de votre devis. Elles sont signalées par une pastille{' '}
                <span style={{ color: SIGNAL_DEEP, fontWeight: 600 }}>« à vérifier »</span> :
                relisez-les, corrigez ou complétez. Le reste est à vous.
              </p>
            </div>
          )}

          <div className="onb-card" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
            <p className="onb-eyebrow" style={{ color: MUTED, marginBottom: '0.9rem' }}>
              — {String(index + 1).padStart(2, '0')} / {String(navItems.length).padStart(2, '0')}
            </p>
            <h2 style={{
              fontFamily: FS, fontSize: 'clamp(1.6rem, 3.4vw, 2.1rem)', fontWeight: 400,
              letterSpacing: '-0.02em', lineHeight: 1.15,
              marginBottom: section.intro ? '0.75rem' : '2rem',
            }}>
              {section.title}
            </h2>
            {section.intro && (
              <p style={{ color: MUTED, fontSize: '0.9rem', lineHeight: 1.7, marginBottom: section === sections[0] && data.contextSummary ? '1.5rem' : '2.25rem', maxWidth: 600 }}>
                {section.intro}
              </p>
            )}

            {/* Contexte : ce que Clément a compris, affiché en tête de la 1re section. */}
            {index === 0 && data.contextSummary && (
              <div style={{
                background: BG, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${SIGNAL}`,
                borderRadius: R, padding: '1.1rem 1.25rem', marginBottom: '2rem',
              }}>
                <p className="onb-eyebrow" style={{ color: SIGNAL_DEEP, marginBottom: '0.5rem' }}>
                  Ce que j’ai compris de votre projet
                </p>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: INK, whiteSpace: 'pre-wrap' }}>
                  {data.contextSummary}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.9rem' }}>
              {section.fields.map(field => (
                <Field
                  key={field.key}
                  field={field}
                  value={answers[field.key] || ''}
                  onChange={v => setAnswer(field.key, v)}
                  prefilled={prefilledSet.has(field.key)}
                />
              ))}
            </div>

            <SectionDocuments section={section} files={files} uploader={uploader} />
          </div>

          {/* Bas de page : navigation + validation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => prevId && goToSection(prevId)}
              disabled={!prevId}
              className="onb-btn"
              style={{
                padding: '0.8rem 1.3rem', border: `1px solid ${BORDER_STRONG}`,
                background: 'transparent', color: prevId ? INK : 'rgba(10,10,11,0.25)',
              }}
            >
              ← Précédent
            </button>
            {nextId ? (
              <button
                onClick={() => goToSection(nextId)}
                className="onb-btn"
                style={{ padding: '0.8rem 1.5rem', border: 'none', background: INK, color: BG }}
              >
                Suivant →
              </button>
            ) : submitted ? (
              // Une fois finalisé, plus de bouton : le questionnaire reste
              // modifiable et tout continue de remonter automatiquement.
              // Reproposer « Finaliser » laisserait croire le contraire.
              <p style={{ fontSize: '0.82rem', color: SIGNAL_DEEP, textAlign: 'right', lineHeight: 1.6 }}>
                ✓ Finalisé{submittedAt ? ` le ${new Date(submittedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}` : ''}
                <br />
                <span style={{ color: MUTED }}>Vos modifications restent enregistrées automatiquement.</span>
              </p>
            ) : (
              <div style={{ textAlign: 'right' }}>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="onb-btn"
                  style={{
                    padding: '0.8rem 1.5rem', border: 'none',
                    background: submitting ? BORDER_STRONG : SIGNAL, color: INK, fontWeight: 600,
                  }}
                >
                  {submitting ? 'Envoi…' : 'Finaliser'}
                </button>
                <p style={{ fontSize: '0.75rem', color: MUTED, marginTop: '0.6rem', lineHeight: 1.6 }}>
                  Vous pourrez revenir compléter ou déposer des documents à tout moment.
                </p>
              </div>
            )}
          </div>

          {isLast && (
            <div className="onb-card" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
              <p style={{ fontFamily: FM, fontSize: '0.78rem', marginBottom: '0.6rem' }}>
                {progress.filled} / {progress.total} réponses · {files.length} document{files.length > 1 ? 's' : ''}
              </p>
              <p style={{ fontSize: '0.83rem', color: MUTED, lineHeight: 1.7 }}>
                {remainingEssential === 0
                  ? submitted
                    ? 'Toutes les questions essentielles ont une réponse. Rien ne vous empêche d’enrichir vos réponses plus tard.'
                    : 'Toutes les questions essentielles ont une réponse. Vous pouvez finaliser, et compléter ensuite si besoin.'
                  : submitted
                    ? `Il reste ${remainingEssential} question${plural} essentielle${plural} sans réponse, repérable${plural} à leur pastille verte. Complétez-les quand vous voulez : Clément verra les ajouts.`
                    : `Il reste ${remainingEssential} question${plural} essentielle${plural} sans réponse, repérable${plural} à leur pastille verte. Vous pouvez finaliser malgré tout : Clément verra ce qui manque, et vous pourrez compléter plus tard.`}
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Sous-composants
   ────────────────────────────────────────────────────────────────────────── */

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: BG, padding: '1.5rem', fontFamily: FT, color: INK,
    }}>
      <style>{`.onb-eyebrow { font-family: ${FM}; font-weight: 500; font-size: 0.68rem;
                               letter-spacing: 0.12em; text-transform: uppercase; }`}</style>
      {children}
    </div>
  )
}

function SaveIndicator({ state, savedAt }: { state: SaveState; savedAt: string }) {
  const label =
    state === 'saving' ? 'Enregistrement…'
    : state === 'saved' ? `Enregistré ${savedAt}`
    : state === 'error' ? 'Non enregistré'
    : ''
  if (!label) return null
  const color = state === 'error' ? '#dc2626' : state === 'saved' ? SIGNAL_DEEP : MUTED
  return (
    <span style={{ fontFamily: FM, fontSize: '0.68rem', color, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

type NavItem = { id: string; title: string; filled: number; total: number; done: boolean; docs: number }

function NavButton({ item, n, active, onClick }: { item: NavItem; n: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.65rem', width: '100%',
        padding: '0.6rem', border: 'none', borderLeft: `2px solid ${active ? INK : 'transparent'}`,
        textAlign: 'left', background: active ? 'rgba(10,10,11,0.04)' : 'transparent',
        fontSize: '0.85rem', fontFamily: FT,
        fontWeight: active ? 600 : 400,
        color: active ? INK : MUTED,
      }}
    >
      <span style={{ fontFamily: FM, fontSize: '0.66rem', color: active ? INK : 'rgba(107,111,122,0.7)' }}>
        {String(n).padStart(2, '0')}
      </span>
      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {item.title}
      </span>
      {item.docs > 0 && (
        <span title={`${item.docs} document${item.docs > 1 ? 's' : ''}`} style={{ fontSize: '0.7rem', flexShrink: 0 }}>
          📎{item.docs}
        </span>
      )}
      <span style={{ fontFamily: FM, fontSize: '0.64rem', color: item.done ? SIGNAL_DEEP : MUTED, flexShrink: 0 }}>
        {item.done ? '✓' : `${item.filled}/${item.total}`}
      </span>
    </button>
  )
}

function Field({ field, value, onChange, prefilled }: { field: OnboardingField; value: string; onChange: (v: string) => void; prefilled?: boolean }) {
  const empty = !value.trim()
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 0.9rem', fontSize: '0.9rem', lineHeight: 1.65,
    border: `1px solid ${BORDER_STRONG}`, borderRadius: R, outline: 'none',
    background: FIELD, boxSizing: 'border-box', color: INK, fontFamily: FT,
  }

  const selected = field.type === 'checkboxes' ? value.split(MULTI_SEP).filter(Boolean) : []
  const toggle = (opt: string) => {
    const next = selected.includes(opt) ? selected.filter(o => o !== opt) : [...selected, opt]
    onChange(next.join(MULTI_SEP))
  }

  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 500, marginBottom: field.help ? '0.3rem' : '0.6rem', lineHeight: 1.5 }}>
        {field.label}
        {field.essential && (
          <span
            title="Question essentielle"
            style={{
              display: 'inline-block', width: 6, height: 6, borderRadius: '50%', marginLeft: 8,
              verticalAlign: 'middle', background: empty ? SIGNAL : 'rgba(10,10,11,0.15)',
            }}
          />
        )}
        {prefilled && (
          <span style={{
            marginLeft: 8, verticalAlign: 'middle', display: 'inline-block',
            fontFamily: FM, fontSize: '0.6rem', letterSpacing: '0.04em', textTransform: 'uppercase',
            color: SIGNAL_DEEP, background: 'rgba(0,214,143,0.12)', borderRadius: 99, padding: '0.1rem 0.45rem',
          }}>
            à vérifier
          </span>
        )}
      </label>
      {field.help && (
        <p style={{ fontSize: '0.8rem', color: MUTED, lineHeight: 1.65, marginBottom: '0.6rem' }}>{field.help}</p>
      )}

      {field.type === 'textarea' && (
        <textarea
          className="onb-input"
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={field.rows || 3}
          placeholder={field.placeholder}
          style={{ ...inputStyle, resize: 'vertical', minHeight: 84 }}
        />
      )}

      {field.type === 'text' && (
        <input
          className="onb-input"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          style={inputStyle}
        />
      )}

      {field.type === 'select' && (
        <select className="onb-input" value={value} onChange={e => onChange(e.target.value)} style={inputStyle}>
          <option value="">Choisir…</option>
          {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      )}

      {field.type === 'checkboxes' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {field.options?.map(o => {
            const on = selected.includes(o)
            return (
              <button
                key={o}
                type="button"
                onClick={() => toggle(o)}
                className="onb-btn"
                style={{
                  padding: '0.45rem 0.8rem', fontSize: '0.79rem',
                  border: `1px solid ${on ? INK : BORDER_STRONG}`,
                  background: on ? INK : FIELD, color: on ? BG : INK,
                }}
              >
                {o}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Documents
   ────────────────────────────────────────────────────────────────────────── */

type UploadState = { name: string; percent: number; error?: string }

type Uploader = ReturnType<typeof useUploads>

/**
 * Envois, suppressions et téléchargements de documents.
 *
 * Vit dans le formulaire et non dans une section : un envoi de 80 Mo doit
 * survivre au passage à la section suivante, et sa barre de progression le
 * retrouve intacte au retour.
 */
function useUploads({
  api, setFiles,
}: {
  api: ApiFn
  setFiles: React.Dispatch<React.SetStateAction<ClientFile[]>>
}) {
  const [uploads, setUploads] = useState<Record<string, UploadState>>({})
  const [busy, setBusy] = useState(false)

  const uploadOne = useCallback(async (slot: string, file: File) => {
    const uploadId = `${slot}::${file.name}::${file.size}`
    if (file.size > MAX_FILE_BYTES) {
      setUploads(u => ({ ...u, [uploadId]: { name: file.name, percent: 0, error: 'Trop lourd (max 100 Mo)' } }))
      return
    }
    const fileId = crypto.randomUUID()
    const chunks = chunkCount(file.size)
    setUploads(u => ({ ...u, [uploadId]: { name: file.name, percent: 0 } }))

    try {
      for (let i = 0; i < chunks; i++) {
        const dataB64 = await readChunkBase64(file, i)
        const res = await api('upload-chunk', {
          fileId, index: i, total: chunks, slot,
          name: file.name, size: file.size, mimeType: file.type || 'application/octet-stream',
          data: dataB64,
        })
        setUploads(u => ({ ...u, [uploadId]: { name: file.name, percent: Math.round(((i + 1) / chunks) * 100) } }))
        if (i === chunks - 1 && res.file) {
          const meta = res.file as ClientFile
          setFiles(prev => [...prev.filter(f => f.id !== meta.id), meta])
        }
      }
      setUploads(u => {
        const next = { ...u }
        delete next[uploadId]
        return next
      })
    } catch (err) {
      setUploads(u => ({ ...u, [uploadId]: { name: file.name, percent: 0, error: (err as Error).message || 'Échec de l’envoi' } }))
    }
  }, [api, setFiles])

  // Un fichier à la fois : plusieurs envois simultanés de 3 Mo saturent la
  // connexion du client et font échouer les morceaux les uns après les autres.
  const uploadMany = useCallback(async (slot: string, list: FileList | File[]) => {
    setBusy(true)
    for (const f of Array.from(list)) await uploadOne(slot, f)
    setBusy(false)
  }, [uploadOne])

  const removeFile = useCallback(async (file: ClientFile) => {
    if (!confirm(`Supprimer « ${file.name} » ?`)) return
    try {
      await api('delete-file', { fileId: file.id })
      setFiles(prev => prev.filter(f => f.id !== file.id))
    } catch { /* le fichier reste affiché, l'utilisateur peut retenter */ }
  }, [api, setFiles])

  const download = useCallback(async (file: ClientFile) => {
    await downloadChunkedFile(file, async i => {
      const res = await api('file-chunk', { fileId: file.id, index: i })
      return res.data as string
    })
  }, [api])

  return { uploads, busy, uploadMany, removeFile, download }
}

/** Les dépôts rattachés à une section, sous ses questions. */
function SectionDocuments({
  section, files, uploader,
}: {
  section: OnboardingSection
  files: ClientFile[]
  uploader: Uploader
}) {
  const slots = slotsForSection(section)
  if (!slots.length) return null

  return (
    <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: `1px solid ${BORDER}` }}>
      <p className="onb-eyebrow" style={{ color: MUTED, marginBottom: '0.5rem' }}>Documents</p>
      <p style={{ color: MUTED, fontSize: '0.85rem', lineHeight: 1.65, marginBottom: '1.25rem', maxWidth: 600 }}>
        Déposez ce que vous avez, même incomplet ou daté. Un document imparfait
        m’apprend souvent plus qu’une réponse écrite. Jusqu’à 100 Mo par fichier.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        {slots.map(slot => (
          <SlotCard
            key={slot.key}
            slot={slot}
            files={files.filter(f => f.slot === slot.key)}
            uploads={Object.entries(uploader.uploads).filter(([id]) => id.startsWith(`${slot.key}::`))}
            busy={uploader.busy}
            onPick={list => uploader.uploadMany(slot.key, list)}
            onRemove={uploader.removeFile}
            onDownload={uploader.download}
          />
        ))}
      </div>
    </div>
  )
}

function SlotCard({
  slot, files, uploads, busy, onPick, onRemove, onDownload,
}: {
  slot: UploadSlot
  files: ClientFile[]
  uploads: [string, UploadState][]
  busy: boolean
  onPick: (list: FileList | File[]) => void
  onRemove: (f: ClientFile) => void
  onDownload: (f: ClientFile) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => {
        e.preventDefault()
        setDragOver(false)
        if (e.dataTransfer.files?.length) onPick(e.dataTransfer.files)
      }}
      style={{
        border: `1px ${dragOver ? 'solid' : 'dashed'} ${dragOver ? SIGNAL_DEEP : BORDER_STRONG}`,
        borderRadius: R, padding: '1.1rem 1.25rem',
        background: dragOver ? 'rgba(0,214,143,0.06)' : FIELD,
        transition: 'background 0.2s ease, border-color 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: '0.9rem', fontWeight: 500, lineHeight: 1.45 }}>{slot.label}</p>
          {slot.help && <p style={{ fontSize: '0.79rem', color: MUTED, lineHeight: 1.6, marginTop: 3 }}>{slot.help}</p>}
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="onb-btn"
          style={{
            flexShrink: 0, padding: '0.5rem 0.9rem', fontSize: '0.79rem',
            border: `1px solid ${BORDER_STRONG}`, background: CARD,
            color: busy ? MUTED : INK,
          }}
        >
          Parcourir
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={e => {
            if (e.target.files?.length) onPick(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {(files.length > 0 || uploads.length > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: '0.9rem' }}>
          {files.map(f => (
            <div key={f.id} style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem', background: CARD,
              border: `1px solid ${BORDER}`, borderRadius: R, padding: '0.55rem 0.75rem',
            }}>
              <span>{fileIcon(f.mimeType, f.name)}</span>
              <span style={{ flex: 1, minWidth: 0, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.name}
              </span>
              <span style={{ fontFamily: FM, fontSize: '0.7rem', color: MUTED, flexShrink: 0 }}>{formatBytes(f.size)}</span>
              <button onClick={() => onDownload(f)} title="Télécharger"
                style={{ border: 'none', background: 'none', fontSize: '0.85rem', color: MUTED, padding: '0 3px' }}>
                ↓
              </button>
              <button onClick={() => onRemove(f)} title="Supprimer"
                style={{ border: 'none', background: 'none', fontSize: '0.85rem', color: MUTED, padding: '0 3px' }}>
                ✕
              </button>
            </div>
          ))}
          {uploads.map(([id, u]) => (
            <div key={id} style={{
              background: CARD, border: `1px solid ${u.error ? '#fecaca' : BORDER}`,
              borderRadius: R, padding: '0.55rem 0.75rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ flex: 1, minWidth: 0, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.name}
                </span>
                <span style={{ fontFamily: FM, fontSize: '0.7rem', color: u.error ? '#dc2626' : MUTED, flexShrink: 0 }}>
                  {u.error || `${u.percent} %`}
                </span>
              </div>
              {!u.error && (
                <div style={{ height: 3, background: 'rgba(10,10,11,0.08)', marginTop: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${u.percent}%`, height: '100%', background: SIGNAL, transition: 'width 0.2s' }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
