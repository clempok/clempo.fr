import type { CSSProperties, ReactNode } from 'react'

interface EyebrowProps {
  children: ReactNode
  tone?: 'signal' | 'ink' | 'steel' | 'mist'
  style?: CSSProperties
}

/**
 * Mono eyebrow — per Brand Book p.14 "// 01 — Market shift".
 * JetBrains Mono 500 · letter-spacing +10% · UPPERCASE.
 * Default tone is Signal green for root sections.
 */
export default function Eyebrow({ children, tone = 'signal', style }: EyebrowProps) {
  const toneClass =
    tone === 'ink' ? 'cb-eyebrow cb-eyebrow--ink'
    : tone === 'steel' ? 'cb-eyebrow cb-eyebrow--steel'
    : tone === 'mist' ? 'cb-eyebrow cb-eyebrow--mist'
    : 'cb-eyebrow'
  return <span className={toneClass} style={style}>{children}</span>
}
