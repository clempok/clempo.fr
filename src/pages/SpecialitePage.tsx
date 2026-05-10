import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import SEO from '../components/SEO'
import Eyebrow from '../components/Eyebrow'
import BarChartRace, { type BarChartRaceData } from '../components/BarChartRace'
import DataDownloadGate, { DataDownloadNetlifyRegistration } from '../components/DataDownloadGate'
import { specialites, getSpecialite } from '../data/specialites'

export default function SpecialitePage() {
  const { slug } = useParams<{ slug: string }>()
  const specialite = slug ? getSpecialite(slug) : undefined
  const [data, setData] = useState<BarChartRaceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

  useEffect(() => {
    if (!specialite) return
    setLoading(true)
    setError(null)
    setData(null)
    fetch(`/data/specialites/${specialite.slug}.json`)
      .then(r => {
        if (!r.ok) throw new Error('Données indisponibles')
        return r.json()
      })
      .then((json: BarChartRaceData) => {
        setData(json)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message || 'Erreur de chargement')
        setLoading(false)
      })
  }, [specialite])

  if (!specialite) {
    return (
      <div style={{
        background: 'var(--paper)', minHeight: '100vh',
        paddingTop: '8rem', paddingLeft: '6vw', paddingRight: '6vw',
        fontFamily: 'var(--font-sans)', color: 'var(--ink)',
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Spécialité introuvable</h1>
        <p style={{ color: 'var(--graphite)' }}>
          <Link to="/parts-de-marche-logiciels-medicaux" style={{ color: 'var(--ink)' }}>← Voir toutes les spécialités</Link>
        </p>
      </div>
    )
  }

  const totalEditeurs = data?.all_progiciels.length ?? 0
  const monthsCount = data?.months.length ?? 0
  const firstMonth = data?.months[0]
  const lastMonth = data?.months[monthsCount - 1]

  // SEO — title ciblé sur "logiciel [spécialité] le plus utilisé"
  const title = `${specialite.metaTitle} | Clempo.fr`

  // JSON-LD Graph : Dataset + FAQPage (deux entités utiles pour le SERP)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Dataset',
        name: `Parts de télétransmission ${specialite.name} 2019-2026`,
        description: specialite.metaDescription,
        url: `https://www.clempo.fr/specialites/${specialite.slug}`,
        creator: { '@type': 'Organization', name: 'GIE SESAM-Vitale' },
        publisher: { '@type': 'Person', name: 'Clément Pouget-Osmont', url: 'https://www.clempo.fr' },
        license: 'https://www.gie-sesam-vitale.fr/',
        temporalCoverage: '2019-01/2026-03',
        spatialCoverage: { '@type': 'Place', name: 'France' },
        distribution: [
          {
            '@type': 'DataDownload',
            encodingFormat: 'text/csv',
            contentUrl: `https://www.clempo.fr/data/specialites/${specialite.slug}.csv`,
          },
          {
            '@type': 'DataDownload',
            encodingFormat: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            contentUrl: `https://www.clempo.fr/data/specialites/${specialite.slug}.xlsx`,
          },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: specialite.faq.map(item => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
    ],
  }

  // Other specialties for cross-linking
  const others = specialites.filter(s => s.slug !== specialite.slug)

  return (
    <>
      <SEO
        title={title}
        description={specialite.metaDescription}
        canonical={`/specialites/${specialite.slug}`}
        jsonLd={jsonLd}
      />

      <div style={{
        background: 'var(--paper)',
        color: 'var(--ink)',
        fontFamily: 'var(--font-sans)',
        minHeight: '100vh',
        paddingTop: '5rem',
      }}>
        {/* HEADER */}
        <header style={{
          padding: '4rem 6vw 2rem',
          maxWidth: '1320px',
          margin: '0 auto',
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <Link to="/parts-de-marche-logiciels-medicaux" style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              color: 'var(--steel)',
              textDecoration: 'none',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              ← Toutes les spécialités
            </Link>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <Eyebrow>// parts de marché — {specialite.source}</Eyebrow>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(2rem, 4.5vw, 3.4rem)',
            fontWeight: 700,
            letterSpacing: '-0.035em',
            lineHeight: 1.05,
            color: 'var(--ink)',
            marginBottom: '1.25rem',
            maxWidth: '26ch',
          }}>
            Logiciel {specialite.shortName} le plus utilisé en France
          </h1>
          <p style={{
            color: 'var(--graphite)',
            fontSize: '1rem',
            lineHeight: 1.6,
            maxWidth: '62ch',
          }}>
            <strong>{specialite.topPlayers[0].name}</strong> ({specialite.topPlayers[0].editor}) est le logiciel {specialite.shortName} le plus utilisé en France en {specialite.asOf}, avec <strong>{specialite.topPlayers[0].share}</strong> des télétransmissions au GIE SESAM-Vitale. Il devance {specialite.topPlayers.slice(1, 4).map((p, i, arr) => (
              <span key={p.name}>
                <strong>{p.name}</strong> ({p.share}){i < arr.length - 1 ? ', ' : '.'}
              </span>
            ))} {specialite.hero}
          </p>
        </header>

        {/* CHART */}
        <section style={{
          maxWidth: '1320px',
          margin: '0 auto 3rem',
          padding: '0 6vw',
        }}>
          <div style={{
            background: 'var(--paper-soft)',
            border: '1px solid rgba(10,10,11,0.08)',
            borderRadius: 'var(--cb-radius)',
            padding: '2rem',
          }}>
            {loading && (
              <div style={{
                padding: '4rem 0',
                textAlign: 'center',
                color: 'var(--steel)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>
                Chargement des données…
              </div>
            )}
            {error && (
              <div style={{
                padding: '4rem 0',
                textAlign: 'center',
                color: 'var(--signal-warm)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
              }}>
                ⚠ {error}
              </div>
            )}
            {data && <BarChartRace data={data} />}
          </div>
        </section>

        {/* DOWNLOADS + STATS */}
        <section style={{
          maxWidth: '1320px',
          margin: '0 auto 4rem',
          padding: '0 6vw',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
        }}>
          {/* DOWNLOAD CARD — gated behind a lead form */}
          <DataDownloadGate
            slug={specialite.slug}
            specialiteName={specialite.name}
            monthsCount={monthsCount}
            totalEditeurs={totalEditeurs}
          />
          <DataDownloadNetlifyRegistration />

          {/* META CARD */}
          <div style={{
            background: 'var(--paper-soft)',
            border: '1px solid rgba(10,10,11,0.08)',
            borderRadius: 'var(--cb-radius)',
            padding: '2rem',
          }}>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.62rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--signal-deep)',
              marginBottom: '0.75rem',
            }}>
              // méthodologie
            </div>
            <h2 style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '1.4rem',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              marginBottom: '1rem',
            }}>
              À propos de la donnée
            </h2>
            <dl style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: '0.5rem 1rem',
              fontSize: '0.85rem',
              color: 'var(--graphite)',
              lineHeight: 1.5,
            }}>
              <dt style={{ color: 'var(--steel)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase', alignSelf: 'center' }}>Source</dt>
              <dd style={{ margin: 0 }}>{specialite.source}</dd>
              <dt style={{ color: 'var(--steel)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase', alignSelf: 'center' }}>Période</dt>
              <dd style={{ margin: 0 }}>{firstMonth ?? '—'} → {lastMonth ?? '—'}</dd>
              <dt style={{ color: 'var(--steel)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase', alignSelf: 'center' }}>Mois</dt>
              <dd style={{ margin: 0 }}>{monthsCount}</dd>
              <dt style={{ color: 'var(--steel)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase', alignSelf: 'center' }}>Progiciels</dt>
              <dd style={{ margin: 0 }}>{totalEditeurs}</dd>
              <dt style={{ color: 'var(--steel)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase', alignSelf: 'center' }}>Métrique</dt>
              <dd style={{ margin: 0 }}>Part de télétransmission (%)</dd>
            </dl>
            <p style={{
              marginTop: '1.25rem',
              fontSize: '0.78rem',
              color: 'var(--steel)',
              lineHeight: 1.55,
            }}>
              La part de télétransmission correspond au pourcentage de feuilles de soins électroniques émises par chaque progiciel pour cette spécialité, mois par mois. C'est l'indicateur le plus fiable pour mesurer l'usage réel d'un éditeur sur le terrain.
            </p>
          </div>
        </section>

        {/* SEO CONTENT — Top 5, analyse de marché, tendances */}
        <section style={{
          maxWidth: '1320px',
          margin: '0 auto 4rem',
          padding: '0 6vw',
        }}>
          {/* Top players ranked list */}
          <div style={{ marginBottom: '3rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <Eyebrow>// classement — {specialite.asOf}</Eyebrow>
            </div>
            <h2 style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              lineHeight: 1.2,
              marginBottom: '1.5rem',
              maxWidth: '24ch',
            }}>
              Top 5 des logiciels {specialite.shortName} les plus utilisés en France
            </h2>
            <ol style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '0.75rem',
            }}>
              {specialite.topPlayers.map((p) => (
                <li key={p.rank} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  padding: '1.25rem 1.5rem',
                  background: p.rank === 1 ? 'var(--ink)' : 'var(--paper-soft)',
                  color: p.rank === 1 ? 'var(--paper)' : 'var(--ink)',
                  border: p.rank === 1 ? 'none' : '1px solid rgba(10,10,11,0.08)',
                  borderRadius: 'var(--cb-radius)',
                }}>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1.6rem',
                    fontWeight: 700,
                    color: p.rank === 1 ? 'var(--signal)' : 'var(--steel)',
                    minWidth: '2ch',
                    lineHeight: 1,
                    paddingTop: '0.15rem',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {String(p.rank).padStart(2, '0')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      lineHeight: 1.25,
                      marginBottom: '0.15rem',
                    }}>
                      {p.name}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.7rem',
                      color: p.rank === 1 ? 'rgba(237,235,228,0.6)' : 'var(--steel)',
                      letterSpacing: '0.04em',
                      marginBottom: '0.4rem',
                    }}>
                      {p.editor}
                    </div>
                    {p.note && (
                      <div style={{
                        fontSize: '0.78rem',
                        color: p.rank === 1 ? 'rgba(237,235,228,0.7)' : 'var(--graphite)',
                        fontStyle: 'italic',
                      }}>
                        — {p.note}
                      </div>
                    )}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1.3rem',
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                    color: p.rank === 1 ? 'var(--signal)' : 'var(--ink)',
                    lineHeight: 1,
                    paddingTop: '0.25rem',
                  }}>
                    {p.share}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Market analysis */}
          <div style={{ marginBottom: '3rem', maxWidth: '70ch' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <Eyebrow tone="ink">// acteurs en présence</Eyebrow>
            </div>
            <h2 style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(1.5rem, 2.6vw, 2rem)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              marginBottom: '1.25rem',
            }}>
              Les acteurs du marché du logiciel {specialite.shortName}
            </h2>
            <div
              style={{
                fontSize: '1rem',
                lineHeight: 1.7,
                color: 'var(--graphite)',
              }}
              dangerouslySetInnerHTML={{ __html: specialite.marketAnalysis }}
            />
          </div>

          {/* Trends */}
          <div style={{ marginBottom: '3rem', maxWidth: '70ch' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <Eyebrow tone="ink">// tendances 2019 → 2026</Eyebrow>
            </div>
            <h2 style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(1.5rem, 2.6vw, 2rem)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              marginBottom: '1.25rem',
            }}>
              Évolutions et tendances du marché
            </h2>
            <div
              style={{
                fontSize: '1rem',
                lineHeight: 1.7,
                color: 'var(--graphite)',
              }}
              dangerouslySetInnerHTML={{ __html: specialite.trends }}
            />
          </div>

          {/* FAQ */}
          <div style={{ maxWidth: '70ch' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <Eyebrow tone="ink">// FAQ</Eyebrow>
            </div>
            <h2 style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(1.5rem, 2.6vw, 2rem)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              marginBottom: '1.5rem',
            }}>
              Questions fréquentes
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {specialite.faq.map((item, i) => (
                <details
                  key={i}
                  style={{
                    background: 'var(--paper-soft)',
                    border: '1px solid rgba(10,10,11,0.08)',
                    borderRadius: 'var(--cb-radius)',
                    padding: '1rem 1.25rem',
                  }}
                >
                  <summary
                    style={{
                      fontWeight: 600,
                      fontSize: '1rem',
                      cursor: 'pointer',
                      color: 'var(--ink)',
                      listStyle: 'none',
                    }}
                  >
                    {item.q}
                  </summary>
                  <p style={{
                    marginTop: '0.85rem',
                    fontSize: '0.95rem',
                    lineHeight: 1.65,
                    color: 'var(--graphite)',
                  }}>
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* OTHER SPECIALTIES */}
        <section style={{
          maxWidth: '1320px',
          margin: '0 auto',
          padding: '0 6vw 6rem',
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <Eyebrow>// autres spécialités</Eyebrow>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '0.75rem',
          }}>
            {others.map(s => (
              <Link
                key={s.slug}
                to={`/specialites/${s.slug}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem 1.25rem',
                  background: 'var(--paper-soft)',
                  border: '1px solid rgba(10,10,11,0.08)',
                  borderRadius: 'var(--cb-radius)',
                  textDecoration: 'none',
                  color: 'var(--ink)',
                  fontSize: '0.88rem',
                  fontWeight: 500,
                  transition: 'border-color 0.2s, transform 0.2s',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = 'var(--ink)'
                  el.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = 'rgba(10,10,11,0.08)'
                  el.style.transform = ''
                }}
              >
                <span>{s.name}</span>
                <span style={{ color: 'var(--steel)' }}>→</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
