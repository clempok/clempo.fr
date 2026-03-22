import type { Handler } from '@netlify/functions'

const handler: Handler = async (event) => {
  try {
    const payload = JSON.parse(event.body || '{}')
    const data = payload.data || {}

    const firstName = data['first-name'] || data.firstName || ''
    const lastName = data['last-name'] || data.lastName || ''
    const company = data.company || ''
    const email = data.email || ''
    const phone = data.phone || ''

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.error('RESEND_API_KEY not set')
      return { statusCode: 500, body: 'Missing API key' }
    }

    const html = `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #09090b; margin-bottom: 24px;">🔔 Nouveau lead — clempo.fr</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666; width: 140px;">Prénom</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600;">${firstName}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Nom</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600;">${lastName}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Entreprise</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600;">${company}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Email</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600;">
              <a href="mailto:${email}" style="color: #0066cc;">${email}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #666;">Téléphone</td>
            <td style="padding: 10px 0; font-weight: 600;">${phone}</td>
          </tr>
        </table>
        <div style="margin-top: 28px; padding: 16px; background: #f9f9f9; border-radius: 8px; font-size: 13px; color: #888;">
          Soumis via le formulaire brochure de clempo.fr
        </div>
      </div>
    `

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Clempo.fr <noreply@clempo.fr>',
        to: ['clement.pougetosmont@gmail.com'],
        subject: 'Nouveau lead',
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Resend error:', err)
      return { statusCode: 500, body: err }
    }

    return { statusCode: 200, body: 'OK' }
  } catch (err) {
    console.error('Function error:', err)
    return { statusCode: 500, body: String(err) }
  }
}

export { handler }
