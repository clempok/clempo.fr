import crypto from 'node:crypto'
import { getStore } from '@netlify/blobs'

/**
 * Self-hosted open/click tracking for outbound emails, stored in Netlify
 * Blobs (store "email-tracking"). No dependency on Resend webhooks or
 * dashboard settings:
 *
 *   - at send time, sendNurtureEmail creates a send record (`send:<id>`) and
 *     instruments the final HTML: every http(s) link is rewritten through
 *     /.netlify/functions/email-click and a 1x1 pixel pointing at
 *     /.netlify/functions/email-open is appended;
 *   - the two public functions record events as key-encoded empty blobs
 *     (`evt:<sendId>:<ts36>:<rand>:o` or `:c<linkIndex>`), so the admin
 *     stats endpoint can aggregate from a key listing alone, without
 *     fetching one blob per event.
 *
 * Dry-run / test sends are never tracked. Caveat to keep in mind when
 * reading the numbers: Apple Mail Privacy Protection and the Gmail image
 * proxy preload images, so open rates are an upper bound — click data is
 * the reliable signal.
 */

const SITE_URL = 'https://www.clempo.fr'
const SITE_ID = '266ec893-0de7-4f86-9559-e80fa4a1e3d7'

export type EmailSendRecord = {
  id: string
  /** Template key ('resource-delivery' | 'nurture-j3' | 'nurture-j7' | …). */
  templateKey: string
  language: 'FR' | 'EN'
  to: string
  recipientName?: string
  company?: string
  subject: string
  sentAt: string
  /** Tracked URLs, in order — click events reference them by index. */
  links: string[]
}

export type EmailTrackingEvent = {
  sendId: string
  type: 'open' | 'click'
  /** Index into the send record's `links` array (clicks only). */
  linkIndex: number
  ts: number
}

function getTrackingStore() {
  const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_API_TOKEN
  const siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID || SITE_ID
  if (token) {
    return getStore({ name: 'email-tracking', siteID, token })
  }
  return getStore({ name: 'email-tracking' })
}

/** Sortable id: fixed-width base36 timestamp prefix + random suffix. */
export function newSendId(): string {
  return `${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}`
}

export async function saveSendRecord(record: EmailSendRecord): Promise<void> {
  const store = getTrackingStore()
  await store.setJSON(`send:${record.id}`, record)
}

export async function getSendRecord(id: string): Promise<EmailSendRecord | null> {
  if (!/^[a-z0-9-]{8,64}$/.test(id)) return null
  const store = getTrackingStore()
  return ((await store.get(`send:${id}`, { type: 'json' })) as EmailSendRecord | null) ?? null
}

export async function recordEmailEvent(sendId: string, type: 'open' | 'click', linkIndex = -1): Promise<void> {
  const store = getTrackingStore()
  const marker = type === 'open' ? 'o' : `c${linkIndex}`
  const key = `evt:${sendId}:${Date.now().toString(36)}:${crypto.randomBytes(3).toString('hex')}:${marker}`
  await store.set(key, '1')
}

/**
 * Rewrite the final email HTML for tracking: http(s) hrefs go through the
 * click redirect (same URL twice shares one index), and an open pixel is
 * appended before </body>. `skipUrls` (e.g. the unsubscribe link, which must
 * stay one-click and matches the List-Unsubscribe header) are left untouched.
 */
export function instrumentEmailHtml(html: string, sendId: string, skipUrls: string[]): { html: string; links: string[] } {
  const skip = new Set(skipUrls)
  const links: string[] = []
  const rewritten = html.replace(/href="([^"]+)"/g, (match, url: string) => {
    if (!/^https?:\/\//i.test(url) || skip.has(url)) return match
    let idx = links.indexOf(url)
    if (idx === -1) {
      links.push(url)
      idx = links.length - 1
    }
    return `href="${SITE_URL}/.netlify/functions/email-click?id=${sendId}&l=${idx}"`
  })
  const pixel = `<img src="${SITE_URL}/.netlify/functions/email-open?id=${sendId}" alt="" width="1" height="1" style="display:block;width:1px;height:1px;border:0;" />`
  const withPixel = rewritten.includes('</body>')
    ? rewritten.replace('</body>', `${pixel}\n</body>`)
    : `${rewritten}\n${pixel}`
  return { html: withPixel, links }
}

/** Full dump for the admin stats endpoint: send records + parsed events. */
export async function listEmailTracking(): Promise<{ sends: EmailSendRecord[]; events: EmailTrackingEvent[] }> {
  const store = getTrackingStore()
  const [sendList, evtList] = await Promise.all([
    store.list({ prefix: 'send:' }),
    store.list({ prefix: 'evt:' }),
  ])

  const events: EmailTrackingEvent[] = []
  for (const blob of evtList.blobs) {
    // evt:<sendId>:<ts36>:<rand>:<o|cN>
    const parts = blob.key.split(':')
    if (parts.length !== 5) continue
    const [, sendId, ts36, , marker] = parts
    const ts = parseInt(ts36, 36)
    if (Number.isNaN(ts)) continue
    if (marker === 'o') {
      events.push({ sendId, type: 'open', linkIndex: -1, ts })
    } else if (marker.startsWith('c')) {
      const linkIndex = Number(marker.slice(1))
      if (!Number.isNaN(linkIndex)) events.push({ sendId, type: 'click', linkIndex, ts })
    }
  }

  // Fetch send records with a bounded-concurrency worker pool. One blob get per
  // send, and the count grows ~linearly with volume: at ~1.5k sends the old
  // sequential batches of 25 (62 round-trip waves) blew past the 10s function
  // budget and the endpoint started returning 502. Keeping many gets
  // continuously in flight brings the full fetch back to a few seconds.
  const sends: EmailSendRecord[] = []
  const keys = sendList.blobs.map(b => b.key)
  const CONCURRENCY = 250
  let next = 0
  async function drainSendKeys() {
    while (next < keys.length) {
      const key = keys[next++]
      const record = (await store.get(key, { type: 'json' })) as EmailSendRecord | null
      if (record && record.id) sends.push(record)
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, keys.length) }, drainSendKeys))
  sends.sort((a, b) => (a.sentAt < b.sentAt ? 1 : -1))

  return { sends, events }
}
