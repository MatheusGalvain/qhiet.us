import { getCategorySymbol } from '@/lib/utils'
import type { Category } from '@/types'
import Link from 'next/link'

interface CategoryTagProps {
  category: Category | string
  label?: string
  linked?: boolean
}

export default function CategoryTag({ category, label, linked = false }: CategoryTagProps) {
  const sym = getCategorySymbol(category)
  const text = label ?? category.charAt(0).toUpperCase() + category.slice(1)

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
