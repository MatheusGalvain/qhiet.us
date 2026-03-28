import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return data?.is_admin ? user : null
}

// DELETE — remove category with cascade cleanup on transmissões
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createServiceClient()
  const { id } = params

  try {
    // 1. Get the slug first (needed to clean transmissões)
    const { data: cat } = await supabase
      .from('categories')
      .select('slug')
      .eq('id', id)
      .single()

    if (!cat) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

    // 2. Remove slug from all transmissões that reference it
    const { data: transmissoes } = await supabase
      .from('transmissoes')
      .select('id, categories')
      .contains('categories', [cat.slug])

    if (transmissoes) {
      for (const t of transmissoes) {
        const newCats = (t.categories ?? []).filter((s: string) => s !== cat.slug)
        await supabase.from('transmissoes').update({ categories: newCats }).eq('id', t.id)
      }
    }

    // 3. Delete the category (category_content cascades via FK)
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

// PATCH — toggle active/inactive
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createServiceClient()
  const { id } = params
  const body = await request.json()

  if (typeof body.active !== 'boolean') {
    return NextResponse.json({ error: 'Campo "active" (boolean) obrigatório' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('categories')
    .update({ active: body.active })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
