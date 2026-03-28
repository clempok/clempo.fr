import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { ContentProvider } from './contexts/ContentContext'
import { LangProvider } from './contexts/LangContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Background from './components/Background'
import LiquidCursor from './components/LiquidCursor'
import Home from './pages/Home'
import Articles from './pages/Articles'
import ArticlePage from './pages/ArticlePage'
import Admin from './pages/Admin'

function SiteLayout() {
  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', position: 'relative' }}>
      <LiquidCursor />
      <Background />
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ContentProvider>
        <LangProvider>
          <Routes>
            <Route path="/admin" element={<Admin />} />
            <Route element={<SiteLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/articles" element={<Articles />} />
              <Route path="/articles/:slug" element={<ArticlePage />} />
            </Route>
          </Routes>
        </LangProvider>
      </ContentProvider>
    </BrowserRouter>
  )
}
