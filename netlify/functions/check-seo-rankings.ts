import type { Handler } from '@netlify/functions'
import { checkAuth } from './_analytics'
import { runSeoCheck } from './_seo-check'

/**
 * Manual trigger for the SEO scan. Called by the Admin "Vérifier positions"
 * button. Auth-gated. For the automatic weekly scan, see scheduled-seo-check.
 */
const handler: Handler = async (event) => {
  if (!checkAuth(event.headers as Record<string, string | undefined>)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  try {
    const result = await runSeoCheck()
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    }
  } catch (err) {
    console.error('check-seo-rankings error:', err)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: String(err), stack: (err as Error)?.stack }),
    }
  }
}

export { handler }
