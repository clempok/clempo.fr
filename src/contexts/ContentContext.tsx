import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ContentData = Record<string, any>

interface ContentContextType {
  content: ContentData | null
  loading: boolean
}

const ContentContext = createContext<ContentContextType>({ content: null, loading: true })

export function useContent() {
  return useContext(ContentContext)
}

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<ContentData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/content.json')
      .then(r => r.json())
      .then(data => {
        setContent(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <ContentContext.Provider value={{ content, loading }}>
      {children}
    </ContentContext.Provider>
  )
}
