import type { Handler } from '@netlify/functions'
import { loadQuotes, saveQuotes, formatAmount, computeLineTotals } from './_quotes'
import type { QuoteSignature, Quote } from './_quotes'
// @ts-expect-error jspdf types
import { jsPDF } from 'jspdf'

/* ─── PDF generation (no reassurance elements) ─── */

function generateQuotePdf(quote: Quote, signature: QuoteSignature): string {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const accent = quote.accentColor || '#1A1A6B'
  let y = 20

  const addText = (text: string, x: number, yPos: number, opts: { size?: number; bold?: boolean; color?: string; maxWidth?: number; align?: string } = {}) => {
    doc.setFontSize(opts.size || 10)
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal')
    const rgb = hexToRgb(opts.color || '#111111')
    doc.setTextColor(rgb.r, rgb.g, rgb.b)
    if (opts.maxWidth) {
      doc.text(text, x, yPos, { maxWidth: opts.maxWidth, align: opts.align || 'left' })
    } else {
      doc.text(text, x, yPos, { align: opts.align || 'left' })
    }
  }

  // Header
  addText(quote.senderCompany, 15, y, { size: 18, bold: true, color: accent })
  addText(`Devis N° ${quote.reference}`, W - 15, y, { size: 10, bold: true, align: 'right' })
  y += 6
  addText(quote.senderName, 15, y, { size: 9, color: '#666666' })
  addText(`Date : ${quote.date}`, W - 15, y, { size: 9, align: 'right', color: '#666666' })
  y += 5
  if (quote.senderEmail) addText(quote.senderEmail, 15, y, { size: 9, color: '#666666' })
  if (quote.validUntil) addText(`Valable jusqu'au : ${quote.validUntil}`, W - 15, y, { size: 9, align: 'right', color: '#666666' })
  y += 5
  if (quote.senderPhone) addText(quote.senderPhone, 15, y, { size: 9, color: '#666666' })
  y += 10

  // Line
  const accentRgb = hexToRgb(accent)
  doc.setDrawColor(accentRgb.r, accentRgb.g, accentRgb.b)
  doc.setLineWidth(0.8)
  doc.line(15, y, W - 15, y)
  y += 10

  // Client info
  addText('DESTINATAIRE', 15, y, { size: 8, bold: true, color: '#999999' })
  y += 5
  addText(quote.companyName, 15, y, { size: 11, bold: true })
  y += 5
  addText(quote.clientName, 15, y, { size: 9, color: '#666666' })
  y += 5
  if (quote.clientEmail) addText(quote.clientEmail, 15, y, { size: 9, color: '#666666' })
  y += 5

  // Signer billing info
  if (signature.signerAddress || signature.signerCity) {
    const addr = [signature.signerAddress, [signature.signerPostalCode, signature.signerCity].filter(Boolean).join(' '), signature.signerCountry].filter(Boolean).join(', ')
    addText(addr, 15, y, { size: 9, color: '#666666' })
    y += 5
  }
  if (signature.signerTva) {
    addText(`TVA : ${signature.signerTva}`, 15, y, { size: 9, color: '#666666' })
    y += 5
  }

  if (quote.offerTitle) {
    y += 5
    addText(quote.offerTitle, W / 2, y, { size: 14, bold: true, color: accent, align: 'center' })
    y += 8
  } else {
    y += 5
  }

  // Products table
  y += 3
  // Table header
  doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b)
  doc.rect(15, y - 4, W - 30, 8, 'F')
  addText('Description', 18, y, { size: 8, bold: true, color: '#ffffff' })
  addText('Qte', 110, y, { size: 8, bold: true, color: '#ffffff', align: 'right' })
  addText('P.U. HT', 132, y, { size: 8, bold: true, color: '#ffffff', align: 'right' })
  addText('TVA', 152, y, { size: 8, bold: true, color: '#ffffff', align: 'right' })
  addText('Total HT', W - 18, y, { size: 8, bold: true, color: '#ffffff', align: 'right' })
  y += 8

  for (const line of quote.lines) {
    if (y > 260) { doc.addPage(); y = 20 }
    const tva = line.tva ?? 20
    const disc = line.discount ?? 0
    const lineHT = line.quantity * line.unitPrice * (1 - disc / 100)

    addText(line.description, 18, y, { size: 9, maxWidth: 85 })
    addText(`${line.quantity} ${line.unit || 'forfait'}`, 110, y, { size: 9, align: 'right' })
    addText(formatAmount(line.unitPrice), 132, y, { size: 9, align: 'right' })
    addText(`${tva}%`, 152, y, { size: 9, align: 'right' })
    addText(formatAmount(lineHT), W - 18, y, { size: 9, bold: true, align: 'right' })

    if (disc > 0) {
      y += 4
      addText(`Remise : -${disc}%`, 18, y, { size: 7, color: accent })
    }

    // Separator
    y += 6
    doc.setDrawColor(230, 230, 230)
    doc.setLineWidth(0.2)
    doc.line(15, y, W - 15, y)
    y += 4
  }

  // Totals
  const { totalHT, totalTVA, totalTTC } = computeLineTotals(quote.lines, quote.globalDiscount || 0)
  y += 4

  const totX = 130
  addText('Sous-total HT', totX, y, { size: 9, color: '#666666' })
  addText(formatAmount(totalHT + (quote.globalDiscount ? totalHT * (quote.globalDiscount / 100) / (1 - quote.globalDiscount / 100) : 0)), W - 18, y, { size: 9, align: 'right' })
  y += 6

  if (quote.globalDiscount && quote.globalDiscount > 0) {
    addText(`Remise globale (${quote.globalDiscount}%)`, totX, y, { size: 9, color: accent })
    const gdAmount = (totalHT / (1 - quote.globalDiscount / 100)) * (quote.globalDiscount / 100)
    addText(`-${formatAmount(gdAmount)}`, W - 18, y, { size: 9, align: 'right', color: accent })
    y += 6
  }

  addText('Total HT', totX, y, { size: 9, color: '#666666' })
  addText(formatAmount(totalHT), W - 18, y, { size: 9, bold: true, align: 'right' })
  y += 6

  addText('TVA', totX, y, { size: 9, color: '#666666' })
  addText(formatAmount(totalTVA), W - 18, y, { size: 9, align: 'right' })
  y += 6

  doc.setDrawColor(accentRgb.r, accentRgb.g, accentRgb.b)
  doc.setLineWidth(0.5)
  doc.line(totX, y, W - 15, y)
  y += 6
  addText('TOTAL TTC', totX, y, { size: 11, bold: true })
  addText(formatAmount(totalTTC), W - 18, y, { size: 13, bold: true, color: accent, align: 'right' })
  y += 10

  // Payment terms
  if (quote.paymentTerms) {
    if (y > 240) { doc.addPage(); y = 20 }
    addText('CONDITIONS DE PAIEMENT', 15, y, { size: 8, bold: true, color: '#999999' })
    y += 5
    addText(quote.paymentTerms, 15, y, { size: 9, color: '#444444', maxWidth: W - 30 })
    y += Math.ceil(quote.paymentTerms.length / 90) * 5 + 5
  }

  // Notes
  if (quote.notes) {
    if (y > 240) { doc.addPage(); y = 20 }
    addText('NOTES', 15, y, { size: 8, bold: true, color: '#999999' })
    y += 5
    addText(quote.notes, 15, y, { size: 9, color: '#444444', maxWidth: W - 30 })
    y += Math.ceil(quote.notes.length / 90) * 5 + 5
  }

  // Signature section
  if (y > 220) { doc.addPage(); y = 20 }
  y += 5
  doc.setDrawColor(230, 230, 230)
  doc.setLineWidth(0.3)
  doc.line(15, y, W - 15, y)
  y += 8

  addText('SIGNATURE ELECTRONIQUE', 15, y, { size: 8, bold: true, color: '#999999' })
  y += 6
  addText(`Signe par : ${signature.signerName}`, 15, y, { size: 9 })
  y += 5
  addText(`Email : ${signature.signerEmail}`, 15, y, { size: 9, color: '#666666' })
  y += 5
  if (signature.signerCompany) {
    addText(`Societe : ${signature.signerCompany}`, 15, y, { size: 9, color: '#666666' })
    y += 5
  }
  addText(`Date : ${new Date(signature.signedAt).toLocaleString('fr-FR')}`, 15, y, { size: 9, color: '#666666' })
  y += 5
  addText(`IP : ${signature.ip}`, 15, y, { size: 8, color: '#aaaaaa' })
  y += 8

  // Draw the signature image if it's base64
  if (signature.image && signature.image.startsWith('data:image')) {
    try {
      doc.addImage(signature.image, 'PNG', 15, y, 60, 20)
      y += 25
    } catch {
      // If image fails, just note it
      addText('[Signature electronique enregistree]', 15, y, { size: 9, color: '#666666' })
      y += 8
    }
  }

  addText('CGV acceptees : Oui', 15, y, { size: 8, color: '#888888' })

  // Footer
  const footerY = 285
  doc.setDrawColor(230, 230, 230)
  doc.setLineWidth(0.2)
  doc.line(15, footerY - 5, W - 15, footerY - 5)
  addText(`${quote.senderCompany} — ${quote.senderEmail}`, W / 2, footerY, { size: 7, color: '#aaaaaa', align: 'center' })

  // Return base64
  return doc.output('datauristring').split(',')[1]
}

