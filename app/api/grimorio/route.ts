import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { canAccessAny, resolvePlans } from '@/lib/plans'

const PER_TX_LIMIT = 1000

async function canUseGrimoire(userId: string): Promise<boolean> {
  const service = createServiceClient()
  const { data } = await service
    .from('profiles')
    .select('plan, plans, is_admin')
    .eq('id', userId)
    .single()
  if (!data) return false
  if ((data as any).is_admin) return true
  const activePlans = resolvePlans((data as any).plans, (data as any).plan)
  return canAccessAny(activePlans, 'grimorio')
}

// ─── PUT — salva/atualiza anotação por trilha ─────────────────
// Body: { trail_id: string, content: string }
export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const allowed = await canUseGrimoire(user.id)
  if (!allowed) {
    return NextResponse.json({ error: 'Exclusivo para Iniciados.' }, { status: 403 })
  }

  const service = createServiceClient()
  const body = await request.json()

  // Aceita trail_id (obrigatório) e tx_id (ignorado por ora — DB ainda não tem a coluna)
  const trail_id: string | null = body.trail_id ?? null
  const content: string = (body.content ?? '').slice(0, PER_TX_LIMIT)

  if (!trail_id) {
    return NextResponse.json({ error: 'trail_id obrigatório.' }, { status: 400 })
  }

  // Busca registro existente
  const { data: existing } = await service
    .from('user_grimoire')
    .select('id')
    .eq('user_id', user.id)
    .eq('trail_id', trail_id)
    .maybeSingle()

  let dbError: any = null
  if (existing) {
    const { error } = await service
      .from('user_grimoire')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    dbError = error
  } else {
    const { error } = await service
      .from('user_grimoire')
      .insert({ user_id: user.id, trail_id, content, updated_at: new Date().toISOString() })
    dbError = error
  }

  if (dbError) {
    console.error('[grimorio PUT]', dbError)
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, chars_used: content.length, limit: PER_TX_LIMIT })
}

// ─── GET — busca anotação de uma trilha ──────────────────────
// Query: trail_id=<uuid>
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const allowed = await canUseGrimoire(user.id)
  if (!allowed) {
    return NextResponse.json({ error: 'Exclusivo para Iniciados.' }, { status: 403 })
  }

  const service = createServiceClient()
  const { searchParams } = new URL(request.url)
  const trail_id = searchParams.get('trail_id')

  if (!trail_id) {
    return NextResponse.json({ error: 'trail_id obrigatório.' }, { status: 400 })
  }

  const { data } = await service
    .from('user_grimoire')
    .select('content, updated_at')
    .eq('user_id', user.id)
    .eq('trail_id', trail_id)
    .maybeSingle()

  return NextResponse.json({
    content: data?.content ?? '',
    updated_at: data?.updated_at ?? null,
    chars_used: data?.content?.length ?? 0,
    limit: PER_TX_LIMIT,
  })
}
