import type { Handler } from '@netlify/functions'
import { loadQuotes, saveQuotes, slugify, formatAmount } from './_quotes'
import type { Quote, QuoteLine } from './_quotes'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

interface QuoteInput {
  clientName: string
  clientEmail: string
  clientCompany: string
  reference: string
  date: string
  dueDate: string
  lines: QuoteLine[]
  notes: string
  emailContent: string
  senderName: string
  senderCompany: string
  senderEmail: string
  accentColor: string
  subject: string
}

function buildEmail(data: QuoteInput, quoteUrl: string): string {
  const totalHT = data.lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0)
  const tva = totalHT * 0.2
  const totalTTC = totalHT + tva

  // Convert newlines in emailContent to <br>
  const bodyHtml = escapeHtml(data.emailContent).replace(/\n/g, '<br>')

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header with CTA -->
          <tr>
            <td style="padding: 28px 32px; background-color: #fafafa; border-bottom: 1px solid #eee;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <a href="${escapeHtml(quoteUrl)}" style="display: inline-block; background-color: ${data.accentColor}; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 14px; letter-spacing: 0.3px;">
                      Voir le Devis
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 16px;">
                    <span style="font-size: 16px; font-weight: 700; color: #111;">${escapeHtml(data.reference)} — ${escapeHtml(data.clientCompany || data.clientName)}</span><br>
                    <span style="font-size: 15px; color: #555; line-height: 1.8;">
                      ${formatAmount(totalTTC)} TTC
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Email body (custom text) -->
          <tr>
            <td style="padding: 28px 32px;">
              <div style="font-size: 15px; color: #333; line-height: 1.7;">
                ${bodyHtml}
              </div>

              <!-- CTA button repeated -->
              <div style="text-align: center; margin: 28px 0 12px;">
                <a href="${escapeHtml(quoteUrl)}" style="display: inline-block; background-color: ${data.accentColor}; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px;">
                  Consulter le devis en ligne
                </a>
              </div>
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
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const { token, data, previewOnly } = body as { token: string; data: QuoteInput; previewOnly?: boolean }

    // Auth
    const secret = process.env.QUOTE_SECRET
    if (!secret || token !== secret) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) }
    }

    // Build the quote ID & URL
    const quoteId = crypto.randomUUID()
    const companySlug = slugify(data.clientCompany || data.clientName)
    const quoteUrl = `https://www.clempo.fr/devis/${companySlug}/${quoteId}`

    const html = buildEmail(data, quoteUrl)

    // Preview mode
    if (previewOnly) {
      return { statusCode: 200, headers, body: JSON.stringify({ html, quoteUrl }) }
    }

    // Save quote to store
    const now = new Date().toISOString()
    const quote: Quote = {
      id: quoteId,
      reference: data.reference,
      companySlug,
      companyName: data.clientCompany || data.clientName,
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      date: data.date,
      dueDate: data.dueDate,
      lines: data.lines,
      notes: data.notes,
      emailContent: data.emailContent,
      status: 'sent',
      accentColor: data.accentColor,
      senderName: data.senderName,
      senderCompany: data.senderCompany,
      senderEmail: data.senderEmail,
      createdAt: now,
      sentAt: now,
    }

    const quotesData = await loadQuotes()
    quotesData.quotes.push(quote)
    await saveQuotes(quotesData)

    // Send via Resend
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'RESEND_API_KEY not set' }) }
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
      return { statusCode: 500, headers, body: JSON.stringify({ error: err }) }
    }

    const result = await res.json()
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, emailId: result.id, quoteId, quoteUrl }),
    }
  } catch (err) {
    console.error('Function error:', err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: String(err) }) }
  }
}

export { handler }
