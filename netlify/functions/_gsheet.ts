/**
 * Minimal Google Sheets API v4 client.
 *
 * Auth flow: load a service-account JSON, sign a JWT with its private key,
 * exchange for an OAuth2 access token, then call sheets.googleapis.com. No
 * SDK — kept to a single file so the Netlify function bundle stays lean.
 *
 * Credential storage: read from the Netlify Blob `secrets/gsheet-sa.json`.
 * Env-var storage is NOT supported because the SA JSON (~2.3KB) blows past
 * the AWS Lambda 4KB-per-function env-var limit. Upload the SA JSON once via
 * the `admin-set-gsheet-credentials` endpoint; this file reads it back.
 *
 * The sheet must be shared (Editor) with the service account's `client_email`.
 */
import crypto from 'node:crypto'
import { getStore } from '@netlify/blobs'

type ServiceAccount = {
  client_email: string
  private_key: string
  token_uri?: string
}

const SITE_ID = '266ec893-0de7-4f86-9559-e80fa4a1e3d7'
const SA_BLOB_KEY = 'gsheet-sa.json'

export function getSecretsStore() {
  const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_API_TOKEN
  const siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID || SITE_ID
  if (token) return getStore({ name: 'secrets', siteID, token })
  return getStore({ name: 'secrets' })
}

let cachedSA: ServiceAccount | null = null

async function loadServiceAccount(): Promise<ServiceAccount> {
  if (cachedSA) return cachedSA

  const store = getSecretsStore()
  const raw = (await store.get(SA_BLOB_KEY, { type: 'text' })) as string | null
  if (!raw) {
    throw new Error(
      'Service-account JSON not found in Netlify Blobs. ' +
      'Upload it via POST /.netlify/functions/admin-set-gsheet-credentials',
    )
  }
  let parsed: ServiceAccount
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Stored service-account JSON is malformed')
  }
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error('Stored service-account JSON is missing client_email or private_key')
  }
  // Normalize \n escapes in case the JSON was edited in a plain-text field.
  parsed.private_key = parsed.private_key.replace(/\\n/g, '\n')
  cachedSA = parsed
  return parsed
}

function base64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

let cachedToken: { token: string; expiresAt: number } | null = null

/**
 * Mint a Google OAuth2 access token from the service account. Cached for ~50min
 * to amortize the cost across multiple Sheets calls in the same function run.
 */
async function getAccessToken(scope = 'https://www.googleapis.com/auth/spreadsheets'): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token

  const sa = await loadServiceAccount()
  const iat = Math.floor(Date.now() / 1000)
  const exp = iat + 3600

  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claim = base64url(JSON.stringify({
    iss: sa.client_email,
    scope,
    aud: sa.token_uri || 'https://oauth2.googleapis.com/token',
    iat, exp,
  }))
  const signingInput = `${header}.${claim}`
  const signer = crypto.createSign('RSA-SHA256')
  signer.update(signingInput)
  const signature = base64url(signer.sign(sa.private_key))
  const jwt = `${signingInput}.${signature}`

  const res = await fetch(sa.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }).toString(),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Token exchange failed (${res.status}): ${body}`)
  }
  const json = await res.json() as { access_token: string; expires_in: number }
  cachedToken = { token: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 }
  return json.access_token
}

const API = 'https://sheets.googleapis.com/v4/spreadsheets'

/** Read a sheet range as a 2D array of strings. */
export async function getSheetValues(spreadsheetId: string, range: string): Promise<string[][]> {
  const token = await getAccessToken()
  const url = `${API}/${spreadsheetId}/values/${encodeURIComponent(range)}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`getSheetValues failed (${res.status}): ${body}`)
  }
  const json = await res.json() as { values?: string[][] }
  return json.values || []
}

/** Overwrite a range with the given values (rows × cols). Clears the existing range first. */
export async function setSheetValues(spreadsheetId: string, range: string, values: string[][]): Promise<void> {
  const token = await getAccessToken()
  // 1) Clear the existing range
  const clearUrl = `${API}/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`
  const clearRes = await fetch(clearUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: '{}',
  })
  if (!clearRes.ok) {
    const body = await clearRes.text()
    throw new Error(`clear failed (${clearRes.status}): ${body}`)
  }
  // 2) Write new values
  const writeUrl = `${API}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`
  const writeRes = await fetch(writeUrl, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values }),
  })
  if (!writeRes.ok) {
    const body = await writeRes.text()
    throw new Error(`setSheetValues failed (${writeRes.status}): ${body}`)
  }
}

/** Append rows to the bottom of a range. */
export async function appendSheetValues(spreadsheetId: string, range: string, values: string[][]): Promise<void> {
  const token = await getAccessToken()
  const url = `${API}/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`appendSheetValues failed (${res.status}): ${body}`)
  }
}
