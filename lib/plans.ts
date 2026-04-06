/* ═══════════════════════════════════════
   QHIETHUS — Planos e Lógica de Acesso
═══════════════════════════════════════ */

export type Plan = 'profano' | 'iniciado' | 'adepto' | 'acervo'

export const PLAN_FEATURES = {
  profano: {
    transmissoes_livres:     true,
    transmissoes_exclusivas: false,
    quiz_completo:           false,
    xp_completo:             false,
    rank_global:             false,
    trilhas:                 false,
    grimorio:                false,
    badges:                  false,
    acervo:                  false,
  },
  iniciado: {
    transmissoes_livres:     true,
    transmissoes_exclusivas: true,
    quiz_completo:           true,
    xp_completo:             true,
    rank_global:             true,
    trilhas:                 true,
    grimorio:                true,
    badges:                  true,
    acervo:                  false,
  },
  adepto: {
    transmissoes_livres:     true,
    transmissoes_exclusivas: true,
    quiz_completo:           true,
    xp_completo:             true,
    rank_global:             true,
    trilhas:                 true,
    grimorio:                true,
    badges:                  true,
    acervo:                  true,
  },
  acervo: {
    transmissoes_livres:     true,
    transmissoes_exclusivas: false,
    quiz_completo:           false,
    xp_completo:             false,
    rank_global:             false,
    trilhas:                 false,
    grimorio:                false,
    badges:                  false,
    acervo:                  true,
  },
} as const

export type PlanFeature = keyof typeof PLAN_FEATURES.profano

/** Check access for a single plan (backward compat) */
export function canAccess(plan: Plan | null | undefined, feature: PlanFeature): boolean {
  const p = plan ?? 'profano'
  return PLAN_FEATURES[p]?.[feature] ?? false
}

/**
 * Check access across MULTIPLE active plans.
 * Use this when a user may hold e.g. ['acervo', 'iniciado'] simultaneously.
 * Returns true if ANY of the plans grants the feature.
 */
export function canAccessAny(plans: string[] | null | undefined, feature: PlanFeature): boolean {
  if (!plans || plans.length === 0) return false
  return plans.some(p => PLAN_FEATURES[p as Plan]?.[feature] ?? false)
}

/**
 * Normalise the plans array from the database.
 * Falls back to deriving from the legacy `plan` column if `plans` is empty.
 */
export function resolvePlans(
  plansArr: string[] | null | undefined,
  legacyPlan: Plan | null | undefined,
): Plan[] {
  if (plansArr && plansArr.length > 0) {
    return plansArr.filter(p => p in PLAN_FEATURES) as Plan[]
  }
  const p = legacyPlan ?? 'profano'
  return p === 'profano' ? [] : [p]
}

/**
 * Given an active plans array, compute the new array after adding a new plan.
 * - Adding 'adepto' replaces everything with just ['adepto'] (superset).
 * - Adding 'iniciado' or 'acervo' when already having both → upgrade hint only.
 * - Otherwise append the new plan without duplicates.
 */
export function addPlan(existing: Plan[], newPlan: Plan): Plan[] {
  if (newPlan === 'adepto') return ['adepto']
  const merged = Array.from(new Set([...existing, newPlan])).filter(p => p !== 'profano') as Plan[]
  return merged
}

/** Returns true if plan is any paid plan */
export function isPaid(plan: Plan | null | undefined): boolean {
  return plan === 'iniciado' || plan === 'adepto' || plan === 'acervo'
}

/** Returns true if plan has full subscriber access (iniciado or adepto) */
export function isSubscriber(plan: Plan | null | undefined): boolean {
  return plan === 'iniciado' || plan === 'adepto'
}

/** Visual metadata for each plan badge */
export const PLAN_META: Record<Plan, {
  label: string
  symbol: string
  color: string
  border: string
  bg: string
  /** Short subtitle shown in profile badges */
  tagline: string
  /** Extended description shown on hover or in badge card */
  description: string
  /** Glow CSS for animated ring (use in box-shadow) */
  glow: string
}> = {
  profano: {
    label:       'PROFANO',
    symbol:      '○',
    color:       'var(--muted)',
    border:      'var(--faint)',
    bg:          'transparent',
    tagline:     'Diante do Véu',
    description: 'O buscador que ainda observa de longe. A jornada aguarda.',
    glow:        'none',
  },
  iniciado: {
    label:       'INICIADO',
    symbol:      '◈',
    color:       'var(--red)',
    border:      'var(--red-dim)',
    bg:          'transparent',
    tagline:     'O Véu foi rasgado',
    description: 'Acesso às transmissões exclusivas, trilhas e grimório. O fogo interior desperta.',
    glow:        '0 0 14px rgba(180, 30, 20, 0.25)',
  },
  adepto: {
    label:       'ADEPTO',
    symbol:      '✦',
    color:       'var(--gold)',
    border:      'var(--gold-dim)',
    bg:          'transparent',
    tagline:     'Portador da Chave de Ouro',
    description: 'Acesso total à plataforma — transmissões, trilhas, grimório e acervo completo.',
    glow:        '0 0 18px rgba(212, 175, 55, 0.30)',
  },
  acervo: {
    label:       'ACERVO',
    symbol:      '◉',
    color:       '#b8a07a',
    border:      'rgba(184, 160, 122, 0.35)',
    bg:          'transparent',
    tagline:     'Guardião do Acervo',
    description: 'Acesso exclusivo à Biblioteca Oculta — obras raras do esoterismo ocidental.',
    glow:        '0 0 14px rgba(184, 160, 122, 0.22)',
  },
}

/** Which Stripe price maps to which plan */
export const PRICE_TO_PLAN: Record<string, Plan> = {
  [process.env.STRIPE_PRICE_ID_INICIADO ?? '']: 'iniciado',
  [process.env.STRIPE_PRICE_ID_ADEPTO   ?? '']: 'adepto',
  [process.env.STRIPE_PRICE_ID_ACERVO   ?? '']: 'acervo',
}

/** Returns the upgrade suggestion for the current plan */
export function getUpgradePlan(plan: Plan): Plan | null {
  switch (plan) {
    case 'profano':  return 'iniciado'
    case 'iniciado': return 'adepto'
    case 'acervo':   return 'adepto'
    case 'adepto':   return null
  }
}
