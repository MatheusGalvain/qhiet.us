import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const service = createServiceClient()
  const { data } = await service.from('profiles').select('is_admin').eq('id', user.id).single()
  return (data as any)?.is_admin ? user : null
}

/** GET — listar todas as categorias da biblioteca */
export async function GET() {
  const service = createServiceClient()
  const { data, error } = await service
    .from('biblioteca_categorias')
    .select('id, name, order_index')
    .order('order_index', { ascending: true })
    .order('name', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

/** POST — criar nova categoria */
export async function POST(request: NextRequest) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, order_index } = await request.json()
  const trimmed = name?.trim()
  if (!trimmed) return NextResponse.json({ error: 'Nome obrigatório.' }, { status: 400 })

  const service = createServiceClient()
  const { data, error } = await service
    .from('biblioteca_categorias')
    .insert({ name: trimmed, order_index: order_index ?? 0 })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Categoria já existe.' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}

/** PATCH — renomear ou reordenar categoria */
export async function PATCH(request: NextRequest) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, name, order_index } = await request.json()
  if (!id) return NextResponse.json({ error: 'ID obrigatório.' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (name !== undefined) updates.name = name.trim()
  if (order_index !== undefined) updates.order_index = order_index

  const service = createServiceClient()
  const { data, error } = await service
    .from('biblioteca_categorias')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

/** DELETE — remover categoria */
export async function DELETE(request: NextRequest) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório.' }, { status: 400 })

  const service = createServiceClient()
  const { error } = await service.from('biblioteca_categorias').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
