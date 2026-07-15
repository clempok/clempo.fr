// Server-side bot detection for track-visit.
//
// Why this exists: the client-side filter in App.tsx (navigator.webdriver + a UA
// regex) only inspects values the client itself controls. A stealth headless
// browser executes the page JS and can set any document.referrer it likes. On
// 2026-07-14 that produced 602 fake "google" visits against 3 real Search
// Console clicks in the same window, and 0 conversions on 647 visits.
//
// Two rules matter here:
//  1. Reject on headers, not on body. The body is client-authored; headers are
//     harder to forge consistently and x-nf-client-connection-ip is set by
//     Netlify's edge, not by the caller.
//  2. Reject BEFORE touching the `analytics` blob. That blob also holds the lead
//     events, and it is read-modify-written without a lock — letting a flood
//     reach it risks racing a real lead away, not just a visit counter.

import { getStore } from '@netlify/blobs'
import { createHash } from 'node:crypto'

const SITE_ID = '266ec893-0de7-4f86-9559-e80fa4a1e3d7'

// Only the production origins. Deploy previews and localhost are intentionally
// excluded so dev traffic stops polluting the stats.
const ALLOWED_HOSTS = new Set(['www.clempo.fr', 'clempo.fr'])

// Named bot tokens. Deliberately NOT a bare /bot/ — that matches real Android
// phones (e.g. "CUBOT_X30") and would silently drop human traffic.
const BOT_UA =
  /googlebot|bingbot|yandex(bot)?|baiduspider|duckduckbot|slurp|sogou|exabot|facebookexternalhit|meta-externalagent|twitterbot|linkedinbot|slackbot|discordbot|telegrambot|whatsapp|applebot|petalbot|semrushbot|ahrefsbot|mj12bot|dotbot|dataforseo|bytespider|amazonbot|gptbot|ccbot|claudebot|claude-web|anthropic|perplexitybot|oai-searchbot|chatgpt-user|google-extended|googleother|google-inspectiontool|feedfetcher|lighthouse|pagespeed|gtmetrix|headlesschrome|phantomjs|puppeteer|playwright|selenium|cypress|webdriver|curl\/|wget|python-requests|python-urllib|aiohttp|httpx|axios|node-fetch|go-http-client|okhttp|apache-httpclient|libwww-perl|scrapy|postman|insomnia|uptimerobot|pingdom|statuscake|electron|\bcrawler\b|\bspider\b|\bscraper\b|[a-z]bot\/[\d.]/i

export type FilterVerdict = { ok: true } | { ok: false; reason: string }

function headerHost(value: string | undefined): string | null {
  if (!value) return null
  try {
    return new URL(value).hostname.toLowerCase()
  } catch {
    return null
  }
}

