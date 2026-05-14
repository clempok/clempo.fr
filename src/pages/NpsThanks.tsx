import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MessageCircleHeart } from 'lucide-react'
import { useLang } from '../contexts/LangContext'

const LEMCAL_URL = 'https://app.lemcal.com/@clementpougetosmont/30minutes'

export default function NpsThanks() {
  const { t } = useLang()
  const [params] = useSearchParams()
  const token = params.get('t') || ''
  const scoreParam = params.get('s')
  const err = params.get('err')

  const score = (() => {
    if (scoreParam === null) return null
    const n = Number.parseInt(scoreParam, 10)
    return Number.isInteger(n) && n >= 0 && n <= 10 ? n : null
  })()

  const isInvalid = err === 'invalid' || !token || score === null

  const [comment, setComment] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  useEffect(() => {
    document.title = t('nps_thanks', 'doc_title')
  }, [t])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (state === 'sending' || !comment.trim()) return
    setState('sending')
    try {
      const res = await fetch('/.netlify/functions/nps-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ t: token, comment: comment.trim() }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || 'fail')
      setState('sent')
    } catch (err) {
      console.error('nps-comment submit failed:', err)
      setState('error')
    }
  }

  const accent = score === null ? '#1A1A6B' : score <= 6 ? '#dc2626' : score <= 8 ? '#f59e0b' : '#16a34a'

  return (
    <main style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '80px 24px',
      background: 'var(--paper)',
      color: 'var(--ink)',
      fontFamily: 'var(--font-sans)',
    }}>
      <div style={{ maxWidth: 560, width: '100%', textAlign: 'center' }}>
        {isInvalid ? (
          <>
            <h1 style={{
              fontSize: 'clamp(24px, 4vw, 32px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              marginBottom: 16,
            }}>
              {t('nps_thanks', 'error_invalid')}
            </h1>
            <Link to="/" className="cb-btn cb-btn--primary">
              {t('nps_thanks', 'home')} <span className="cb-arrow">→</span>
            </Link>
          </>
        ) : (
          <>
            <div style={{
              width: 72, height: 72,
              borderRadius: 'var(--cb-radius, 16px)',
              backgroundColor: 'var(--ink)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 28px',
            }}>
              <MessageCircleHeart size={34} color={accent} />
            </div>

            <h1 style={{
              fontSize: 'clamp(28px, 5vw, 40px)',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              marginBottom: 16,
              lineHeight: 1.15,
            }}>
              {t('nps_thanks', 'title')}<span style={{ color: accent }}>.</span>
            </h1>

            <p style={{
              fontSize: 18,
              color: 'var(--graphite, #71717a)',
              marginBottom: 32,
            }}>
              {t('nps_thanks', 'score_prefix')}
              <strong style={{ color: accent, fontSize: 28 }}>{score}</strong>
              {t('nps_thanks', 'score_suffix')}
            </p>

            {state === 'sent' ? (
              <div style={{
                padding: 20,
                background: '#f0fdf4',
                border: '1px solid #16a34a',
                borderRadius: 12,
                color: '#14532d',
                marginBottom: 40,
              }}>
                {t('nps_thanks', 'thanks_after')}
              </div>
            ) : (
              <form onSubmit={submit} style={{ textAlign: 'left', marginBottom: 40 }}>
                <label htmlFor="nps-comment" style={{
                  display: 'block',
                  fontSize: 15,
                  fontWeight: 500,
                  marginBottom: 8,
                  color: 'var(--ink)',
                }}>
                  {t('nps_thanks', 'ask_comment')}
                </label>
                <textarea
                  id="nps-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t('nps_thanks', 'placeholder')}
                  rows={5}
                  maxLength={2000}
                  disabled={state === 'sending'}
                  style={{
                    width: '100%',
                    padding: 14,
                    fontSize: 15,
                    fontFamily: 'inherit',
                    border: '1px solid rgba(0,0,0,0.12)',
                    borderRadius: 12,
                    background: '#fff',
                    color: 'var(--ink)',
                    resize: 'vertical',
                    minHeight: 120,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {state === 'error' && (
                  <p style={{ color: '#dc2626', fontSize: 14, marginTop: 8 }}>
                    {t('nps_thanks', 'error_send')}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={!comment.trim() || state === 'sending'}
                  className="cb-btn cb-btn--primary"
                  style={{
                    marginTop: 16,
                    opacity: (!comment.trim() || state === 'sending') ? 0.5 : 1,
                    cursor: (!comment.trim() || state === 'sending') ? 'not-allowed' : 'pointer',
                  }}
                >
                  {state === 'sending' ? t('nps_thanks', 'submitting') : t('nps_thanks', 'submit')}
                </button>
              </form>
            )}

            <div style={{
              borderTop: '1px solid rgba(0,0,0,0.08)',
              paddingTop: 32,
              marginTop: 16,
            }}>
              <p style={{
                fontSize: 18,
                fontWeight: 600,
                marginBottom: 8,
                color: 'var(--ink)',
              }}>
                {t('nps_thanks', 'cta_title')}
              </p>
              <p style={{
                fontSize: 15,
                color: 'var(--graphite, #71717a)',
                marginBottom: 20,
              }}>
                {t('nps_thanks', 'cta_sub')}
              </p>
              <a
                href={LEMCAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="cb-btn cb-btn--primary"
              >
                {t('nps_thanks', 'cta_btn')}
              </a>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
