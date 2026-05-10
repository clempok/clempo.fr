import { useEffect, useRef, useState } from 'react'

export interface BarChartRaceData {
  months: string[]
  monthly_data: Record<string, Record<string, number>>
  all_progiciels: string[]
  top10?: Array<Array<[string, number]>>
}

interface Props {
  data: BarChartRaceData
}

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

// Frames d'interpolation entre deux mois (animation fluide)
const FRAMES_PER_MONTH = 30

// Palette curatée — assignée déterministiquement par hash du nom d'éditeur
// pour que chaque éditeur ait une couleur stable et distincte d'une page à l'autre.
const COLOR_PALETTE = [
  '#1f3864', // navy
  '#0a9396', // teal
  '#ee9b00', // amber
  '#bb3e03', // burnt orange
  '#9b2226', // brick red
  '#5f0f40', // burgundy
  '#005f73', // dark cyan
  '#6a994e', // olive
  '#7209b7', // violet
  '#3a0ca3', // indigo
  '#b5179e', // magenta
  '#0f4c5c', // deep teal
  '#94d2bd', // sage
  '#a98467', // taupe
  '#bc6c25', // copper
  '#4f6da6', // steel blue
  '#dda15e', // tan
  '#560bad', // dark violet
  '#386641', // forest green
  '#d62828', // bright red
  '#588157', // moss green
  '#8338ec', // electric purple
  '#3a86ff', // azure
  '#fb5607', // orange
  '#06a77d', // emerald
  '#5e503f', // brown
  '#22577a', // dark blue
  '#264653', // dark slate
  '#e76f51', // coral
  '#2a9d8f', // sea green
]
const AUTRES_COLOR = '#B8BCC4'

// FNV-1a 32-bit hash for stable color assignment
function hashString(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h
}

function getColor(label: string): string {
  if (label.includes('Autres')) return AUTRES_COLOR
  const parts = label.split(' — ')
  // Hash on the EDITOR ONLY so all products from the same editor share a color
  // — useful at a glance to see editors with multiple products in the top 10
  // (e.g. Cegedim, Sofia Développement).
  const key = parts[1] || label
  return COLOR_PALETTE[hashString(key) % COLOR_PALETTE.length]
}

