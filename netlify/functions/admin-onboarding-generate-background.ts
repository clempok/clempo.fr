import type { Handler } from '@netlify/functions'
import { isAdminToken } from './_analytics'
import {
  getOnboardingStore, sanitizeSchema, ensureContextField, sanitizePrefill, prefillableKeys,
  CONTEXT_SUMMARY_MAX, UPLOAD_SLOT_KEYS,
} from './_onboarding'
import type { OnbSection } from './_onboarding'

/**
 * Génère un questionnaire d'onboarding personnalisé à partir du contexte d'un
 * client (typiquement son devis signé). Part du questionnaire standard —
 * transmis par l'admin, qui en est la source unique (src/lib/onboarding-schema)
 * — et le retaille : retire les questions hors-sujet, reformule avec le
 * vocabulaire du client, ajoute les questions propres à sa mission.
 *
 * FONCTION BACKGROUND : Claude met plus de 10 s à écrire un questionnaire
 * complet, ce qui dépasse le timeout d'une fonction synchrone (504). On répond
 * donc en 202 immédiat, on travaille en arrière-plan (jusqu'à 15 min), et on
 * écrit le résultat sous `gen/<clientId>` dans le store. L'admin poste ici puis
 * interroge admin-onboarding (action generation-status) jusqu'à ce que son
 * `jobId` revienne. La sortie de l'IA est assainie pour qu'un JSON malformé ne
 * puisse jamais casser la page client.
 */

const MODEL = 'claude-sonnet-4-6'
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'

/** Clé de stockage d'un résultat de génération. */
function genKey(clientId: string): string {
  return `gen/${clientId}`
}

async function writeResult(clientId: string, record: Record<string, unknown>): Promise<void> {
  const store = getOnboardingStore()
  await store.setJSON(genKey(clientId), { ...record, at: new Date().toISOString() }).catch(() => { /* non bloquant */ })
}

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
  // Fonction background : la plateforme a déjà renvoyé 202 au client. Ce qu'on
  // retourne ici est ignoré ; le résultat passe par le store (`gen/<clientId>`),
  // que l'admin va interroger. On garde donc les erreurs DANS le store.
  if (!isAdminToken(event.headers.authorization || '')) {
    return { statusCode: 401, body: 'Unauthorized' }
  }

  let body: { clientId?: string; jobId?: string; context?: string; baseSchema?: OnbSection[]; companyName?: string; instructions?: string }
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, body: 'Bad JSON' }
  }

  const clientId = String(body.clientId || '')
  const jobId = String(body.jobId || '')
  if (!clientId || !jobId) return { statusCode: 400, body: 'clientId & jobId requis' }

  const fail = async (error: string) => {
    await writeResult(clientId, { jobId, status: 'error', error })
    return { statusCode: 200, body: 'ok' }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return fail('ANTHROPIC_API_KEY absente des variables Netlify.')

  const context = (body.context || '').trim()
  const base = Array.isArray(body.baseSchema) ? body.baseSchema : []
  if (!context) return fail('Contexte requis')
  if (!base.length) return fail('Schéma de référence manquant')

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

En plus du questionnaire, produis deux choses pour faire gagner du temps au client :

1. "contextSummary" : un court résumé (3 à 5 phrases, vouvoiement) de ce que Clément a compris du client et de la mission, ADRESSÉ AU CLIENT ("Voici ce que j'ai compris de votre activité et de nos objectifs : …"). Il sera affiché en tête de son espace, pour qu'il valide ou corrige. Reste factuel, tiré du contexte, sans flatterie.

2. "prefill" : pour CHAQUE question dont le contexte donne déjà la réponse (même partielle), rédige un BROUILLON de réponse à la PREMIÈRE personne, au nom du client ("Nous…", "Notre…"), que le client n'aura qu'à valider ou corriger. Objet {clé_de_la_question: "brouillon"}. NE PRÉ-REMPLIS QUE ce qui découle vraiment du contexte — laisse tout le reste absent, n'invente jamais un chiffre ou un fait non fourni. Ne pré-remplis jamais une question à choix (select/checkboxes).

Réponds UNIQUEMENT par un objet JSON strict, sans texte ni balise Markdown autour :
{"contextSummary":"…","prefill":{"cle":"brouillon"},"sections":[{"id","title","icon","intro","uploads":["..."],"fields":[{"key","label","help","type","options":["..."],"essential":true,"rows":4}]}]}
"icon" est un emoji. "help", "options", "essential", "rows", "intro", "uploads", "contextSummary", "prefill" sont facultatifs.`

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
    return fail('Appel Anthropic échoué : ' + String(err))
  }

  if (!response.ok) {
    const details = await response.text()
    return fail('Erreur API Anthropic : ' + details.slice(0, 300))
  }

  const payload = await response.json() as { content?: { type: string; text: string }[] }
  const text = (payload.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim()

  // Le modèle renvoie {"sections":[...]} ; on tolère un tableau nu ou des fences.
  const match = text.match(/\{[\s\S]*\}/) || text.match(/\[[\s\S]*\]/)
  if (!match) return fail('Pas de JSON dans la réponse du modèle.')

  let parsed: unknown
  try {
    parsed = JSON.parse(match[0])
  } catch {
    return fail('JSON invalide dans la réponse du modèle.')
  }

  const obj = (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed as Record<string, unknown> : {}
  const rawSections = Array.isArray(parsed) ? parsed : obj.sections
  let sections = sanitizeSchema(rawSections)
  if (!sections) return fail('Le questionnaire généré était vide ou invalide. Réessayez.')

  const contextSummary = typeof obj.contextSummary === 'string' ? obj.contextSummary.trim().slice(0, CONTEXT_SUMMARY_MAX) : ''
  // Le champ « corrigez mon résumé » n'a de sens que si un résumé est affiché.
  if (contextSummary) sections = ensureContextField(sections)
  const prefill = sanitizePrefill(obj.prefill, prefillableKeys(sections))

  await writeResult(clientId, { jobId, status: 'done', sections, contextSummary, prefill })
  return { statusCode: 200, body: 'ok' }
}

export { handler }
