import { createServiceClient } from './supabase/server'

export interface CategoryInfo {
  label: string
  symbol: string
  parent_id: string | null
  parent_slug: string | null
}

export type CategoryLabelMap = Record<string, CategoryInfo>

/** Fetches all categories and returns a slug → CategoryInfo map.
 *  Uses service client to bypass RLS — safe for server-side use only. */
export async function getCategoryLabelMap(): Promise<CategoryLabelMap> {
  try {
    const service = createServiceClient()
    const { data } = await service
      .from('categories')
      .select('id, slug, label, symbol, parent_id')

    const idToSlug: Record<string, string> = {}
    for (const cat of data ?? []) {
      idToSlug[cat.id] = cat.slug
    }

    const map: CategoryLabelMap = {}
    for (const cat of data ?? []) {
      map[cat.slug] = {
        label: cat.label,
        symbol: cat.symbol,
        parent_id: cat.parent_id ?? null,
        parent_slug: cat.parent_id ? (idToSlug[cat.parent_id] ?? null) : null,
      }
    }
    return map
  } catch {
    return {}
  }
}

/** Resolves a category slug to its display label.
 *  Falls back to capitalizing the slug if not found in map. */
export function resolveCategoryLabel(slug: string, map: CategoryLabelMap): string {
  return map[slug]?.label ?? (slug.charAt(0).toUpperCase() + slug.slice(1))
}

export function resolveCategorySymbol(slug: string, map: CategoryLabelMap): string | null {
  return map[slug]?.symbol ?? null
}

/** Returns the full label chain: "Parent → Child" if parent exists, else just the label. */
export function resolveCategoryChain(slug: string, map: CategoryLabelMap): string {
  const info = map[slug]
  if (!info) return slug.charAt(0).toUpperCase() + slug.slice(1)
  if (info.parent_slug && map[info.parent_slug]) {
    return `${map[info.parent_slug].label} → ${info.label}`
  }
  return info.label
}
