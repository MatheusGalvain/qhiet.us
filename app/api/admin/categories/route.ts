import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return data?.is_admin ? user : null
}

// GET — list all categories (admin only)
export async function GET() {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const service = createServiceClient()
  const { data } = await service.from('categories').select('*').order('sort_order')
  return NextResponse.json(data ?? [])
}

// POST — create or update category
export async function POST(request: NextRequest) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { slug, label, symbol, color, description, sort_order, tags } = body

  if (!slug || !label) return NextResponse.json({ error: 'slug e label obrigatórios' }, { status: 400 })

  const service = createServiceClient()
  const { data, error } = await service
    .from('categories')
    .upsert({
      slug,
      label,
      symbol:     symbol     || '◉',
      color:      color      || '#b02a1e',
      description,
      sort_order: sort_order ?? 99,
      tags:       tags       ?? [],
    }, { onConflict: 'slug' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE — remove category
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServiceClient()
  const { id } = params // O UUID que vem do botão

  try {
    // 1. Pegamos o slug da categoria primeiro (precisamos dele para limpar as transmissões)
    const { data: cat } = await supabase
      .from('categories')
      .select('slug')
      .eq('id', id)
      .single()

    if (!cat) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

    // 2. Limpar o slug do array de categorias nas transmissões
    // Usamos o operador 'cs' (contains) para achar quem tem esse slug no array
    const { data: transmissoes } = await supabase
      .from('transmissoes')
      .select('id, categories')
      .contains('categories', [cat.slug])

    if (transmissoes) {
      for (const t of transmissoes) {
        const newCats = t.categories.filter((s: string) => s !== cat.slug)
        await supabase
          .from('transmissoes')
          .update({ categories: newCats })
          .eq('id', t.id)
      }
    }

    // 3. Deletar a categoria
    // Graças ao SQL que rodamos acima (CASCADE), o category_content será apagado sozinho!
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}