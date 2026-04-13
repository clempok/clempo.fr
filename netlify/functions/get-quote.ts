import type { Handler } from '@netlify/functions'
import { loadQuotes, saveQuotes } from './_quotes'

const handler: Handler = async (event) => {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: 'Method not allowed' }
  }

  const company = event.queryStringParameters?.company
  const ref = event.queryStringParameters?.ref

  if (!company || !ref) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing company or ref' }) }
  }

  const data = await loadQuotes()
  const quote = data.quotes.find(
    q => q.companySlug === company && q.id === ref
  )

  if (!quote) {
    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Quote not found' }) }
  }

  // Mark as viewed if first time
  if (quote.status === 'sent' && !quote.viewedAt) {
    quote.viewedAt = new Date().toISOString()
    quote.status = 'viewed'
    await saveQuotes(data)
  }

  // Return all public quote data
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      reference: quote.reference,
      companyName: quote.companyName,
      clientName: quote.clientName,
      prospectLogo: quote.prospectLogo,
      date: quote.date,
      dueDate: quote.dueDate,
      validUntil: quote.validUntil || quote.dueDate,
      offerTitle: quote.offerTitle,
      context: quote.context,
      presentation: quote.presentation,
      arguments: quote.arguments,
      lines: quote.lines,
      globalDiscount: quote.globalDiscount || 0,
      notes: quote.notes,
      paymentTerms: quote.paymentTerms,
      accentColor: quote.accentColor,
      senderName: quote.senderName,
      senderCompany: quote.senderCompany,
      senderEmail: quote.senderEmail,
      senderPhone: quote.senderPhone,
      senderPhoto: quote.senderPhoto,
      status: quote.status,
      cgvText: quote.cgvText || undefined,
      signature: quote.signature ? {
        image: quote.signature.image,
        type: quote.signature.type,
        signerName: quote.signature.signerName,
        signerEmail: quote.signature.signerEmail,
        signerCompany: quote.signature.signerCompany,
        signerEmailCompta: quote.signature.signerEmailCompta,
        signerTva: quote.signature.signerTva,
        signedAt: quote.signature.signedAt,
        cgvAccepted: quote.signature.cgvAccepted,
      } : undefined,
    }),
  }
}

export { handler }
