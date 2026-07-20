import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ONBOARDING_SECTIONS, UPLOAD_SLOTS,
  answersToMarkdown, isFilled, overallProgress, sectionProgress,
} from '../lib/onboarding-schema'
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
                    const p = overallProgress(c.answers || {})
                    const st = STATUS_STYLE[c.status]
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedId(c.id)}
                        style={{ borderTop: `1px solid ${BORDER}`, cursor: 'pointer' }}
                      >
                        <Td>
                          <div style={{ fontWeight: 600 }}>{c.companyName}</div>
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
  const answers = client.answers || {}
  const files = client.files || []
  const progress = useMemo(() => overallProgress(answers), [answers])
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
          <Pill onClick={() => copy(answersToMarkdown(client.companyName, answers, files), 'Dossier')}>
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

      {ONBOARDING_SECTIONS.map(section => {
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
