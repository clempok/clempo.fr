import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { articles } from '../data/articles'
import { useLang } from '../contexts/LangContext'

const ACCENT = '#1A1A6B'
const ACCENT_LIGHT = 'rgba(26,26,107,0.07)'
const BORDER = 'rgba(0,0,0,0.06)'
const MUTED = '#71717A'
const TEXT = '#0A0A0A'
const BG_OFF = '#F8F8F6'

export default function Articles() {
  const { t, lang } = useLang()

  useEffect(() => {
    document.title = t('articles_page', 'doc_title')
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', t('articles_page', 'doc_meta'))
    window.scrollTo(0, 0)
  }, [lang])

  const locale = lang === 'fr' ? 'fr-FR' : 'en-GB'
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{ paddingTop: '5rem', background: '#fff', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ padding: '4rem 4vw 3rem', maxWidth: '56rem', margin: '0 auto', textAlign: 'center' }}>
        <p style={{ fontSize: '0.68rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: ACCENT, marginBottom: '1.5rem', fontWeight: 500 }}>
          {t('articles_page', 'badge')}
        </p>
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.1,
          color: TEXT, marginBottom: '1rem',
        }}>
          {t('articles_page', 'title')}
        </h1>
        <p style={{ color: MUTED, fontSize: '1.05rem', lineHeight: 1.6, fontWeight: 300 }}>
          {t('articles_page', 'subtitle')}
        </p>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: BORDER, maxWidth: '72rem', margin: '0 auto 3rem' }} />

      {/* Sections */}
      {[
        {
          title: 'Analyses des systèmes de santé',
          subtitle: lang === 'fr' ? 'Décryptage des systèmes de santé mondiaux' : 'Global healthcare systems in depth',
          items: articles.filter(a => a.slug.startsWith('systeme-sante')),
        },
        {
          title: 'Conseils marketing appliqués à la santé',
          subtitle: lang === 'fr' ? 'Stratégies et tactiques pour les entreprises de santé' : 'Strategies and tactics for healthcare companies',
          items: articles.filter(a => !a.slug.startsWith('systeme-sante')),
        },
      ].map(section => (
        <div key={section.title} style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 4vw 5rem' }}>
          {/* Section header */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 700,
              letterSpacing: '-0.025em', color: TEXT, marginBottom: '0.4rem',
            }}>
              {section.title}
            </h2>
            <p style={{ fontSize: '0.9rem', color: MUTED, fontWeight: 300 }}>
              {section.subtitle}
            </p>
            <div style={{ marginTop: '1.2rem', height: '2px', width: '40px', background: ACCENT, borderRadius: '2px' }} />
          </div>

          {/* Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem',
          }}>
            {section.items.map(article => (
              <Link key={article.slug} to={`/articles/${article.slug}`} style={{ textDecoration: 'none' }}>
                <article style={{
                  display: 'flex', flexDirection: 'column', height: '100%',
                  borderRadius: '20px', overflow: 'hidden',
                  background: BG_OFF, border: `1px solid ${BORDER}`,
                  transition: 'all 0.4s', color: TEXT,
                }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 16px 50px rgba(0,0,0,0.06)'; el.style.borderColor = 'rgba(26,26,107,0.15)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ''; el.style.boxShadow = ''; el.style.borderColor = BORDER }}
                >
                  {article.heroImage && (
                    <div style={{ aspectRatio: '16/9', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                      <img
                        src={article.heroImage} alt={article.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                      />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.2) 100%)' }} />
                      <span style={{
                        position: 'absolute', bottom: '0.875rem', left: '1rem',
                        padding: '0.3rem 0.9rem', background: ACCENT,
                        color: '#fff', borderRadius: '100px',
                        fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                      }}>
                        {article.category}
                      </span>
                    </div>
                  )}

                  <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    {!article.heroImage && (
                      <span style={{
                        display: 'inline-flex', padding: '0.3rem 0.9rem',
                        background: ACCENT_LIGHT, color: ACCENT,
                        borderRadius: '100px', fontSize: '0.65rem', fontWeight: 600,
                        letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem', width: 'fit-content',
                      }}>
                        {article.category}
                      </span>
                    )}
                    <h2 style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: '1.1rem', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.35,
                      marginBottom: '0.75rem', flexGrow: 1, color: TEXT,
                    }}>
                      {article.title}
                    </h2>
                    <p style={{
                      fontSize: '0.875rem', color: MUTED, lineHeight: 1.65,
                      marginBottom: '1.5rem', fontWeight: 300,
                      display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {article.excerpt}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: `1px solid ${BORDER}` }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                        <span style={{ color: '#A1A1AA', fontSize: '0.78rem' }}>{formatDate(article.date)}</span>
                        <span style={{ color: '#A1A1AA', fontSize: '0.78rem' }}>⏱ {article.readingTime} {t('articles_page', 'reading_time')}</span>
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 500, color: ACCENT }}>
                        {t('articles_page', 'read')} →
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
