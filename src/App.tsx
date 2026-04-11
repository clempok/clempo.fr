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
      }).catch(() => {})
    } catch {
      /* ignore */
    }
  }, [location.pathname])
  return null
}

function Shell() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', position: 'relative' }}>
      <VisitTracker />
      {!isAdmin && <LiquidCursor />}
      {!isAdmin && <Background />}
      {!isAdmin && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/articles" element={<Articles />} />
        <Route path="/articles/:slug" element={<ArticlePage />} />
        <Route path="/confirmation" element={<Confirmation />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/booking" element={<Booking />} />
      </Routes>
      {!isAdmin && <Footer />}
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
