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
    let foundContact: { email: string; firstName?: string; lastName?: string } | null = null
    let foundCompanyName = ''
    let foundResponseLabel = ''
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
        foundContact = {
          email: contact.email,
          firstName: contact.firstName,
          lastName: contact.lastName,
        }
        foundCompanyName = co.name
        foundResponseLabel = np.resourceLabel
        break outer
      }
    }

    if (changed) await writeCrm(data)

    if (changed && foundContact) {
      const apiKey = process.env.RESEND_API_KEY
      if (apiKey) {
        const fullName = [foundContact.firstName, foundContact.lastName].filter(Boolean).join(' ') || foundContact.email
        const color = score <= 6 ? '#dc2626' : score <= 8 ? '#f59e0b' : '#16a34a'
        const label = score <= 6 ? 'Détracteur' : score <= 8 ? 'Passif' : 'Promoteur'
        const html = `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #09090b; margin-bottom: 24px;">📊 Nouvelle réponse NPS</h2>
            <div style="font-size: 48px; font-weight: 700; color: ${color}; text-align: center; margin: 8px 0;">${score}/10</div>
            <div style="text-align: center; color: ${color}; font-weight: 600; margin-bottom: 24px;">${label}</div>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666; width: 140px;">Contact</td><td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600;">${fullName}</td></tr>
              <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Email</td><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><a href="mailto:${foundContact.email}" style="color: #0066cc;">${foundContact.email}</a></td></tr>
              <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Société</td><td style="padding: 10px 0; border-bottom: 1px solid #eee;">${foundCompanyName}</td></tr>
              <tr><td style="padding: 10px 0; color: #666;">Ressource</td><td style="padding: 10px 0; font-weight: 600;">${foundResponseLabel}</td></tr>
            </table>
            <p style="margin-top: 24px; font-size: 13px; color: #888;">
              Si le contact poursuit, son commentaire arrivera dans le CRM. Vue admin : <a href="https://www.clempo.fr/admin" style="color: #0066cc;">clempo.fr/admin</a>.
            </p>
          </div>
        `
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Clempo.fr <noreply@clempo.fr>',
              to: ['clement.pougetosmont@gmail.com'],
              subject: `NPS ${score}/10 — ${foundResponseLabel}`,
              html,
            }),
          })
        } catch (err) {
          console.error('nps-respond owner-notify error:', err)
        }
      }
    }

    return redirect(npsThanksUrl(token, score))
  } catch (err) {
    console.error('nps-respond error:', err)
    return redirect(npsThanksErrorUrl())
  }
}

export { handler }
