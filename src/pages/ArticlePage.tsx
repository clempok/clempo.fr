import { useEffect, useState } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { ChevronRight, List, X } from 'lucide-react'
import { articles } from '../data/articles'
import { useLang } from '../contexts/LangContext'
import SEO from '../components/SEO'

// ---- Markdown renderer ----

type TableRow = string[]

interface ParsedBlock {
  type: 'h2' | 'h3' | 'p' | 'ul' | 'ol' | 'table' | 'faq' | 'hr' | 'empty'
  content?: string
  items?: string[]
  headers?: string[]
  rows?: TableRow[]
  question?: string
  answer?: string
}

function applyInline(text: string): React.ReactNode {
  // Bold + links
  const parts: React.ReactNode[] = []
  const re = /(\*\*(.+?)\*\*)|(\*(.+?)\*)/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    if (m[1]) {
      parts.push(<strong key={m.index} style={{ color: '#0A0A0A', fontWeight: 600 }}>{m[2]}</strong>)
    } else if (m[3]) {
      parts.push(<em key={m.index} style={{ fontStyle: 'italic' }}>{m[4]}</em>)
    }
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

function parseMarkdown(md: string): ParsedBlock[] {
  const lines = md.split('\n')
  const blocks: ParsedBlock[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // H2
    if (line.startsWith('## ')) {
      // Check if this is the FAQ section
      const title = line.slice(3).trim()
      if (title.toLowerCase().startsWith('faq')) {
        // skip; FAQ items will be parsed below
        i++
        continue
      }
      blocks.push({ type: 'h2', content: title })
      i++
      continue
    }

    // H3
    if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', content: line.slice(4).trim() })
      i++
      continue
    }

    // HR
    if (line.trim() === '---') {
      blocks.push({ type: 'hr' })
      i++
      continue
    }

    // Table
    if (line.trim().startsWith('|') && i + 1 < lines.length && lines[i + 1].trim().startsWith('|---')) {
      const headerLine = line
      const headers = headerLine
        .split('|')
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
        .map(h => h.trim())
      i += 2 // skip header + separator
      const rows: TableRow[] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const cells = lines[i]
          .split('|')
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
          .map(c => c.trim())
        rows.push(cells)
        i++
      }
      blocks.push({ type: 'table', headers, rows })
      continue
    }

    // FAQ item: bold question followed by answer on next line
    // Pattern: **Question?**\nAnswer text
    if (line.startsWith('**') && line.endsWith('**') && i + 1 < lines.length && !lines[i + 1].startsWith('**')) {
      const question = line.slice(2, -2).trim()
      const answerLines: string[] = []
      i++
      while (i < lines.length && lines[i].trim() !== '' && !lines[i].startsWith('**') && !lines[i].startsWith('#')) {
        answerLines.push(lines[i])
        i++
      }
      if (answerLines.length > 0) {
        blocks.push({ type: 'faq', question, answer: answerLines.join(' ') })
        continue
      } else {
        // It's just a bold paragraph
        blocks.push({ type: 'p', content: line })
        continue
      }
    }

    // Unordered list
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const items: string[] = []
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(lines[i].slice(2).trim())
        i++
      }
      blocks.push({ type: 'ul', items })
      continue
    }

    // Ordered list
    if (/^\d+\. /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, '').trim())
        i++
      }
      blocks.push({ type: 'ol', items })
      continue
    }

    // Empty line
    if (line.trim() === '') {
      blocks.push({ type: 'empty' })
      i++
      continue
    }

    // Italic source line (starts with *)
    if (line.startsWith('*') && line.endsWith('*')) {
      blocks.push({ type: 'p', content: line.slice(1, -1) })
      i++
      continue
    }

    // Paragraph
    if (line.trim()) {
      blocks.push({ type: 'p', content: line.trim() })
    }
    i++
  }

  return blocks
}

