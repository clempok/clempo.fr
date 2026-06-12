import type { Handler } from '@netlify/functions'
import { getSendRecord, recordEmailEvent } from './_email-tracking'

/** 1x1 transparent GIF. */
const PIXEL_B64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

/**
 * Public open-tracking pixel, embedded in every tracked email. Records an
 * "open" event for the send id, then returns the pixel — always, even on
 * error or unknown id, so a broken blob store never shows a broken image
 * in someone's inbox.
 */
const handler: Handler = async (event) => {
  const id = event.queryStringParameters?.id
  try {
    if (id && (await getSendRecord(id))) {
      await recordEmailEvent(id, 'open')
    }
  } catch (err) {
    console.error('[email-open] error:', err)
  }
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    },
    body: PIXEL_B64,
    isBase64Encoded: true,
  }
}

export { handler }
