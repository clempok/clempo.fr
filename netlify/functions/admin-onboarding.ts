import type { Handler } from '@netlify/functions'
import { isAdminToken } from './_analytics'
import {
  chunkKey,
  deleteFileChunks,
  generateAccessCode,
  getOnboardingStore,
  loadOnboarding,
  saveOnboarding,
  sanitizeSchema,
  sanitizePrefill,
  prefillableKeys,
  slugifyOnboarding,
  CONTEXT_SUMMARY_MAX,
  RESERVED_SLUGS,
} from './_onboarding'
import type { OnboardingClient } from './_onboarding'

/** Côté admin : création des espaces client, relecture des réponses,
 *  téléchargement des documents (morceau par morceau, recollés par le
 *  navigateur — voir _onboarding.ts pour le pourquoi). */

const HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
}

const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: HEADERS, body: '' }
  }

  if (!isAdminToken(event.headers.authorization || '')) {
    return { statusCode: 401, headers: HEADERS, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  const data = await loadOnboarding()

  if (event.httpMethod === 'GET') {
    const clients = [...data.clients].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ clients }) }
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
  const now = new Date().toISOString()

  /* ── Création d'un espace client ───────────────────────────────────────── */
  if (action === 'create') {
    const companyName = String(body.companyName || '').trim()
    if (!companyName) {
      return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Nom d’entreprise requis' }) }
    }
    const slug = slugifyOnboarding(String(body.slug || '') || companyName)
    const err = validateSlug(slug, data.clients, null)
    if (err) return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: err }) }

    const client: OnboardingClient = {
      id: crypto.randomUUID(),
      slug,
      companyName,
      contactName: String(body.contactName || '').trim() || undefined,
      contactEmail: String(body.contactEmail || '').trim() || undefined,
      internalNote: String(body.internalNote || '').trim() || undefined,
      accessCode: generateAccessCode(),
      answers: {},
      files: [],
      createdAt: now,
      status: 'draft',
    }
    data.clients.push(client)
    await saveOnboarding(data)
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ client }) }
  }

  const id = String(body.id || '')
  const client = data.clients.find(c => c.id === id)
  if (!client) {
    return { statusCode: 404, headers: HEADERS, body: JSON.stringify({ error: 'Onboarding introuvable' }) }
  }

  /* ── Édition des métadonnées ───────────────────────────────────────────── */
  if (action === 'update') {
    const patch = (body.patch || {}) as Record<string, unknown>

    if (typeof patch.slug === 'string') {
      const slug = slugifyOnboarding(patch.slug)
      const err = validateSlug(slug, data.clients, client.id)
      if (err) return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: err }) }
      client.slug = slug
    }
    if (typeof patch.companyName === 'string' && patch.companyName.trim()) {
      client.companyName = patch.companyName.trim()
    }
    for (const key of ['contactName', 'contactEmail', 'internalNote'] as const) {
      if (typeof patch[key] === 'string') {
        client[key] = (patch[key] as string).trim() || undefined
      }
    }
    await saveOnboarding(data)
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ client }) }
  }

  /* ── Suivi d'une génération en background ──────────────────────────────── */
  if (action === 'generation-status') {
    const store = getOnboardingStore()
    const rec = await store.get(`gen/${client.id}`, { type: 'json' }).catch(() => null) as
      | { jobId: string; status: 'done' | 'error'; sections?: unknown; error?: string }
      | null
    // Terminal → consommé une fois, on nettoie le store.
    if (rec && (rec.status === 'done' || rec.status === 'error')) {
      await store.delete(`gen/${client.id}`).catch(() => { /* non bloquant */ })
    }
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ generation: rec }) }
  }

  /* ── Questionnaire personnalisé ────────────────────────────────────────── */
  if (action === 'set-schema') {
    const clean = sanitizeSchema(body.schema)
    if (!clean) {
      return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Schéma vide ou invalide' }) }
    }
    client.schema = clean

    // Résumé de contexte affiché au client (vide → on l'enlève).
    if (typeof body.contextSummary === 'string') {
      const summary = body.contextSummary.trim().slice(0, CONTEXT_SUMMARY_MAX)
      if (summary) client.contextSummary = summary
      else delete client.contextSummary
    }

    // Réponses pré-remplies : on ne seed QUE les questions encore vides, pour ne
    // jamais écraser ce que le client a déjà saisi. On mémorise les clés seedées
    // pour l'affichage « à valider » côté client. On ne touche à tout ça que si
    // un prefill est fourni — une simple ré-édition du schéma ne doit pas effacer
    // les marqueurs d'une génération précédente.
    const prefill = sanitizePrefill(body.prefill, prefillableKeys(clean))
    if (Object.keys(prefill).length) {
      client.answers = client.answers || {}
      const seeded: string[] = []
      for (const [k, v] of Object.entries(prefill)) {
        const existing = client.answers[k]
        if (!existing || !existing.trim()) {
          client.answers[k] = v
          seeded.push(k)
        }
      }
      client.prefilledKeys = seeded
    }

    await saveOnboarding(data)
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true, schema: clean }) }
  }

  // Retour au questionnaire standard. Les réponses déjà données restent en base ;
  // on retire seulement les artefacts de personnalisation (résumé, marqueurs).
  if (action === 'reset-schema') {
    delete client.schema
    delete client.contextSummary
    delete client.prefilledKeys
    await saveOnboarding(data)
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true }) }
  }

  /* ── Nouveau code d'accès (l'ancien cesse immédiatement de fonctionner) ── */
  if (action === 'regenerate-code') {
    client.accessCode = generateAccessCode()
    await saveOnboarding(data)
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ accessCode: client.accessCode }) }
  }

  /* ── Suppression complète (métadonnées + tous les morceaux de fichiers) ── */
  if (action === 'delete') {
    for (const f of client.files || []) {
      await deleteFileChunks(client.id, f)
    }
    data.clients = data.clients.filter(c => c.id !== client.id)
    await saveOnboarding(data)
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true }) }
  }

  /* ── Téléchargement : un morceau à la fois ─────────────────────────────── */
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

  if (action === 'delete-file') {
    const fileId = String(body.fileId || '')
    const file = (client.files || []).find(f => f.id === fileId)
    if (!file) return { statusCode: 404, headers: HEADERS, body: JSON.stringify({ error: 'Fichier introuvable' }) }
    await deleteFileChunks(client.id, file)
    client.files = client.files.filter(f => f.id !== fileId)
    await saveOnboarding(data)
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true }) }
  }

  /* ── Rouvrir un onboarding validé (le client peut compléter à nouveau) ─── */
  if (action === 'reopen') {
    client.status = 'in_progress'
    client.submittedAt = undefined
    client.submitNotifiedAt = undefined
    await saveOnboarding(data)
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true }) }
  }

  return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Unknown action' }) }
}

/** Le slug devient une URL de premier niveau : il ne doit ni être vide, ni
 *  masquer une page existante, ni entrer en collision avec un autre client. */
function validateSlug(slug: string, clients: OnboardingClient[], selfId: string | null): string | null {
  if (!slug) return 'Slug invalide'
  if (RESERVED_SLUGS.has(slug)) return `« ${slug} » est déjà une page du site`
  if (clients.some(c => c.slug === slug && c.id !== selfId)) return `« ${slug} » est déjà utilisé par un autre client`
  return null
}

export { handler }