function renderBlock(block: ParsedBlock, idx: number): React.ReactNode {
  switch (block.type) {
    case 'h2':
      return (
        <h2 key={idx} id={`h2-${idx}`} style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '1.5rem', fontWeight: 700, color: '#0A0A0A',
          marginTop: '2.5rem', marginBottom: '1rem', lineHeight: '1.3',
        }}>
          {block.content}
        </h2>
      )
    case 'h3':
      return (
        <h3 key={idx} style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '1.15rem', fontWeight: 600, color: '#0A0A0A',
          marginTop: '1.75rem', marginBottom: '0.625rem',
        }}>
          {block.content}
        </h3>
      )
    case 'p':
      return (
        <p key={idx} style={{ color: '#71717A', lineHeight: '1.8', marginTop: '1rem', marginBottom: '1rem', fontSize: '1rem' }}>
          {applyInline(block.content || '')}
        </p>
      )
    case 'ul':
      return (
        <ul key={idx} style={{ listStyleType: 'disc', paddingLeft: '1.5rem', color: '#71717A', margin: '1rem 0' }}>
          {(block.items || []).map((item, j) => (
            <li key={j} style={{ marginBottom: '0.5rem', lineHeight: '1.7' }}>{applyInline(item)}</li>
          ))}
        </ul>
      )
    case 'ol':
      return (
        <ol key={idx} style={{ listStyleType: 'decimal', paddingLeft: '1.5rem', color: '#71717A', margin: '1rem 0' }}>
          {(block.items || []).map((item, j) => (
            <li key={j} style={{ marginBottom: '0.5rem', lineHeight: '1.7' }}>{applyInline(item)}</li>
          ))}
        </ol>
      )
    case 'table':
      return (
        <div key={idx} style={{ overflowX: 'auto', margin: '1.5rem 0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr>
                {(block.headers || []).map((h, j) => (
                  <th key={j} style={{ background: 'rgba(26,26,107,0.07)', color: '#1A1A6B', padding: '0.75rem 1rem', textAlign: 'left', border: '1px solid rgba(0,0,0,0.06)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(block.rows || []).map((row, j) => (
                <tr key={j}>
                  {row.map((cell, k) => (
                    <td key={k} style={{ color: '#71717A', padding: '0.75rem 1rem', border: '1px solid rgba(0,0,0,0.06)' }}>
                      {applyInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'faq':
      return (
        <div key={idx} style={{ background: 'rgba(26,26,107,0.06)', border: '1px solid rgba(26,26,107,0.15)', borderRadius: '0.75rem', padding: '1rem 1.25rem', marginBottom: '0.75rem' }}>
          <p style={{ color: '#1A1A6B', fontWeight: 600, fontSize: '1rem', marginBottom: '0.5rem' }}>
            {block.question}
          </p>
          <p style={{ color: '#71717A', lineHeight: '1.7', fontSize: '0.9375rem' }}>
            {applyInline(block.answer || '')}
          </p>
        </div>
      )
    case 'hr':
      return (
        <hr key={idx} style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.06)', margin: '2rem 0' }} />
      )
    default:
      return null
  }
}

function MarkdownArticle({ content }: { content: string }) {
  const blocks = parseMarkdown(content)
  return <>{blocks.map((b, i) => renderBlock(b, i))}</>
}

// ---- Table of Contents ----

function extractTOC(content: string): { id: string; label: string }[] {
  const toc: { id: string; label: string }[] = []
  const lines = content.split('\n')
  let blockIdx = 0
  for (const line of lines) {
    if (line.startsWith('## ')) {
      const label = line.slice(3).trim()
      if (!label.toLowerCase().startsWith('faq')) {
        toc.push({ id: `h2-${blockIdx}`, label })
      }
      blockIdx++
    } else {
      blockIdx++
    }
  }
  return toc
}

// ---- Page ----

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>()
  const article = articles.find(a => a.slug === slug)
  const [tocOpen, setTocOpen] = useState(false)
  const { t } = useLang()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

  if (!article) return <Navigate to="/articles" replace />

  const toc = extractTOC(article.content)

  return (
    <>
      <SEO
        title={`${article.title} | Clempo.fr`}
        description={article.metaDescription}
        canonical={`/articles/${article.slug}`}
        ogImage={article.heroImage}
        ogType="article"
        articlePublishedTime={article.date}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: article.title,
          description: article.metaDescription,
          image: article.heroImage,
          datePublished: article.date,
          author: {
            '@type': 'Person',
            '@id': 'https://www.clempo.fr/#person',
            name: 'Clément Pouget-Osmont',
            url: 'https://www.clempo.fr',
          },
          publisher: {
            '@type': 'Person',
            name: 'Clément Pouget-Osmont',
            url: 'https://www.clempo.fr',
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `https://www.clempo.fr/articles/${article.slug}`,
          },
        }}
      />
    <div style={{ paddingTop: '5rem', background: '#fff', minHeight: '100vh' }}>
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 4vw' }}>
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm" style={{ padding: '1.5rem 0', color: '#A1A1AA' }}>
          <Link to="/" style={{ color: '#A1A1AA', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#1A1A6B')}
            onMouseLeave={e => (e.currentTarget.style.color = '#A1A1AA')}
          >{t('article_page', 'home')}</Link>
          <ChevronRight size={14} />
          <Link to="/articles" style={{ color: '#A1A1AA', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#1A1A6B')}
            onMouseLeave={e => (e.currentTarget.style.color = '#A1A1AA')}
          >{t('nav', 'articles')}</Link>
          <ChevronRight size={14} />
          <span style={{ color: '#71717A' }}>{article.category}</span>
        </nav>

        {/* Article header */}
        <div style={{ maxWidth: '48rem', marginBottom: '2.5rem' }}>
          <span style={{
            display: 'inline-flex', padding: '0.3rem 0.9rem',
            background: 'rgba(26,26,107,0.07)', color: '#1A1A6B',
            borderRadius: '100px', fontSize: '0.65rem', fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.25rem',
          }}>
            {article.category}
          </span>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
            lineHeight: '1.15', letterSpacing: '-0.03em',
            color: '#0A0A0A', marginBottom: '1.25rem', fontWeight: 700,
          }}>
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: '#A1A1AA' }}>
            <span>Par <strong style={{ color: '#71717A', fontWeight: 500 }}>Clément Pouget-Osmont</strong></span>
            <span>·</span>
            <span>{formatDate(article.date)}</span>
            <span>·</span>
            <span>⏱ {article.readingTime} de lecture</span>
          </div>
        </div>

        {/* Hero image */}
        {article.heroImage && (
          <div style={{ maxWidth: '48rem', marginBottom: '2.5rem', borderRadius: '16px', overflow: 'hidden', height: '320px', position: 'relative' }}>
            <img src={article.heroImage} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.15) 100%)' }} />
          </div>
        )}

        {/* Divider */}
        {!article.heroImage && (
          <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', marginBottom: '2.5rem' }} />
        )}

        {/* Layout: sidebar + content */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: toc.length > 0 ? '1fr 260px' : '1fr',
            gap: '3rem',
            alignItems: 'start',
          }}
          className="lg:grid-cols-article"
        >
          {/* Article body */}
          <main>
            {/* Mobile TOC toggle */}
            {toc.length > 0 && (
              <div className="lg:hidden" style={{ marginBottom: '1.5rem' }}>
                <button
                  onClick={() => setTocOpen(!tocOpen)}
                  className="flex items-center gap-2 rounded-xl text-sm font-medium"
                  style={{
                    background: '#F8F8F6', border: '1px solid rgba(0,0,0,0.06)',
                    color: '#71717A', padding: '0.625rem 1rem', width: '100%', justifyContent: 'space-between',
                  }}
                >
                  <span className="flex items-center gap-2"><List size={15} />{t('article_page', 'toc')}</span>
                  {tocOpen ? <X size={14} /> : <ChevronRight size={14} />}
                </button>
                {tocOpen && (
                  <div className="rounded-xl mt-2" style={{ background: '#F8F8F6', border: '1px solid rgba(0,0,0,0.06)', padding: '1rem' }}>
                    {toc.map((item, i) => (
                      <a key={i} href={`#${item.id}`} onClick={() => setTocOpen(false)}
                        className="block text-sm py-1.5 transition-colors"
                        style={{ color: '#71717A', textDecoration: 'none' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#1A1A6B')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#71717A')}
                      >{item.label}</a>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ maxWidth: '680px' }}>
              <MarkdownArticle content={article.content} />
            </div>

            {/* Author card */}
            <div className="rounded-2xl flex gap-4 items-start" style={{ background: '#F8F8F6', border: '1px solid rgba(0,0,0,0.06)', padding: '1.5rem', marginTop: '3.5rem', maxWidth: '680px' }}>
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6913248fb7d48a3e5503c26d/d9c4651cb_Profile-Nano-Clem.png"
                alt="Clément Pouget-Osmont"
                style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              />
              <div>
                <p className="font-bold text-sm" style={{ color: '#0A0A0A', marginBottom: '0.125rem' }}>
                  {t('article_page', 'author_label')}
                </p>
                <p className="font-semibold text-sm" style={{ color: '#1A1A6B', marginBottom: '0.5rem' }}>
                  Clément Pouget-Osmont
                </p>
                <p style={{ color: '#71717A', fontSize: '0.875rem', lineHeight: '1.6' }}>
                  {t('article_page', 'author_bio')}
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="rounded-2xl text-center" style={{ background: 'rgba(26,26,107,0.05)', border: '1px solid rgba(26,26,107,0.12)', padding: '2rem 1.5rem', marginTop: '2rem', maxWidth: '680px' }}>
              <p className="font-bold" style={{ color: '#0A0A0A', fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                {t('article_page', 'cta_title')}
              </p>
              <p style={{ color: '#71717A', fontSize: '0.9375rem', marginBottom: '1.5rem' }}>
                {t('article_page', 'cta_sub')}
              </p>
              <Link to="/booking"
                className="inline-flex items-center font-bold rounded-full"
                style={{ backgroundColor: '#1A1A6B', color: '#fff', padding: '0.75rem 1.75rem', fontSize: '0.9375rem', textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#2D2D8A'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#1A1A6B'; (e.currentTarget as HTMLElement).style.transform = '' }}
              >
                {t('article_page', 'cta_btn')}
              </Link>
            </div>

            <div style={{ height: '5rem' }} />
          </main>

          {/* Desktop sidebar TOC */}
          {toc.length > 0 && (
            <aside className="hidden lg:block" style={{ position: 'sticky', top: '5.5rem' }}>
              <div className="rounded-2xl" style={{ background: '#F8F8F6', border: '1px solid rgba(0,0,0,0.06)', padding: '1.25rem' }}>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#A1A1AA', marginBottom: '0.875rem' }}>
                  {t('article_page', 'toc')}
                </p>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                  {toc.map((item, i) => (
                    <a key={i} href={`#${item.id}`}
                      className="text-sm py-1.5 rounded-lg px-2 transition-all duration-150"
                      style={{ color: '#71717A', textDecoration: 'none', lineHeight: '1.4', display: 'block' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#1A1A6B'; e.currentTarget.style.background = 'rgba(26,26,107,0.06)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#71717A'; e.currentTarget.style.background = 'transparent' }}
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
    </>
  )
}
