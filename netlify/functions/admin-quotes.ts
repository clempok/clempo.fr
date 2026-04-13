import type { Handler } from '@netlify/functions'
import { loadQuotes, saveQuotes } from './_quotes'
import type { Quote, QuoteStatus } from './_quotes'

const handler: Handler = async (event) => {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  // Auth
  const auth = event.headers.authorization?.replace('Bearer ', '')
  const pw = process.env.ADMIN_PASSWORD || 'Ch4!pitron'
  if (auth !== pw) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  const data = await loadQuotes()

  // GET — list all quotes
  if (event.httpMethod === 'GET') {
    // Sort by createdAt desc
    const sorted = [...data.quotes].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return { statusCode: 200, headers, body: JSON.stringify({ quotes: sorted }) }
  }

  if (event.httpMethod === 'POST') {
    const body = JSON.parse(event.body || '{}')
    const { action } = body

    // Update status
    if (action === 'update-status') {
      const { id, status } = body as { id: string; status: QuoteStatus; action: string }
      const quote = data.quotes.find(q => q.id === id)
      if (!quote) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Quote not found' }) }
      quote.status = status
      await saveQuotes(data)
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) }
    }

    // Delete
    if (action === 'delete') {
      const { id } = body
      data.quotes = data.quotes.filter(q => q.id !== id)
      await saveQuotes(data)
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) }
    }

    // Duplicate
    if (action === 'duplicate') {
      const { id } = body
      const original = data.quotes.find(q => q.id === id)
      if (!original) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Quote not found' }) }
      const now = new Date().toISOString()
      const newQuote: Quote = {
        ...original,
        id: crypto.randomUUID(),
        reference: original.reference + '-copie',
        status: 'draft',
        createdAt: now,
        sentAt: undefined,
        viewedAt: undefined,
      }
      data.quotes.push(newQuote)
      await saveQuotes(data)
      return { statusCode: 200, headers, body: JSON.stringify({ quote: newQuote }) }
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown action' }) }
  }

  return { statusCode: 405, headers, body: 'Method not allowed' }
}

export { handler }
