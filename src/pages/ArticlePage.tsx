import { useEffect, useState } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { ChevronRight, List, X } from 'lucide-react'
import { articles, type Article } from '../data/articles'
import { useLang } from '../contexts/LangContext'
import SEO from '../components/SEO'
import Eyebrow from '../components/Eyebrow'
import Wordmark from '../components/Wordmark'
import JournalistesForm from '../components/JournalistesForm'
import { bookingUrl } from '../lib/cta'

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
  const parts: React.ReactNode[] = []
  const re = /(\*\*(.+?)\*\*)|(\*(.+?)\*)/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    if (m[1]) {
      parts.push(<strong key={m.index} style={{ color: 'var(--ink)', fontWeight: 600 }}>{m[2]}</strong>)
    } else if (m[3]) {
      parts.push(<em key={m.index} style={{ fontStyle: 'italic', fontFamily: 'var(--font-serif)' }}>{m[4]}</em>)
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

    if (line.startsWith('## ')) {
      const title = line.slice(3).trim()
      if (title.toLowerCase().startsWith('faq')) {
        i++
        continue
      }
      blocks.push({ type: 'h2', content: title })
      i++
      continue
    }

    if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', content: line.slice(4).trim() })
      i++
      continue
    }

    if (line.trim() === '---') {
      blocks.push({ type: 'hr' })
      i++
      continue
    }

    if (line.trim().startsWith('|') && i + 1 < lines.length && lines[i + 1].trim().startsWith('|---')) {
      const headerLine = line
      const headers = headerLine
        .split('|')
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
        .map(h => h.trim())
      i += 2
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
        blocks.push({ type: 'p', content: line })
        continue
      }
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      const items: string[] = []
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(lines[i].slice(2).trim())
        i++
      }
      blocks.push({ type: 'ul', items })
      continue
    }

    if (/^\d+\. /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, '').trim())
        i++
      }
      blocks.push({ type: 'ol', items })
      continue
    }

    if (line.trim() === '') {
      blocks.push({ type: 'empty' })
      i++
      continue
    }

    if (line.startsWith('*') && line.endsWith('*')) {
      blocks.push({ type: 'p', content: line.slice(1, -1) })
      i++
      continue
    }

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
          fontFamily: 'var(--font-sans)',
          fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)',
          letterSpacing: '-0.02em',
          marginTop: '2.5rem', marginBottom: '1rem', lineHeight: 1.25,
        }}>
          {block.content}
        </h2>
      )
    case 'h3':
      return (
        <h3 key={idx} style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '1.15rem', fontWeight: 600, color: 'var(--ink)',
          letterSpacing: '-0.015em',
          marginTop: '1.75rem', marginBottom: '0.625rem',
        }}>
          {block.content}
        </h3>
      )
    case 'p':
      return (
        <p key={idx} style={{ color: 'var(--graphite)', lineHeight: 1.75, marginTop: '1rem', marginBottom: '1rem', fontSize: '1rem' }}>
          {applyInline(block.content || '')}
        </p>
      )
    case 'ul':
      return (
        <ul key={idx} style={{ listStyle: 'none', paddingLeft: 0, color: 'var(--graphite)', margin: '1rem 0' }}>
          {(block.items || []).map((item, j) => (
            <li key={j} style={{
              marginBottom: '0.5rem',
              lineHeight: 1.7,
              paddingLeft: '1.5rem',
              position: 'relative',
            }}>
              <span style={{
                position: 'absolute',
                left: 0,
                color: 'var(--signal)',
                fontWeight: 600,
              }}>—</span>
              {applyInline(item)}
            </li>
          ))}
        </ul>
      )
    case 'ol':
      return (
        <ol key={idx} style={{ listStyleType: 'decimal', paddingLeft: '1.5rem', color: 'var(--graphite)', margin: '1rem 0' }}>
          {(block.items || []).map((item, j) => (
            <li key={j} style={{ marginBottom: '0.5rem', lineHeight: 1.7 }}>{applyInline(item)}</li>
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
                  <th key={j} style={{
                    background: 'var(--paper-soft)',
                    color: 'var(--ink)',
                    padding: '0.75rem 1rem',
                    textAlign: 'left',
                    border: '1px solid rgba(10,10,11,0.1)',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.78rem',
                    letterSpacing: '0.02em',
                    textTransform: 'uppercase',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(block.rows || []).map((row, j) => (
                <tr key={j}>
                  {row.map((cell, k) => (
                    <td key={k} style={{ color: 'var(--graphite)', padding: '0.75rem 1rem', border: '1px solid rgba(10,10,11,0.08)' }}>
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
        <div key={idx} style={{
          background: 'var(--paper-soft)',
          border: '1px solid rgba(10,10,11,0.08)',
          borderLeft: '3px solid var(--signal)',
          borderRadius: 'var(--cb-radius)',
          padding: '1rem 1.25rem',
          marginBottom: '0.75rem',
        }}>
          <p style={{ color: 'var(--ink)', fontWeight: 600, fontSize: '1rem', marginBottom: '0.5rem' }}>
            {block.question}
          </p>
          <p style={{ color: 'var(--graphite)', lineHeight: 1.7, fontSize: '0.9375rem' }}>
            {applyInline(block.answer || '')}
          </p>
        </div>
      )
    case 'hr':
      return (
        <hr key={idx} style={{ border: 'none', borderTop: '1px solid rgba(10,10,11,0.08)', margin: '2rem 0' }} />
      )
    default:
      return null
  }
}

function MarkdownArticle({ content }: { content: string }) {
  const blocks = parseMarkdown(content)
  return <>{blocks.map((b, i) => renderBlock(b, i))}</>
}

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

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Nettoie le markdown inline pour le texte des données structurées (pas de **, *, [texte](url))
function stripMarkdown(text: string): string {
  return text
    .replace(/\[(.+?)\]\((.+?)\)/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

// Construit le JSON-LD complet d'un article : Article + BreadcrumbList + FAQPage (si FAQ présente)
function buildArticleJsonLd(article: Article): object {
  const url = `https://www.clempo.fr/articles/${article.slug}`
  const faqs = parseMarkdown(article.content).filter(
    b => b.type === 'faq' && b.question && b.answer
  )

  const graph: object[] = [
    {
      '@type': 'Article',
      headline: article.title,
      description: article.metaDescription,
      image: article.heroImage,
      datePublished: article.date,
      dateModified: article.updated || article.date,
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
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://www.clempo.fr' },
        { '@type': 'ListItem', position: 2, name: 'Articles', item: 'https://www.clempo.fr/articles' },
        { '@type': 'ListItem', position: 3, name: article.title, item: url },
      ],
    },
  ]

  if (faqs.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: faqs.map(f => ({
        '@type': 'Question',
        name: stripMarkdown(f.question as string),
        acceptedAnswer: { '@type': 'Answer', text: stripMarkdown(f.answer as string) },
      })),
    })
  }

  return { '@context': 'https://schema.org', '@graph': graph }
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
        articleModifiedTime={article.updated || article.date}
        jsonLd={buildArticleJsonLd(article)}
      />
      <div style={{
        paddingTop: '5rem',
        background: 'var(--paper)',
        color: 'var(--ink)',
        fontFamily: 'var(--font-sans)',
        minHeight: '100vh',
      }}>
        <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '0 6vw' }}>
          {/* Breadcrumb — mono style */}
          <nav style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '1.5rem 0',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            letterSpacing: '0.04em',
            color: 'var(--steel)',
          }}>
            <Link to="/" style={{ color: 'var(--steel)', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--steel)')}
            >{t('article_page', 'home')}</Link>
            <ChevronRight size={12} />
            <Link to="/articles" style={{ color: 'var(--steel)', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--steel)')}
            >{t('nav', 'articles')}</Link>
            <ChevronRight size={12} />
            <span style={{ color: 'var(--ink)' }}>{article.category}</span>
          </nav>

          {/* Article header */}
          <div style={{ maxWidth: '48rem', marginBottom: '2.5rem' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <Eyebrow>// {article.category}</Eyebrow>
            </div>
            <h1 style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(1.9rem, 4vw, 3rem)',
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: 'var(--ink)',
              marginBottom: '1.5rem',
              fontWeight: 700,
            }}>
              {article.title}
            </h1>
            <div style={{
              display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              color: 'var(--steel)',
              letterSpacing: '0.02em',
            }}>
              <span>{t('article_page', 'by')} <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>Clément Pouget-Osmont</strong></span>
              <span style={{ color: 'var(--signal)' }}>·</span>
              <span>{formatDate(article.date)}</span>
              {article.updated && article.updated !== article.date && (
                <>
                  <span style={{ color: 'var(--signal)' }}>·</span>
                  <span>Mis à jour le {formatDate(article.updated)}</span>
                </>
              )}
              <span style={{ color: 'var(--signal)' }}>·</span>
              <span>{article.readingTime} {t('articles_page', 'reading_time')}</span>
            </div>
          </div>

          {/* Hero image */}
          {article.heroImage && (
            <div style={{
              maxWidth: '48rem',
              marginBottom: '2.5rem',
              borderRadius: 'var(--cb-radius)',
              overflow: 'hidden',
              height: '320px',
              position: 'relative',
              background: 'var(--ink)',
            }}>
              <img
                src={article.heroImage}
                alt={article.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: 'grayscale(1) contrast(1.05)',
                }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(10,10,11,0.25) 100%)' }} />
            </div>
          )}

          {!article.heroImage && (
            <div style={{ height: '1px', background: 'rgba(10,10,11,0.08)', marginBottom: '2.5rem' }} />
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
            <main>
              {/* Mobile TOC toggle */}
              {toc.length > 0 && (
                <div className="lg:hidden" style={{ marginBottom: '1.5rem' }}>
                  <button
                    onClick={() => setTocOpen(!tocOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'var(--paper-soft)',
                      border: '1px solid rgba(10,10,11,0.08)',
                      borderRadius: 'var(--cb-radius)',
                      color: 'var(--ink)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.78rem',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      padding: '0.7rem 1rem',
                      width: '100%',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <List size={14} /> {t('article_page', 'toc')}
                    </span>
                    {tocOpen ? <X size={14} /> : <ChevronRight size={14} />}
                  </button>
                  {tocOpen && (
                    <div style={{
                      background: 'var(--paper-soft)',
                      border: '1px solid rgba(10,10,11,0.08)',
                      borderRadius: 'var(--cb-radius)',
                      padding: '1rem',
                      marginTop: '0.5rem',
                    }}>
                      {toc.map((item, i) => (
                        <a key={i} href={`#${item.id}`} onClick={() => setTocOpen(false)}
                          style={{
                            display: 'block',
                            fontSize: '0.88rem',
                            padding: '0.35rem 0',
                            color: 'var(--graphite)',
                            textDecoration: 'none',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--graphite)')}
                        >{item.label}</a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div style={{ maxWidth: '680px' }}>
                <MarkdownArticle content={article.content} />
              </div>

              {/* Inline ressource — only on marketing articles (slug ≠ systeme-sante-*) */}
              {!article.slug.startsWith('systeme-sante') && (
                <div style={{ maxWidth: '680px', marginTop: '3rem' }}>
                  <JournalistesForm variant="compact" source={`article-${article.slug}`} />
                </div>
              )}

              {/* Author card */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start',
                background: 'var(--paper-soft)',
                border: '1px solid rgba(10,10,11,0.08)',
                borderRadius: 'var(--cb-radius)',
                padding: '1.5rem',
                marginTop: '3.5rem',
                maxWidth: '680px',
              }}>
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6913248fb7d48a3e5503c26d/d9c4651cb_Profile-Nano-Clem.png"
                  alt="Clément Pouget-Osmont"
                  style={{
                    width: '64px', height: '64px',
                    borderRadius: 'var(--cb-radius)',
                    objectFit: 'cover',
                    flexShrink: 0,
                    filter: 'grayscale(1) contrast(1.05)',
                    background: 'var(--ink)',
                  }}
                />
                <div>
                  <p style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--signal-deep)',
                    fontWeight: 500,
                    marginBottom: '0.4rem',
                  }}>
                    // {t('article_page', 'author_label')}
                  </p>
                  <p style={{
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    color: 'var(--ink)',
                    marginBottom: '0.5rem',
                  }}>
                    Clément Pouget-Osmont
                  </p>
                  <p style={{ color: 'var(--graphite)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                    {t('article_page', 'author_bio')}
                  </p>
                </div>
              </div>

              {/* CTA */}
              <div style={{
                background: 'var(--ink)',
                color: 'var(--paper)',
                borderRadius: 'var(--cb-radius)',
                padding: '2rem 1.75rem',
                marginTop: '2rem',
                maxWidth: '680px',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div className="cb-dotmatrix cb-dotmatrix--signal" aria-hidden style={{
                  position: 'absolute', right: 0, top: 0,
                  width: '40%', height: '100%', pointerEvents: 'none',
                }} />
                <div style={{ position: 'relative' }}>
                  <Eyebrow>// Let's talk</Eyebrow>
                  <p style={{
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 700,
                    color: 'var(--paper)',
                    fontSize: '1.25rem',
                    letterSpacing: '-0.02em',
                    marginTop: '0.75rem',
                    marginBottom: '0.5rem',
                  }}>
                    {t('article_page', 'cta_title')}
                  </p>
                  <p style={{ color: 'var(--mist)', fontSize: '0.9375rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                    {t('article_page', 'cta_sub')}
                  </p>
                  <Link to={bookingUrl(`article-${slug || 'unknown'}`)} className="cb-btn cb-btn--signal">
                    {t('article_page', 'cta_btn').replace(/\s*→\s*$/, '')} <span className="cb-arrow">→</span>
                  </Link>
                </div>
              </div>

              <div style={{
                marginTop: '3rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                maxWidth: '680px',
              }}>
                <Wordmark size="0.85rem" />
                <span className="cb-page-marker">— Écrit · clempo.fr</span>
              </div>

              <div style={{ height: '5rem' }} />
            </main>

            {/* Desktop sidebar TOC */}
            {toc.length > 0 && (
              <aside className="hidden lg:block" style={{ position: 'sticky', top: '5.5rem' }}>
                <div style={{
                  background: 'var(--paper-soft)',
                  border: '1px solid rgba(10,10,11,0.08)',
                  borderRadius: 'var(--cb-radius)',
                  padding: '1.25rem',
                }}>
                  <p style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.68rem',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: 'var(--signal-deep)',
                    marginBottom: '0.875rem',
                  }}>
                    // {t('article_page', 'toc')}
                  </p>
                  <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                    {toc.map((item, i) => (
                      <a key={i} href={`#${item.id}`}
                        style={{
                          fontSize: '0.82rem',
                          padding: '0.4rem 0.5rem',
                          color: 'var(--graphite)',
                          textDecoration: 'none',
                          lineHeight: 1.45,
                          display: 'block',
                          borderRadius: 'var(--cb-radius)',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--ink)'; e.currentTarget.style.background = 'rgba(10,10,11,0.04)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--graphite)'; e.currentTarget.style.background = 'transparent' }}
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
