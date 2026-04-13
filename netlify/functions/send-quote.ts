import type { Handler } from '@netlify/functions'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

interface QuoteLine {
  description: string
  quantity: number
  unitPrice: number
}

interface QuoteData {
  clientName: string
  clientEmail: string
  clientCompany: string
  reference: string
  date: string
  dueDate: string
  lines: QuoteLine[]
  notes: string
  senderName: string
  senderCompany: string
  senderEmail: string
  accentColor: string
  ctaLabel: string
  ctaUrl: string
  subject: string
}

function buildQuoteEmail(data: QuoteData): string {
  const totalHT = data.lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0)
  const tva = totalHT * 0.2
  const totalTTC = totalHT + tva

  const linesHtml = data.lines
    .map(
      (l) => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 14px; color: #333;">
          ${escapeHtml(l.description)}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 14px; color: #333; text-align: center;">
          ${l.quantity}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 14px; color: #333; text-align: right;">
          ${formatAmount(l.unitPrice)}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 14px; color: #333; text-align: right; font-weight: 600;">
          ${formatAmount(l.quantity * l.unitPrice)}
        </td>
      </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header avec bouton CTA (style Odoo) -->
          <tr>
            <td style="padding: 28px 32px; background-color: #fafafa; border-bottom: 1px solid #eee;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <a href="${escapeHtml(data.ctaUrl)}" style="display: inline-block; background-color: ${data.accentColor}; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 14px; letter-spacing: 0.3px;">
                      ${escapeHtml(data.ctaLabel)}
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 16px;">
                    <span style="font-size: 16px; font-weight: 700; color: #111;">${escapeHtml(data.reference)} — ${escapeHtml(data.clientCompany || data.clientName)}</span><br>
                    <span style="font-size: 15px; color: #555; line-height: 1.8;">
                      ${formatAmount(totalTTC)} TTC &nbsp;·&nbsp; dû le ${formatDate(data.dueDate)}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Corps du message -->
          <tr>
            <td style="padding: 28px 32px;">
              <p style="margin: 0 0 16px; font-size: 15px; color: #333; line-height: 1.6;">
                Bonjour ${escapeHtml(data.clientName)},
              </p>
              <p style="margin: 0 0 16px; font-size: 15px; color: #333; line-height: 1.6;">
                Veuillez trouver ci-dessous votre devis <strong>${escapeHtml(data.reference)}</strong>, d'un montant de <strong>${formatAmount(totalTTC)} TTC</strong>, émis par ${escapeHtml(data.senderCompany)}.
              </p>

              <!-- Tableau des lignes -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                <tr style="background-color: ${data.accentColor};">
                  <td style="padding: 10px 12px; font-size: 13px; font-weight: 600; color: #fff;">Description</td>
                  <td style="padding: 10px 12px; font-size: 13px; font-weight: 600; color: #fff; text-align: center;">Qté</td>
                  <td style="padding: 10px 12px; font-size: 13px; font-weight: 600; color: #fff; text-align: right;">Prix unit.</td>
                  <td style="padding: 10px 12px; font-size: 13px; font-weight: 600; color: #fff; text-align: right;">Total</td>
                </tr>
                ${linesHtml}
                <tr>
                  <td colspan="3" style="padding: 8px 12px; font-size: 14px; color: #666; text-align: right;">Total HT</td>
                  <td style="padding: 8px 12px; font-size: 14px; color: #333; text-align: right; font-weight: 600;">${formatAmount(totalHT)}</td>
                </tr>
                <tr>
                  <td colspan="3" style="padding: 8px 12px; font-size: 14px; color: #666; text-align: right;">TVA (20%)</td>
                  <td style="padding: 8px 12px; font-size: 14px; color: #333; text-align: right;">${formatAmount(tva)}</td>
                </tr>
                <tr style="background-color: #fafafa;">
                  <td colspan="3" style="padding: 12px; font-size: 15px; font-weight: 700; color: #111; text-align: right;">Total TTC</td>
                  <td style="padding: 12px; font-size: 15px; font-weight: 700; color: ${data.accentColor}; text-align: right;">${formatAmount(totalTTC)}</td>
                </tr>
              </table>

              ${data.notes ? `<p style="margin: 16px 0; font-size: 14px; color: #555; line-height: 1.6; padding: 16px; background: #f9f9f9; border-radius: 8px; border-left: 3px solid ${data.accentColor};">${escapeHtml(data.notes)}</p>` : ''}

              <p style="margin: 16px 0; font-size: 15px; color: #333; line-height: 1.6;">
                Merci d'indiquer la référence <strong>${escapeHtml(data.reference)}</strong> lors de votre paiement.
              </p>
              <p style="margin: 16px 0 0; font-size: 15px; color: #333; line-height: 1.6;">
                Nous restons à votre disposition si besoin.
              </p>
              <p style="margin: 16px 0 0; font-size: 15px; color: #333;">
                Bien à vous,
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; border-top: 1px solid #eee; background-color: #fafafa;">
              <p style="margin: 0; font-size: 13px; color: #888;">
                --<br>
                ${escapeHtml(data.senderName)}<br>
                ${escapeHtml(data.senderCompany)}<br>
                <a href="mailto:${escapeHtml(data.senderEmail)}" style="color: ${data.accentColor};">${escapeHtml(data.senderEmail)}</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

const handler: Handler = async (event) => {
  // CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' },
      body: '',
    }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const { token, data, previewOnly } = body as { token: string; data: QuoteData; previewOnly?: boolean }

    // Simple auth token (set as env var QUOTE_SECRET)
    const secret = process.env.QUOTE_SECRET
    if (!secret || token !== secret) {
      return { statusCode: 401, body: 'Unauthorized' }
    }

    const html = buildQuoteEmail(data)

    // Preview mode: return HTML without sending
    if (previewOnly) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ html }),
      }
    }

    // Send via Resend
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return { statusCode: 500, body: 'RESEND_API_KEY not set' }
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${data.senderCompany} <noreply@clempo.fr>`,
        to: [data.clientEmail],
        reply_to: data.senderEmail,
        subject: data.subject || `${data.reference} — ${data.senderCompany}`,
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Resend error:', err)
      return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: err }
    }

    const result = await res.json()
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true, emailId: result.id }),
    }
  } catch (err) {
    console.error('Function error:', err)
    return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: String(err) }
  }
}

export { handler }
