import type { Handler } from '@netlify/functions'
import { loadQuotes, saveQuotes, slugify, computeLineTotals, formatAmount } from './_quotes'
import type { Quote } from './_quotes'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildEmail(data: any, quoteUrl: string): string {
  const { totalTTC } = computeLineTotals(data.lines || [], data.globalDiscount || 0)
  const bodyHtml = escapeHtml(data.emailContent || '').replace(/\n/g, '<br>')

  // ── Brand Book 2026 — Ink / Paper / Signal ──
  const INK = '#0A0A0B'
  const PAPER = '#EDEBE4'
  const PAPER_SOFT = '#F4F4F2'
  const GRAPHITE = '#2A2D35'
  const STEEL = '#6B6F7A'
  const MIST = '#B8BCC4'
  const SIGNAL = '#00D68F'
  const fontStack = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
  const monoStack = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
  const serifStack = "'Instrument Serif', Georgia, 'Times New Roman', serif"

  const offerLine = data.offerTitle
    ? `<tr><td style="padding-top: 8px; font-family: ${fontStack}; font-size: 14px; color: ${MIST};">${escapeHtml(data.offerTitle)}</td></tr>`
    : ''

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Devis ${escapeHtml(data.reference)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background-color: ${PAPER}; font-family: ${fontStack}; color: ${INK};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${PAPER};">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: ${PAPER}; border: 1px solid rgba(10,10,11,0.08); border-radius: 4px; overflow: hidden;">

          <!-- Hero band — Ink -->
          <tr>
            <td style="padding: 28px 32px; background-color: ${INK};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-family: ${monoStack}; font-size: 11px; font-weight: 500; color: ${SIGNAL}; letter-spacing: 0.1em; text-transform: uppercase;">
                      // Devis ${escapeHtml(data.reference)}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 10px;">
                    <span style="font-family: ${fontStack}; font-size: 22px; font-weight: 700; color: ${PAPER}; letter-spacing: -0.02em; line-height: 1.2;">
                      ${escapeHtml(data.clientCompany || data.clientName)} — <span style="font-family: ${monoStack}; font-weight: 500;">${formatAmount(totalTTC)}</span>
                    </span>
                  </td>
                </tr>
                ${offerLine}
              </table>
            </td>
          </tr>

          <!-- Email body -->
          <tr>
            <td style="padding: 32px;">
              <div style="font-family: ${fontStack}; font-size: 15px; color: ${GRAPHITE}; line-height: 1.75;">
                ${bodyHtml}
              </div>

              <!-- Primary CTA -->
              <div style="text-align: center; margin: 32px 0 8px;">
                <a href="${escapeHtml(quoteUrl)}" style="display: inline-block; background-color: ${SIGNAL}; color: ${INK}; padding: 14px 32px; border-radius: 4px; text-decoration: none; font-family: ${fontStack}; font-weight: 600; font-size: 15px; letter-spacing: -0.005em;">
                  Consulter le devis en ligne &nbsp;→
                </a>
              </div>
              <p style="font-family: ${monoStack}; font-size: 11px; color: ${STEEL}; text-align: center; margin: 12px 0 0; letter-spacing: 0.05em;">
                ou copier ce lien : <a href="${escapeHtml(quoteUrl)}" style="color: ${INK}; text-decoration: underline;">${escapeHtml(quoteUrl)}</a>
              </p>
            </td>
          </tr>

          <!-- Sign-off card -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${PAPER_SOFT}; border-radius: 4px; border-left: 2px solid ${SIGNAL};">
                <tr>
                  <td style="padding: 18px 22px;">
                    <span style="font-family: ${monoStack}; font-size: 11px; color: ${SIGNAL}; letter-spacing: 0.1em; text-transform: uppercase;">// Votre contact</span>
                    <p style="margin: 6px 0 0; font-family: ${fontStack}; font-size: 14px; color: ${INK}; line-height: 1.7;">
                      <strong style="font-weight: 700; letter-spacing: -0.01em;">${escapeHtml(data.senderName)}</strong><br>
                      <span style="font-family: ${serifStack}; font-style: italic; color: ${GRAPHITE};">Healthcare</span>
                      <span style="color: ${GRAPHITE};">Marketing Director — ${escapeHtml(data.senderCompany)}</span><br>
                      <a href="mailto:${escapeHtml(data.senderEmail)}" style="color: ${INK}; text-decoration: underline; text-decoration-color: ${SIGNAL}; text-underline-offset: 3px;">${escapeHtml(data.senderEmail)}</a>${data.senderPhone ? ' &middot; <span style="font-family: ' + monoStack + '; color: ' + GRAPHITE + ';">' + escapeHtml(data.senderPhone) + '</span>' : ''}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 18px 32px 22px; border-top: 1px solid rgba(10,10,11,0.08); text-align: center;">
              <span style="font-family: ${fontStack}; font-size: 14px; font-weight: 700; color: ${INK}; letter-spacing: -0.05em;">
                clempo<span style="display: inline-block; width: 4px; height: 4px; border-radius: 50%; background-color: ${SIGNAL}; margin-left: 1px; vertical-align: 1px;"></span>
              </span>
              <p style="margin: 6px 0 0; font-family: ${monoStack}; font-size: 10px; color: ${STEEL}; letter-spacing: 0.05em;">
                © ${new Date().getFullYear()} ${escapeHtml(data.senderCompany)} — www.clempo.fr
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { token, data, previewOnly } = body as { token: string; data: any; previewOnly?: boolean }

    // Auth — accept QUOTE_SECRET or ADMIN_PASSWORD
    const secret = process.env.QUOTE_SECRET
    const adminPw = process.env.ADMIN_PASSWORD
    const validToken = (secret && token === secret) || (adminPw && token === adminPw)
    if (!validToken) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) }
    }

    // Parse CC emails (comma-separated string OR array)
    const parseCc = (raw: unknown): string[] => {
      if (!raw) return []
      const arr = Array.isArray(raw)
        ? raw
        : String(raw).split(/[,;\n]/)
      return arr.map(s => String(s).trim()).filter(Boolean)
    }
    const ccEmails = parseCc(data.clientCcEmails)

    // Existing-id mode: update an existing quote and resend the email
    const existingId: string | undefined = data.existingId
    const quotesData = await loadQuotes()
    const existing = existingId ? quotesData.quotes.find(q => q.id === existingId) : null

    const quoteId = existing?.id || crypto.randomUUID()
    const companySlug = existing?.companySlug || slugify(data.clientCompany || data.clientName || 'client')
    const quoteUrl = `https://www.clempo.fr/devis/${companySlug}/${quoteId}`

    const html = buildEmail(data, quoteUrl)

    if (previewOnly) {
      return { statusCode: 200, headers, body: JSON.stringify({ html, quoteUrl }) }
    }

    // Save / update quote in store
    const now = new Date().toISOString()

    if (existing) {
      existing.reference = data.reference
      existing.companyName = data.clientCompany || data.clientName
      existing.clientName = data.clientName
      existing.clientEmail = data.clientEmail
      existing.clientCcEmails = ccEmails.length ? ccEmails : undefined
      existing.prospectLogo = data.prospectLogo || undefined
      existing.date = data.date
      existing.dueDate = data.dueDate
      existing.validUntil = data.validUntil || data.dueDate
      existing.offerTitle = data.offerTitle || undefined
      existing.context = data.context || undefined
      existing.presentation = data.presentation || undefined
      existing.arguments = data.arguments || undefined
      existing.lines = data.lines
      existing.globalDiscount = data.globalDiscount || 0
      existing.notes = data.notes
      existing.paymentTerms = data.paymentTerms || undefined
      existing.subject = data.subject || undefined
      existing.emailContent = data.emailContent
      existing.accentColor = data.accentColor || '#0A0A0B'
      existing.senderName = data.senderName
      existing.senderCompany = data.senderCompany
      existing.senderEmail = data.senderEmail
      existing.senderPhone = data.senderPhone || undefined
      existing.senderPhoto = data.senderPhoto || undefined
      existing.updatedAt = now
      existing.resentAt = now
      // Status: si déjà accepté/refusé/consulté, on garde — sinon on remet sent
      if (existing.status === 'draft') existing.status = 'sent'
    } else {
      const quote: Quote = {
        id: quoteId,
        reference: data.reference,
        companySlug,
        companyName: data.clientCompany || data.clientName,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientCcEmails: ccEmails.length ? ccEmails : undefined,
        prospectLogo: data.prospectLogo || undefined,
        date: data.date,
        dueDate: data.dueDate,
        validUntil: data.validUntil || data.dueDate,
        offerTitle: data.offerTitle || undefined,
        context: data.context || undefined,
        presentation: data.presentation || undefined,
        arguments: data.arguments || undefined,
        lines: data.lines,
        globalDiscount: data.globalDiscount || 0,
        notes: data.notes,
        paymentTerms: data.paymentTerms || undefined,
        subject: data.subject || undefined,
        emailContent: data.emailContent,
        status: 'sent',
        accentColor: data.accentColor || '#0A0A0B',
        senderName: data.senderName,
        senderCompany: data.senderCompany,
        senderEmail: data.senderEmail,
        senderPhone: data.senderPhone || undefined,
        senderPhoto: data.senderPhoto || undefined,
        createdAt: now,
        sentAt: now,
      }
      quotesData.quotes.push(quote)
    }
    await saveQuotes(quotesData)

    // Send via Resend
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'RESEND_API_KEY not set' }) }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resendBody: any = {
      from: `${data.senderCompany} <noreply@clempo.fr>`,
      to: [data.clientEmail],
      reply_to: data.senderEmail,
      subject: data.subject || `${data.reference} — ${data.senderCompany}`,
      html,
    }
    if (ccEmails.length) resendBody.cc = ccEmails

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resendBody),
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
      body: JSON.stringify({ success: true, emailId: result.id, quoteId, quoteUrl, updated: !!existing }),
    }
  } catch (err) {
    console.error('Function error:', err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: String(err) }) }
  }
}

export { handler }
