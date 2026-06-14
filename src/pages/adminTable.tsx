import { useState, useRef, useEffect, type ReactNode, type CSSProperties } from 'react'

const ACCENT = '#0A0A0B'

/* ──────────────────────────────────────────────────────────────────────────
   Tri réutilisable
   ────────────────────────────────────────────────────────────────────────── */

export type SortDir = 'asc' | 'desc'
export interface SortState { key: string | null; dir: SortDir }

/** Hook de tri : clic 1 → asc, clic 2 → desc, clic 3 → reset. */
export function useSort(initial: SortState = { key: null, dir: 'asc' }) {
  const [sort, setSort] = useState<SortState>(initial)
  const toggle = (key: string) =>
    setSort(s =>
      s.key !== key
        ? { key, dir: 'asc' }
        : s.dir === 'asc'
          ? { key, dir: 'desc' }
          : { key: null, dir: 'asc' },
    )
  return { sort, toggle, setSort }
}

type SortValue = string | number | null | undefined

/** Trie `rows` selon l'accesseur de la colonne active. Nulls en dernier. */
export function sortRows<T>(
  rows: T[],
  sort: SortState,
  accessors: Record<string, (row: T) => SortValue>,
): T[] {
  if (!sort.key) return rows
  const acc = accessors[sort.key]
  if (!acc) return rows
  const dir = sort.dir === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const av = acc(a)
    const bv = acc(b)
    const an = av === null || av === undefined
    const bn = bv === null || bv === undefined
    if (an && bn) return 0
    if (an) return 1 // nulls toujours en dernier
    if (bn) return -1
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
    return String(av).localeCompare(String(bv), 'fr', { numeric: true }) * dir
  })
}

/* ──────────────────────────────────────────────────────────────────────────
   Popover de filtre (position: fixed → échappe aux conteneurs overflow:hidden)
   ────────────────────────────────────────────────────────────────────────── */

function FilterPopover({ active, children }: { active: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const place = () => {
      const r = btnRef.current?.getBoundingClientRect()
      if (r) setPos({ top: r.bottom + 6, left: Math.max(8, r.right - 220) })
    }
    place()
    const onDown = (e: MouseEvent) => {
      if (
        !panelRef.current?.contains(e.target as Node) &&
        !btnRef.current?.contains(e.target as Node)
      ) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open])

  return (
    <>
      <button
        ref={btnRef}
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        title="Filtrer"
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 18, height: 18, padding: 0, marginLeft: 4,
          border: 'none', borderRadius: 4, cursor: 'pointer', flexShrink: 0,
          background: active ? ACCENT : 'transparent',
          color: active ? '#fff' : '#bbb', lineHeight: 1,
        }}
      >
        {/* funnel */}
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1.5 2.5h13l-5 6v5l-3 1.5v-6.5z" />
        </svg>
      </button>
      {open && pos && (
        <div
          ref={panelRef}
          onClick={e => e.stopPropagation()}
          style={{
            position: 'fixed', top: pos.top, left: pos.left, zIndex: 1000,
            width: 220, padding: '0.6rem', background: '#fff',
            border: '1px solid #e5e5e5', borderRadius: 10,
            boxShadow: '0 8px 28px rgba(0,0,0,0.12)',
            textTransform: 'none', letterSpacing: 'normal', fontWeight: 400,
          }}
        >
          {children}
        </div>
      )}
    </>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   En-tête de colonne : libellé cliquable (tri) + icône filtre optionnelle
   ────────────────────────────────────────────────────────────────────────── */

export function Th({
  label, thStyle, align = 'left', sortKey, sort, onSort, filterActive, filter,
}: {
  label: ReactNode
  thStyle: CSSProperties
  align?: 'left' | 'right' | 'center'
  sortKey?: string
  sort?: SortState
  onSort?: (key: string) => void
  filterActive?: boolean
  filter?: ReactNode
}) {
  const sortable = !!sortKey && !!onSort
  const isActive = sort?.key === sortKey
  const arrow = !isActive ? '↕' : sort?.dir === 'asc' ? '↑' : '↓'
  const justify = align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start'

  return (
    <th style={{ ...thStyle, textAlign: align }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, justifyContent: justify }}>
        <span
          onClick={sortable ? () => onSort!(sortKey!) : undefined}
          style={{
            cursor: sortable ? 'pointer' : 'default',
            userSelect: 'none', display: 'inline-flex', alignItems: 'center', gap: 4,
          }}
        >
          {label}
          {sortable && (
            <span style={{ fontSize: '0.85em', color: isActive ? ACCENT : '#ccc', fontWeight: 700 }}>{arrow}</span>
          )}
        </span>
        {filter && <FilterPopover active={!!filterActive}>{filter}</FilterPopover>}
      </span>
    </th>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Corps de filtres réutilisables (à passer dans la prop `filter` de <Th>)
   ────────────────────────────────────────────────────────────────────────── */

/** Recherche texte. */
export function FilterSearch({
  value, onChange, placeholder = 'Rechercher…',
}: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      autoFocus
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', boxSizing: 'border-box', padding: '0.4rem 0.55rem',
        border: '1px solid #e0e0e0', borderRadius: 7, fontSize: '0.8rem', color: '#222',
      }}
    />
  )
}

/** Liste de choix (radio) — pour les filtres énumérés / booléens. */
export function FilterChoices({
  value, onChange, options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {options.map(o => {
        const sel = o.value === value
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
              padding: '0.4rem 0.55rem', border: 'none', borderRadius: 7, cursor: 'pointer',
              background: sel ? '#f3f3f3' : 'transparent',
              color: sel ? ACCENT : '#444', fontSize: '0.8rem', fontWeight: sel ? 600 : 400,
            }}
          >
            <span style={{
              width: 13, height: 13, borderRadius: '50%', flexShrink: 0,
              border: `1px solid ${sel ? ACCENT : '#ccc'}`,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {sel && <span style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT }} />}
            </span>
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
