import type { Handler } from '@netlify/functions'
import { readCrm, writeCrm } from './_crm'
import { verifyNpsToken } from './_nps'

const MAX_COMMENT_LEN = 2000

/**
 * Public POST endpoint hit from the NpsThanks page when the visitor submits
 * an optional comment. JSON body: { t: token, comment: string }.
 * Idempotent — each submit overwrites the previous comment.
 */
const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  let body: { t?: string; comment?: string }
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'bad-json' }) }
  }

  const payload = verifyNpsToken(body.t)
  if (!payload) {
    return { statusCode: 401, body: JSON.stringify({ ok: false, error: 'bad-token' }) }
  }

  const comment = (body.comment || '').toString().trim().slice(0, MAX_COMMENT_LEN)
  if (!comment) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'empty-comment' }) }
  }

  try {
    const data = await readCrm()
    let changed = false

    outer: for (const co of data.companies) {
      for (const contact of co.contacts) {
        if (contact.email.toLowerCase() !== payload.contactEmail.toLowerCase()) continue
        if (!contact.npsResponses) continue
        const np = contact.npsResponses.find(r => r.id === payload.responseId)
        if (!np) continue
        np.comment = comment
        np.commentAt = new Date().toISOString()
        contact.updatedAt = np.commentAt
        co.updatedAt = np.commentAt
        changed = true
        break outer
      }
    }

    if (!changed) {
      return { statusCode: 404, body: JSON.stringify({ ok: false, error: 'not-found' }) }
    }
    await writeCrm(data)

    // Pas de notification instantanée : les commentaires NPS sont regroupés
    // dans le récap du matin (scheduled-leads-digest.ts).

    return { statusCode: 200, body: JSON.stringify({ ok: true }) }
  } catch (err) {
    console.error('nps-comment error:', err)
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'server' }) }
  }
}

export { handler }
