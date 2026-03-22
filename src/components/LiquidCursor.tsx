import { useEffect, useRef } from 'react'

export default function LiquidCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    let ringX = 0, ringY = 0, mx = 0, my = 0
    let raf: number

    const onMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY
      dot.style.left = e.clientX + 'px'
      dot.style.top = e.clientY + 'px'
      const isHoverable = !!(e.target as HTMLElement).closest('a, button, [data-hover]')
      ring.classList.toggle('hovering', isHoverable)
    }

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    const animate = () => {
      ringX = lerp(ringX, mx, 0.12)
      ringY = lerp(ringY, my, 0.12)
      ring.style.left = ringX + 'px'
      ring.style.top = ringY + 'px'
      raf = requestAnimationFrame(animate)
    }

    document.addEventListener('mousemove', onMove)
    raf = requestAnimationFrame(animate)
    return () => {
      document.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      <div ref={dotRef} className="cursor-dot" />
      <div ref={ringRef} className="cursor-ring" />
    </>
  )
}
