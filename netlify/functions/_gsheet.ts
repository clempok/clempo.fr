/**
 * Minimal Google Sheets API v4 client.
 *
 * Auth flow: load a service-account JSON (GOOGLE_SERVICE_ACCOUNT_JSON env),
 * sign a JWT with its private key, exchange for an OAuth2 access token, then
 * call sheets.googleapis.com. No SDK — kept to a single file so the Netlify
 * function bundle stays lean.
 *
 * The sheet must be shared (Editor) with the service account's `client_email`.
 */
import crypto from 'node:crypto'

type ServiceAccount = {
  client_email: string
  private_key: string
  token_uri?: string
}

function loadServiceAccount(): ServiceAccount {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON env var is missing')
  let parsed: ServiceAccount
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON')
  }
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON missing client_email or private_key')
  }
  // Netlify env vars often store \n literally — normalize to real newlines.
  parsed.private_key = parsed.private_key.replace(/\\n/g, '\n')
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

  const sa = loadServiceAccount()
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
