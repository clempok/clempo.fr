import { createContext, useContext, useState, type ReactNode } from 'react'
import { translations as defaultTranslations, type Lang } from '../i18n/translations'
import { useContent } from './ContentContext'

interface LangContextType {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (section: string, key: string) => string
}

const LangContext = createContext<LangContextType | null>(null)

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used within LangProvider')
  return ctx
}

export function LangProvider({ children }: { children: ReactNode }) {
  const { content } = useContent()

  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === 'undefined') return 'fr'
    const saved = localStorage.getItem('lang') as Lang
    if (saved === 'fr' || saved === 'en') return saved
    return navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en'
  })

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem('lang', l)
  }

  const t = (section: string, key: string): string => {
    // Try content.json first, fallback to default translations
    if (content?.translations?.[lang]?.[section]?.[key]) {
      return content.translations[lang][section][key]
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = (defaultTranslations[lang] as any)[section]
    return s?.[key] ?? key
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}
