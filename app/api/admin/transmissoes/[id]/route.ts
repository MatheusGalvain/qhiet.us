import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  return profile?.is_admin ? user : null
}

// GET — single transmissão
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('transmissoes').select('*').eq('id', params.id).single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

// PUT — update transmissão
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const supabase = createServiceClient()

  // published_at logic:
  // - draft with a date  → keep the date (scheduled countdown)
  // - publishing without a date → stamp now
  // - publishing with a date → keep provided date
  const updatePayload: Record<string, any> = { ...body }
  if (body.status === 'published' && !body.published_at) {
    updatePayload.published_at = new Date().toISOString()
  }
  // Remove helper field that doesn't exist in DB
  delete updatePayload.scheduled_at

  const { data, error } = await supabase
    .from('transmissoes')
    .update(updatePayload)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE — delete transmissão
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('transmissoes').delete().eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
