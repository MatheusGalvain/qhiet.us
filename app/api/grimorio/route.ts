import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const PER_TRAIL_LIMIT = 7500

async function getSubscriberProfile(userId: string) {
  const service = createServiceClient()
  const { data } = await service
    .from('profiles')
    .select('is_subscriber, is_admin')
    .eq('id', userId)
    .single()
  return data
}

// ─── PUT — salva anotação do grimório por trilha ──────────────
// Body: { trail_id: string, content: string }
export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await getSubscriberProfile(user.id)
  if (!profile?.is_subscriber && !profile?.is_admin) {
    return NextResponse.json({ error: 'Exclusivo para Iniciados.' }, { status: 403 })
  }

  const service = createServiceClient()
  const body = await request.json()
  const trail_id: string | null = body.trail_id ?? null
  const content: string = body.content ?? ''

  if (!trail_id) {
    return NextResponse.json({ error: 'trail_id obrigatório.' }, { status: 400 })
  }

  if (content.length > PER_TRAIL_LIMIT) {
    return NextResponse.json({
      error: `Máximo ${PER_TRAIL_LIMIT} caracteres por trilha.`,
    }, { status: 400 })
  }

  // Upsert por trilha
  const { data: existing } = await service
    .from('user_grimoire')
    .select('id')
    .eq('user_id', user.id)
    .eq('trail_id', trail_id)
    .single()

  let upsertError: any = null
  if (existing) {
    const { error } = await service
      .from('user_grimoire')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    upsertError = error
  } else {
    const { error } = await service
      .from('user_grimoire')
      .insert({ user_id: user.id, trail_id, content, updated_at: new Date().toISOString() })
    upsertError = error
  }

  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 })

  return NextResponse.json({ success: true, chars_used: content.length, limit: PER_TRAIL_LIMIT })
}

// ─── GET — busca anotação de uma trilha específica ────────────
// Query: trail_id=<uuid>
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await getSubscriberProfile(user.id)
  if (!profile?.is_subscriber && !profile?.is_admin) {
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
    .single()

  return NextResponse.json({
    content: data?.content ?? '',
    updated_at: data?.updated_at ?? null,
    chars_used: data?.content?.length ?? 0,
    limit: PER_TRAIL_LIMIT,
  })
}
