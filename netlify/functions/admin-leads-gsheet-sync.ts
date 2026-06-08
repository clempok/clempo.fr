import type { Handler } from '@netlify/functions'
import { checkAuth } from './_analytics'
import { syncLeadsToGsheet } from './_leads-gsheet'

/**
 * On-demand trigger for the Leads → Google Sheet sync. Same logic as the
 * weekly cron, exposed behind the admin bearer so it can be fired from the
 * /admin dashboard or via curl for backlog fills / debugging.
 *
 *   curl -X POST -H "Authorization: Bearer $ADMIN_PASSWORD" \
 *     https://www.clempo.fr/.netlify/functions/admin-leads-gsheet-sync
 */
const handler: Handler = async (event) => {
  if (!checkAuth(event.headers as Record<string, string | undefined>)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  try {
    const result = await syncLeadsToGsheet(process.env.LEADS_SHEET_ID || undefined)
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    }
  } catch (err) {
    console.error('admin-leads-gsheet-sync error:', err)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: String(err) }),
    }
  }
}

export { handler }
