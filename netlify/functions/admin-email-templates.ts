import type { Handler } from '@netlify/functions'
import { checkAuth } from './_analytics'
import {
  DEFAULT_TEMPLATES,
  OWNER_EMAIL,
  TEMPLATE_KEYS,
  resourceAccessUrl,
  buildEmailHtml,
  buildResourceLinksHtml,
  buildResourcesHtml,
  buildVideoHtml,
  readEmailTemplates,
  renderTemplate,
  sendNurtureEmail,
  unsubscribeUrl,
  writeEmailTemplates,
} from './_email-templates'
import type { EmailTemplatesData, TemplateKey } from './_email-templates'

/**
 * Admin API for the "Emails" tab.
 *   GET  → { templates, defaults } (stored overrides merged over defaults)
 *   PUT  → save the full templates object
 *   POST { action: 'test', key, language } → render the template with sample
 *          data and send it to the owner inbox, [TEST]-prefixed.
 */
const handler: Handler = async (event) => {
  if (!checkAuth(event.headers as Record<string, string | undefined>)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  const json = (status: number, body: unknown) => ({
    statusCode: status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  try {
    if (event.httpMethod === 'GET') {
      const templates = await readEmailTemplates()
      return json(200, { templates, defaults: DEFAULT_TEMPLATES })
    }

    if (event.httpMethod === 'PUT') {
      const payload = JSON.parse(event.body || '{}') as Partial<EmailTemplatesData>
      const current = await readEmailTemplates()
      for (const key of TEMPLATE_KEYS) {
        const incoming = payload[key]
        if (!incoming) continue
        for (const lang of ['FR', 'EN'] as const) {
          const tpl = incoming[lang]
          if (tpl && typeof tpl.subject === 'string' && typeof tpl.body === 'string') {
            current[key][lang] = { subject: tpl.subject.trim(), body: tpl.body }
          }
        }
      }
      await writeEmailTemplates(current)
      return json(200, { ok: true, updatedAt: current.updatedAt })
    }

    if (event.httpMethod === 'POST') {
      const apiKey = process.env.RESEND_API_KEY
      if (!apiKey) return json(500, { error: 'RESEND_API_KEY not set' })

      const payload = JSON.parse(event.body || '{}') as {
        action?: string
        key?: TemplateKey
        language?: 'FR' | 'EN'
        /** When provided, test the unsaved editor content instead of the stored version. */
        subject?: string
        body?: string
      }
      if (payload.action !== 'test' || !payload.key || !TEMPLATE_KEYS.includes(payload.key)) {
        return json(400, { error: 'Expected { action: "test", key, language }' })
      }
      const language = payload.language === 'EN' ? 'EN' : 'FR'
      const templates = await readEmailTemplates()
      const tpl = {
        subject: payload.subject ?? templates[payload.key][language].subject,
        body: payload.body ?? templates[payload.key][language].body,
      }

      // Sample data: a contact who downloaded the décideurs base.
      const vars: Record<string, string> = {
        firstName: 'Marie',
        hello: language === 'EN' ? 'Hi Marie,' : 'Bonjour Marie,',
        resourceLabel: language === 'EN' ? 'Hospital decision-makers database' : 'Base décideurs hospitaliers',
        resourceUrl: resourceAccessUrl('decideurs-hospitaliers'),
        bookingUrl: 'https://www.clempo.fr/booking?src=nurture-j7',
        siteUrl: 'https://www.clempo.fr',
        resourcesHtml: buildResourcesHtml(['decideurs-hospitaliers'], language) || '',
        resourceLinksHtml: buildResourceLinksHtml([{
          label: language === 'EN' ? 'Open the database' : 'Ouvrir la base',
          url: 'https://www.clempo.fr/decideurs-hospitaliers',
        }]),
        videoHtml: buildVideoHtml(language),
        appointmentDate: language === 'EN' ? 'Monday 16 June 2026' : 'lundi 16 juin 2026',
        appointmentTime: '14:30',
      }

      const subject = renderTemplate(tpl.subject, vars)
      const unsubUrl = unsubscribeUrl(OWNER_EMAIL)
      const html = buildEmailHtml({
        bodyHtml: renderTemplate(tpl.body, vars),
        subject,
        language,
        unsubUrl,
        isDryRun: true,
        realRecipient: '(test admin — données fictives)',
      })

      const result = await sendNurtureEmail({ apiKey, to: OWNER_EMAIL, subject, html, unsubUrl, isDryRun: true })
      if (!result.ok) return json(502, { error: result.error })
      return json(200, { ok: true, sentTo: OWNER_EMAIL })
    }

    return json(405, { error: 'Method not allowed' })
  } catch (err) {
    console.error('[admin-email-templates] error:', err)
    return json(500, { error: String(err) })
  }
}

export { handler }