function hexToRgb(hex: string) {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.substring(0, 2), 16) || 0,
    g: parseInt(h.substring(2, 4), 16) || 0,
    b: parseInt(h.substring(4, 6), 16) || 0,
  }
}

/* ─── Handler ─── */

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

    const fullSignature: QuoteSignature = {
      ...signature,
      ip,
      userAgent,
      signedAt: new Date().toISOString(),
    }

    quote.signature = fullSignature
    quote.status = 'accepted'

    await saveQuotes(data)

    // Generate PDF
    let pdfBase64: string | null = null
    try {
      pdfBase64 = generateQuotePdf(quote, fullSignature)
    } catch (e) {
      console.error('PDF generation error:', e)
    }

    // Send confirmation emails
    const apiKey = process.env.RESEND_API_KEY
    if (apiKey) {
      const { totalTTC } = computeLineTotals(quote.lines, quote.globalDiscount || 0)
      const quoteUrl = `https://www.clempo.fr/devis/${quote.companySlug}/${quote.id}`
      const pdfFilename = `${quote.reference.replace(/\//g, '-')}-signe.pdf`

      const attachments = pdfBase64 ? [{ filename: pdfFilename, content: pdfBase64 }] : []

      // Email to sender (notification)
      const senderHtml = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2 style="color:#16a34a;margin:0 0 16px;">Devis signe !</h2>
          <p style="color:#333;font-size:15px;line-height:1.7;">
            Le devis <strong>${quote.reference}</strong> a ete signe par <strong>${signature.signerName}</strong>
            (${signature.signerCompany || quote.companyName}).
          </p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr><td style="padding:8px 0;color:#666;font-size:14px;">Montant TTC</td><td style="padding:8px 0;font-weight:700;font-size:14px;">${formatAmount(totalTTC)}</td></tr>
            <tr><td style="padding:8px 0;color:#666;font-size:14px;">Signataire</td><td style="padding:8px 0;font-size:14px;">${signature.signerName} — ${signature.signerEmail}</td></tr>
            ${signature.signerCompany ? `<tr><td style="padding:8px 0;color:#666;font-size:14px;">Societe</td><td style="padding:8px 0;font-size:14px;">${signature.signerCompany}</td></tr>` : ''}
            ${signature.signerEmailCompta ? `<tr><td style="padding:8px 0;color:#666;font-size:14px;">Email compta</td><td style="padding:8px 0;font-size:14px;">${signature.signerEmailCompta}</td></tr>` : ''}
            ${signature.signerTva ? `<tr><td style="padding:8px 0;color:#666;font-size:14px;">N° TVA</td><td style="padding:8px 0;font-size:14px;">${signature.signerTva}</td></tr>` : ''}
            <tr><td style="padding:8px 0;color:#666;font-size:14px;">Signe le</td><td style="padding:8px 0;font-size:14px;">${new Date().toLocaleString('fr-FR')}</td></tr>
            <tr><td style="padding:8px 0;color:#666;font-size:14px;">IP</td><td style="padding:8px 0;font-size:14px;">${ip}</td></tr>
          </table>
          <a href="${quoteUrl}" style="display:inline-block;background:#1A1A6B;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Voir le devis signe</a>
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
            Votre signature du devis <strong>${quote.reference}</strong> a bien ete enregistree.
            Vous trouverez en piece jointe une copie PDF du devis signe.
          </p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${quoteUrl}" style="display:inline-block;background:${quote.accentColor || '#1A1A6B'};color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">Voir le devis</a>
          </div>
          <p style="color:#888;font-size:13px;line-height:1.6;">
            Signe le ${new Date().toLocaleString('fr-FR')}<br>
            Montant : ${formatAmount(totalTTC)} TTC
          </p>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
          <p style="color:#888;font-size:13px;">
            ${quote.senderName} — ${quote.senderCompany}<br>
            <a href="mailto:${quote.senderEmail}" style="color:${quote.accentColor || '#1A1A6B'};">${quote.senderEmail}</a>
          </p>
        </div>
      `

      // Send both emails in parallel with PDF attachment
      await Promise.allSettled([
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: `${quote.senderCompany} <noreply@clempo.fr>`,
            to: [quote.senderEmail],
            subject: `Devis ${quote.reference} signe par ${signature.signerName}`,
            html: senderHtml,
            attachments,
          }),
        }),
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: `${quote.senderCompany} <noreply@clempo.fr>`,
            to: [signature.signerEmail],
            reply_to: quote.senderEmail,
            subject: `Confirmation — Devis ${quote.reference} signe`,
            html: clientHtml,
            attachments,
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
