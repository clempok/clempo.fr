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

  // Return quote data (without sensitive internal fields)
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      reference: quote.reference,
      companyName: quote.companyName,
      clientName: quote.clientName,
      date: quote.date,
      dueDate: quote.dueDate,
      lines: quote.lines,
      notes: quote.notes,
      accentColor: quote.accentColor,
      senderName: quote.senderName,
      senderCompany: quote.senderCompany,
      senderEmail: quote.senderEmail,
      status: quote.status,
    }),
  }
}

export { handler }
