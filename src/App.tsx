import { BrowserRouter, Routes, Route } from 'react-router-dom'
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

export default function App() {
  return (
    <BrowserRouter>
      <ContentProvider>
        <LangProvider>
          <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', position: 'relative' }}>
            <LiquidCursor />
            <Background />
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/articles" element={<Articles />} />
              <Route path="/articles/:slug" element={<ArticlePage />} />
              <Route path="/confirmation" element={<Confirmation />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/booking" element={<Booking />} />
            </Routes>
            <Footer />
          </div>
        </LangProvider>
      </ContentProvider>
    </BrowserRouter>
  )
}
