import { getStore } from '@netlify/blobs'

/**
 * Onboarding client — portail que le client remplit à son rythme après signature.
 *
 * Deux surfaces :
 *  - publique   : clempo.fr/<slug>, protégée par un code à 6 caractères
 *  - admin      : /admin → onglet Onboarding
 *
 * Stockage Netlify Blobs, store `onboarding` :
 *  - `data`                    → { clients: OnboardingClient[] } (métadonnées + réponses)
 *  - `f/<clientId>/<fileId>/N` → un morceau de fichier, en base64
 *  - `rl/<slug>`               → compteur d'échecs de code (anti brute-force)
 *
 * Les fichiers sont découpés parce qu'une fonction Netlify plafonne à 6 Mo par
 * requête ET par réponse. On stocke donc des morceaux de CHUNK_BYTES octets que
 * le navigateur recolle : un fichier de 80 Mo passe sans que personne ne le voie.
 */

/** Taille d'un morceau, en octets bruts (avant base64, qui gonfle de ~33 %). */
export const CHUNK_BYTES = 3 * 1024 * 1024

/** Taille max d'un fichier accepté. */
export const MAX_FILE_BYTES = 100 * 1024 * 1024

/** Nombre max de fichiers par onboarding. */
export const MAX_FILES = 60

/** Longueur max d'une réponse texte (garde-fou anti-payload). */
export const MAX_ANSWER_CHARS = 20000

export type OnboardingStatus = 'draft' | 'in_progress' | 'submitted'

export type OnboardingFile = {
  id: string
  /** Slot d'upload auquel le fichier est rattaché (bp, creas, video…). */
  slot: string
  name: string
  size: number
  mimeType: string
  /** Nombre de morceaux stockés sous `f/<clientId>/<id>/0..chunks-1`. */
  chunks: number
  uploadedAt: string
}

export type OnboardingClient = {
  id: string
  /** Segment d'URL : clempo.fr/<slug> */
  slug: string
  companyName: string
  contactName?: string
  contactEmail?: string
  /** Code à 6 caractères transmis au client. Régénérable depuis l'admin. */
  accessCode: string
  /** Note interne, visible seulement dans l'admin. */
  internalNote?: string
  /** Réponses, indexées par clé de champ (voir src/lib/onboarding-schema.ts). */
  answers: Record<string, string>
  files: OnboardingFile[]
  createdAt: string
  /** Dernière modification par le client. */
  updatedAt?: string
  firstOpenedAt?: string
  lastOpenedAt?: string
  openCount?: number
  /** Le client a cliqué sur « J'ai terminé » (il peut continuer à éditer après). */
  submittedAt?: string
  status: OnboardingStatus
  /** Notification email « onboarding terminé » déjà envoyée. */
  submitNotifiedAt?: string
}

export type OnboardingData = {
  clients: OnboardingClient[]
}

const SITE_ID = '266ec893-0de7-4f86-9559-e80fa4a1e3d7'

export function getOnboardingStore() {
  const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_API_TOKEN
  const siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID || SITE_ID
  if (token) {
    return getStore({ name: 'onboarding', siteID, token })
  }
  return getStore({ name: 'onboarding' })
}

export async function loadOnboarding(): Promise<OnboardingData> {
  const store = getOnboardingStore()
  const raw = await store.get('data', { type: 'json' }).catch(() => null)
  if (raw && typeof raw === 'object' && Array.isArray((raw as OnboardingData).clients)) {
    return raw as OnboardingData
  }
  return { clients: [] }
}

export async function saveOnboarding(data: OnboardingData): Promise<void> {
  const store = getOnboardingStore()
  await store.setJSON('data', data)
}

/**
 * Alphabet sans caractères ambigus (pas de 0/O, 1/I/L) : le code est lu au
 * téléphone ou recopié depuis un email, il ne doit jamais prêter à confusion.
 */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function generateAccessCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  let out = ''
  for (const b of bytes) out += CODE_ALPHABET[b % CODE_ALPHABET.length]
  return out
}

