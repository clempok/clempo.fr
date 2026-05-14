import type { Handler } from '@netlify/functions'
import { checkAuth } from './_analytics'
import { readCrm, writeCrm } from './_crm'
import { sendNpsEmailFor } from './_nps'

/**
 * Admin-only endpoint to send a pending NPS email immediately (skips the
 * J+1 wait). Used from the admin "Envoyer maintenant" button on a contact's
 * pending NPS entry. Respects NPS_DRY_RUN so the same dry-run rules apply
 * as the cron.
 */
const handler: Handler = async (event) => {
  if (!checkAuth(event.headers as Record<string, string | undefined>)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'RESEND_API_KEY not configured' }) }
  }
  if (!process.env.NPS_SIGNING_SECRET) {
    return { statusCode: 500, body: JSON.stringify({ error: 'NPS_SIGNING_SECRET not configured' }) }
  }

  try {
    const body = JSON.parse(event.body || '{}') as {
      companyId?: string; contactId?: string; responseId?: string
    }
    if (!body.companyId || !body.contactId || !body.responseId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'companyId, contactId, responseId required' }) }
    }

    const data = await readCrm()
    const company = data.companies.find(c => c.id === body.companyId)
    if (!company) return { statusCode: 404, body: JSON.stringify({ error: 'Company not found' }) }
    const contact = company.contacts.find(c => c.id === body.contactId)
    if (!contact) return { statusCode: 404, body: JSON.stringify({ error: 'Contact not found' }) }
    const np = contact.npsResponses?.find(r => r.id === body.responseId)
    if (!np) return { statusCode: 404, body: JSON.stringify({ error: 'NPS response not found' }) }
    if (np.askedAt) {
      return { statusCode: 409, body: JSON.stringify({ error: 'already-asked', askedAt: np.askedAt }) }
    }

    const isDryRun = process.env.NPS_DRY_RUN === '1'
    const result = await sendNpsEmailFor(contact, np, { apiKey, isDryRun })
    if (!result.ok) {
      return { statusCode: 502, body: JSON.stringify({ error: 'send-failed', detail: result.error }) }
    }

    contact.updatedAt = np.askedAt!
    company.updatedAt = np.askedAt!
    await writeCrm(data)

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        dryRun: isDryRun,
        recipient: isDryRun ? 'clement.pougetosmont@gmail.com' : contact.email,
        askedAt: np.askedAt,
      }),
    }
  } catch (err) {
    console.error('admin-nps-trigger error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) }
  }
}

export { handler }