export function clientIp(headers: Record<string, string | undefined>): string {
  return (
    headers['x-nf-client-connection-ip'] ||
    (headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    'unknown'
  )
}

/**
 * Header-only checks. No I/O, so a flood costs us nothing and never reaches the
 * lead-bearing blob.
 */
export function screenRequest(headers: Record<string, string | undefined>): FilterVerdict {
  const ua = headers['user-agent'] || ''

  if (!ua) return { ok: false, reason: 'no-ua' }
  if (ua.length < 20) return { ok: false, reason: 'short-ua' }
  // Every mainstream browser sends a Mozilla/5.0 prefix. Anything else calling
  // this endpoint is a script.
  if (!/mozilla\//i.test(ua)) return { ok: false, reason: 'non-browser-ua' }
  if (BOT_UA.test(ua)) return { ok: false, reason: 'bot-ua' }

  // Browsers send Origin on cross- AND same-origin POST requests. Referer is the
  // fallback for the rare client that omits Origin.
  const origin = headerHost(headers['origin']) || headerHost(headers['referer'])
  if (!origin) return { ok: false, reason: 'no-origin' }
  if (!ALLOWED_HOSTS.has(origin)) return { ok: false, reason: 'bad-origin' }

  // Real browsers negotiate a language. Most headless setups leave this empty.
  if (!headers['accept-language']) return { ok: false, reason: 'no-accept-language' }

  return { ok: true }
}

function botStore() {
  const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_API_TOKEN
  const siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID || SITE_ID
  if (token) return getStore({ name: 'analytics-bots', siteID, token })
  return getStore({ name: 'analytics-bots' })
}

// A single human browsing hard tops out well below this. Real traffic is ~100
// visits/day spread across many IPs, so 40 leaves enormous headroom for an
// office or carrier NAT while still capping a single-IP flood.
const MAX_VISITS_PER_IP_PER_DAY = 40

/**
 * Per-IP daily cap, kept in a SEPARATE store so bot traffic never contends with
 * the lead blob. IPs are salted-hashed and the key is per-day, so nothing here
 * can be used to follow someone across days.
 *
 * Fails OPEN: a storage hiccup must not silently stop counting real visits.
 */
export async function underRateLimit(ip: string, day: string): Promise<boolean> {
  if (ip === 'unknown') return true
  try {
    const s = botStore()
    const key = `rl-${day}`
    const bucket = ((await s.get(key, { type: 'json' })) as Record<string, number> | null) || {}
    const id = createHash('sha256').update(`${ip}|${day}|clempo-rl`).digest('hex').slice(0, 12)
    const seen = bucket[id] || 0
    if (seen >= MAX_VISITS_PER_IP_PER_DAY) return false
    bucket[id] = seen + 1
    await s.setJSON(key, bucket)
    return true
  } catch (err) {
    console.error('rate-limit check failed, allowing:', err)
    return true
  }
}

export type BlockedDay = {
  total: number
  byReason: Record<string, number>
  uaSample: Record<string, number>
}
export type BlockedLog = Record<string, BlockedDay> // YYYY-MM-DD -> stats

const BLOCKED_KEY = 'blocked'
const BLOCKED_RETENTION_DAYS = 60

/**
 * Record what we turned away, so the admin can show it instead of us guessing.
 * Keeps a truncated UA sample (capped) to make the next diagnosis a lookup
 * rather than an investigation.
 *
 * One key for every day rather than a key per day: the admin renders a 7/30/90
 * day range, and a key per day would mean up to 90 blob reads per dashboard
 * load. Concurrent writes here can race and undercount, which is fine — this is
 * a diagnostic, and it lives in its own store, so a flood racing itself can
 * never touch the lead events. Never throws.
 */
export async function recordBlocked(day: string, reason: string, ua: string): Promise<void> {
  try {
    const s = botStore()
    const log = ((await s.get(BLOCKED_KEY, { type: 'json' })) as BlockedLog | null) || {}
    const rec = log[day] || { total: 0, byReason: {}, uaSample: {} }

    rec.total += 1
    rec.byReason[reason] = (rec.byReason[reason] || 0) + 1

    const short = (ua || '(vide)').slice(0, 120)
    // Cap the sample so one rotating-UA flood can't grow the blob without bound.
    if (rec.uaSample[short] !== undefined || Object.keys(rec.uaSample).length < 25) {
      rec.uaSample[short] = (rec.uaSample[short] || 0) + 1
    }
    log[day] = rec

    const cutoff = new Date(`${day}T00:00:00Z`)
    cutoff.setUTCDate(cutoff.getUTCDate() - BLOCKED_RETENTION_DAYS)
    const cutoffKey = cutoff.toISOString().slice(0, 10)
    for (const k of Object.keys(log)) if (k < cutoffKey) delete log[k]

    await s.setJSON(BLOCKED_KEY, log)
  } catch (err) {
    console.error('recordBlocked failed:', err)
  }
}

export async function readBlockedLog(): Promise<BlockedLog> {
  try {
    const s = botStore()
    return ((await s.get(BLOCKED_KEY, { type: 'json' })) as BlockedLog | null) || {}
  } catch {
    return {}
  }
}
