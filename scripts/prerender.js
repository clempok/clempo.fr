import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

// All routes to pre-render
const slugs = [
  'systeme-sante-etats-unis',
  'systeme-sante-canada-mexique',
  'systeme-sante-europe',
  'systeme-sante-asie',
  'systeme-sante-moyen-orient',
  'systeme-sante-afrique',
  'systeme-sante-amerique-du-sud',
  'systeme-sante-australie-nouvelle-zelande',
  'palantir-dans-la-sante-promesses-resultats-controverses',
  'capter-attention-scientifiques-hcps-linkedin',
  'generer-leads-ia-healthtech-2025',
  'contenu-ne-genere-pas-business-distribution-cle',
  'hack-scraping-linkedin-scoring-prospects-b2b-sante',
  '17-outils-generer-leads-startup-sante',
  'contacter-medecins-courrier-postal-1-euro-methode',
]

const specialiteSlugs = [
  'medecins-generalistes',
  'medecins-specialistes',
  'dentistes',
  'infirmiers',
  'kines',
  'orthophonistes',
  'pharmacies',
  'opticiens',
  'audioprothesistes',
  'orthoptistes',
  'sages-femmes',
  'pedicures-podologues',
  'centres-sante',
  'laboratoires-analyses',
]

const routes = [
  '/',
  '/articles',
  '/transition-cmo',
  '/consultant-marketing-sante',
  '/parts-de-marche-logiciels-medicaux',
  '/hiring',
  '/decideurs-hospitaliers',
  '/influenceurs-sante',
  ...slugs.map(s => `/articles/${s}`),
  ...specialiteSlugs.map(s => `/specialites/${s}`),
]

async function prerender() {
  const template = fs.readFileSync(path.join(root, 'dist/index.html'), 'utf-8')

  // Import the SSR bundle
  const { render } = await import(path.join(root, 'dist/server/entry-server.js'))

  for (const url of routes) {
    console.log(`Pre-rendering: ${url}`)

    const { html, head } = render(url)

    let fullHtml = template.replace('<!--app-html-->', html)

    // Inject Helmet head tags into <head>. Strip the static <title>,
    // <meta name="description">, and <link rel="canonical"> so we don't
    // end up with duplicates (Google may pick the wrong one).
    if (head) {
      fullHtml = fullHtml
        .replace(/<title>[^<]*<\/title>/, '')
        .replace(/<meta name="description"[^>]*\/?>/, '')
        .replace(/<link rel="canonical"[^>]*\/?>/, '')
        .replace('</head>', `${head}\n</head>`)
    }

    const outDir = url === '/' ? root + '/dist' : root + '/dist' + url
    fs.mkdirSync(outDir, { recursive: true })
    fs.writeFileSync(path.join(outDir, 'index.html'), fullHtml)
  }

  console.log(`✓ Pre-rendered ${routes.length} pages`)
}

prerender().catch(err => {
  console.error('Pre-render failed:', err)
  process.exit(1)
})
