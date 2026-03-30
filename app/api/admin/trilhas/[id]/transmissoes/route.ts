import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return data?.is_admin ? user : null
}

// POST — adiciona transmissão à trilha
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createServiceClient()
  const body = await request.json()

  // Pega o maior order_index atual para auto-incrementar
  const { data: last } = await supabase
    .from('trail_transmissoes')
    .select('order_index')
    .eq('trail_id', params.id)
    .order('order_index', { ascending: false })
    .limit(1)
    .single()

  const nextOrder = (last?.order_index ?? -1) + 1

  const { data, error } = await supabase
    .from('trail_transmissoes')
    .insert({
      trail_id:          params.id,
      title:             body.title,
      content:           body.content,
      order_index:       body.order_index ?? nextOrder,
      read_time_minutes: body.read_time_minutes ?? 8,
      section_title:     body.section_title ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

// PATCH — edita transmissão (título, conteúdo, ordem, tempo)
export async function PATCH(
  request: NextRequest,
  { params: _ }: { params: { id: string } }
) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createServiceClient()
  const body = await request.json()
  const { txId, ...fields } = body

  if (!txId) return NextResponse.json({ error: 'txId required' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (fields.title             !== undefined) updates.title             = fields.title
  if (fields.content           !== undefined) updates.content           = fields.content
  if (fields.order_index       !== undefined) updates.order_index       = fields.order_index
  if (fields.read_time_minutes !== undefined) updates.read_time_minutes = fields.read_time_minutes
  if (fields.section_title     !== undefined) updates.section_title     = fields.section_title ?? null

  const { data, error } = await supabase
    .from('trail_transmissoes')
    .update(updates)
    .eq('id', txId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE — remove transmissão
export async function DELETE(
  request: NextRequest,
  { params: _ }: { params: { id: string } }
) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createServiceClient()
  const { searchParams } = new URL(request.url)
  const txId = searchParams.get('txId')

  if (!txId) return NextResponse.json({ error: 'txId required' }, { status: 400 })

  const { error } = await supabase.from('trail_transmissoes').delete().eq('id', txId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
