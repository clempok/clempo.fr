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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HelmetProviderAny = HelmetProvider as any

export function render(url: string) {
  const helmetContext: Record<string, unknown> = {}

  const html = renderToString(
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
            </Routes>
            <Footer />
          </div>
        </LangProvider>
      </StaticRouter>
    </HelmetProviderAny>
  )

  return { html }
}
