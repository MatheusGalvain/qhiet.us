import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return data?.is_admin ? user : null
}

// GET — detalhes de uma trilha com suas transmissões
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createServiceClient()
  const { id } = params

  const [trailRes, txRes] = await Promise.all([
    supabase.from('trails').select('*').eq('id', id).single(),
    supabase.from('trail_transmissoes').select('*').eq('trail_id', id).order('order_index'),
  ])

  if (trailRes.error) return NextResponse.json({ error: trailRes.error.message }, { status: 404 })
  return NextResponse.json({ trail: trailRes.data, transmissoes: txRes.data ?? [] })
}

// PATCH — atualiza campos da trilha
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createServiceClient()
  const body = await request.json()
  const updates: Record<string, unknown> = {}

  if (body.title        !== undefined) updates.title         = body.title
  if (body.description  !== undefined) updates.description   = body.description
  if (body.category     !== undefined) updates.category      = body.category
  if (body.categories   !== undefined) {
    const cats = Array.isArray(body.categories) ? body.categories : [body.category ?? '']
    updates.categories = cats
    if (!updates.category) updates.category = cats[0] ?? ''
  }
  if (body.duration_days !== undefined) updates.duration_days = body.duration_days
  if (body.xp_reward    !== undefined) updates.xp_reward     = body.xp_reward
  if (body.is_published !== undefined) updates.is_published  = body.is_published
  if (body.is_free      !== undefined) updates.is_free       = body.is_free
  if (body.order_index  !== undefined) updates.order_index   = body.order_index

  const { data, error } = await supabase
    .from('trails')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE — remove trilha (cascade elimina transmissões + progresso)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createServiceClient()
  const { error } = await supabase.from('trails').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