export function normalizeCode(code: string): string {
  return (code || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function slugifyOnboarding(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

/**
 * Slugs déjà pris par une route ou un fichier du site. Un onboarding créé sur
 * l'un d'eux serait masqué par la vraie page (React Router classe les segments
 * statiques avant `/:slug`), donc on refuse à la création plutôt que de livrer
 * un lien mort au client.
 */
export const RESERVED_SLUGS = new Set([
  'admin', 'articles', 'booking', 'devis', 'confirmation', 'hiring',
  'transition-cmo', 'consultant-marketing-sante', 'parts-de-marche-logiciels-medicaux',
  'specialites', 'merci-nps', 'decideurs-hospitaliers', 'influenceurs-sante',
  'sitemap.xml', 'robots.txt', 'assets', 'tools', 'data', 'api', 'onboarding',
])

/** Clé de stockage d'un morceau de fichier. */
export function chunkKey(clientId: string, fileId: string, index: number): string {
  return `f/${clientId}/${fileId}/${index}`
}

/** Supprime tous les morceaux d'un fichier. Best-effort : un morceau déjà
 *  absent ne doit pas faire échouer la suppression côté client. */
export async function deleteFileChunks(clientId: string, file: OnboardingFile): Promise<void> {
  const store = getOnboardingStore()
  await Promise.all(
    Array.from({ length: file.chunks }, (_, i) =>
      store.delete(chunkKey(clientId, file.id, i)).catch(() => { /* déjà supprimé */ }),
    ),
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Anti brute-force sur le code d'accès
   ────────────────────────────────────────────────────────────────────────── */

const RL_WINDOW_MS = 15 * 60 * 1000
const RL_MAX_FAILS = 15

type RateLimit = { fails: number; since: number }

/** True si le slug est temporairement bloqué après trop d'échecs. */
export async function isRateLimited(slug: string): Promise<boolean> {
  const store = getOnboardingStore()
  const rl = (await store.get(`rl/${slug}`, { type: 'json' }).catch(() => null)) as RateLimit | null
  if (!rl) return false
  if (Date.now() - rl.since > RL_WINDOW_MS) return false
  return rl.fails >= RL_MAX_FAILS
}

export async function recordCodeFailure(slug: string): Promise<void> {
  const store = getOnboardingStore()
  const rl = (await store.get(`rl/${slug}`, { type: 'json' }).catch(() => null)) as RateLimit | null
  const fresh = !rl || Date.now() - rl.since > RL_WINDOW_MS
  const next: RateLimit = fresh
    ? { fails: 1, since: Date.now() }
    : { fails: rl.fails + 1, since: rl.since }
  await store.setJSON(`rl/${slug}`, next).catch(() => { /* non bloquant */ })
}

export async function clearCodeFailures(slug: string): Promise<void> {
  const store = getOnboardingStore()
  await store.delete(`rl/${slug}`).catch(() => { /* non bloquant */ })
}

/* ──────────────────────────────────────────────────────────────────────────
   Authentification client
   ────────────────────────────────────────────────────────────────────────── */

/**
 * Résout un couple (slug, code). Renvoie le client si le code est bon.
 * `reason` distingue les cas pour que l'appelant renvoie le bon statut HTTP
 * sans révéler au visiteur si le slug existe ou non.
 */
export async function authClient(
  slug: string,
  code: string,
): Promise<
  | { ok: true; data: OnboardingData; client: OnboardingClient }
  | { ok: false; reason: 'not-found' | 'bad-code' | 'rate-limited' }
> {
  const cleanSlug = slugifyOnboarding(slug)
  if (!cleanSlug) return { ok: false, reason: 'not-found' }

  if (await isRateLimited(cleanSlug)) return { ok: false, reason: 'rate-limited' }

  const data = await loadOnboarding()
  const client = data.clients.find(c => c.slug === cleanSlug)
  if (!client) return { ok: false, reason: 'not-found' }

  if (normalizeCode(code) !== normalizeCode(client.accessCode)) {
    await recordCodeFailure(cleanSlug)
    return { ok: false, reason: 'bad-code' }
  }

  await clearCodeFailures(cleanSlug)
  return { ok: true, data, client }
}
