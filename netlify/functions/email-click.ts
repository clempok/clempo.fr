import type { Handler } from '@netlify/functions'
import { getSendRecord, recordEmailEvent } from './_email-tracking'

const SITE_URL = 'https://www.clempo.fr'

/**
 * Public click-tracking redirect: every http(s) link in a tracked email goes
 * through here. The target URL is looked up by index in the send record
 * (never taken from the query string — no open redirect), a "click" event is
 * recorded, then 302 to the real destination. Unknown id/index falls back to
 * the site home so old or mangled links still land somewhere sensible.
 */
const handler: Handler = async (event) => {
  const id = event.queryStringParameters?.id || ''
  const linkIndex = Number(event.queryStringParameters?.l)

  let target = SITE_URL
  try {
    const record = id ? await getSendRecord(id) : null
    const url = record && Number.isInteger(linkIndex) ? record.links[linkIndex] : undefined
    if (record && url) {
      target = url
      await recordEmailEvent(id, 'click', linkIndex)
    }
  } catch (err) {
    console.error('[email-click] error:', err)
  }

  return {
    statusCode: 302,
    headers: {
      Location: target,
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    },
    body: '',
  }
}

export { handler }
