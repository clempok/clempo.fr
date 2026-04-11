import type { Handler } from '@netlify/functions'
import { recordEvent } from './_analytics'
import { upsertContact } from './_crm'

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

// Format date for display (always in Paris timezone)
function formatDateParis(dateStr: string, locale: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`)
  return d.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Paris',
  })
}

// Build a local Paris dateTime string (Google accepts this with timeZone field)
function toLocalDateTime(dateStr: string, hour: number, minute: number): string {
  return `${dateStr}T${pad(hour)}:${pad(minute)}:00`
}

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

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  try {
    const { date, hour, minute, firstName, lastName, email, message, lang } = JSON.parse(event.body || '{}')

    if (!date || hour === undefined || minute === undefined || !firstName || !lastName || !email) {
      return { statusCode: 400, body: 'Missing required fields' }
    }

    const isFr = lang === 'fr'
    const endMinute = (minute + 30) % 60
    const endHour = minute + 30 >= 60 ? hour + 1 : hour

    const startDateTime = toLocalDateTime(date, hour, minute)
    const endDateTime = toLocalDateTime(date, endHour, endMinute)

    const summary = `RDV Clement Pouget-Osmont / ${firstName} ${lastName}`
    const description = [
      isFr ? 'Rendez-vous de 30 minutes' : '30-minute meeting',
      '',
      `${firstName} ${lastName} <${email}>`,
      message ? '' : null,
      message || null,
    ].filter(x => x !== null).join('\n')

    // Get Google OAuth access token
    const accessToken = await getAccessToken()

    // Create event in Google Calendar with guest as attendee
    // sendUpdates=all → Google sends calendar invitation email to attendees natively
    const calendarRes = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary,
          description,
          start: {
            dateTime: startDateTime,
            timeZone: 'Europe/Paris',
          },
          end: {
            dateTime: endDateTime,
            timeZone: 'Europe/Paris',
          },
          attendees: [
            { email, displayName: `${firstName} ${lastName}` },
          ],
          reminders: {
            useDefault: true,
          },
          guestsCanModify: false,
          guestsCanInviteOthers: false,
        }),
      }
    )

    if (!calendarRes.ok) {
      const err = await calendarRes.text()
      console.error('Google Calendar error:', err)
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, error: err }),
      }
    }

    // Record booking event in analytics store (non-blocking failure)
    await recordEvent({
      type: 'booking',
      firstName,
      lastName,
      email,
      date,
      hour,
      minute,
      message,
      lang,
    })

    // Upsert into CRM with status "Lead"
    await upsertContact(
      {
        email,
        firstName,
        lastName,
        source: 'Booking',
        notes: message ? `RDV ${date} ${hour}:${minute} — ${message}` : `RDV ${date} ${hour}:${minute}`,
      },
      'Lead',
    )

    const eventData = await calendarRes.json()
    const dateFormatted = formatDateParis(date, isFr ? 'fr-FR' : 'en-GB')
    const timeFormatted = `${pad(hour)}:${pad(minute)} — ${pad(endHour)}:${pad(endMinute)}`

    // Send notification email to Clement via Resend (Google doesn't email organizer)
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      const notifHtml = `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #1A1A6B; margin-bottom: 24px;">Nouveau rendez-vous</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666; width: 120px;">Date</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600;">${dateFormatted}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Horaire</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600;">${timeFormatted} (Paris)</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Nom</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600;">${firstName} ${lastName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Email</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600;">
                <a href="mailto:${email}" style="color: #1A1A6B;">${email}</a>
              </td>
            </tr>
            ${message ? `
            <tr>
              <td style="padding: 10px 0; color: #666;">Message</td>
              <td style="padding: 10px 0; font-weight: 600;">${message}</td>
            </tr>` : ''}
          </table>
          ${eventData.htmlLink ? `
          <p style="margin-top: 24px;">
            <a href="${eventData.htmlLink}" style="color: #1A1A6B; font-weight: 600;">Voir dans Google Calendar →</a>
          </p>` : ''}
        </div>
      `

      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Clempo.fr <noreply@clempo.fr>',
            to: ['clement.pougetosmont@gmail.com'],
            subject: `RDV ${firstName} ${lastName} - ${dateFormatted}`,
            html: notifHtml,
          }),
        })
      } catch (e) {
        console.error('Resend notification failed:', e)
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        eventId: eventData.id,
        htmlLink: eventData.htmlLink,
        debug: { date, hour, minute, dateFormatted, startDateTime, endDateTime },
      }),
    }
  } catch (err) {
    console.error('Function error:', err)
    return { statusCode: 500, body: String(err) }
  }
}

export { handler }
