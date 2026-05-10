import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import { HelmetProvider } from 'react-helmet-async'
import { Routes, Route } from 'react-router-dom'
import { LangProvider } from './contexts/LangContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Background from './components/Background'
import LiquidCursor from './components/LiquidCursor'
import Home from './pages/Home'
import Articles from './pages/Articles'
import ArticlePage from './pages/ArticlePage'
import TransitionCMO from './pages/TransitionCMO'
import Specialites from './pages/Specialites'
import SpecialitePage from './pages/SpecialitePage'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HelmetProviderAny = HelmetProvider as any

export function render(url: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const helmetContext: any = {}

  const rawHtml = renderToString(
    <HelmetProviderAny context={helmetContext}>
      <StaticRouter location={url}>
        <LangProvider>
          <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', position: 'relative' }}>
            <LiquidCursor />
            <Background />
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/articles" element={<Articles />} />
              <Route path="/articles/:slug" element={<ArticlePage />} />
              <Route path="/transition-cmo" element={<TransitionCMO />} />
              <Route path="/parts-de-marche-logiciels-medicaux" element={<Specialites />} />
              <Route path="/specialites/:slug" element={<SpecialitePage />} />
            </Routes>
            <Footer />
          </div>
        </LangProvider>
      </StaticRouter>
    </HelmetProviderAny>
  )

  // react-helmet-async v3 renders Helmet's tags inline in the body output.
  // Extract them so the prerender script can hoist them to <head> — leaving
  // duplicates in <body> would weaken SEO signals.
  const headTags: string[] = []
  // <title>...</title>
  const titleMatches = [...rawHtml.matchAll(/<title>[^<]*<\/title>/g)]
  if (titleMatches.length) headTags.push(titleMatches[titleMatches.length - 1][0])
  // <meta ...>, <link rel="canonical" ...>, <script type="application/ld+json">...</script>
  // We only hoist tags that Helmet adds (anything between </nav> and the main app
  // shell tends to be Helmet's, but it's safer to match by tag name + key attrs).
  const metaRe = /<meta\s+[^>]*\/?>/g
  const metas = [...rawHtml.matchAll(metaRe)].map(m => m[0])
  // SEO-relevant metas: name=description|robots, property=og:*|article:*, name=twitter:*
  for (const m of metas) {
    if (/\b(name="(?:description|robots|twitter:[^"]+)"|property="(?:og:[^"]+|article:[^"]+)")/.test(m)) {
      headTags.push(m)
    }
  }
  const canonical = rawHtml.match(/<link\s+rel="canonical"[^>]*\/?>/)
  if (canonical) headTags.push(canonical[0])
  const jsonLd = [...rawHtml.matchAll(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g)]
  for (const j of jsonLd) headTags.push(j[0])

  // Remove the extracted tags from the body so they don't appear twice.
  let html = rawHtml
  for (const tag of headTags) {
    html = html.replace(tag, '')
  }

  return { html, head: headTags.join('\n') }
}
