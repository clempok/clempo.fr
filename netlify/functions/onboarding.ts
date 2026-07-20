import type { Handler } from '@netlify/functions'
import {
  authClient,
  chunkKey,
  deleteFileChunks,
  getOnboardingStore,
  loadOnboarding,
  saveOnboarding,
  slugifyOnboarding,
  CHUNK_BYTES,
  MAX_ANSWER_CHARS,
  MAX_FILES,
  MAX_FILE_BYTES,
} from './_onboarding'
import type { OnboardingClient, OnboardingFile } from './_onboarding'

/**
 * API publique de l'onboarding client (clempo.fr/<slug>).
 *
 * Chaque appel porte ses identifiants `{ slug, code }` : pas de session, pas de
 * cookie. Le navigateur du client garde le code en localStorage, il ne le saisit
 * donc qu'une fois, mais le serveur le revérifie à chaque requête.
 */

const HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
}

/** Vue renvoyée au client : jamais le code d'accès, jamais la note interne. */
function publicView(c: OnboardingClient) {
  return {
    companyName: c.companyName,
    contactName: c.contactName || '',
    answers: c.answers || {},
    files: (c.files || []).map(f => ({
      id: f.id, slot: f.slot, name: f.name, size: f.size,
      mimeType: f.mimeType, chunks: f.chunks, uploadedAt: f.uploadedAt,
    })),
    status: c.status,
    updatedAt: c.updatedAt,
    submittedAt: c.submittedAt,
  }
}

const MAX_CHUNKS = Math.ceil(MAX_FILE_BYTES / CHUNK_BYTES)

/** Les identifiants de fichiers finissent dans une clé de blob : on n'accepte
 *  que des UUID pour qu'un `../` ne puisse pas s'y glisser. */
const FILE_ID_RE = /^[a-f0-9-]{8,64}$/i

