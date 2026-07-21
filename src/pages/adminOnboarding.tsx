import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ONBOARDING_SECTIONS, UPLOAD_SLOTS, FIELD_TYPES,
  answersToMarkdown, isFilled, overallProgress, sectionProgress, resolveSections,
} from '../lib/onboarding-schema'
import type { OnboardingField, OnboardingFieldType, OnboardingSection } from '../lib/onboarding-schema'
import { downloadChunkedFile, fileIcon, formatBytes } from '../lib/onboarding-files'

/**
 * Onglet « Onboarding » de /admin — l'autre bout du portail client.
 *
 * Créer un espace, transmettre le lien et le code, relire les réponses,
 * récupérer les documents. Les fichiers arrivent en morceaux et sont recollés
 * par le navigateur (voir src/lib/onboarding-files.ts).
 */

const ACCENT = '#0A0A0B'  // Ink — Brand Book 2026
const SIGNAL = '#00D68F'
const MUTED = '#6B6F7A'
const BORDER = '#e5e5e5'
const API = '/.netlify/functions/admin-onboarding'
const SITE = 'https://www.clempo.fr'

type AdminFile = {
  id: string
  slot: string
  name: string
  size: number
  mimeType: string
  chunks: number
  uploadedAt: string
}

type AdminClient = {
  id: string
  slug: string
  companyName: string
  contactName?: string
  contactEmail?: string
  internalNote?: string
  accessCode: string
  answers: Record<string, string>
  schema?: OnboardingSection[] | null
  files: AdminFile[]
  createdAt: string
  updatedAt?: string
  firstOpenedAt?: string
  lastOpenedAt?: string
  openCount?: number
  submittedAt?: string
  status: 'draft' | 'in_progress' | 'submitted'
}

const STATUS_STYLE: Record<AdminClient['status'], { label: string; bg: string; fg: string }> = {
  draft: { label: 'Jamais ouvert', bg: '#f4f4f5', fg: '#52525b' },
  in_progress: { label: 'En cours', bg: '#fef3c7', fg: '#92400e' },
  submitted: { label: 'Terminé', bg: 'rgba(0,214,143,0.15)', fg: '#009E68' },
}

function fmtDate(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })
}

