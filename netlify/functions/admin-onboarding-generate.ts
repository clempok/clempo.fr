import type { Handler } from '@netlify/functions'
import { isAdminToken } from './_analytics'
import { sanitizeSchema, UPLOAD_SLOT_KEYS } from './_onboarding'
import type { OnbSection } from './_onboarding'

/**
 * Génère un questionnaire d'onboarding personnalisé à partir du contexte d'un
 * client (typiquement son devis signé). Part du questionnaire standard —
 * transmis par l'admin, qui en est la source unique (src/lib/onboarding-schema)
 * — et le retaille : retire les questions hors-sujet, reformule avec le
 * vocabulaire du client, ajoute les questions propres à sa mission.
 *
 * Ne stocke rien : l'admin prévisualise, édite, puis enregistre via
 * admin-onboarding (action set-schema). La sortie de l'IA est assainie ici pour
 * qu'un JSON malformé ne puisse jamais casser la page client.
 */

const MODEL = 'claude-sonnet-4-6'
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'

const HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }

/** Représentation compacte du schéma de référence, pour économiser des tokens. */
function compactBase(sections: OnbSection[]): string {
  return sections.map(s => {
    const fields = (s.fields || []).map(f => {
      const bits = [`${f.key} (${f.type}${f.essential ? ', essentiel' : ''})`, f.label]
      if (f.help) bits.push(`— ${f.help}`)
      return `    · ${bits.join(' : ')}`
    }).join('\n')
    const up = s.uploads?.length ? `  [dépôts: ${s.uploads.join(', ')}]` : ''
    return `# ${s.id} — ${s.title}${up}\n${fields}`
  }).join('\n')
}

const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: HEADERS, body: '' }
  if (!isAdminToken(event.headers.authorization || '')) {
    return { statusCode: 401, headers: HEADERS, body: JSON.stringify({ error: 'Unauthorized' }) }
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: 'ANTHROPIC_API_KEY absente des variables Netlify.' }) }
  }

  let body: { context?: string; baseSchema?: OnbSection[]; companyName?: string; instructions?: string }
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Bad JSON' }) }
  }

  const context = (body.context || '').trim()
  const base = Array.isArray(body.baseSchema) ? body.baseSchema : []
  if (!context) return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Contexte requis' }) }
  if (!base.length) return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Schéma de référence manquant' }) }

  const knownKeys = base.flatMap(s => s.fields.map(f => f.key))

  const systemPrompt = `Tu adaptes le questionnaire d'onboarding de Clément Pouget-Osmont, directeur marketing santé freelance, pour un nouveau client qu'il vient de signer. Objectif : que chaque question soit pertinente au regard du contexte réel du client, plutôt que générique.

Tu pars du QUESTIONNAIRE STANDARD fourni et tu le retailles :
- SUPPRIME les questions sans objet pour ce client (ex. taux de conversion, CAC ou cycle de vente pour un produit pas encore lancé ; questions sur une équipe qui n'existe pas).
- REFORMULE les questions avec le vocabulaire et les spécificités du client (ses cibles nommées, son produit, son marché), pour qu'il se sente compris.
- AJOUTE les questions propres à sa mission et à ses enjeux, tirées du contexte.
- GARDE une structure comparable : 6 à 9 sections, une progression logique.

Règle de clés IMPÉRATIVE : quand une question correspond à une question standard, RÉUTILISE sa "key" exacte (liste fournie). N'invente une nouvelle key (snake_case, sans accent) que pour une question réellement nouvelle. Les réponses sont indexées sur ces clés.

Types autorisés : "text", "textarea", "select", "checkboxes". Un "select"/"checkboxes" DOIT avoir un tableau "options" (2 minimum). Marque "essential": true les questions vraiment structurantes (vise 15 à 22 essentielles au total).

Dépôts de documents : chaque section peut proposer des emplacements via "uploads", en piochant UNIQUEMENT dans ces clés : ${UPLOAD_SLOT_KEYS.join(', ')}. Choisis celles qui ont du sens là où la conversation les appelle.

Ton : expert, accessible, direct, jamais corporate. Vouvoiement. Style insider santé. Les intros de section sont courtes et parlent au client.

Réponds UNIQUEMENT par un objet JSON strict, sans texte ni balise Markdown autour :
{"sections":[{"id","title","icon","intro","uploads":["..."],"fields":[{"key","label","help","type","options":["..."],"essential":true,"rows":4}]}]}
"icon" est un emoji. "help", "options", "essential", "rows", "intro", "uploads" sont facultatifs.`

  const userPrompt = `CONTEXTE DU CLIENT${body.companyName ? ` (${body.companyName})` : ''} :
${context}

${body.instructions ? `CONSIGNES SUPPLÉMENTAIRES DE CLÉMENT :\n${body.instructions}\n\n` : ''}CLÉS STANDARD RÉUTILISABLES :
${knownKeys.join(', ')}

QUESTIONNAIRE STANDARD (à adapter) :
${compactBase(base)}`

  let response: Response
  try {
    response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 8000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })
  } catch (err) {
    return { statusCode: 502, headers: HEADERS, body: JSON.stringify({ error: 'Appel Anthropic échoué', details: String(err) }) }
  }

  if (!response.ok) {
    const details = await response.text()
    return { statusCode: 502, headers: HEADERS, body: JSON.stringify({ error: 'Erreur API Anthropic', details }) }
  }

  const payload = await response.json() as { content?: { type: string; text: string }[] }
  const text = (payload.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim()

  // Le modèle renvoie {"sections":[...]} ; on tolère un tableau nu ou des fences.
  const match = text.match(/\{[\s\S]*\}/) || text.match(/\[[\s\S]*\]/)
  if (!match) {
    return { statusCode: 502, headers: HEADERS, body: JSON.stringify({ error: 'Pas de JSON dans la réponse', raw: text.slice(0, 500) }) }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(match[0])
  } catch {
    return { statusCode: 502, headers: HEADERS, body: JSON.stringify({ error: 'JSON invalide', raw: text.slice(0, 500) }) }
  }

  const rawSections = Array.isArray(parsed) ? parsed : (parsed as { sections?: unknown }).sections
  const sections = sanitizeSchema(rawSections)
  if (!sections) {
    return { statusCode: 502, headers: HEADERS, body: JSON.stringify({ error: 'Le questionnaire généré était vide ou invalide. Réessayez.' }) }
  }

  return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ sections }) }
}

export { handler }
