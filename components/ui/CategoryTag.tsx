import { getCategorySymbol } from '@/lib/utils'
import type { Category } from '@/types'
import type { CategoryLabelMap } from '@/lib/getCategoryLabelMap'
import { resolveCategoryLabel, resolveCategorySymbol } from '@/lib/getCategoryLabelMap'
import Link from 'next/link'

interface CategoryTagProps {
  category: Category | string
  label?: string
  linked?: boolean
  labelMap?: CategoryLabelMap
}

export default function CategoryTag({ category, label, linked = false, labelMap = {} }: CategoryTagProps) {
  const sym = resolveCategorySymbol(category as string, labelMap) ?? getCategorySymbol(category)
  const text = label ?? resolveCategoryLabel(category as string, labelMap)

  const inner = (
    <span className="cat-tag-inline">
      <span className="cat-sym">{sym}</span>
      {text}
    </span>
  )

  if (linked) {
    return (
      <Link href={`/categorias/${category}`} style={{ textDecoration: 'none' }}>
        {inner}
      </Link>
    )
  }

  return inner
}
