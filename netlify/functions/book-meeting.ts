import type { Handler } from '@netlify/functions'

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

function formatICSDate(date: string, hour: number, minute: number): string {
  // date is YYYY-MM-DD, return YYYYMMDDTHHMMSS format (local Paris time treated as UTC for simplicity)
  const d = date.replace(/-/g, '')
  return `${d}T${pad(hour)}${pad(minute)}00`
}

function generateUID(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}@clempo.fr`
}

function escapeICS(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
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

    const startStr = formatICSDate(date, hour, minute)
    const endStr = formatICSDate(date, endHour, endMinute)
    const uid = generateUID()
    const now = new Date()
    const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}T${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`

    const summary = `RDV Clément Pouget-Osmont / ${firstName} ${lastName}`
    const description = message
      ? `Message: ${escapeICS(message)}`
      : (isFr ? 'Rendez-vous de 30 minutes' : '30-minute meeting')

    // Generate ICS content
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//clempo.fr//Booking//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VTIMEZONE',
      'TZID:Europe/Paris',
      'BEGIN:STANDARD',
      'DTSTART:19701025T030000',
      'RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10',
      'TZOFFSETFROM:+0200',
      'TZOFFSETTO:+0100',
      'TZNAME:CET',
      'END:STANDARD',
      'BEGIN:DAYLIGHT',
      'DTSTART:19700329T020000',
      'RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3',
      'TZOFFSETFROM:+0100',
      'TZOFFSETTO:+0200',
      'TZNAME:CEST',
      'END:DAYLIGHT',
      'END:VTIMEZONE',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=Europe/Paris:${startStr}`,
      `DTEND;TZID=Europe/Paris:${endStr}`,
      `SUMMARY:${escapeICS(summary)}`,
      `DESCRIPTION:${description}`,
      `ORGANIZER;CN=Clément Pouget-Osmont:mailto:clement.pougetosmont@gmail.com`,
      `ATTENDEE;RSVP=TRUE;CN=${escapeICS(firstName)} ${escapeICS(lastName)}:mailto:${email}`,
      `ATTENDEE;CN=Clément Pouget-Osmont:mailto:clement.pougetosmont@gmail.com`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    const icsBase64 = Buffer.from(ics).toString('base64')

    const dateFormatted = new Date(date).toLocaleDateString(isFr ? 'fr-FR' : 'en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    const timeFormatted = `${pad(hour)}:${pad(minute)} — ${pad(endHour)}:${pad(endMinute)}`

    // Email to Clément (notification + ICS)
    const notifHtml = `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #1A1A6B; margin-bottom: 24px;">📅 Nouveau rendez-vous — clempo.fr</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666; width: 120px;">Date</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600;">${dateFormatted}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Horaire</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600;">${timeFormatted}</td>
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

    // Email to guest (confirmation + ICS)
    const confirmHtml = isFr ? `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #1A1A6B; margin-bottom: 24px;">Votre rendez-vous est confirmé</h2>
        <p style="color: #333; line-height: 1.6;">Bonjour ${firstName},</p>
        <p style="color: #333; line-height: 1.6;">Votre rendez-vous avec Clément Pouget-Osmont a bien été enregistré.</p>
        <div style="background: #f8f8f6; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 8px; font-weight: 600; color: #0A0A0A;">📅 ${dateFormatted}</p>
          <p style="margin: 0 0 8px; color: #1A1A6B; font-weight: 500;">🕐 ${timeFormatted} (heure de Paris)</p>
          <p style="margin: 0; color: #666; font-size: 13px;">Durée : 30 minutes</p>
        </div>
        <p style="color: #666; font-size: 13px; line-height: 1.5;">
          Vous trouverez l'invitation calendrier en pièce jointe.<br/>
          Pour toute question : clement.pougetosmont@gmail.com
        </p>
      </div>
    ` : `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #1A1A6B; margin-bottom: 24px;">Your meeting is confirmed</h2>
        <p style="color: #333; line-height: 1.6;">Hi ${firstName},</p>
        <p style="color: #333; line-height: 1.6;">Your meeting with Clément Pouget-Osmont has been confirmed.</p>
        <div style="background: #f8f8f6; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 8px; font-weight: 600; color: #0A0A0A;">📅 ${dateFormatted}</p>
          <p style="margin: 0 0 8px; color: #1A1A6B; font-weight: 500;">🕐 ${timeFormatted} (Paris time)</p>
          <p style="margin: 0; color: #666; font-size: 13px;">Duration: 30 minutes</p>
        </div>
        <p style="color: #666; font-size: 13px; line-height: 1.5;">
          Please find the calendar invitation attached.<br/>
          Any questions? clement.pougetosmont@gmail.com
        </p>
      </div>
    `

    // Send both emails via Resend
    const sendEmail = (to: string, subject: string, html: string, attachIcs: boolean) =>
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Clempo.fr <onboarding@resend.dev>',
          to: [to],
          subject,
          html,
          ...(attachIcs ? {
            attachments: [{
              filename: 'invitation.ics',
              content: icsBase64,
              content_type: 'text/calendar; method=REQUEST',
            }],
          } : {}),
        }),
      })

    // Send to Clément
    const notifSubject = `RDV ${firstName} ${lastName} — ${dateFormatted}`
    const [res1, res2] = await Promise.all([
      sendEmail('clement.pougetosmont@gmail.com', notifSubject, notifHtml, true),
      sendEmail(email, isFr ? 'Votre rendez-vous — clempo.fr' : 'Your meeting — clempo.fr', confirmHtml, true),
    ])

    if (!res1.ok) {
      const err = await res1.text()
      console.error('Resend error (notif):', err)
    }
    if (!res2.ok) {
      const err = await res2.text()
      console.error('Resend error (confirm):', err)
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) }
  } catch (err) {
    console.error('Function error:', err)
    return { statusCode: 500, body: String(err) }
  }
}

export { handler }
