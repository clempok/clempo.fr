import type { CSSProperties } from 'react'

interface WordmarkProps {
  size?: number | string
  color?: string
  as?: 'span' | 'div'
  style?: CSSProperties
}

/**
 * clempo. wordmark — Inter 700 lowercase, letter-spacing -0.05em, Signal Green dot.
 * Per Brand Book V1 · 2026, p.05-06.
 * - Jamais de capitale. Jamais un point d'une autre couleur que Signal Green.
 * - Monogramme "c." réservé aux favicons / avatars.
 */
export default function Wordmark({ size = '1rem', color, as: Tag = 'span', style }: WordmarkProps) {
  const fontSize = typeof size === 'number' ? `${size}px` : size
  return (
    <Tag
      className="cb-wordmark"
      style={{ fontSize, color: color ?? 'inherit', ...style }}
      aria-label="clempo"
    >
      clempo
    </Tag>
  )
}
