import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { articles } from '../data/articles'
import { useLang } from '../contexts/LangContext'
import SEO from '../components/SEO'
import Eyebrow from '../components/Eyebrow'
import Wordmark from '../components/Wordmark'

export default function Articles() {
  const { t, lang } = useLang()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const locale = lang === 'fr' ? 'fr-FR' : 'en-GB'
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })

  const articlesTitle = lang === 'fr'
    ? 'Articles — Analyses des systèmes de santé & Marketing Santé | Clempo.fr'
    : 'Articles — Healthcare Systems Analysis & Health Marketing | Clempo.fr'
  const articlesDesc = lang === 'fr'
    ? 'Analyses approfondies des systèmes de santé mondiaux et conseils marketing pour entrepreneurs healthtech. Par Clément Pouget-Osmont, expert marketing santé.'
    : 'In-depth analysis of global healthcare systems and marketing insights for healthtech entrepreneurs. By Clément Pouget-Osmont.'

  const sections = [
    {
      idx: '// 01',
      title: 'Analyses des systèmes de santé',
      subtitle: lang === 'fr' ? 'Décryptage des systèmes de santé mondiaux' : 'Global healthcare systems in depth',
      items: articles.filter(a => a.slug.startsWith('systeme-sante')),
    },
    {
      idx: '// 02',
      title: 'Conseils marketing appliqués à la santé',
      subtitle: lang === 'fr' ? 'Stratégies et tactiques pour les entreprises de santé' : 'Strategies and tactics for healthcare companies',
      items: articles.filter(a => !a.slug.startsWith('systeme-sante')),
    },
  ]

  return (
    <>
      <SEO title={articlesTitle} description={articlesDesc} canonical="/articles" />

      <div style={{
        background: 'var(--paper)',
        color: 'var(--ink)',
        fontFamily: 'var(--font-sans)',
        minHeight: '100vh',
        paddingTop: '5rem',
      }}>
        {/* ── HEADER ── */}
        <header style={{
          padding: '5rem 6vw 3rem',
          maxWidth: '1320px',
          margin: '0 auto',
          position: 'relative',
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <Eyebrow>// {t('articles_page', 'badge')}</Eyebrow>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
            fontWeight: 700,
            letterSpacing: '-0.035em',
            lineHeight: 1.05,
            color: 'var(--ink)',
            marginBottom: '1.5rem',
            maxWidth: '24ch',
          }}>
            {t('articles_page', 'title')}
          </h1>
          {t('articles_page', 'subtitle') && (
            <p style={{
              color: 'var(--graphite)',
              fontSize: '1rem',
              lineHeight: 1.6,
              fontWeight: 400,
              maxWidth: '60ch',
            }}>
              {t('articles_page', 'subtitle')}
            </p>
          )}
        </header>

        {/* ── DIVIDER ── */}
        <div style={{ height: '1px', background: 'rgba(10,10,11,0.08)', maxWidth: '1320px', margin: '0 auto 3rem', marginLeft: '6vw', marginRight: '6vw' }} />

        {/* ── SECTIONS ── */}
        {sections.map((section, sIdx) => (
          <section key={section.title} style={{
            maxWidth: '1320px',
            margin: '0 auto',
            padding: '0 6vw 5rem',
          }}>
            <div style={{ marginBottom: '2.5rem' }}>
              <Eyebrow>{section.idx} — section</Eyebrow>
              <h2 style={{
                marginTop: '1rem',
                fontFamily: 'var(--font-sans)',
                fontSize: 'clamp(1.6rem, 3vw, 2.3rem)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                color: 'var(--ink)',
                lineHeight: 1.15,
                marginBottom: '0.4rem',
              }}>
                {section.title}
              </h2>
              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                letterSpacing: '0.04em',
                color: 'var(--steel)',
              }}>
                — {section.subtitle}
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.25rem',
            }}>
              {section.items.map((article, i) => (
                <Link key={article.slug} to={`/articles/${article.slug}`} style={{ textDecoration: 'none' }}>
                  <article style={{
                    display: 'flex', flexDirection: 'column', height: '100%',
                    borderRadius: 'var(--cb-radius)',
                    overflow: 'hidden',
                    background: 'var(--paper-soft)',
                    border: '1px solid rgba(10,10,11,0.08)',
                    transition: 'transform 0.3s ease, border-color 0.3s ease',
                    color: 'var(--ink)',
                  }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.transform = 'translateY(-2px)'
                      el.style.borderColor = 'var(--ink)'
                      const img = el.querySelector('img') as HTMLElement
                      if (img) img.style.transform = 'scale(1.03)'
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.transform = ''
                      el.style.borderColor = 'rgba(10,10,11,0.08)'
                      const img = el.querySelector('img') as HTMLElement
                      if (img) img.style.transform = 'scale(1)'
                    }}
                  >
                    {article.heroImage && (
                      <div style={{ aspectRatio: '16/9', overflow: 'hidden', position: 'relative', flexShrink: 0, background: 'var(--ink)' }}>
                        <img
                          src={article.heroImage}
                          alt={article.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            filter: 'grayscale(1) contrast(1.05)',
                            transition: 'transform 0.5s ease',
                          }}
                        />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(10,10,11,0.55) 100%)' }} />
                        <span style={{
                          position: 'absolute', bottom: '0.875rem', left: '1rem',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.62rem',
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: 'var(--signal)',
                          fontWeight: 500,
                        }}>
                          // {article.category}
                        </span>
                        <span style={{
                          position: 'absolute', top: '0.875rem', right: '1rem',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.62rem',
                          letterSpacing: '0.1em',
                          color: 'var(--mist)',
                        }}>
                          — {String(i + 1).padStart(2, '0')} / {String(section.items.length).padStart(2, '0')}
                        </span>
                      </div>
                    )}

                    <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                      {!article.heroImage && (
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.7rem',
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: 'var(--signal-deep)',
                          fontWeight: 500,
                          marginBottom: '1rem',
                        }}>
                          // {article.category}
                        </span>
                      )}
                      <h3 style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        letterSpacing: '-0.015em',
                        lineHeight: 1.3,
                        marginBottom: '0.85rem',
                        color: 'var(--ink)',
                      }}>
                        {article.title}
                      </h3>
                      <p style={{
                        fontSize: '0.85rem',
                        color: 'var(--graphite)',
                        lineHeight: 1.6,
                        marginBottom: '1.5rem',
                        fontWeight: 400,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        flexGrow: 1,
                      }}>
                        {article.excerpt}
                      </p>
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        paddingTop: '1rem',
                        borderTop: '1px solid rgba(10,10,11,0.08)',
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--steel)',
                            fontSize: '0.72rem',
                          }}>
                            {formatDate(article.date)}
                          </span>
                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--steel)',
                            fontSize: '0.72rem',
                          }}>
                            {article.readingTime} {t('articles_page', 'reading_time')}
                          </span>
                        </div>
                        <span style={{
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          color: 'var(--ink)',
                        }}>
                          {t('articles_page', 'read')}
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            {/* Section footer */}
            <div style={{
              marginTop: '3rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Wordmark size="0.85rem" />
              <span className="cb-page-marker">— 0{sIdx + 1} / 0{sections.length}</span>
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
