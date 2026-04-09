import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LangProvider } from './contexts/LangContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Background from './components/Background'
import LiquidCursor from './components/LiquidCursor'
import Home from './pages/Home'
import Articles from './pages/Articles'
import ArticlePage from './pages/ArticlePage'
import Booking from './pages/Booking'

export default function App() {
  return (
    <BrowserRouter>
      <LangProvider>
        <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', position: 'relative' }}>
          <LiquidCursor />
          <Background />
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/articles/:slug" element={<ArticlePage />} />
            <Route path="/booking" element={<Booking />} />
          </Routes>
          <Footer />
        </div>
      </LangProvider>
    </BrowserRouter>
  )
}
