import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { LangProvider } from './contexts/LangContext'
import { ContentProvider } from './contexts/ContentContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Background from './components/Background'
import LiquidCursor from './components/LiquidCursor'
import ReturnVisitorPopup from './components/ReturnVisitorPopup'
import JournalistesExitPopup from './components/JournalistesExitPopup'
import JournalistesStickyPromo from './components/JournalistesStickyPromo'
import Home from './pages/Home'
import Articles from './pages/Articles'
import ArticlePage from './pages/ArticlePage'
import Confirmation from './pages/Confirmation'
import Admin from './pages/Admin'
import Booking from './pages/Booking'
import QuotePage from './pages/QuotePage'
import TransitionCMO from './pages/TransitionCMO'
import Specialites from './pages/Specialites'
import SpecialitePage from './pages/SpecialitePage'
import NpsThanks from './pages/NpsThanks'
import Hiring from './pages/Hiring'

// Normalize a referrer hostname into a short stable label so the admin dashboard
// can group "www.google.fr", "google.com", "www.google.co.uk" under "google".
function normalizeRef(host: string): string {
  const h = host.toLowerCase().replace(/^www\./, '')
  if (/(^|\.)google\./.test(h)) return 'google'
  if (/(^|\.)bing\./.test(h)) return 'bing'
  if (/(^|\.)duckduckgo\./.test(h)) return 'duckduckgo'
  if (/(^|\.)yahoo\./.test(h)) return 'yahoo'
  if (/(^|\.)ecosia\./.test(h)) return 'ecosia'
  if (/(^|\.)qwant\./.test(h)) return 'qwant'
  if (h.includes('linkedin.') || h === 'lnkd.in') return 'linkedin'
  if (h.includes('twitter.') || h === 'x.com' || h === 't.co') return 'twitter/x'
  if (h.includes('facebook.') || h === 'fb.me' || h === 'l.facebook.com') return 'facebook'
  if (h.includes('instagram.')) return 'instagram'
  if (h.includes('youtube.') || h === 'youtu.be') return 'youtube'
  if (h.includes('reddit.')) return 'reddit'
  if (h.includes('chatgpt.com') || h.includes('chat.openai.com')) return 'chatgpt'
  if (h.includes('claude.ai')) return 'claude'
  if (h.includes('perplexity.')) return 'perplexity'
  if (h.includes('gemini.google.com') || h === 'bard.google.com') return 'gemini'
  return h.slice(0, 64)
}

// Resolve the referrer ONCE per browser session so the attribution is credited
// to the first landing page only, not to every subsequent in-site navigation.
function resolveSessionRef(): string | null {
  const KEY = 'clempo_session_ref'
  const existing = sessionStorage.getItem(KEY)
  if (existing !== null) return existing || null
  let ref = 'direct'
  try {
    if (document.referrer) {
      const refUrl = new URL(document.referrer)
      if (refUrl.hostname && !/(^|\.)clempo\.fr$/.test(refUrl.hostname)) {
        ref = normalizeRef(refUrl.hostname)
      } else {
        // Self-referral (internal navigation) — do not attribute
        ref = ''
      }
    }
  } catch {
    ref = ''
  }
  try { sessionStorage.setItem(KEY, ref) } catch { /* ignore */ }
  return ref || null
}

function isAutomatedBrowser(): boolean {
  try {
    // navigator.webdriver is set to true by Selenium, Playwright, Puppeteer,
    // headless Chrome, and most automation frameworks (W3C WebDriver spec).
    if ((navigator as Navigator & { webdriver?: boolean }).webdriver === true) return true
    const ua = navigator.userAgent || ''
    // Catch headless browsers, common automation frameworks, and Claude's own
    // browsing tools (preview, browse, gstack) which advertise themselves in UA.
    if (/HeadlessChrome|Headless|PhantomJS|puppeteer|playwright|Selenium|Cypress|Claude\/|claude-code|Anthropic|Electron/i.test(ua)) return true
  } catch { /* ignore */ }
  return false
}

function VisitTracker() {
  const location = useLocation()
  useEffect(() => {
    // Don't count admin visits or automated browsers (Claude debug sessions,
    // QA bots, monitoring agents) — they polluted the stats on 2026-05-10.
    if (location.pathname.startsWith('/admin')) return
    if (isAutomatedBrowser()) return
    try {
      const today = new Date().toISOString().slice(0, 10)
      // Dedupe per (day + path + src) so attribution data isn't lost if the
      // same visitor lands on Home then Transition-CMO the same day.
      const params = new URLSearchParams(location.search)
      const src = (params.get('src') || '').slice(0, 64) // hard cap
      const dedupeKey = `clempo_visit_${today}_${location.pathname}_${src}`
      if (sessionStorage.getItem(dedupeKey)) return
      sessionStorage.setItem(dedupeKey, '1')

      // Only attribute the external referrer on the FIRST track-visit of a
      // session so a Google landing isn't counted again when the visitor
      // clicks through to /articles.
      const refSentKey = 'clempo_session_ref_sent'
      let ref: string | null = null
      if (!sessionStorage.getItem(refSentKey)) {
        ref = resolveSessionRef()
        try { sessionStorage.setItem(refSentKey, '1') } catch { /* ignore */ }
      }

      fetch('/.netlify/functions/track-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: today, path: location.pathname, src: src || null, ref }),
        keepalive: true,
      })
        .then(r => r.ok ? r.json() : r.text().then(t => Promise.reject(t)))
        .then(d => console.log('[clempo] visit tracked', d))
        .catch(err => console.warn('[clempo] track-visit failed', err))

      // CRM-aware tracking: identify known contacts via the CID cookie
      const cid = document.cookie.match(/(?:^|;\s*)clempo_cid=([^;]+)/)?.[1]
      if (cid) {
        fetch('/.netlify/functions/track-crm-visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cid, path: location.pathname }),
          keepalive: true,
        }).catch(() => { /* silent */ })
      }
    } catch {
      /* ignore */
    }
  }, [location.pathname, location.search])
  return null
}

function Shell() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')
  const isQuote = location.pathname.startsWith('/devis/')

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', position: 'relative' }}>
      <VisitTracker />
      {!isAdmin && !isQuote && <LiquidCursor />}
      {!isAdmin && !isQuote && <Background />}
      {!isAdmin && !isQuote && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/articles" element={<Articles />} />
        <Route path="/articles/:slug" element={<ArticlePage />} />
        <Route path="/confirmation" element={<Confirmation />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/devis/:company/:id" element={<QuotePage />} />
        <Route path="/transition-cmo" element={<TransitionCMO />} />
        <Route path="/parts-de-marche-logiciels-medicaux" element={<Specialites />} />
        <Route path="/specialites/:slug" element={<SpecialitePage />} />
        <Route path="/merci-nps" element={<NpsThanks />} />
        <Route path="/hiring" element={<Hiring />} />
      </Routes>
      {!isAdmin && !isQuote && <Footer />}
      {!isAdmin && !isQuote && <ReturnVisitorPopup />}
      {!isAdmin && !isQuote && <JournalistesExitPopup />}
      {!isAdmin && !isQuote && <JournalistesStickyPromo />}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ContentProvider>
        <LangProvider>
          <Shell />
        </LangProvider>
      </ContentProvider>
    </BrowserRouter>
  )
}
