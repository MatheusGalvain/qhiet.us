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

/** Format date to Portuguese short format */
export function formatDatePT(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
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

/** Estimate read time from content length */
export function estimateReadTime(content: string): number {
  const words = content.trim().split(/\s+/).length
  return Math.ceil(words / 200) // avg 200 wpm
}
