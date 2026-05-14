import type { Handler } from '@netlify/functions'
import { checkAuth } from './_analytics'
import { readCrm, writeCrm } from './_crm'

const DEFAULT_MODEL = 'claude-haiku-4-5-20251001'
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'

type Extraction = {
  jobTitle: string | null
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
}

const handler: Handler = async (event) => {
  if (!checkAuth(event.headers as Record<string, string | undefined>)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }) }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const { companyId, contactId, overwrite, model } = body as {
      companyId: string; contactId: string; overwrite?: boolean; model?: string
    }
    if (!companyId || !contactId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'companyId and contactId required' }) }
    }
    const modelToUse = typeof model === 'string' && model.length > 0 ? model : DEFAULT_MODEL

    const data = await readCrm()
    const company = data.companies.find(c => c.id === companyId)
    if (!company) return { statusCode: 404, body: JSON.stringify({ error: 'Company not found' }) }
    const contact = company.contacts.find(c => c.id === contactId)
    if (!contact) return { statusCode: 404, body: JSON.stringify({ error: 'Contact not found' }) }

    if (contact.jobTitle && !overwrite) {
      return { statusCode: 200, body: JSON.stringify({ ok: true, applied: false, reason: 'jobTitle already set', contact }) }
    }
    const notes = (contact.notes || '').trim()
    if (!notes) {
      return { statusCode: 200, body: JSON.stringify({ ok: true, applied: false, reason: 'no notes', contact }) }
    }

    const personName = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || contact.email
    const promptUser = `Person: ${personName}\nCompany: ${company.name}\nNotes about this contact:\n${notes.slice(0, 1200)}`

    const systemPrompt = `Extract the person's professional job title from the freeform notes. Output ONLY strict JSON, no prose.

Schema:
{
  "jobTitle": string | null,
  "confidence": "high" | "medium" | "low",
  "reasoning": "one short sentence"
}

Rules:
- Return the most senior/relevant role mentioned. If two roles are listed (e.g. "Co-Founder & CEO"), keep them combined exactly as written.
- Normalize whitespace; trim trailing punctuation.
- If the notes do NOT contain a job title (e.g. "Business meeting santexpo", "RDV 12/05", "Audit Marketing Healthcare"), return jobTitle: null.
- Phrases like "Building <X>" implicitly mean "Founder" — return "Founder".
- Keep the title short (under 60 chars). Drop trailing company name from the title.
- Prefer French if the notes are in French.`

    const response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: modelToUse,
        max_tokens: 200,
        system: systemPrompt,
        messages: [{ role: 'user', content: promptUser }],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      return { statusCode: 502, body: JSON.stringify({ error: 'Anthropic API error', details: errText }) }
    }

    const apiPayload = await response.json() as { content?: { type: string; text: string }[] }
    const text = (apiPayload.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { statusCode: 502, body: JSON.stringify({ error: 'No JSON in LLM response', raw: text }) }

    let parsed: Extraction
    try { parsed = JSON.parse(jsonMatch[0]) as Extraction }
    catch { return { statusCode: 502, body: JSON.stringify({ error: 'Invalid JSON from LLM', raw: text }) } }

    const jobTitle = parsed.jobTitle && typeof parsed.jobTitle === 'string' && parsed.jobTitle.trim().length > 0
      ? parsed.jobTitle.trim().slice(0, 80)
      : null

    let applied = false
    if (jobTitle && (overwrite || !contact.jobTitle)) {
      contact.jobTitle = jobTitle
      contact.updatedAt = new Date().toISOString()
      await writeCrm(data)
      applied = true
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: true,
        applied,
        extraction: { jobTitle, confidence: parsed.confidence, reasoning: parsed.reasoning },
        contact,
      }),
    }
  } catch (err) {
    console.error('admin-extract-job-title error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) }
  }
}

export { handler }
