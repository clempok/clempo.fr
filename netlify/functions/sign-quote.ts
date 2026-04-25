import type { Handler } from '@netlify/functions'
import { loadQuotes, saveQuotes, formatAmount, computeLineTotals } from './_quotes'
import type { QuoteSignature, Quote } from './_quotes'
// @ts-expect-error jspdf types
import { jsPDF } from 'jspdf'

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/* ─── PDF generation (no reassurance elements) ─── */

function generateQuotePdf(quote: Quote, signature: QuoteSignature): string {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const accent = quote.accentColor || '#0A0A0B'
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

      const wordmark = `<span style="font-family:${fontStack};font-size:14px;font-weight:700;color:${INK};letter-spacing:-0.05em;">clempo<span style="display:inline-block;width:4px;height:4px;border-radius:50%;background-color:${SIGNAL};margin-left:1px;vertical-align:1px;"></span></span>`

      // Email to sender (notification) — internal
      const senderHtml = `
<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background-color:${PAPER};font-family:${fontStack};color:${INK};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${PAPER};"><tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:${PAPER};border:1px solid rgba(10,10,11,0.08);border-radius:4px;overflow:hidden;">
      <tr><td style="padding:24px 32px;background-color:${INK};">
        <span style="font-family:${monoStack};font-size:11px;font-weight:500;color:${SIGNAL};letter-spacing:0.1em;text-transform:uppercase;">// Devis signé</span>
        <div style="margin-top:8px;font-family:${fontStack};font-size:20px;font-weight:700;color:${PAPER};letter-spacing:-0.02em;">
          <span style="font-family:${serifStack};font-style:italic;font-weight:400;">${escapeHtml(signature.signerName)}</span> a signé ${escapeHtml(quote.reference)}
        </div>
      </td></tr>
      <tr><td style="padding:28px 32px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:10px 0;border-bottom:1px solid rgba(10,10,11,0.08);font-family:${monoStack};color:${STEEL};font-size:11px;letter-spacing:0.08em;text-transform:uppercase;">Montant TTC</td><td style="padding:10px 0;border-bottom:1px solid rgba(10,10,11,0.08);font-family:${monoStack};font-weight:600;font-size:14px;color:${INK};text-align:right;">${formatAmount(totalTTC)}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid rgba(10,10,11,0.08);font-family:${monoStack};color:${STEEL};font-size:11px;letter-spacing:0.08em;text-transform:uppercase;">Signataire</td><td style="padding:10px 0;border-bottom:1px solid rgba(10,10,11,0.08);font-size:14px;color:${INK};text-align:right;">${escapeHtml(signature.signerName)} — <a href="mailto:${escapeHtml(signature.signerEmail)}" style="color:${INK};text-decoration:underline;text-decoration-color:${SIGNAL};">${escapeHtml(signature.signerEmail)}</a></td></tr>
          ${signature.signerCompany ? `<tr><td style="padding:10px 0;border-bottom:1px solid rgba(10,10,11,0.08);font-family:${monoStack};color:${STEEL};font-size:11px;letter-spacing:0.08em;text-transform:uppercase;">Société</td><td style="padding:10px 0;border-bottom:1px solid rgba(10,10,11,0.08);font-size:14px;color:${INK};text-align:right;">${escapeHtml(signature.signerCompany)}</td></tr>` : ''}
          ${signature.signerEmailCompta ? `<tr><td style="padding:10px 0;border-bottom:1px solid rgba(10,10,11,0.08);font-family:${monoStack};color:${STEEL};font-size:11px;letter-spacing:0.08em;text-transform:uppercase;">Email compta</td><td style="padding:10px 0;border-bottom:1px solid rgba(10,10,11,0.08);font-size:14px;color:${INK};text-align:right;">${escapeHtml(signature.signerEmailCompta)}</td></tr>` : ''}
          ${signature.signerTva ? `<tr><td style="padding:10px 0;border-bottom:1px solid rgba(10,10,11,0.08);font-family:${monoStack};color:${STEEL};font-size:11px;letter-spacing:0.08em;text-transform:uppercase;">N° TVA</td><td style="padding:10px 0;border-bottom:1px solid rgba(10,10,11,0.08);font-family:${monoStack};font-size:13px;color:${INK};text-align:right;">${escapeHtml(signature.signerTva)}</td></tr>` : ''}
          <tr><td style="padding:10px 0;border-bottom:1px solid rgba(10,10,11,0.08);font-family:${monoStack};color:${STEEL};font-size:11px;letter-spacing:0.08em;text-transform:uppercase;">Signé le</td><td style="padding:10px 0;border-bottom:1px solid rgba(10,10,11,0.08);font-family:${monoStack};font-size:13px;color:${INK};text-align:right;">${new Date().toLocaleString('fr-FR')}</td></tr>
          <tr><td style="padding:10px 0;font-family:${monoStack};color:${STEEL};font-size:11px;letter-spacing:0.08em;text-transform:uppercase;">IP</td><td style="padding:10px 0;font-family:${monoStack};font-size:13px;color:${INK};text-align:right;">${escapeHtml(ip)}</td></tr>
        </table>
        <div style="text-align:center;margin-top:28px;">
          <a href="${escapeHtml(quoteUrl)}" style="display:inline-block;background:${SIGNAL};color:${INK};padding:13px 28px;border-radius:4px;text-decoration:none;font-family:${fontStack};font-weight:600;font-size:14px;letter-spacing:-0.005em;">Voir le devis signé &nbsp;→</a>
        </div>
      </td></tr>
      <tr><td style="padding:18px 32px 22px;border-top:1px solid rgba(10,10,11,0.08);text-align:center;">${wordmark}</td></tr>
    </table>
  </td></tr></table>
</body></html>`

      // Email to client (confirmation)
      const clientHtml = `
<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background-color:${PAPER};font-family:${fontStack};color:${INK};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${PAPER};"><tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:${PAPER};border:1px solid rgba(10,10,11,0.08);border-radius:4px;overflow:hidden;">
      <tr><td style="padding:28px 32px;background-color:${INK};">
        <span style="font-family:${monoStack};font-size:11px;font-weight:500;color:${SIGNAL};letter-spacing:0.1em;text-transform:uppercase;">// Confirmation de signature</span>
        <div style="margin-top:8px;font-family:${fontStack};font-size:22px;font-weight:700;color:${PAPER};letter-spacing:-0.02em;line-height:1.2;">
          Merci <span style="font-family:${serifStack};font-style:italic;font-weight:400;">${escapeHtml(signature.signerName.split(' ')[0])}</span>
        </div>
        <div style="margin-top:6px;font-family:${fontStack};font-size:14px;color:${MIST};">Devis ${escapeHtml(quote.reference)} — ${formatAmount(totalTTC)} TTC</div>
      </td></tr>
      <tr><td style="padding:28px 32px;">
        <p style="margin:0 0 14px;font-family:${fontStack};font-size:15px;color:${GRAPHITE};line-height:1.75;">
          Votre signature du devis <strong style="color:${INK};">${escapeHtml(quote.reference)}</strong> a bien été enregistrée.
        </p>
        <p style="margin:0;font-family:${fontStack};font-size:15px;color:${GRAPHITE};line-height:1.75;">
          Vous trouverez en pièce jointe une copie PDF du devis signé.
        </p>
        <div style="text-align:center;margin:28px 0 8px;">
          <a href="${escapeHtml(quoteUrl)}" style="display:inline-block;background:${SIGNAL};color:${INK};padding:14px 32px;border-radius:4px;text-decoration:none;font-family:${fontStack};font-weight:600;font-size:15px;letter-spacing:-0.005em;">Voir le devis &nbsp;→</a>
        </div>
        <p style="font-family:${monoStack};font-size:11px;color:${STEEL};text-align:center;margin:14px 0 0;letter-spacing:0.05em;">Signé le ${new Date().toLocaleString('fr-FR')}</p>
      </td></tr>
      <tr><td style="padding:0 32px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${PAPER_SOFT};border-radius:4px;border-left:2px solid ${SIGNAL};">
          <tr><td style="padding:18px 22px;">
            <span style="font-family:${monoStack};font-size:11px;color:${SIGNAL};letter-spacing:0.1em;text-transform:uppercase;">// Votre contact</span>
            <p style="margin:6px 0 0;font-family:${fontStack};font-size:14px;color:${INK};line-height:1.7;">
              <strong style="font-weight:700;letter-spacing:-0.01em;">${escapeHtml(quote.senderName)}</strong> — ${escapeHtml(quote.senderCompany)}<br>
              <a href="mailto:${escapeHtml(quote.senderEmail)}" style="color:${INK};text-decoration:underline;text-decoration-color:${SIGNAL};text-underline-offset:3px;">${escapeHtml(quote.senderEmail)}</a>
            </p>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:18px 32px 22px;border-top:1px solid rgba(10,10,11,0.08);text-align:center;">${wordmark}</td></tr>
    </table>
  </td></tr></table>
</body></html>`

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
