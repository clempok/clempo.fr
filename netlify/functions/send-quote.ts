import type { Handler } from '@netlify/functions'
import { loadQuotes, saveQuotes, slugify } from './_quotes'
import type { Quote } from './_quotes'
import { isAdminToken } from './_analytics'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildEmail(data: any, quoteUrl: string): string {
  const bodyHtml = escapeHtml(data.emailContent || '').replace(/\n/g, '<br>')
  const fontStack = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

  const phoneLine = data.senderPhone
    ? `<br>${escapeHtml(data.senderPhone)}`
    : ''

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Devis ${escapeHtml(data.reference)}</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:${fontStack};color:#1a1a1a;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;font-size:15px;line-height:1.6;">

    <div>${bodyHtml}</div>

    <div style="margin:28px 0;">
      <a href="${escapeHtml(quoteUrl)}" style="display:inline-block;background-color:#0A0A0B;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;font-family:${fontStack};">
        Consulter le devis →
      </a>
    </div>

    <div style="color:#1a1a1a;">
      ${escapeHtml(data.senderName)}<br>
      <a href="mailto:${escapeHtml(data.senderEmail)}" style="color:#1a1a1a;text-decoration:underline;">${escapeHtml(data.senderEmail)}</a>${phoneLine}
    </div>

  </div>
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
    const isDraft = data?.draft === true

    // Auth — accept QUOTE_SECRET or any admin password (principal + stagiaire)
    const secret = process.env.QUOTE_SECRET
    const validToken = (secret && token === secret) || isAdminToken(token)
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
      if (!isDraft) {
        existing.resentAt = now
        // Status: si déjà accepté/refusé/consulté, on garde — sinon on remet sent
        if (existing.status === 'draft') existing.status = 'sent'
      }
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
        status: isDraft ? 'draft' : 'sent',
        accentColor: data.accentColor || '#0A0A0B',
        senderName: data.senderName,
        senderCompany: data.senderCompany,
        senderEmail: data.senderEmail,
        senderPhone: data.senderPhone || undefined,
        senderPhoto: data.senderPhoto || undefined,
        createdAt: now,
        sentAt: isDraft ? undefined : now,
      }
      quotesData.quotes.push(quote)
    }
    await saveQuotes(quotesData)

    // Mode brouillon : on s'arrête là, pas d'email
    if (isDraft) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, draft: true, quoteId, quoteUrl, updated: !!existing }),
      }
    }

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
