import type { Handler } from '@netlify/functions'
import { readCrm, writeCrm } from './_crm'
import { verifyUnsubToken } from './_email-templates'

/**
 * Public unsubscribe endpoint, linked from every nurture email footer and
 * the List-Unsubscribe header. Validates the HMAC token, sets emailOptOut on
 * every contact matching the email (the same person can exist under several
 * companies), and shows a minimal confirmation page.
 *
 * Accepts GET (footer link) and POST (RFC 8058 one-click from mail clients).
 * Idempotent: re-clicking keeps the original opt-out date.
 */
const handler: Handler = async (event) => {
  const token = event.queryStringParameters?.t
  const email = verifyUnsubToken(token)

  const page = (title: string, message: string, status = 200) => ({
    statusCode: status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    body: `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title></head>
<body style="margin:0;background:#f8f8f6;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:480px;margin:80px auto;padding:40px 32px;background:#fff;border:1px solid rgba(0,0,0,0.06);border-radius:16px;text-align:center;color:#0a0a0a;">
    <h1 style="font-size:1.3rem;margin:0 0 12px;">${title}</h1>
    <p style="font-size:0.95rem;line-height:1.6;color:#71717a;margin:0;">${message}</p>
    <p style="margin:24px 0 0;"><a href="https://www.clempo.fr" style="color:#1A1A6B;font-size:0.9rem;">← clempo.fr</a></p>
  </div>
</body>
</html>`,
  })

  if (!email) {
    return page('Lien invalide', 'Ce lien de désinscription est invalide ou expiré. Écrivez-moi à clement.pougetosmont@gmail.com et je vous retire manuellement.', 400)
  }

  try {
    const data = await readCrm()
    const now = new Date().toISOString()
    let changed = false

    for (const co of data.companies) {
      for (const contact of co.contacts) {
        if (contact.email?.toLowerCase() === email && !contact.emailOptOut) {
          contact.emailOptOut = now
          contact.updatedAt = now
          co.updatedAt = now
          changed = true
        }
      }
    }

    if (changed) await writeCrm(data)
    console.log(`[unsubscribe] ${email} · changed=${changed}`)

    return page(
      'Désinscription confirmée',
      `Vous ne recevrez plus d'emails de ma part sur ${email}. Les ressources du site restent bien sûr accessibles.`,
    )
  } catch (err) {
    console.error('[unsubscribe] error:', err)
    return page('Erreur', 'Une erreur est survenue. Réessayez ou écrivez-moi à clement.pougetosmont@gmail.com.', 500)
  }
}

export { handler }
