import type { Handler } from '@netlify/functions'
import { getOnboardingStore, loadOnboarding, logoKey, slugifyOnboarding } from './_onboarding'

/**
 * Sert le logo d'un client d'onboarding à une URL publique et stable :
 *   /.netlify/functions/onboarding-logo?slug=<slug>
 *
 * Existe parce que les robots d'aperçu de lien (LinkedIn, WhatsApp, Slack…)
 * exigent une URL HTTP en `og:image` — ils ne savent pas afficher un data-URI.
 * Le logo lui-même vient du devis signé (voir admin-onboarding), stocké en
 * base64 dans le blob `logo/<clientId>`. Non secret : c'est le logo du client,
 * affiché dans l'invitation qu'on lui envoie.
 */

const handler: Handler = async (event) => {
  const slug = slugifyOnboarding(event.queryStringParameters?.slug || '')
  if (!slug) return { statusCode: 400, body: 'Missing slug' }

  const data = await loadOnboarding()
  const client = data.clients.find(c => c.slug === slug)
  if (!client || !client.logoMime) {
    return { statusCode: 404, body: 'No logo' }
  }

  const store = getOnboardingStore()
  const base64 = await store.get(logoKey(client.id)).catch(() => null)
  if (!base64) return { statusCode: 404, body: 'No logo' }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': client.logoMime,
      // Les scrapers et le CDN peuvent cacher : le logo change rarement.
      'Cache-Control': 'public, max-age=86400',
    },
    body: base64 as string,
    isBase64Encoded: true,
  }
}

export { handler }
