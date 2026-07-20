import type { Handler } from '@netlify/functions'
import { readCrm, writeCrm } from './_crm'
import {
  npsThanksErrorUrl,
  npsThanksUrl,
  parseScoreParam,
  verifyNpsToken,
} from './_nps'

/**
 * Public GET endpoint hit when a prospect clicks an NPS score button in the
 * email. Validates the HMAC token, writes the score on the matching
 * npsResponse, notifies the owner, and redirects to the thank-you page.
 *
 * Idempotent: re-clicking the same score is a no-op; clicking a different
 * score on the same token overwrites and re-notifies (treated as a correction).
 */
const handler: Handler = async (event) => {
  const params = event.queryStringParameters || {}
  const token = params.t
  const score = parseScoreParam(params.s)

  const redirect = (location: string) => ({
    statusCode: 302,
    headers: { Location: location, 'Cache-Control': 'no-store' },
    body: '',
  })

  if (!token || score === null) return redirect(npsThanksErrorUrl())
  const payload = verifyNpsToken(token)
  if (!payload) return redirect(npsThanksErrorUrl())

  try {
    const data = await readCrm()
    let changed = false

    outer: for (const co of data.companies) {
      for (const contact of co.contacts) {
        if (contact.email.toLowerCase() !== payload.contactEmail.toLowerCase()) continue
        if (!contact.npsResponses) continue
        const np = contact.npsResponses.find(r => r.id === payload.responseId)
        if (!np) continue
        if (np.score !== score) {
          np.score = score
          np.scoredAt = new Date().toISOString()
          contact.updatedAt = np.scoredAt
          co.updatedAt = np.scoredAt
          changed = true
        }
        break outer
      }
    }

    if (changed) await writeCrm(data)

    // Pas de notification instantanée : les réponses NPS de la journée sont
    // regroupées dans le récap du matin (scheduled-leads-digest.ts).

    return redirect(npsThanksUrl(token, score))
  } catch (err) {
    console.error('nps-respond error:', err)
    return redirect(npsThanksErrorUrl())
  }
}

export { handler }
