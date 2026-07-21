import type { Context, Config } from '@netlify/edge-functions'

/**
 * Aperçu de lien personnalisé pour les espaces d'onboarding (clempo.fr/<slug>).
 *
 * Quand on partage le lien à un client (LinkedIn, WhatsApp, email…), le robot
 * qui génère l'aperçu n'exécute PAS le JavaScript — React Helmet ne peut donc
 * rien y faire. Cette edge function intercepte la page, récupère le nom et le
 * logo du client, et réécrit les balises og:/twitter: du HTML servi pour que
 * l'aperçu montre SON logo (et non la photo de Clément), histoire de l'inciter
 * à remplir.
 *
 * Portée : `/:slug` (un seul segment). Home, /articles/*, /assets/* et les
 * fichiers ne matchent pas. Les vraies pages d'un seul segment (articles, admin…)
 * passent en clair.
 */

// Segments de premier niveau qui sont de vraies pages du site, pas des slugs
// d'onboarding. À garder aligné avec SITE_SEGMENTS (src/App.tsx).
const SITE_SEGMENTS = new Set([
  'articles', 'confirmation', 'admin', 'booking', 'devis', 'transition-cmo',
  'consultant-marketing-sante', 'parts-de-marche-logiciels-medicaux',
  'specialites', 'merci-nps', 'hiring', 'decideurs-hospitaliers',
  'influenceurs-sante', 'tools', 'data',
])

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Force le `content` de TOUTES les balises meta repérées par leur property/name,
 * quel que soit l'ordre des attributs. Le HTML vient de la home prérendue :
 * React Helmet y ajoute `data-rh` et peut dupliquer les balises statiques —
 * on les écrase toutes pour que le robot voie la bonne valeur, peu importe
 * laquelle il retient. Absente : on l'injecte.
 */
function setMeta(html: string, attr: 'property' | 'name', key: string, value: string): string {
  const tagRe = new RegExp(`<meta[^>]*\\b${attr}="${key}"[^>]*>`, 'gi')
  let found = false
  const out = html.replace(tagRe, (tag) => {
    found = true
    return /content="/i.test(tag)
      ? tag.replace(/content="[^"]*"/i, `content="${escapeAttr(value)}"`)
      : tag.replace(/<meta/i, `<meta content="${escapeAttr(value)}"`)
  })
  if (found) return out
  return html.replace('</head>', `<meta ${attr}="${key}" content="${escapeAttr(value)}" />\n</head>`)
}

export default async (request: Request, context: Context): Promise<Response | void> => {
  const url = new URL(request.url)
  const slug = decodeURIComponent(url.pathname.slice(1))

  // Passe-plat : racine, sous-chemins, fichiers, vraies pages du site.
  if (!slug || slug.includes('/') || slug.includes('.') || SITE_SEGMENTS.has(slug)) return

  // Nom + présence de logo (endpoint public, ne révèle rien de confidentiel).
  let meta: { found?: boolean; companyName?: string; hasLogo?: boolean }
  try {
    const r = await fetch(`${url.origin}/.netlify/functions/onboarding?slug=${encodeURIComponent(slug)}`)
    meta = await r.json()
  } catch {
    return
  }
  if (!meta?.found) return

  // À partir d'ici, toute erreur doit laisser la page se servir normalement
  // (surtout pas un 500 sur l'espace client à cause de l'aperçu de lien).
  try {
    return await rewrite(slug, url, meta, context)
  } catch {
    return
  }
}

async function rewrite(
  slug: string,
  url: URL,
  meta: { companyName?: string; hasLogo?: boolean },
  context: Context,
): Promise<Response | void> {
  const res = await context.next()
  if (!(res.headers.get('content-type') || '').includes('text/html')) return res

  let html = await res.text()
  const company = meta.companyName || 'Votre entreprise'
  const title = `Onboarding ${company} — Clément Pouget-Osmont`
  const description = `Votre espace pour préparer notre collaboration : quelques questions et vos documents clés, à remplir à votre rythme.`
  const image = meta.hasLogo
    ? `${url.origin}/.netlify/functions/onboarding-logo?slug=${encodeURIComponent(slug)}`
    : `${url.origin}/favicon-180.png`

  html = html.replace(/<title[^>]*>[\s\S]*?<\/title>/gi, `<title>${escapeAttr(title)}</title>`)
  html = setMeta(html, 'name', 'description', description)
  html = setMeta(html, 'property', 'og:title', title)
  html = setMeta(html, 'property', 'og:description', description)
  html = setMeta(html, 'property', 'og:image', image)
  html = setMeta(html, 'property', 'og:url', `${url.origin}/${encodeURIComponent(slug)}`)
  html = setMeta(html, 'name', 'twitter:title', title)
  html = setMeta(html, 'name', 'twitter:description', description)
  html = setMeta(html, 'name', 'twitter:image', image)
  // Un logo est carré : la vignette « summary » lui va mieux que le grand format.
  html = setMeta(html, 'name', 'twitter:card', meta.hasLogo ? 'summary' : 'summary_large_image')

  return new Response(html, {
    status: res.status,
    headers: { ...Object.fromEntries(res.headers), 'content-type': 'text/html; charset=utf-8' },
  })
}

export const config: Config = {
  path: '/:slug',
}
