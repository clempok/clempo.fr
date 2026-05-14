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
    let foundContact: { email: string; firstName?: string; lastName?: string } | null = null
    let foundCompanyName = ''
    let foundLabel = ''
    let foundScore: number | undefined
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
        foundContact = {
          email: contact.email,
          firstName: contact.firstName,
          lastName: contact.lastName,
        }
        foundCompanyName = co.name
        foundLabel = np.resourceLabel
        foundScore = np.score
        changed = true
        break outer
      }
    }

    if (!changed) {
      return { statusCode: 404, body: JSON.stringify({ ok: false, error: 'not-found' }) }
    }
    await writeCrm(data)

    const apiKey = process.env.RESEND_API_KEY
    if (apiKey && foundContact) {
      const fullName = [foundContact.firstName, foundContact.lastName].filter(Boolean).join(' ') || foundContact.email
      const scoreLine = typeof foundScore === 'number' ? `${foundScore}/10` : '—'
      const html = `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #09090b; margin-bottom: 16px;">💬 Commentaire NPS</h2>
          <p style="margin: 0 0 16px; color: #555;">${fullName} (${foundContact.email}) — ${foundCompanyName}</p>
          <p style="margin: 0 0 16px; color: #555;">Note ${scoreLine} sur <strong>${foundLabel}</strong></p>
          <blockquote style="margin: 0; padding: 16px; background: #f9f9f9; border-left: 4px solid #1A1A6B; border-radius: 4px; white-space: pre-wrap; font-size: 15px; line-height: 1.55;">${escapeHtml(comment)}</blockquote>
          <p style="margin-top: 24px; font-size: 13px; color: #888;">
            Vue admin : <a href="https://www.clempo.fr/admin" style="color: #0066cc;">clempo.fr/admin</a>.
          </p>
        </div>
      `
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Clempo.fr <noreply@clempo.fr>',
            to: ['clement.pougetosmont@gmail.com'],
            subject: `💬 Commentaire NPS ${scoreLine} — ${foundLabel}`,
            html,
          }),
        })
      } catch (err) {
        console.error('nps-comment owner-notify error:', err)
      }
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) }
  } catch (err) {
    console.error('nps-comment error:', err)
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'server' }) }
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export { handler }
