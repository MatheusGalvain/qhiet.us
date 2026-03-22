import { clsx, type ClassValue } from 'clsx'
import type { Category } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

/** Get initials from full name for avatar */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('')
}

/** Format date to Portuguese short format — uses UTC to stay consistent
 *  between server (Node.js) and client (browser) and avoid hydration mismatch */
const PT_MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun',
                   'jul', 'ago', 'set', 'out', 'nov', 'dez']
export function formatDatePT(dateString: string): string {
  if (!dateString) return '—'
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return '—'
  const day   = String(d.getUTCDate()).padStart(2, '0')
  const month = PT_MONTHS[d.getUTCMonth()]
  const year  = d.getUTCFullYear()
  return `${day} ${month} ${year}`
}

/** Zero-pad transmissão number */
export function padNumber(n: number, digits = 3): string {
  return String(n).padStart(digits, '0')
}

/** Category symbol lookup */
const CAT_SYMBOLS: Record<string, string> = {
  hermetismo:  '☿',
  cabala:      '✡',
  gnosticismo: '⊕',
  alquimia:    '☽',
  tarot:       '⊗',
  rosacruz:    '△',
}

export function getCategorySymbol(cat: Category | string): string {
  return CAT_SYMBOLS[cat] ?? '◉'
}

/** Format integer with thousands separator — deterministic on server + client */
export function formatNumber(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/** Estimate read time from content length */
export function estimateReadTime(content: string): number {
  const words = content.trim().split(/\s+/).length
  return Math.ceil(words / 200) // avg 200 wpm
}

export const RANK_THRESHOLDS = [
  { name: 'Profano', min: 0, symbol: 'I' },
  { name: 'Neófito', min: 500, symbol: 'II' },
  { name: 'Iniciado', min: 2000, symbol: 'III' },
  { name: 'Adepto', min: 5000, symbol: 'IV' },
  { name: 'Mestre', min: 10000, symbol: 'V' },
]

export function getRank(xp: number) {
  return [...RANK_THRESHOLDS].reverse().find(r => xp >= r.min) || RANK_THRESHOLDS[0]
}

export function getNextRank(xp: number) {
  return RANK_THRESHOLDS.find(r => xp < r.min) || null
}
