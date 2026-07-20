/**
 * Découpage et recollage des fichiers de l'onboarding.
 *
 * Une fonction Netlify plafonne à 6 Mo par requête ET par réponse. Un deck de
 * 40 Mo ou une vidéo produit ne passent donc jamais en un seul appel : le
 * navigateur découpe à l'envoi et recolle à la réception. Côté client comme
 * côté admin, personne ne voit la différence — c'est le but.
 *
 * Doit rester aligné avec CHUNK_BYTES dans netlify/functions/_onboarding.ts.
 */

export const CHUNK_BYTES = 3 * 1024 * 1024
export const MAX_FILE_BYTES = 100 * 1024 * 1024

/** btoa() ne prend qu'une chaîne : on convertit par tranches pour ne pas
 *  dépasser la limite d'arguments de String.fromCharCode sur un gros fichier. */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const STEP = 0x8000
  for (let i = 0; i < bytes.length; i += STEP) {
    binary += String.fromCharCode(...bytes.subarray(i, i + STEP))
  }
  return btoa(binary)
}

export function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}

export function chunkCount(size: number): number {
  return Math.max(1, Math.ceil(size / CHUNK_BYTES))
}

/** Lit le n-ième morceau d'un File et le renvoie en base64. */
export async function readChunkBase64(file: File, index: number): Promise<string> {
  const start = index * CHUNK_BYTES
  const blob = file.slice(start, Math.min(start + CHUNK_BYTES, file.size))
  const buf = await blob.arrayBuffer()
  return bytesToBase64(new Uint8Array(buf))
}

/**
 * Récupère tous les morceaux, reconstitue le fichier et déclenche le
 * téléchargement. `fetchChunk` diffère selon l'appelant (API client ou admin),
 * le reste est identique.
 */
export async function downloadChunkedFile(
  file: { name: string; mimeType: string; chunks: number },
  fetchChunk: (index: number) => Promise<string>,
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  const parts: Uint8Array[] = []
  for (let i = 0; i < file.chunks; i++) {
    parts.push(base64ToBytes(await fetchChunk(i)))
    onProgress?.(i + 1, file.chunks)
  }
  const blob = new Blob(parts as BlobPart[], { type: file.mimeType || 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Laisse au navigateur le temps de démarrer le téléchargement avant de
  // libérer l'URL : révoquer trop tôt donne un fichier vide sur Safari.
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

export function formatBytes(n: number): string {
  if (!n) return '0 Ko'
  if (n < 1024) return `${n} o`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} Ko`
  return `${(n / (1024 * 1024)).toFixed(n < 10 * 1024 * 1024 ? 1 : 0)} Mo`
}

export function fileIcon(mimeType: string, name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  if (mimeType.startsWith('video/')) return '🎬'
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType.startsWith('audio/')) return '🎧'
  if (mimeType === 'application/pdf' || ext === 'pdf') return '📕'
  if (['ppt', 'pptx', 'key'].includes(ext)) return '📊'
  if (['xls', 'xlsx', 'csv', 'numbers'].includes(ext)) return '📈'
  if (['doc', 'docx', 'pages'].includes(ext)) return '📝'
  if (['zip', 'rar', '7z'].includes(ext)) return '🗜️'
  return '📎'
}