function fmtDateTime(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function OnboardingView({ password }: { password: string }) {
  const [clients, setClients] = useState<AdminClient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState('')

  const api = useCallback(async (payload: Record<string, unknown>) => {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` },
      body: JSON.stringify(payload),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json.error || 'Erreur serveur')
    return json
  }, [password])

  const reload = useCallback(async () => {
    try {
      const res = await fetch(API, { headers: { Authorization: `Bearer ${password}` } })
      if (!res.ok) throw new Error('Erreur serveur')
      const json = await res.json()
      setClients(json.clients || [])
      setError('')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [password])

  useEffect(() => { void reload() }, [reload])

  const flash = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2200)
  }, [])

  const copy = useCallback((text: string, label: string) => {
    void navigator.clipboard.writeText(text).then(() => flash(`${label} copié`))
  }, [flash])

  const selected = clients.find(c => c.id === selectedId) || null

  if (loading) return <div style={{ padding: '2rem', color: MUTED, fontSize: '0.85rem' }}>Chargement…</div>

  return (
    <div style={{ padding: '2rem', maxWidth: 1100 }}>
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 50, background: '#111', color: '#fff',
          padding: '0.7rem 1.1rem', borderRadius: 10, fontSize: '0.8rem', fontWeight: 500,
        }}>
          {toast}
        </div>
      )}

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: 10, fontSize: '0.8rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {selected ? (
        <ClientDetail
          client={selected}
          api={api}
          reload={reload}
          onBack={() => setSelectedId(null)}
          onDeleted={() => { setSelectedId(null); void reload() }}
          copy={copy}
          password={password}
        />
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: ACCENT }}>Onboarding client</h2>
              <p style={{ fontSize: '0.8rem', color: MUTED, marginTop: 2 }}>
                Un espace par client signé. Le lien et le code se transmettent par email.
              </p>
            </div>
            <button
              onClick={() => setCreating(v => !v)}
              style={{
                padding: '0.6rem 1.1rem', borderRadius: 10, border: 'none', background: ACCENT,
                color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              {creating ? 'Annuler' : '+ Nouvel onboarding'}
            </button>
          </div>

          {creating && (
            <CreateForm
              api={api}
              onCreated={async (client) => {
                setCreating(false)
                await reload()
                setSelectedId(client.id)
              }}
            />
          )}

          {clients.length === 0 ? (
            <div style={{ border: `1px dashed ${BORDER}`, borderRadius: 14, padding: '3rem 2rem', textAlign: 'center' }}>
              <p style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>📋</p>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.3rem' }}>Aucun onboarding pour l’instant</p>
              <p style={{ fontSize: '0.8rem', color: MUTED }}>
                Créez-en un après chaque signature : le client remplit à son rythme, vous récupérez tout ici.
              </p>
            </div>
          ) : (
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: '#fafafa', textAlign: 'left' }}>
                    <Th>Client</Th>
                    <Th>Statut</Th>
                    <Th>Avancement</Th>
                    <Th>Docs</Th>
                    <Th>Dernière activité</Th>
                    <Th>Code</Th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map(c => {
                    const p = overallProgress(c.answers || {}, resolveSections(c.schema))
                    const st = STATUS_STYLE[c.status]
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedId(c.id)}
                        style={{ borderTop: `1px solid ${BORDER}`, cursor: 'pointer' }}
                      >
                        <Td>
                          <div style={{ fontWeight: 600 }}>
                            {c.companyName}
                            {c.schema && c.schema.length > 0 && (
                              <span title="Questionnaire sur mesure" style={{ marginLeft: 6, fontSize: '0.7rem', color: SIGNAL }}>✨</span>
                            )}
                          </div>
                          <div style={{ color: MUTED, fontSize: '0.72rem' }}>/{c.slug}</div>
                        </Td>
                        <Td>
                          <span style={{
                            background: st.bg, color: st.fg, padding: '0.2rem 0.5rem',
                            borderRadius: 6, fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap',
                          }}>
                            {st.label}
                          </span>
                        </Td>
                        <Td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 60, height: 5, background: '#eee', borderRadius: 99, overflow: 'hidden' }}>
                              <div style={{ width: `${p.percent}%`, height: '100%', background: SIGNAL }} />
                            </div>
                            <span style={{ color: MUTED, fontSize: '0.72rem' }}>{p.percent} %</span>
                          </div>
                          <div style={{ color: p.essentialFilled === p.essentialTotal ? '#009E68' : MUTED, fontSize: '0.7rem', marginTop: 2 }}>
                            essentiel {p.essentialFilled}/{p.essentialTotal}
                          </div>
                        </Td>
                        <Td>{(c.files || []).length || '—'}</Td>
                        <Td style={{ color: MUTED, fontSize: '0.75rem' }}>{fmtDate(c.updatedAt || c.createdAt)}</Td>
                        <Td>
                          <code style={{
                            background: '#f4f4f5', padding: '0.15rem 0.4rem', borderRadius: 5,
                            fontSize: '0.72rem', letterSpacing: '0.06em',
                          }}>
                            {c.accessCode}
                          </code>
                        </Td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Création
   ────────────────────────────────────────────────────────────────────────── */

function CreateForm({
  api, onCreated,
}: {
  api: (p: Record<string, unknown>) => Promise<Record<string, unknown>>
  onCreated: (c: AdminClient) => void | Promise<void>
}) {
  const [companyName, setCompanyName] = useState('')
  const [slug, setSlug] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  // Le slug suit le nom tant que Clément ne l'a pas édité à la main.
  const [slugTouched, setSlugTouched] = useState(false)
  const autoSlug = companyName.toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  const effectiveSlug = slugTouched ? slug : autoSlug

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      const json = await api({ action: 'create', companyName, slug: effectiveSlug, contactName, contactEmail })
      await onCreated(json.client as AdminClient)
    } catch (e2) {
      setErr((e2 as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: '1.25rem', marginBottom: '1.5rem', background: '#fafafa' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
        <LabeledInput label="Nom de l’entreprise" value={companyName} onChange={setCompanyName} required autoFocus />
        <LabeledInput
          label="Slug (URL)"
          value={effectiveSlug}
          onChange={v => { setSlugTouched(true); setSlug(v) }}
          prefix="clempo.fr/"
        />
        <LabeledInput label="Contact (nom)" value={contactName} onChange={setContactName} />
        <LabeledInput label="Contact (email)" value={contactEmail} onChange={setContactEmail} type="email" />
      </div>
      {err && <p style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: '0.75rem' }}>{err}</p>}
      <button
        type="submit"
        disabled={busy || !companyName.trim() || !effectiveSlug}
        style={{
          marginTop: '1rem', padding: '0.6rem 1.2rem', borderRadius: 10, border: 'none',
          background: busy || !companyName.trim() ? '#c7c7cd' : ACCENT, color: '#fff',
          fontSize: '0.8rem', fontWeight: 600, cursor: busy ? 'default' : 'pointer',
        }}
      >
        {busy ? 'Création…' : 'Créer l’espace'}
      </button>
    </form>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Détail d'un client
   ────────────────────────────────────────────────────────────────────────── */

function ClientDetail({
  client, api, reload, onBack, onDeleted, copy, password,
}: {
  client: AdminClient
  api: (p: Record<string, unknown>) => Promise<Record<string, unknown>>
  reload: () => Promise<void>
  onBack: () => void
  onDeleted: () => void
  copy: (text: string, label: string) => void
  password: string
}) {
  const [showEmpty, setShowEmpty] = useState(false)
  const [note, setNote] = useState(client.internalNote || '')
  const [downloading, setDownloading] = useState<Record<string, string>>({})
  const [studioOpen, setStudioOpen] = useState(false)
  const answers = client.answers || {}
  const files = client.files || []
  const sections = useMemo(() => resolveSections(client.schema), [client.schema])
  const personalized = !!(client.schema && client.schema.length)
  const progress = useMemo(() => overallProgress(answers, sections), [answers, sections])
  const url = `${SITE}/${client.slug}`

  const emailBody = useMemo(() => (
    `Bonjour${client.contactName ? ' ' + client.contactName.split(' ')[0] : ''},\n\n` +
    `Avant qu'on démarre, j'ai préparé un espace pour rassembler ce dont j'ai besoin : ` +
    `objectifs, cibles, produit, marketing déjà fait, concurrence, équipe, et vos documents.\n\n` +
    `👉 ${url}\n` +
    `Code d'accès : ${client.accessCode}\n\n` +
    `Tout est enregistré au fur et à mesure : vous pouvez le remplir en plusieurs fois, ` +
    `et déposer vos fichiers (BP, decks, créas, vidéo produit) directement dessus.\n\n` +
    `À très vite,\nClément`
  ), [client.contactName, client.accessCode, url])

  const saveNote = async () => {
    await api({ action: 'update', id: client.id, patch: { internalNote: note } })
    await reload()
  }

  const download = async (file: AdminFile) => {
    setDownloading(d => ({ ...d, [file.id]: '0 %' }))
    try {
      await downloadChunkedFile(
        file,
        async i => {
          const res = await fetch(API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` },
            body: JSON.stringify({ action: 'file-chunk', id: client.id, fileId: file.id, index: i }),
          })
          const json = await res.json()
          if (!res.ok) throw new Error(json.error || 'Erreur')
          return json.data as string
        },
        (done, total) => setDownloading(d => ({ ...d, [file.id]: `${Math.round((done / total) * 100)} %` })),
      )
    } finally {
      setDownloading(d => {
        const next = { ...d }
        delete next[file.id]
        return next
      })
    }
  }

  return (
    <div>
      <button
        onClick={onBack}
        style={{ border: 'none', background: 'none', color: MUTED, fontSize: '0.8rem', cursor: 'pointer', marginBottom: '1rem', padding: 0 }}
      >
        ← Tous les onboardings
      </button>

      {/* En-tête */}
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: ACCENT }}>{client.companyName}</h2>
            <p style={{ fontSize: '0.8rem', color: MUTED, marginTop: 2 }}>
              {client.contactName || 'Contact non renseigné'}
              {client.contactEmail && ` · ${client.contactEmail}`}
            </p>
          </div>
          <span style={{
            background: STATUS_STYLE[client.status].bg, color: STATUS_STYLE[client.status].fg,
            padding: '0.3rem 0.7rem', borderRadius: 7, fontSize: '0.75rem', fontWeight: 600,
          }}>
            {STATUS_STYLE[client.status].label}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1.25rem' }}>
          <Pill onClick={() => copy(url, 'Lien')}>🔗 {url.replace('https://www.', '')}</Pill>
          <Pill onClick={() => copy(client.accessCode, 'Code')}>🔑 {client.accessCode}</Pill>
          <Pill onClick={() => copy(emailBody, 'Email')}>✉️ Copier l’email d’invitation</Pill>
          <Pill onClick={() => copy(answersToMarkdown(client.companyName, answers, files, sections), 'Dossier')}>
            📄 Copier tout le dossier
          </Pill>
        </div>

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '1.25rem', fontSize: '0.78rem' }}>
          <Stat label="Réponses" value={`${progress.filled} / ${progress.total}`} />
          <Stat
            label="Questions essentielles"
            value={`${progress.essentialFilled} / ${progress.essentialTotal}`}
            highlight={progress.essentialFilled === progress.essentialTotal}
          />
          <Stat label="Documents" value={String(files.length)} />
          <Stat label="Ouvertures" value={String(client.openCount || 0)} />
          <Stat label="Dernière activité" value={fmtDateTime(client.updatedAt || client.createdAt)} />
          {client.submittedAt && <Stat label="Transmis le" value={fmtDateTime(client.submittedAt)} highlight />}
        </div>
      </div>

      {/* Questionnaire */}
      <div style={{
        border: `1px solid ${personalized ? 'rgba(0,214,143,0.4)' : BORDER}`, borderRadius: 14,
        padding: '1.25rem', marginBottom: '0.9rem',
        background: personalized ? 'rgba(0,214,143,0.05)' : '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              {personalized ? '✨ Questionnaire sur mesure' : 'Questionnaire standard'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: MUTED, marginTop: 3, lineHeight: 1.55, maxWidth: 560 }}>
              {personalized
                ? `${sections.length} sections, ${sections.reduce((n, s) => n + s.fields.length, 0)} questions adaptées au contexte de ce client.`
                : 'Les 9 sections par défaut. Personnalisez-les à partir du contexte du client (son devis, ses enjeux) pour des questions vraiment pertinentes.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, flexWrap: 'wrap' }}>
            {personalized && (
              <button
                onClick={async () => {
                  if (!confirm('Revenir au questionnaire standard ? Les réponses déjà données sont conservées.')) return
                  await api({ action: 'reset-schema', id: client.id })
                  await reload()
                }}
                style={{
                  padding: '0.5rem 0.9rem', borderRadius: 9, fontSize: '0.78rem', fontWeight: 600,
                  border: `1px solid ${BORDER}`, background: '#fff', color: '#111', cursor: 'pointer',
                }}
              >
                Revenir au standard
              </button>
            )}
            <button
              onClick={() => setStudioOpen(true)}
              style={{
                padding: '0.5rem 0.95rem', borderRadius: 9, fontSize: '0.78rem', fontWeight: 600,
                border: 'none', background: ACCENT, color: '#fff', cursor: 'pointer',
              }}
            >
              {personalized ? 'Modifier le questionnaire' : '✨ Personnaliser avec l’IA'}
            </button>
          </div>
        </div>
      </div>

      {studioOpen && (
        <SchemaStudio
          client={client}
          password={password}
          onClose={() => setStudioOpen(false)}
          onSaved={async () => { setStudioOpen(false); await reload() }}
        />
      )}

      {/* Documents */}
      <Panel title={`Documents (${files.length})`}>
        {files.length === 0 ? (
          <p style={{ fontSize: '0.82rem', color: MUTED }}>Aucun document déposé pour l’instant.</p>
        ) : (
          UPLOAD_SLOTS.map(slot => {
            const inSlot = files.filter(f => f.slot === slot.key)
            if (!inSlot.length) return null
            return (
              <div key={slot.key} style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                  {slot.label}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {inSlot.map(f => (
                    <div key={f.id} style={{
                      display: 'flex', alignItems: 'center', gap: '0.6rem',
                      border: `1px solid ${BORDER}`, borderRadius: 10, padding: '0.55rem 0.75rem',
                    }}>
                      <span>{fileIcon(f.mimeType, f.name)}</span>
                      <span style={{ flex: 1, minWidth: 0, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.name}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: MUTED }}>{formatBytes(f.size)}</span>
                      <span style={{ fontSize: '0.72rem', color: MUTED }}>{fmtDate(f.uploadedAt)}</span>
                      <button
                        onClick={() => void download(f)}
                        disabled={!!downloading[f.id]}
                        style={{
                          border: `1px solid ${BORDER}`, background: '#fff', borderRadius: 8,
                          padding: '0.25rem 0.6rem', fontSize: '0.72rem', fontWeight: 600,
                          color: ACCENT, cursor: downloading[f.id] ? 'default' : 'pointer', whiteSpace: 'nowrap',
                        }}
                      >
                        {downloading[f.id] || 'Télécharger'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </Panel>

      {/* Réponses */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '1.5rem 0 0.75rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Réponses</h3>
        <label style={{ fontSize: '0.78rem', color: MUTED, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input type="checkbox" checked={showEmpty} onChange={e => setShowEmpty(e.target.checked)} />
          Afficher les questions sans réponse
        </label>
      </div>

      {sections.map(section => {
        const sp = sectionProgress(answers, section)
        const visible = section.fields.filter(f => showEmpty || isFilled(answers, f.key))
        if (!visible.length) return null
        return (
          <Panel
            key={section.id}
            title={`${section.icon} ${section.title}`}
            badge={`${sp.filled}/${sp.total}`}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {visible.map(f => {
                const filled = isFilled(answers, f.key)
                return (
                  <div key={f.key}>
                    <p style={{ fontSize: '0.78rem', fontWeight: 600, color: MUTED, marginBottom: '0.3rem' }}>
                      {f.label}
                      {f.essential && !filled && (
                        <span style={{ color: '#dc2626', marginLeft: 6, fontWeight: 500 }}>· essentiel, sans réponse</span>
                      )}
                    </p>
                    <p style={{
                      fontSize: '0.88rem', lineHeight: 1.65, whiteSpace: 'pre-wrap',
                      color: filled ? '#111' : '#c7c7cd',
                    }}>
                      {filled ? answers[f.key] : '—'}
                    </p>
                  </div>
                )
              })}
            </div>
          </Panel>
        )
      })}

      {/* Note interne + actions */}
      <Panel title="Note interne">
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          onBlur={() => void saveNote()}
          rows={3}
          placeholder="Visible uniquement ici. Ce que vous voulez retenir sur ce client."
          style={{
            width: '100%', padding: '0.7rem', fontSize: '0.85rem', border: `1px solid ${BORDER}`,
            borderRadius: 10, outline: 'none', boxSizing: 'border-box', resize: 'vertical',
            fontFamily: "'Inter', sans-serif", lineHeight: 1.6,
          }}
        />
      </Panel>

      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: `1px solid ${BORDER}` }}>
        <DangerButton
          onClick={async () => {
            if (!confirm('Générer un nouveau code ? L’ancien cessera immédiatement de fonctionner et le client devra ressaisir le nouveau.')) return
            await api({ action: 'regenerate-code', id: client.id })
            await reload()
          }}
          tone="neutral"
        >
          Régénérer le code
        </DangerButton>
        {client.status === 'submitted' && (
          <DangerButton
            onClick={async () => {
              await api({ action: 'reopen', id: client.id })
              await reload()
            }}
            tone="neutral"
          >
            Rouvrir le questionnaire
          </DangerButton>
        )}
        <DangerButton
          onClick={async () => {
            if (!confirm(`Supprimer définitivement l’onboarding de ${client.companyName}, réponses et documents compris ?`)) return
            await api({ action: 'delete', id: client.id })
            onDeleted()
          }}
          tone="danger"
        >
          Supprimer
        </DangerButton>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Studio de personnalisation du questionnaire
   ────────────────────────────────────────────────────────────────────────── */

/** Clé unique pour une nouvelle question, dérivée de son intitulé. */
function freshKey(label: string, taken: Set<string>): string {
  const base = (label || 'question')
    .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'question'
  let key = base
  let n = 2
  while (taken.has(key)) key = `${base}_${n++}`
  return key
}

function allKeys(sections: OnboardingSection[]): Set<string> {
  return new Set(sections.flatMap(s => s.fields.map(f => f.key)))
}

/** Copie profonde d'un schéma, pour éditer sans muter la source. */
function cloneSections(sections: OnboardingSection[]): OnboardingSection[] {
  return sections.map(s => ({
    ...s,
    uploads: s.uploads ? [...s.uploads] : undefined,
    fields: s.fields.map(f => ({ ...f, options: f.options ? [...f.options] : undefined })),
  }))
}

type StudioMode = 'context' | 'editing'

function SchemaStudio({
  client, password, onClose, onSaved,
}: {
  client: AdminClient
  password: string
  onClose: () => void
  onSaved: () => void | Promise<void>
}) {
  const hasAnswers = Object.keys(client.answers || {}).length > 0
  const [mode, setMode] = useState<StudioMode>(client.schema && client.schema.length ? 'editing' : 'context')
  const [draft, setDraft] = useState<OnboardingSection[]>(
    client.schema && client.schema.length ? cloneSections(client.schema) : [],
  )
  const [context, setContext] = useState('')
  const [instructions, setInstructions] = useState('')
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')

  const authFetch = useCallback(async (url: string, payload: Record<string, unknown>) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` },
      body: JSON.stringify(payload),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json.error || 'Erreur serveur')
    return json
  }, [password])

  // Importe le contexte d'un devis signé de la même entreprise, s'il existe.
  const importQuote = async () => {
    setErr('')
    setBusy('quote')
    try {
      const res = await fetch('/.netlify/functions/admin-quotes', { headers: { Authorization: `Bearer ${password}` } })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur devis')
      const norm = (s: string) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
      const target = norm(client.companyName)
      const quotes = (json.quotes || []) as QuoteLike[]
      const match = quotes
        .filter(q => { const n = norm(q.companyName || ''); return n && (n === target || n.includes(target) || target.includes(n)) })
        .sort((a, b) => (a.status === 'accepted' ? -1 : 1) - (b.status === 'accepted' ? -1 : 1))[0]
      if (!match) { setErr(`Aucun devis trouvé pour « ${client.companyName} ». Collez le contexte à la main.`); return }
      setContext(c => (c ? c + '\n\n' : '') + quoteToText(match))
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy('')
    }
  }

  // La génération dépasse le timeout d'une fonction synchrone : on lance une
  // fonction background (202 immédiat) qui écrit le résultat dans le store, puis
  // on interroge jusqu'à retrouver notre jobId.
  const generate = async () => {
    setErr('')
    setBusy('generate')
    const jobId = crypto.randomUUID()
    try {
      await fetch('/.netlify/functions/admin-onboarding-generate-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` },
        body: JSON.stringify({
          clientId: client.id, jobId, context, instructions,
          companyName: client.companyName, baseSchema: ONBOARDING_SECTIONS,
        }),
      })
      const deadline = Date.now() + 120000
      while (Date.now() < deadline) {
        await new Promise(r => setTimeout(r, 2500))
        const json = await authFetch('/.netlify/functions/admin-onboarding', { action: 'generation-status', id: client.id })
        const g = json.generation as { jobId: string; status: string; sections?: OnboardingSection[]; error?: string } | null
        if (g && g.jobId === jobId) {
          if (g.status === 'error') throw new Error(g.error || 'Génération échouée')
          setDraft(g.sections || [])
          setMode('editing')
          setBusy('')
          return
        }
      }
      throw new Error('La génération a expiré (2 min). Réessayez.')
    } catch (e) {
      setErr((e as Error).message)
      setBusy('')
    }
  }

  const save = async () => {
    setErr('')
    setBusy('save')
    try {
      await authFetch('/.netlify/functions/admin-onboarding', { action: 'set-schema', id: client.id, schema: draft })
      await onSaved()
    } catch (e) {
      setErr((e as Error).message)
      setBusy('')
    }
  }

  /* Mutations du brouillon ─────────────────────────────────────────────── */
  const patchSection = (i: number, patch: Partial<OnboardingSection>) =>
    setDraft(d => d.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))
  const patchField = (si: number, fi: number, patch: Partial<OnboardingField>) =>
    setDraft(d => d.map((s, idx) => idx !== si ? s : { ...s, fields: s.fields.map((f, j) => (j === fi ? { ...f, ...patch } : f)) }))
  const moveSection = (i: number, dir: -1 | 1) =>
    setDraft(d => { const j = i + dir; if (j < 0 || j >= d.length) return d; const n = [...d]; [n[i], n[j]] = [n[j], n[i]]; return n })
  const moveField = (si: number, fi: number, dir: -1 | 1) =>
    setDraft(d => d.map((s, idx) => { if (idx !== si) return s; const j = fi + dir; if (j < 0 || j >= s.fields.length) return s; const f = [...s.fields]; [f[fi], f[j]] = [f[j], f[fi]]; return { ...s, fields: f } }))
  const deleteSection = (i: number) =>
    setDraft(d => d.filter((_, idx) => idx !== i))
  const deleteField = (si: number, fi: number) =>
    setDraft(d => d.map((s, idx) => (idx === si ? { ...s, fields: s.fields.filter((_, j) => j !== fi) } : s)))
  const addField = (si: number) =>
    setDraft(d => d.map((s, idx) => idx !== si ? s : { ...s, fields: [...s.fields, { key: freshKey('nouvelle question', allKeys(d)), label: 'Nouvelle question', type: 'textarea' as OnboardingFieldType, rows: 3 }] }))
  const addSection = () =>
    setDraft(d => [...d, { id: `section_${d.length + 1}_${Math.round(performance.now())}`, title: 'Nouvelle section', icon: '📋', fields: [] }])
  const toggleUpload = (si: number, key: string) =>
    setDraft(d => d.map((s, idx) => { if (idx !== si) return s; const up = new Set(s.uploads || []); up.has(key) ? up.delete(key) : up.add(key); return { ...s, uploads: [...up] } }))

  const totalFields = draft.reduce((n, s) => n + s.fields.length, 0)
  const totalEssential = draft.reduce((n, s) => n + s.fields.filter(f => f.essential).length, 0)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(10,10,11,0.4)',
      display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflowY: 'auto', padding: '2.5rem 1rem',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 820, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
      >
        {/* En-tête sticky */}
        <div style={{
          position: 'sticky', top: 0, background: '#fff', borderBottom: `1px solid ${BORDER}`,
          borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: '1.1rem 1.5rem', zIndex: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
        }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: ACCENT }}>
              Questionnaire — {client.companyName}
            </h2>
            {mode === 'editing' && (
              <p style={{ fontSize: '0.75rem', color: MUTED, marginTop: 2 }}>
                {draft.length} sections · {totalFields} questions · {totalEssential} essentielles
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {mode === 'editing' && (
              <button onClick={() => setMode('context')} style={ghostBtn}>↻ Regénérer</button>
            )}
            <button onClick={onClose} style={ghostBtn}>Fermer</button>
            {mode === 'editing' && (
              <button
                onClick={() => void save()}
                disabled={busy === 'save' || !draft.length}
                style={{ ...primaryBtn, opacity: busy === 'save' || !draft.length ? 0.6 : 1 }}
              >
                {busy === 'save' ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            )}
          </div>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {err && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.7rem 0.9rem', borderRadius: 9, fontSize: '0.8rem', marginBottom: '1rem' }}>
              {err}
            </div>
          )}

          {mode === 'context' ? (
            <div>
              <p style={{ fontSize: '0.85rem', color: '#333', lineHeight: 1.6, marginBottom: '1rem' }}>
                Donnez à l’IA le contexte de ce client. Elle part des 9 sections standard,
                retire les questions hors-sujet, reformule avec son vocabulaire et ajoute
                les questions propres à sa mission. Vous pourrez tout retoucher ensuite.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: MUTED }}>Contexte du client</label>
                <button onClick={() => void importQuote()} disabled={busy === 'quote'} style={ghostBtnSm}>
                  {busy === 'quote' ? 'Import…' : '↧ Importer le devis signé'}
                </button>
              </div>
              <textarea
                value={context}
                onChange={e => setContext(e.target.value)}
                rows={9}
                placeholder="Collez le devis, un compte-rendu d'appel, ou décrivez : ce que fait le client, sa cible, où il en est, la mission signée, ses enjeux…"
                style={studioTextarea}
              />

              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: MUTED, margin: '1rem 0 0.4rem' }}>
                Consignes particulières <span style={{ fontWeight: 400 }}>(facultatif)</span>
              </label>
              <textarea
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                rows={2}
                placeholder="Ex. insister sur le réglementaire, zapper la partie levée de fonds…"
                style={studioTextarea}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => void generate()}
                  disabled={busy === 'generate' || context.trim().length < 20}
                  style={{ ...primaryBtn, padding: '0.7rem 1.3rem', opacity: busy === 'generate' || context.trim().length < 20 ? 0.6 : 1 }}
                >
                  {busy === 'generate' ? 'Génération en cours… (~30 s)' : '✨ Générer le questionnaire'}
                </button>
                <button
                  onClick={() => { setDraft(cloneSections(ONBOARDING_SECTIONS)); setMode('editing') }}
                  style={ghostBtn}
                >
                  Partir du standard et éditer à la main
                </button>
              </div>
            </div>
          ) : (
            <div>
              {hasAnswers && (
                <div style={{ background: '#fef3c7', color: '#92400e', padding: '0.6rem 0.85rem', borderRadius: 9, fontSize: '0.78rem', marginBottom: '1rem', lineHeight: 1.5 }}>
                  Ce client a déjà commencé à répondre. Évitez de supprimer les questions
                  déjà remplies : leurs réponses resteraient stockées mais ne s’afficheraient plus.
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {draft.map((section, si) => (
                  <SectionEditor
                    key={section.id}
                    section={section}
                    index={si}
                    total={draft.length}
                    onPatch={patch => patchSection(si, patch)}
                    onPatchField={(fi, patch) => patchField(si, fi, patch)}
                    onMove={dir => moveSection(si, dir)}
                    onMoveField={(fi, dir) => moveField(si, fi, dir)}
                    onDelete={() => deleteSection(si)}
                    onDeleteField={fi => deleteField(si, fi)}
                    onAddField={() => addField(si)}
                    onToggleUpload={key => toggleUpload(si, key)}
                  />
                ))}
              </div>
              <button onClick={addSection} style={{ ...ghostBtn, marginTop: '1rem', width: '100%', padding: '0.7rem' }}>
                + Ajouter une section
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SectionEditor({
  section, index, total, onPatch, onPatchField, onMove, onMoveField, onDelete, onDeleteField, onAddField, onToggleUpload,
}: {
  section: OnboardingSection
  index: number
  total: number
  onPatch: (patch: Partial<OnboardingSection>) => void
  onPatchField: (fi: number, patch: Partial<OnboardingField>) => void
  onMove: (dir: -1 | 1) => void
  onMoveField: (fi: number, dir: -1 | 1) => void
  onDelete: () => void
  onDeleteField: (fi: number) => void
  onAddField: () => void
  onToggleUpload: (key: string) => void
}) {
  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: '1rem', background: '#fafafa' }}>
      {/* Ligne titre de section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
        <input
          value={section.icon}
          onChange={e => onPatch({ icon: e.target.value })}
          style={{ ...miniInput, width: 44, textAlign: 'center', fontSize: '1rem' }}
          aria-label="Emoji de section"
        />
        <input
          value={section.title}
          onChange={e => onPatch({ title: e.target.value })}
          style={{ ...miniInput, flex: 1, fontWeight: 600 }}
          placeholder="Titre de la section"
        />
        <IconBtn title="Monter" disabled={index === 0} onClick={() => onMove(-1)}>↑</IconBtn>
        <IconBtn title="Descendre" disabled={index === total - 1} onClick={() => onMove(1)}>↓</IconBtn>
        <IconBtn title="Supprimer la section" danger onClick={() => { if (confirm(`Supprimer la section « ${section.title} » et ses questions ?`)) onDelete() }}>✕</IconBtn>
      </div>
      <input
        value={section.intro || ''}
        onChange={e => onPatch({ intro: e.target.value })}
        style={{ ...miniInput, width: '100%', fontSize: '0.78rem', color: MUTED, marginBottom: '0.75rem', boxSizing: 'border-box' }}
        placeholder="Intro de section (facultatif)"
      />

      {/* Questions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {section.fields.map((f, fi) => (
          <FieldEditor
            key={f.key}
            field={f}
            first={fi === 0}
            last={fi === section.fields.length - 1}
            onPatch={patch => onPatchField(fi, patch)}
            onMove={dir => onMoveField(fi, dir)}
            onDelete={() => onDeleteField(fi)}
          />
        ))}
      </div>
      <button onClick={onAddField} style={{ ...ghostBtnSm, marginTop: '0.6rem' }}>+ question</button>

      {/* Dépôts de documents */}
      <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: `1px dashed ${BORDER}` }}>
        <p style={{ fontSize: '0.68rem', fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
          Documents à déposer ici
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {UPLOAD_SLOTS.map(slot => {
            const on = (section.uploads || []).includes(slot.key)
            return (
              <button
                key={slot.key}
                onClick={() => onToggleUpload(slot.key)}
                title={slot.help}
                style={{
                  padding: '0.3rem 0.6rem', borderRadius: 99, fontSize: '0.72rem', cursor: 'pointer',
                  border: `1px solid ${on ? ACCENT : BORDER}`, background: on ? ACCENT : '#fff', color: on ? '#fff' : '#555',
                }}
              >
                {on ? '✓ ' : ''}{slot.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function FieldEditor({
  field, first, last, onPatch, onMove, onDelete,
}: {
  field: OnboardingField
  first: boolean
  last: boolean
  onPatch: (patch: Partial<OnboardingField>) => void
  onMove: (dir: -1 | 1) => void
  onDelete: () => void
}) {
  const needsOptions = field.type === 'select' || field.type === 'checkboxes'
  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 9, padding: '0.6rem', background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <input
          value={field.label}
          onChange={e => onPatch({ label: e.target.value })}
          style={{ ...miniInput, flex: 1, fontWeight: 500 }}
          placeholder="Intitulé de la question"
        />
        <IconBtn title="Monter" disabled={first} onClick={() => onMove(-1)}>↑</IconBtn>
        <IconBtn title="Descendre" disabled={last} onClick={() => onMove(1)}>↓</IconBtn>
        <IconBtn title="Supprimer" danger onClick={onDelete}>✕</IconBtn>
      </div>
      <input
        value={field.help || ''}
        onChange={e => onPatch({ help: e.target.value })}
        style={{ ...miniInput, width: '100%', fontSize: '0.76rem', color: MUTED, marginTop: '0.4rem', boxSizing: 'border-box' }}
        placeholder="Aide sous la question (facultatif)"
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.45rem', flexWrap: 'wrap' }}>
        <select
          value={field.type}
          onChange={e => onPatch({ type: e.target.value as OnboardingFieldType })}
          style={{ ...miniInput, width: 'auto', fontSize: '0.76rem', cursor: 'pointer' }}
        >
          {FIELD_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.76rem', color: '#333', cursor: 'pointer' }}>
          <input type="checkbox" checked={!!field.essential} onChange={e => onPatch({ essential: e.target.checked })} />
          Essentielle
        </label>
      </div>
      {needsOptions && (
        <input
          value={(field.options || []).join(', ')}
          onChange={e => onPatch({ options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
          style={{ ...miniInput, width: '100%', fontSize: '0.76rem', marginTop: '0.45rem', boxSizing: 'border-box' }}
          placeholder="Options séparées par des virgules"
        />
      )}
    </div>
  )
}

/* Devis → texte de contexte ─────────────────────────────────────────────── */

type QuoteLike = {
  companyName?: string
  status?: string
  offerTitle?: string
  context?: { title?: string; description?: string }
  arguments?: { title?: string; description?: string }[]
  lines?: { description?: string; detail?: string }[]
  notes?: string
}

function stripHtml(s?: string): string {
  return (s || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

function quoteToText(q: QuoteLike): string {
  const out: string[] = []
  if (q.offerTitle) out.push(`Offre : ${stripHtml(q.offerTitle)}`)
  if (q.context?.title || q.context?.description) {
    out.push(`${stripHtml(q.context.title) || 'Contexte'} : ${stripHtml(q.context.description)}`)
  }
  for (const a of q.arguments || []) {
    if (a.title || a.description) out.push(`• ${stripHtml(a.title)} : ${stripHtml(a.description)}`)
  }
  for (const l of q.lines || []) {
    const d = [stripHtml(l.description), stripHtml(l.detail)].filter(Boolean).join(' — ')
    if (d) out.push(`Prestation : ${d}`)
  }
  if (q.notes) out.push(`Notes : ${stripHtml(q.notes)}`)
  return out.join('\n')
}

const TYPE_LABELS: Record<OnboardingFieldType, string> = {
  text: 'Texte court',
  textarea: 'Texte long',
  select: 'Liste déroulante',
  checkboxes: 'Cases à cocher',
}

const miniInput: React.CSSProperties = {
  padding: '0.4rem 0.55rem', fontSize: '0.82rem', border: `1px solid ${BORDER}`,
  borderRadius: 7, outline: 'none', background: '#fff', fontFamily: "'Inter', sans-serif",
}
const ghostBtn: React.CSSProperties = {
  padding: '0.5rem 0.9rem', borderRadius: 9, fontSize: '0.78rem', fontWeight: 600,
  border: `1px solid ${BORDER}`, background: '#fff', color: '#111', cursor: 'pointer',
}
const ghostBtnSm: React.CSSProperties = {
  padding: '0.35rem 0.7rem', borderRadius: 8, fontSize: '0.74rem', fontWeight: 600,
  border: `1px solid ${BORDER}`, background: '#fff', color: ACCENT, cursor: 'pointer',
}
const primaryBtn: React.CSSProperties = {
  padding: '0.5rem 1.1rem', borderRadius: 9, fontSize: '0.8rem', fontWeight: 600,
  border: 'none', background: ACCENT, color: '#fff', cursor: 'pointer',
}
const studioTextarea: React.CSSProperties = {
  width: '100%', padding: '0.7rem 0.85rem', fontSize: '0.85rem', border: `1px solid ${BORDER}`,
  borderRadius: 10, outline: 'none', boxSizing: 'border-box', resize: 'vertical',
  fontFamily: "'Inter', sans-serif", lineHeight: 1.55,
}

function IconBtn({
  children, onClick, title, disabled, danger,
}: {
  children: React.ReactNode
  onClick: () => void
  title: string
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        width: 26, height: 26, flexShrink: 0, borderRadius: 6, border: `1px solid ${BORDER}`,
        background: '#fff', cursor: disabled ? 'default' : 'pointer', fontSize: '0.72rem',
        color: disabled ? '#ccc' : danger ? '#dc2626' : '#555', lineHeight: 1,
      }}
    >
      {children}
    </button>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Éléments d'interface
   ────────────────────────────────────────────────────────────────────────── */

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{ padding: '0.6rem 0.85rem', fontSize: '0.72rem', fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {children}
    </th>
  )
}

function Td({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <td style={{ padding: '0.7rem 0.85rem', verticalAlign: 'top', ...style }}>{children}</td>
}

function Panel({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: '1.25rem', marginBottom: '0.9rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
        <h3 style={{ fontSize: '0.92rem', fontWeight: 700 }}>{title}</h3>
        {badge && <span style={{ fontSize: '0.72rem', color: MUTED, fontWeight: 600 }}>{badge}</span>}
      </div>
      {children}
    </div>
  )
}

function Pill({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.45rem 0.8rem', borderRadius: 99, border: `1px solid ${BORDER}`,
        background: '#fff', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer', color: '#111',
      }}
    >
      {children}
    </button>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p style={{ fontSize: '0.68rem', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: '0.85rem', fontWeight: 600, color: highlight ? '#009E68' : '#111' }}>{value}</p>
    </div>
  )
}

function LabeledInput({
  label, value, onChange, type = 'text', required, autoFocus, prefix,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  autoFocus?: boolean
  prefix?: string
}) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: MUTED, marginBottom: '0.3rem' }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${BORDER}`, borderRadius: 9, background: '#fff', overflow: 'hidden' }}>
        {prefix && <span style={{ padding: '0 0 0 0.7rem', fontSize: '0.8rem', color: MUTED, whiteSpace: 'nowrap' }}>{prefix}</span>}
        <input
          type={type}
          value={value}
          required={required}
          autoFocus={autoFocus}
          onChange={e => onChange(e.target.value)}
          style={{
            flex: 1, minWidth: 0, padding: '0.55rem 0.7rem', fontSize: '0.85rem',
            border: 'none', outline: 'none', background: 'transparent', fontFamily: "'Inter', sans-serif",
          }}
        />
      </div>
    </label>
  )
}

function DangerButton({
  children, onClick, tone,
}: {
  children: React.ReactNode
  onClick: () => void | Promise<void>
  tone: 'neutral' | 'danger'
}) {
  return (
    <button
      onClick={() => void onClick()}
      style={{
        padding: '0.55rem 1rem', borderRadius: 9, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
        border: `1px solid ${tone === 'danger' ? '#fecaca' : BORDER}`,
        background: tone === 'danger' ? '#fef2f2' : '#fff',
        color: tone === 'danger' ? '#dc2626' : '#111',
      }}
    >
      {children}
    </button>
  )
}
