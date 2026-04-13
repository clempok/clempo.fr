import type { Handler } from '@netlify/functions'
import { loadQuotes, saveQuotes, formatAmount, computeLineTotals } from './_quotes'
import type { QuoteSignature } from './_quotes'

const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method not allowed' }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const { company, ref, signature } = body as {
      company: string
      ref: string
      signature: Omit<QuoteSignature, 'ip' | 'userAgent' | 'signedAt'>
    }

    if (!company || !ref) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing company or ref' }) }
    }

    if (!signature?.signerName || !signature?.signerEmail || !signature?.image) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing signature data' }) }
    }

    if (!signature.cgvAccepted) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'CGV must be accepted' }) }
    }

    const data = await loadQuotes()
    const quote = data.quotes.find(q => q.companySlug === company && q.id === ref)

    if (!quote) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Quote not found' }) }
    }

    if (quote.signature) {
      return { statusCode: 409, headers, body: JSON.stringify({ error: 'Quote already signed' }) }
    }

    // Save signature with metadata
    const ip = event.headers['x-forwarded-for']
      || event.headers['x-real-ip']
      || event.headers['client-ip']
      || 'unknown'
    const userAgent = event.headers['user-agent'] || 'unknown'

    quote.signature = {
      ...signature,
      ip,
      userAgent,
      signedAt: new Date().toISOString(),
    }
    quote.status = 'accepted'

    await saveQuotes(data)

    // Send confirmation emails
    const apiKey = process.env.RESEND_API_KEY
    if (apiKey) {
      const { totalTTC } = computeLineTotals(quote.lines, quote.globalDiscount || 0)
      const quoteUrl = `https://www.clempo.fr/devis/${quote.companySlug}/${quote.id}`

      // Email to sender (notification)
      const senderHtml = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2 style="color:#16a34a;margin:0 0 16px;">Devis signé !</h2>
          <p style="color:#333;font-size:15px;line-height:1.7;">
            Le devis <strong>${quote.reference}</strong> a été signé par <strong>${signature.signerName}</strong>
            (${signature.signerCompany || quote.companyName}).
          </p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr><td style="padding:8px 0;color:#666;font-size:14px;">Montant TTC</td><td style="padding:8px 0;font-weight:700;font-size:14px;">${formatAmount(totalTTC)}</td></tr>
            <tr><td style="padding:8px 0;color:#666;font-size:14px;">Signataire</td><td style="padding:8px 0;font-size:14px;">${signature.signerName} — ${signature.signerEmail}</td></tr>
            ${signature.signerCompany ? `<tr><td style="padding:8px 0;color:#666;font-size:14px;">Société</td><td style="padding:8px 0;font-size:14px;">${signature.signerCompany}</td></tr>` : ''}
            ${signature.signerEmailCompta ? `<tr><td style="padding:8px 0;color:#666;font-size:14px;">Email compta</td><td style="padding:8px 0;font-size:14px;">${signature.signerEmailCompta}</td></tr>` : ''}
            ${signature.signerTva ? `<tr><td style="padding:8px 0;color:#666;font-size:14px;">N° TVA</td><td style="padding:8px 0;font-size:14px;">${signature.signerTva}</td></tr>` : ''}
            <tr><td style="padding:8px 0;color:#666;font-size:14px;">Signé le</td><td style="padding:8px 0;font-size:14px;">${new Date().toLocaleString('fr-FR')}</td></tr>
            <tr><td style="padding:8px 0;color:#666;font-size:14px;">IP</td><td style="padding:8px 0;font-size:14px;">${ip}</td></tr>
          </table>
          <a href="${quoteUrl}" style="display:inline-block;background:#1A1A6B;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Voir le devis signé</a>
        </div>
      `

      // Email to client (confirmation)
      const clientHtml = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2 style="color:${quote.accentColor || '#1A1A6B'};margin:0 0 16px;">Confirmation de signature</h2>
          <p style="color:#333;font-size:15px;line-height:1.7;">
            Bonjour ${signature.signerName},
          </p>
          <p style="color:#333;font-size:15px;line-height:1.7;">
            Votre signature du devis <strong>${quote.reference}</strong> a bien été enregistrée.
            Vous pouvez consulter le devis signé à tout moment :
          </p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${quoteUrl}" style="display:inline-block;background:${quote.accentColor || '#1A1A6B'};color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">Voir le devis</a>
          </div>
          <p style="color:#888;font-size:13px;line-height:1.6;">
            Signé le ${new Date().toLocaleString('fr-FR')}<br>
            Montant : ${formatAmount(totalTTC)} TTC
          </p>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
          <p style="color:#888;font-size:13px;">
            ${quote.senderName} — ${quote.senderCompany}<br>
            <a href="mailto:${quote.senderEmail}" style="color:${quote.accentColor || '#1A1A6B'};">${quote.senderEmail}</a>
          </p>
        </div>
      `

      // Send both emails in parallel
      await Promise.allSettled([
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: `${quote.senderCompany} <noreply@clempo.fr>`,
            to: [quote.senderEmail],
            subject: `✅ Devis ${quote.reference} signé par ${signature.signerName}`,
            html: senderHtml,
          }),
        }),
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: `${quote.senderCompany} <noreply@clempo.fr>`,
            to: [signature.signerEmail],
            reply_to: quote.senderEmail,
            subject: `Confirmation — Devis ${quote.reference} signé`,
            html: clientHtml,
          }),
        }),
      ])
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, signedAt: quote.signature.signedAt }),
    }
  } catch (err) {
    console.error('Sign error:', err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: String(err) }) }
  }
}

export { handler }
