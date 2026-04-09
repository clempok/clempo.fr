import type { Handler } from '@netlify/functions'

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

function generateUID(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}@clempo.fr`
}

// Get Paris UTC offset for a given date (+1 in winter, +2 in summer)
function getParisOffset(dateStr: string): number {
  const d = new Date(`${dateStr}T12:00:00Z`)
  const parisHour = parseInt(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Paris',
      hour: 'numeric',
      hour12: false,
    }).format(d)
  )
  return parisHour - d.getUTCHours()
}

// Convert Paris local time to UTC ICS format (YYYYMMDDTHHMMSSZ)
function parisToICSUtc(dateStr: string, hour: number, minute: number): string {
  const offset = getParisOffset(dateStr)
  const y = parseInt(dateStr.slice(0, 4))
  const m = parseInt(dateStr.slice(5, 7)) - 1
  const day = parseInt(dateStr.slice(8, 10))
  const utc = new Date(Date.UTC(y, m, day, hour - offset, minute, 0))
  return `${utc.getUTCFullYear()}${pad(utc.getUTCMonth() + 1)}${pad(utc.getUTCDate())}T${pad(utc.getUTCHours())}${pad(utc.getUTCMinutes())}00Z`
}

// Format date for display (always in Paris timezone)
function formatDateParis(dateStr: string, locale: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`) // noon UTC to avoid day shift
  return d.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Paris',
  })
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

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.error('RESEND_API_KEY not set')
      return { statusCode: 500, body: 'Missing API key' }
    }

    const isFr = lang === 'fr'
    const endMinute = (minute + 30) % 60
    const endHour = minute + 30 >= 60 ? hour + 1 : hour

    const dtStart = parisToICSUtc(date, hour, minute)
    const dtEnd = parisToICSUtc(date, endHour, endMinute)
    const dtStamp = parisToICSUtc(
      new Date().toISOString().slice(0, 10),
      new Date().getUTCHours(),
      new Date().getUTCMinutes()
    )
    const uid = generateUID()

    const summary = `RDV Clement Pouget-Osmont / ${firstName} ${lastName}`
    const desc = message || (isFr ? 'Rendez-vous de 30 minutes' : '30-minute meeting')

    // ICS — keep lines short, use UTC Z format for max compatibility
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//clempo.fr//Booking//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${desc}`,
      `ORGANIZER;CN=Clement Pouget-Osmont:mailto:clement.pougetosmont@gmail.com`,
      `ATTENDEE;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${firstName} ${lastName}`,
      ` :mailto:${email}`,
      `ATTENDEE;PARTSTAT=ACCEPTED;CN=Clement Pouget-Osmont`,
      ` :mailto:clement.pougetosmont@gmail.com`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    const icsBase64 = Buffer.from(ics).toString('base64')

    const dateFormatted = formatDateParis(date, isFr ? 'fr-FR' : 'en-GB')
    const timeFormatted = `${pad(hour)}:${pad(minute)} — ${pad(endHour)}:${pad(endMinute)}`

    // Notification email to Clément
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
      </div>
    `

    // Confirmation email to guest
    const confirmHtml = isFr ? `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #1A1A6B; margin-bottom: 24px;">Votre rendez-vous est confirme</h2>
        <p style="color: #333; line-height: 1.6;">Bonjour ${firstName},</p>
        <p style="color: #333; line-height: 1.6;">Votre rendez-vous avec Clement Pouget-Osmont a bien ete enregistre.</p>
        <div style="background: #f8f8f6; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 8px; font-weight: 600; color: #0A0A0A;">${dateFormatted}</p>
          <p style="margin: 0 0 8px; color: #1A1A6B; font-weight: 500;">${timeFormatted} (heure de Paris)</p>
          <p style="margin: 0; color: #666; font-size: 13px;">Duree : 30 minutes</p>
        </div>
        <p style="color: #666; font-size: 13px; line-height: 1.5;">
          Vous trouverez l'invitation calendrier en piece jointe.<br/>
          Pour toute question : clement.pougetosmont@gmail.com
        </p>
      </div>
    ` : `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #1A1A6B; margin-bottom: 24px;">Your meeting is confirmed</h2>
        <p style="color: #333; line-height: 1.6;">Hi ${firstName},</p>
        <p style="color: #333; line-height: 1.6;">Your meeting with Clement Pouget-Osmont has been confirmed.</p>
        <div style="background: #f8f8f6; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 8px; font-weight: 600; color: #0A0A0A;">${dateFormatted}</p>
          <p style="margin: 0 0 8px; color: #1A1A6B; font-weight: 500;">${timeFormatted} (Paris time)</p>
          <p style="margin: 0; color: #666; font-size: 13px;">Duration: 30 minutes</p>
        </div>
        <p style="color: #666; font-size: 13px; line-height: 1.5;">
          Please find the calendar invitation attached.<br/>
          Any questions? clement.pougetosmont@gmail.com
        </p>
      </div>
    `

    const sendEmail = (to: string, subject: string, html: string) =>
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Clempo.fr <noreply@clempo.fr>',
          to: [to],
          subject,
          html,
          attachments: [{
            filename: 'invite.ics',
            content: icsBase64,
          }],
        }),
      })

    const notifSubject = `RDV ${firstName} ${lastName} - ${dateFormatted}`
    const results: string[] = []

    const res1 = await sendEmail('clement.pougetosmont@gmail.com', notifSubject, notifHtml)
    if (!res1.ok) {
      const err = await res1.text()
      console.error('Resend error (notif):', err)
      results.push(`notif: ${err}`)
    } else {
      results.push('notif: ok')
    }

    try {
      const res2 = await sendEmail(
        email,
        isFr ? 'Votre rendez-vous - clempo.fr' : 'Your meeting - clempo.fr',
        confirmHtml
      )
      if (!res2.ok) {
        const err = await res2.text()
        console.error('Resend error (guest):', err)
        results.push(`guest: ${err}`)
      } else {
        results.push('guest: ok')
      }
    } catch (e) {
      console.error('Could not send to guest:', e)
      results.push(`guest: ${String(e)}`)
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, results }),
    }
  } catch (err) {
    console.error('Function error:', err)
    return { statusCode: 500, body: String(err) }
  }
}

export { handler }