function parseLabel(label: string): { progiciel: string; editor: string } {
  const parts = label.split(' — ')
  return { progiciel: parts[0] || label, editor: parts[1] || '' }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

interface Frame {
  bars: [string, number][]
  monthLabel: string
}

export default function BarChartRace({ data }: Props) {
  const chartRef = useRef<HTMLDivElement | null>(null)
  const barElementsRef = useRef<Map<string, HTMLDivElement>>(new Map())
  const stateRef = useRef({
    isPlaying: false,
    currentMonthIndex: 0,
    currentSubFrame: 0,
    monthDuration: 700,
    lastFrameTime: 0,
    rafId: 0,
  })

  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [monthLabel, setMonthLabel] = useState(data.months[0])
  const [speed, setSpeed] = useState(700)

  const ROW_HEIGHT = 50
  const ROW_GAP = 4
  // Responsive label/value sizing — the chart layout is "label | bar | value%"
  // and on mobile (~375px wide) a 240px label leaves no room for the bar.
  // Compute these dynamically from the chart's actual width.
  function getLayout(chartWidth: number) {
    if (chartWidth < 480) return { LABEL_WIDTH: 110, VALUE_PADDING: 44 }
    if (chartWidth < 720) return { LABEL_WIDTH: 160, VALUE_PADDING: 52 }
    return { LABEL_WIDTH: 240, VALUE_PADDING: 60 }
  }

  function buildFrame(monthIndex: number, subFrame: number): Frame {
    const months = data.months
    const monthly = data.monthly_data
    const progiciels = data.all_progiciels

    const idx0 = monthIndex
    const idx1 = Math.min(monthIndex + 1, months.length - 1)
    const t = subFrame / FRAMES_PER_MONTH

    const m0 = monthly[months[idx0]] || {}
    const m1 = monthly[months[idx1]] || {}

    const interp: Record<string, number> = {}
    progiciels.forEach(p => {
      const v0 = m0[p] || 0
      const v1 = m1[p] || 0
      interp[p] = lerp(v0, v1, t)
    })

    const bars = (Object.entries(interp) as [string, number][])
      .filter(([, v]) => v > 0.05)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    return { bars, monthLabel: months[idx0] }
  }

  function renderFrame(frame: Frame, chartWidth: number) {
    const chartEl = chartRef.current
    if (!chartEl) return
    const { bars, monthLabel: ml } = frame
    setMonthLabel(ml)

    const { LABEL_WIDTH, VALUE_PADDING } = getLayout(chartWidth)
    const maxVal = Math.max(...bars.map(b => b[1]), 5)
    const activeKeys = new Set(bars.map(b => b[0]))

    bars.forEach(([key, val], rank) => {
      let el = barElementsRef.current.get(key)
      if (!el) {
        el = document.createElement('div')
        el.className = 'bcr-row'
        const labelDiv = document.createElement('div')
        labelDiv.className = 'bcr-label'
        const barDiv = document.createElement('div')
        barDiv.className = 'bcr-bar'
        const valOutside = document.createElement('div')
        valOutside.className = 'bcr-value-outside'
        el.appendChild(labelDiv)
        el.appendChild(barDiv)
        el.appendChild(valOutside)
        chartEl.appendChild(el)
        barElementsRef.current.set(key, el)
      }

      const { progiciel, editor } = parseLabel(key)
      const labelDiv = el.children[0] as HTMLDivElement
      const barDiv = el.children[1] as HTMLDivElement
      const valOutside = el.children[2] as HTMLDivElement

      labelDiv.style.width = (LABEL_WIDTH - 12) + 'px'
      labelDiv.innerHTML = `<div><div class="bcr-progiciel">${progiciel}</div><div class="bcr-editor">${editor}</div></div>`
      const color = getColor(key)
      barDiv.style.background = color
      barDiv.style.left = LABEL_WIDTH + 'px'
      const widthPx = (val / maxVal) * (chartWidth - LABEL_WIDTH - VALUE_PADDING)
      barDiv.style.width = Math.max(widthPx, 0) + 'px'
      const valueText = val.toFixed(1) + '%'
      const fitsInside = widthPx >= 48
      barDiv.textContent = fitsInside ? valueText : ''
      valOutside.textContent = fitsInside ? '' : valueText
      valOutside.style.left = (LABEL_WIDTH + Math.max(widthPx, 0) + 2) + 'px'

      el.style.transform = `translateY(${rank * (ROW_HEIGHT + ROW_GAP)}px)`
      el.style.opacity = '1'
    })

    barElementsRef.current.forEach((el, key) => {
      if (!activeKeys.has(key)) {
        el.style.opacity = '0'
        el.style.transform = `translateY(${10 * (ROW_HEIGHT + ROW_GAP)}px)`
      }
    })
  }

  function loop(now: number) {
    const s = stateRef.current
    if (!s.isPlaying) return
    if (!s.lastFrameTime) s.lastFrameTime = now
    const dt = now - s.lastFrameTime
    s.lastFrameTime = now

    const totalMonths = data.months.length
    const subFramesPerMs = FRAMES_PER_MONTH / s.monthDuration
    s.currentSubFrame += dt * subFramesPerMs

    while (s.currentSubFrame >= FRAMES_PER_MONTH) {
      s.currentSubFrame -= FRAMES_PER_MONTH
      s.currentMonthIndex++
      if (s.currentMonthIndex >= totalMonths - 1) {
        s.currentMonthIndex = totalMonths - 1
        s.currentSubFrame = 0
        s.isPlaying = false
        setIsPlaying(false)
      }
    }

    const chartEl = chartRef.current
    const chartWidth = chartEl ? chartEl.offsetWidth : 800
    renderFrame(buildFrame(s.currentMonthIndex, s.currentSubFrame), chartWidth)

    const p = (s.currentMonthIndex + s.currentSubFrame / FRAMES_PER_MONTH) / (totalMonths - 1)
    setProgress(p * 100)

    if (s.isPlaying) {
      s.rafId = requestAnimationFrame(loop)
    }
  }

  function play() {
    const s = stateRef.current
    if (s.currentMonthIndex >= data.months.length - 1) {
      s.currentMonthIndex = 0
      s.currentSubFrame = 0
    }
    s.isPlaying = true
    s.lastFrameTime = 0
    setIsPlaying(true)
    s.rafId = requestAnimationFrame(loop)
  }

  function pause() {
    const s = stateRef.current
    s.isPlaying = false
    if (s.rafId) cancelAnimationFrame(s.rafId)
    setIsPlaying(false)
  }

  function restart() {
    pause()
    const s = stateRef.current
    s.currentMonthIndex = 0
    s.currentSubFrame = 0
    const chartEl = chartRef.current
    if (chartEl) {
      renderFrame(buildFrame(0, 0), chartEl.offsetWidth)
    }
    setProgress(0)
  }

  function handleProgressClick(e: React.MouseEvent<HTMLDivElement>) {
    pause()
    const target = e.currentTarget
    const rect = target.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const totalMonths = data.months.length
    const exact = ratio * (totalMonths - 1)
    const s = stateRef.current
    s.currentMonthIndex = Math.floor(exact)
    s.currentSubFrame = (exact - s.currentMonthIndex) * FRAMES_PER_MONTH
    const chartEl = chartRef.current
    if (chartEl) {
      renderFrame(buildFrame(s.currentMonthIndex, s.currentSubFrame), chartEl.offsetWidth)
    }
    setProgress(ratio * 100)
  }

  useEffect(() => {
    stateRef.current.monthDuration = speed
  }, [speed])

  // Reset when data changes (specialty switch)
  useEffect(() => {
    pause()
    const chartEl = chartRef.current
    if (!chartEl) return
    // Clear existing bars
    barElementsRef.current.forEach(el => el.remove())
    barElementsRef.current.clear()
    const s = stateRef.current
    s.currentMonthIndex = 0
    s.currentSubFrame = 0
    setProgress(0)
    renderFrame(buildFrame(0, 0), chartEl.offsetWidth)
    // Auto-play after a short delay so the user sees the start state first
    const timer = setTimeout(() => {
      play()
    }, 600)
    return () => {
      clearTimeout(timer)
      pause()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  // Resize handler
  useEffect(() => {
    function onResize() {
      const chartEl = chartRef.current
      if (!chartEl) return
      const s = stateRef.current
      renderFrame(buildFrame(s.currentMonthIndex, s.currentSubFrame), chartEl.offsetWidth)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [yyyy, mm] = monthLabel.split('-')
  const monthName = MONTH_NAMES[parseInt(mm, 10) - 1] || ''
  const totalMonths = data.months.length

  return (
    <div className="bcr-container">
      <style>{`
        .bcr-container { font-family: var(--font-sans); color: var(--ink); }
        .bcr-header-row {
          display: flex; justify-content: space-between; align-items: flex-end;
          margin-bottom: 1.25rem; padding-bottom: 1rem;
          border-bottom: 1px solid rgba(10,10,11,0.08);
        }
        .bcr-month-label {
          font-family: var(--font-sans);
          font-size: clamp(2.4rem, 5vw, 3.6rem);
          font-weight: 800; letter-spacing: -0.04em; line-height: 1;
          color: var(--ink); font-variant-numeric: tabular-nums;
        }
        .bcr-month-name { font-weight: 600; color: var(--steel); margin-right: 0.5rem; }
        .bcr-meta {
          text-align: right; color: var(--steel);
          font-family: var(--font-mono); font-size: 0.7rem;
          letter-spacing: 0.08em; text-transform: uppercase;
        }
        .bcr-meta-frame {
          font-size: 0.95rem; color: var(--ink); font-weight: 600;
          font-family: var(--font-mono); font-variant-numeric: tabular-nums;
          letter-spacing: 0.04em; text-transform: none; margin-top: 0.25rem;
        }
        .bcr-chart {
          position: relative;
          height: ${10 * (ROW_HEIGHT + ROW_GAP)}px;
          overflow: hidden;
        }
        .bcr-row {
          position: absolute; left: 0; right: 0;
          height: ${ROW_HEIGHT}px;
          transition: transform 250ms ease-out, opacity 250ms ease-out;
          will-change: transform;
        }
        .bcr-label {
          position: absolute; left: 0;
          height: 100%;
          display: flex; align-items: center; justify-content: flex-end;
          padding-right: 12px;
          font-family: var(--font-sans);
          font-size: 0.78rem; font-weight: 600;
          color: var(--ink); text-align: right; line-height: 1.2;
          overflow: hidden;
        }
        .bcr-label > div { width: 100%; min-width: 0; }
        .bcr-progiciel {
          font-weight: 600; color: var(--ink); font-size: 0.78rem;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .bcr-editor {
          color: var(--steel); font-weight: 400; font-size: 0.65rem;
          margin-top: 0.1rem; font-family: var(--font-mono); letter-spacing: 0.02em;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .bcr-bar {
          position: absolute;
          height: 100%;
          border-radius: 3px;
          transition: width 250ms ease-out;
          display: flex; align-items: center; justify-content: flex-end;
          padding-right: 0.6rem;
          color: white; font-weight: 700; font-size: 0.78rem;
          font-family: var(--font-mono); font-variant-numeric: tabular-nums;
        }
        .bcr-value-outside {
          position: absolute; height: 100%;
          display: flex; align-items: center; padding-left: 0.5rem;
          font-weight: 600; font-size: 0.78rem;
          color: var(--graphite);
          font-family: var(--font-mono); font-variant-numeric: tabular-nums;
          transition: left 250ms ease-out;
        }
        .bcr-controls {
          margin-top: 1.5rem; display: flex; align-items: center; gap: 1rem;
          flex-wrap: wrap;
        }
        .bcr-btn {
          background: var(--ink); color: var(--paper);
          border: none; padding: 0.6rem 1rem; border-radius: var(--cb-radius);
          font-family: var(--font-mono); font-size: 0.72rem; font-weight: 500;
          letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer;
          transition: background 0.2s, transform 0.1s;
        }
        .bcr-btn:hover { background: var(--graphite); }
        .bcr-btn:active { transform: scale(0.98); }
        .bcr-btn--secondary { background: transparent; color: var(--ink); border: 1px solid rgba(10,10,11,0.2); }
        .bcr-btn--secondary:hover { background: var(--paper-soft); border-color: var(--ink); }
        .bcr-speed { display: flex; align-items: center; gap: 0.5rem; }
        .bcr-speed-label {
          font-family: var(--font-mono); font-size: 0.7rem;
          color: var(--steel); letter-spacing: 0.06em; text-transform: uppercase;
        }
        .bcr-speed select {
          padding: 0.5rem 0.7rem;
          border: 1px solid rgba(10,10,11,0.2);
          border-radius: var(--cb-radius);
          font-family: var(--font-mono); font-size: 0.72rem;
          background: var(--paper);
          color: var(--ink);
          cursor: pointer;
        }
        .bcr-progress {
          flex: 1; min-width: 200px; height: 4px;
          background: rgba(10,10,11,0.08); border-radius: 2px; cursor: pointer;
          position: relative;
        }
        .bcr-progress-bar {
          height: 100%; background: var(--ink); border-radius: 2px;
          transition: width 100ms linear;
        }
        @media (max-width: 640px) {
          .bcr-label { padding-right: 8px; }
          .bcr-progiciel { font-size: 0.72rem; line-height: 1.15; }
          .bcr-editor { font-size: 0.56rem; }
          .bcr-bar { font-size: 0.7rem; padding-right: 0.4rem; }
          .bcr-value-outside { font-size: 0.68rem; padding-left: 0.3rem; }
        }
        @media (max-width: 480px) {
          .bcr-progiciel { font-size: 0.68rem; }
          .bcr-editor { font-size: 0.52rem; }
        }
      `}</style>

      <div className="bcr-header-row">
        <div className="bcr-month-label">
          <span className="bcr-month-name">{monthName}</span>
          <span>{yyyy}</span>
        </div>
        <div className="bcr-meta">
          <div>Mois</div>
          <div className="bcr-meta-frame">
            {Math.floor(progress / 100 * (totalMonths - 1)) + 1} / {totalMonths}
          </div>
        </div>
      </div>

      <div ref={chartRef} className="bcr-chart" />

      <div className="bcr-controls">
        <button className="bcr-btn" onClick={() => isPlaying ? pause() : play()}>
          {isPlaying ? '⏸ Pause' : '▶ Lecture'}
        </button>
        <button className="bcr-btn bcr-btn--secondary" onClick={restart}>↺ Recommencer</button>
        <div className="bcr-speed">
          <span className="bcr-speed-label">Vitesse</span>
          <select value={speed} onChange={e => setSpeed(parseInt(e.target.value, 10))}>
            <option value="1500">Lente</option>
            <option value="700">Normale</option>
            <option value="350">Rapide</option>
            <option value="150">Très rapide</option>
          </select>
        </div>
        <div className="bcr-progress" onClick={handleProgressClick}>
          <div className="bcr-progress-bar" style={{ width: progress + '%' }} />
        </div>
      </div>
    </div>
  )
}
