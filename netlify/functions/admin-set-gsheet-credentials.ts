import type { Handler } from '@netlify/functions'
import { checkAuth } from './_analytics'
import { getSecretsStore } from './_gsheet'

/**
 * One-time upload of the Google service-account JSON into Netlify Blobs.
 * The SA JSON is ~2.3KB which blows past Lambda's 4KB-per-function env-var
 * limit, so we can't ship it as an env var. We store it in the `secrets` blob
 * store and read it from there at runtime.
 *
 * Usage:
 *   curl -X POST -H "Authorization: Bearer $ADMIN_PASSWORD" \
 *        -H "Content-Type: application/json" \
 *        --data-binary @clempo-leads-sync.json \
 *        https://www.clempo.fr/.netlify/functions/admin-set-gsheet-credentials
 *
 * GET returns a presence check (does not leak the key).
 */
const handler: Handler = async (event) => {
  if (!checkAuth(event.headers as Record<string, string | undefined>)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  const store = getSecretsStore()

  if (event.httpMethod === 'GET') {
    const raw = (await store.get('gsheet-sa.json', { type: 'text' })) as string | null
    if (!raw) {
      return { statusCode: 404, body: JSON.stringify({ present: false }) }
    }
    try {
      const parsed = JSON.parse(raw)
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          present: true,
          client_email: parsed.client_email,
          project_id: parsed.project_id,
        }),
      }
    } catch {
      return { statusCode: 200, body: JSON.stringify({ present: true, malformed: true }) }
    }
  }

  if (event.httpMethod === 'POST') {
    const body = event.body || ''
    if (!body) return { statusCode: 400, body: JSON.stringify({ error: 'Empty body' }) }
    let parsed: { client_email?: string; private_key?: string }
    try {
      parsed = JSON.parse(body)
    } catch {
      return { statusCode: 400, body: JSON.stringify({ error: 'Body is not valid JSON' }) }
    }
    if (!parsed.client_email || !parsed.private_key) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing client_email or private_key' }),
      }
    }
    await store.set('gsheet-sa.json', body)
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: true,
        client_email: parsed.client_email,
        sizeBytes: body.length,
      }),
    }
  }

  return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
}

export { handler }