const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: HEADERS, body: '' }
  }

  /* GET ?slug=x — existence seule, pour distinguer un onboarding d'un vrai 404.
     Ne renvoie aucune donnée : tout le contenu est derrière le code. */
  if (event.httpMethod === 'GET') {
    const slug = slugifyOnboarding(event.queryStringParameters?.slug || '')
    if (!slug) return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Missing slug' }) }
    const data = await loadOnboarding()
    const found = data.clients.some(c => c.slug === slug)
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ found }) }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  let body: Record<string, unknown>
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Bad JSON' }) }
  }

  const action = String(body.action || '')
  const slug = String(body.slug || '')
  const code = String(body.code || '')

  const auth = await authClient(slug, code)
  if (!auth.ok) {
    if (auth.reason === 'rate-limited') {
      return {
        statusCode: 429,
        headers: HEADERS,
        body: JSON.stringify({ error: 'Trop de tentatives. Réessayez dans 15 minutes.' }),
      }
    }
    // `not-found` et `bad-code` renvoient le même message : inutile d'aider
    // quelqu'un qui teste des noms d'entreprise à la main.
    return { statusCode: 401, headers: HEADERS, body: JSON.stringify({ error: 'Code incorrect' }) }
  }

  const { data, client } = auth
  const now = new Date().toISOString()

  /* ── Ouverture de l'espace ─────────────────────────────────────────────── */
  if (action === 'open') {
    if (!client.firstOpenedAt) client.firstOpenedAt = now
    client.lastOpenedAt = now
    client.openCount = (client.openCount || 0) + 1
    if (client.status === 'draft') client.status = 'in_progress'
    await saveOnboarding(data)
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify(publicView(client)) }
  }

  /* ── Enregistrement des réponses (patch partiel) ───────────────────────── */
  if (action === 'save') {
    const patch = body.answers
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
      return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Missing answers' }) }
    }
    client.answers = client.answers || {}
    for (const [k, v] of Object.entries(patch as Record<string, unknown>)) {
      if (!/^[a-z0-9_]{1,64}$/i.test(k)) continue
      const value = typeof v === 'string' ? v : String(v ?? '')
      if (value.length > MAX_ANSWER_CHARS) {
        return {
          statusCode: 413,
          headers: HEADERS,
          body: JSON.stringify({ error: `Réponse trop longue (max ${MAX_ANSWER_CHARS} caractères)` }),
        }
      }
      // Une valeur vide efface la réponse plutôt que de stocker "" partout.
      if (value === '') delete client.answers[k]
      else client.answers[k] = value
    }
    client.updatedAt = now
    if (client.status === 'draft') client.status = 'in_progress'
    await saveOnboarding(data)
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true, savedAt: now }) }
  }

  /* ── Upload d'un morceau de fichier ────────────────────────────────────── */
  if (action === 'upload-chunk') {
    const fileId = String(body.fileId || '')
    const index = Number(body.index)
    const total = Number(body.total)
    const name = String(body.name || 'document').slice(0, 200)
    const size = Number(body.size)
    const mimeType = String(body.mimeType || 'application/octet-stream').slice(0, 120)
    const dataB64 = String(body.data || '')

    if (!FILE_ID_RE.test(fileId)) {
      return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Bad fileId' }) }
    }
    if (!Number.isInteger(index) || !Number.isInteger(total) || total < 1 || total > MAX_CHUNKS || index < 0 || index >= total) {
      return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Bad chunk range' }) }
    }
    if (!Number.isFinite(size) || size < 0 || size > MAX_FILE_BYTES) {
      return { statusCode: 413, headers: HEADERS, body: JSON.stringify({ error: 'Fichier trop volumineux (max 100 Mo)' }) }
    }
    // base64 gonfle de 4/3 : au-delà, le morceau vient d'un client qui ne
    // respecte pas CHUNK_BYTES et ferait exploser la limite de payload.
    if (dataB64.length > Math.ceil(CHUNK_BYTES * 1.4)) {
      return { statusCode: 413, headers: HEADERS, body: JSON.stringify({ error: 'Morceau trop gros' }) }
    }

    client.files = client.files || []
    const existing = client.files.find(f => f.id === fileId)
    if (!existing && client.files.length >= MAX_FILES) {
      return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: `Maximum ${MAX_FILES} fichiers` }) }
    }

    const store = getOnboardingStore()
    await store.set(chunkKey(client.id, fileId, index), dataB64)

    // Le fichier n'apparaît dans les métadonnées qu'une fois le dernier morceau
    // écrit : un upload interrompu ne laisse jamais un fichier tronqué visible.
    if (index === total - 1) {
      const meta: OnboardingFile = {
        id: fileId,
        slot: String(body.slot || 'autres').slice(0, 40),
        name,
        size,
        mimeType,
        chunks: total,
        uploadedAt: now,
      }
      if (existing) Object.assign(existing, meta)
      else client.files.push(meta)
      client.updatedAt = now
      if (client.status === 'draft') client.status = 'in_progress'
      await saveOnboarding(data)
      return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true, file: meta }) }
    }

    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true }) }
  }

  /* ── Relecture d'un morceau (le client peut retélécharger ses dépôts) ──── */
  if (action === 'file-chunk') {
    const fileId = String(body.fileId || '')
    const index = Number(body.index)
    const file = (client.files || []).find(f => f.id === fileId)
    if (!file) return { statusCode: 404, headers: HEADERS, body: JSON.stringify({ error: 'Fichier introuvable' }) }
    if (!Number.isInteger(index) || index < 0 || index >= file.chunks) {
      return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Bad chunk index' }) }
    }
    const store = getOnboardingStore()
    const chunk = await store.get(chunkKey(client.id, fileId, index)).catch(() => null)
    if (chunk === null) return { statusCode: 404, headers: HEADERS, body: JSON.stringify({ error: 'Morceau manquant' }) }
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ data: chunk }) }
  }

  /* ── Suppression d'un fichier ──────────────────────────────────────────── */
  if (action === 'delete-file') {
    const fileId = String(body.fileId || '')
    const file = (client.files || []).find(f => f.id === fileId)
    if (!file) return { statusCode: 404, headers: HEADERS, body: JSON.stringify({ error: 'Fichier introuvable' }) }
    await deleteFileChunks(client.id, file)
    client.files = client.files.filter(f => f.id !== fileId)
    client.updatedAt = now
    await saveOnboarding(data)
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true }) }
  }

  /* ── « J'ai terminé » ──────────────────────────────────────────────────── */
  if (action === 'submit') {
    client.submittedAt = now
    client.status = 'submitted'
    client.updatedAt = now

    // Un seul email par onboarding : le client peut re-cliquer sans spammer.
    const shouldNotify = !client.submitNotifiedAt
    if (shouldNotify) client.submitNotifiedAt = now
    await saveOnboarding(data)

    if (shouldNotify) {
      await notifySubmission(client).catch(err => console.error('onboarding: notify failed', err))
    }
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true, submittedAt: now }) }
  }

  return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Unknown action' }) }
}

/** Prévient Clément que l'onboarding est bouclé. Best-effort : un échec Resend
 *  ne doit jamais faire échouer la soumission côté client. */
async function notifySubmission(client: OnboardingClient): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('onboarding: RESEND_API_KEY absente, notification ignorée')
    return
  }
  const answered = Object.values(client.answers || {}).filter(v => v && v.trim()).length
  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;color:#111">
      <h2 style="color:#1A1A6B;margin:0 0 4px">Onboarding terminé — ${escapeHtml(client.companyName)}</h2>
      <p style="color:#666;margin:0 0 20px;font-size:14px">
        ${escapeHtml(client.contactName || 'Le client')} vient de valider son questionnaire.
      </p>
      <table style="font-size:14px;border-collapse:collapse">
        <tr><td style="padding:4px 16px 4px 0;color:#666">Réponses remplies</td><td><b>${answered}</b></td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#666">Documents déposés</td><td><b>${(client.files || []).length}</b></td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#666">Lien client</td><td><a href="https://www.clempo.fr/${client.slug}">clempo.fr/${client.slug}</a></td></tr>
      </table>
      <p style="margin:24px 0 0">
        <a href="https://www.clempo.fr/admin" style="background:#1A1A6B;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">
          Ouvrir dans l'admin
        </a>
      </p>
    </div>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Clempo.fr <noreply@clempo.fr>',
      to: ['clement.pougetosmont@gmail.com'],
      subject: `✅ Onboarding terminé — ${client.companyName}`,
      html,
    }),
  })
  if (!res.ok) console.error('onboarding: Resend error', await res.text())
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch] || ch))
}

export { handler }
