import type { Handler } from '@netlify/functions'

// Exchange refresh token for access token
async function getAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing Google OAuth credentials')
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }).toString(),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Token refresh failed: ${err}`)
  }

  const data = await res.json()
  return data.access_token
}

const handler: Handler = async () => {
  try {
    const accessToken = await getAccessToken()

    // Look at the next 8 weeks
    const now = new Date()
    const timeMin = now.toISOString()
    const timeMax = new Date(now.getTime() + 56 * 24 * 60 * 60 * 1000).toISOString()

    const res = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timeMin,
        timeMax,
        timeZone: 'Europe/Paris',
        items: [{ id: 'primary' }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('FreeBusy error:', err)
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, error: err }),
      }
    }

    const data = await res.json()
    const busy = data.calendars?.primary?.busy || []

    return {
      statusCode: 200,
      headers: {
        'Cache-Control': 'public, max-age=60',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ success: true, busy }),
    }
  } catch (err) {
    console.error('Function error:', err)
    return { statusCode: 500, body: String(err) }
  }
}

export { handler }
