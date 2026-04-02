import CategoryForm from '@/components/admin/CategoryForm'
import Link from 'next/link'

export default function NovaCategoriaPage() {
  return (
    <div>
      <div style={{ marginBottom: 40 }}>
        <Link href="/control/categorias" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--muted)', textDecoration: 'none' }}>
          ← Categorias
        </Link>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, letterSpacing: 2, color: 'var(--cream)', lineHeight: 1, marginTop: 12 }}>
          Nova Categoria
        </h1>
      </div>
      <CategoryForm mode="create" />
    </div>
  )
}
