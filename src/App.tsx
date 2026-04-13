import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { LangProvider } from './contexts/LangContext'
import { ContentProvider } from './contexts/ContentContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Background from './components/Background'
import LiquidCursor from './components/LiquidCursor'
import Home from './pages/Home'
import Articles from './pages/Articles'
import ArticlePage from './pages/ArticlePage'
import Confirmation from './pages/Confirmation'
import Admin from './pages/Admin'
import Booking from './pages/Booking'
import QuotePage from './pages/QuotePage'

function VisitTracker() {
  const location = useLocation()
  useEffect(() => {
    // Don't count admin visits
    if (location.pathname.startsWith('/admin')) return
    try {
      const today = new Date().toISOString().slice(0, 10)
      const key = `clempo_visit_${today}`
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
      fetch('/.netlify/functions/track-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: today }),
        keepalive: true,
      })
        .then(r => r.ok ? r.json() : r.text().then(t => Promise.reject(t)))
        .then(d => console.log('[clempo] visit tracked', d))
        .catch(err => console.warn('[clempo] track-visit failed', err))
    } catch {
      /* ignore */
    }
  }, [location.pathname])
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
      </Routes>
      {!isAdmin && !isQuote && <Footer />}
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
