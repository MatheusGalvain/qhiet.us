/* ═══════════════════════════════════════
   QHIETHUS — Global Types
═══════════════════════════════════════ */

export type Plan = 'profano' | 'iniciado'

export type AccessLevel = 'free' | 'locked'

export type Category =
  | 'hermetismo'
  | 'cabala'
  | 'gnosticismo'
  | 'alquimia'
  | 'tarot'
  | 'rosacruz'

export const CATEGORY_META: Record<Category, { label: string; symbol: string; slug: string }> = {
  hermetismo:  { label: 'Hermetismo',  symbol: '☿', slug: 'hermetismo' },
  cabala:      { label: 'Cabala',      symbol: '✡', slug: 'cabala' },
  gnosticismo: { label: 'Gnosticismo', symbol: '⊕', slug: 'gnosticismo' },
  alquimia:    { label: 'Alquimia',    symbol: '☽', slug: 'alquimia' },
  tarot:       { label: 'Tarot',       symbol: '⊗', slug: 'tarot' },
  rosacruz:    { label: 'Rosacruz',    symbol: '△', slug: 'rosacruz' },
}

/* ─── User / Profile ─── */
export interface Profile {
  id: string
  email: string
  name: string
  plan: Plan
  is_subscriber: boolean
  is_admin: boolean
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  xp_total: number
  xp_by_domain: Record<Category, number>
  rank: string
  created_at: string
}

/* ─── Transmissão (Article) ─── */
export type TransmissaoStatus = 'draft' | 'published'

export interface Transmissao {
  id: string
  slug: string
  number: number
  title: string
  excerpt: string
  content: string          // MDX / rich text
  categories: Category[]
  access: AccessLevel
  status: TransmissaoStatus
  read_time_minutes: number
  xp_reward: number
  published_at: string
  created_at: string
}

/* ─── Quiz ─── */
export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correct_index: number
  explanation: string
}

export interface Quiz {
  transmissao_id: string
  questions: QuizQuestion[]
  xp_reward: number
}

/* ─── XP / Rank ─── */
export interface XPEvent {
  id: string
  user_id: string
  transmissao_id: string | null
  type: 'reading' | 'quiz'
  xp: number
  created_at: string
}

export const RANK_THRESHOLDS = [
  { name: 'Profano',      symbol: '○', min: 0 },
  { name: 'Neófito',      symbol: '◎', min: 100 },
  { name: 'Zelador',      symbol: '◉', min: 300 },
  { name: 'Teórico',      symbol: '◈', min: 600 },
  { name: 'Practicus',    symbol: '◇', min: 1000 },
  { name: 'Philosophus',  symbol: '◆', min: 1800 },
  { name: 'Adeptus',      symbol: '✦', min: 3000 },
  { name: 'Magister',     symbol: '★', min: 5000 },
] as const

export function getRank(xp: number) {
  const ranks = [...RANK_THRESHOLDS].reverse()
  return ranks.find(r => xp >= r.min) ?? RANK_THRESHOLDS[0]
}

export function getNextRank(xp: number) {
  const idx = RANK_THRESHOLDS.findIndex(r => r.min > xp)
  return idx === -1 ? null : RANK_THRESHOLDS[idx]
}

/* ─── Monthly Book ─── */
export interface MonthlyBook {
  id: string
  month: string           // e.g. "2026-03"
  title: string
  author: string
  plan_access: Plan[]     // which plans receive it
  file_url: string        // Supabase Storage URL
  sent_at: string | null
}

/* ─── Admin ─── */
export interface AdminStats {
  total_users: number
  total_subscribers: number
  total_transmissoes: number
  total_xp_awarded: number
}
