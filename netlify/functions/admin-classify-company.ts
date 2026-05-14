import type { Handler } from '@netlify/functions'
import { checkAuth } from './_analytics'
import {
  readCrm, writeCrm,
  COMPANY_SIZES, COMPANY_LOCATIONS, COMPANY_SECTORS,
  type CompanySize, type CompanyLocation, type CompanySector,
} from './_crm'

const MODEL = 'claude-haiku-4-5-20251001'
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'

type Classification = {
  size: CompanySize | null
  location: CompanyLocation | null
  sector: CompanySector | null
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
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured. Add it in Netlify env vars.' }),
    }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const { companyId, overwrite } = body as { companyId: string; overwrite?: boolean }
    if (!companyId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'companyId required' }) }
    }

    const data = await readCrm()
    const company = data.companies.find(c => c.id === companyId)
    if (!company) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Company not found' }) }
    }

    // Distill the signal we have on this company into a compact prompt.
    const emailDomains = Array.from(new Set(
      company.contacts
        .map(c => (c.email || '').split('@')[1])
        .filter((d): d is string => !!d && !['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'free.fr', 'orange.fr', 'wanadoo.fr', 'laposte.net'].includes(d.toLowerCase())),
    ))
    const jobTitles = Array.from(new Set(company.contacts.map(c => c.jobTitle).filter(Boolean))).slice(0, 5)
    const linkedIns = Array.from(new Set(company.contacts.map(c => c.linkedIn).filter(Boolean))).slice(0, 3)

    const promptUser = [
      `Company name: ${company.name}`,
      emailDomains.length > 0 ? `Professional email domains: ${emailDomains.join(', ')}` : null,
      jobTitles.length > 0 ? `Sample job titles: ${jobTitles.join(' / ')}` : null,
      linkedIns.length > 0 ? `LinkedIn URLs: ${linkedIns.join(' / ')}` : null,
      `Existing notes: ${(company.notes || '').slice(0, 500) || '(none)'}`,
    ].filter(Boolean).join('\n')

    const systemPrompt = `You classify healthcare-adjacent companies for a marketing-services CRM. Output ONLY a strict JSON object, no prose, no markdown.

Schema:
{
  "size": "Startup" | "Scaleup" | "ETI" | "Grand groupe" | null,
  "location": "FR" | "Europe_US" | "Autre" | null,
  "sector": "LogicielsSante" | "MedTechBioPharma" | "SanteB2C" | "Autre" | null,
  "confidence": "high" | "medium" | "low",
  "reasoning": "one short sentence"
}

Definitions:
- size: Startup <50 employees, Scaleup 50-499, ETI 500-4999, "Grand groupe" 5000+. Use null when truly unknown.
- location: FR = French HQ. Europe_US = Western Europe (excl. France) or US. Autre = rest of world. Use email TLDs and well-known facts.
- sector: LogicielsSante = software/SaaS for healthcare professionals (EHR, telemedicine platforms, lab software, clinic management). MedTechBioPharma = medical devices, diagnostics, pharma, biotech. SanteB2C = direct-to-patient health (wellness apps, insurance, healthcare retail). Autre = not healthcare, or healthcare adjacent (VC, consulting, recruitment).
- confidence: high = well-known company, medium = strong signal but inferred, low = guessing.

Rules:
- If you don't recognize the company AND signals are weak, set fields to null and confidence "low".
- Never invent. Prefer null over a wrong answer.`

    const response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: 'user', content: promptUser }],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      return {
        statusCode: 502,
        body: JSON.stringify({ error: 'Anthropic API error', details: errText }),
      }
    }

    const apiPayload = await response.json() as { content?: { type: string; text: string }[] }
    const text = (apiPayload.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim()

    // Tolerate leading/trailing fences just in case.
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { statusCode: 502, body: JSON.stringify({ error: 'No JSON in LLM response', raw: text }) }
    }

    let parsed: Classification
    try {
      parsed = JSON.parse(jsonMatch[0]) as Classification
    } catch {
      return { statusCode: 502, body: JSON.stringify({ error: 'Invalid JSON from LLM', raw: text }) }
    }

    // Validate enum values; coerce unknowns to null.
    const size = parsed.size && COMPANY_SIZES.includes(parsed.size) ? parsed.size : null
    const location = parsed.location && COMPANY_LOCATIONS.includes(parsed.location) ? parsed.location : null
    const sector = parsed.sector && COMPANY_SECTORS.includes(parsed.sector) ? parsed.sector : null

    // Persist: by default only fill empty fields, unless overwrite=true.
    let applied = false
    if (overwrite || !company.size) { if (size) { company.size = size; applied = true } }
    if (overwrite || !company.location) { if (location) { company.location = location; applied = true } }
    if (overwrite || !company.sector) { if (sector) { company.sector = sector; applied = true } }
    if (applied) {
      company.updatedAt = new Date().toISOString()
      await writeCrm(data)
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: true,
        applied,
        classification: { size, location, sector, confidence: parsed.confidence, reasoning: parsed.reasoning },
        company,
      }),
    }
  } catch (err) {
    console.error('admin-classify-company error:', err)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: String(err) }),
    }
  }
}

export { handler }
