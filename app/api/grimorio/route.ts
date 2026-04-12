import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { canAccessAny, resolvePlans } from '@/lib/plans'

// Keeps in sync with GrimoireList.tsx and TrailReader.tsx
const PER_TX_LIMIT = 10000

// ─── PUT — salva/atualiza anotação por trilha ─────────────────────────────────
// Body: { trail_id: string, content: string }
export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const body    = await request.json()

  const trail_id: string | null = body.trail_id ?? null
  const content: string = (body.content ?? '').slice(0, PER_TX_LIMIT)

  if (!trail_id) {
    return NextResponse.json({ error: 'trail_id obrigatório.' }, { status: 400 })
  }

  // Paraleliza verificação de acesso + leitura do registro existente
  // (ambos são leituras — o write só ocorre após confirmar acesso)
  const [profileRes, existingRes] = await Promise.all([
    service.from('profiles').select('plan, plans, is_admin').eq('id', user.id).single() as any,
    service.from('user_grimoire').select('id').eq('user_id', user.id).eq('trail_id', trail_id).maybeSingle() as any,
  ])

  const prof = profileRes.data as any
  if (!prof) return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 403 })

  // Admins passam direto; demais precisam ter acesso ao grimório
  if (!prof.is_admin) {
    const activePlans = resolvePlans(prof.plans, prof.plan)
    if (!canAccessAny(activePlans, 'grimorio')) {
      return NextResponse.json({ error: 'Exclusivo para Iniciados.' }, { status: 403 })
    }
  }

  const existing = existingRes.data

  let dbError: any = null
  if (existing) {
    const { error } = await (service
      .from('user_grimoire') as any)
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    dbError = error
  } else {
    const { error } = await (service
      .from('user_grimoire') as any)
      .insert({ user_id: user.id, trail_id, content, updated_at: new Date().toISOString() })
    dbError = error
  }

  if (dbError) {
    console.error('[grimorio PUT]', dbError)
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, chars_used: content.length, limit: PER_TX_LIMIT })
}

// ─── GET — busca anotação de uma trilha ──────────────────────────────────────
// Query: trail_id=<uuid>
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const trail_id = searchParams.get('trail_id')
  if (!trail_id) return NextResponse.json({ error: 'trail_id obrigatório.' }, { status: 400 })

  const service = createServiceClient()

  // Paraleliza verificação de acesso + busca do conteúdo
  const [profileRes, grimoireRes] = await Promise.all([
    service.from('profiles').select('plan, plans, is_admin').eq('id', user.id).single() as any,
    service.from('user_grimoire').select('content, updated_at').eq('user_id', user.id).eq('trail_id', trail_id).maybeSingle() as any,
  ])

  const prof = profileRes.data as any
  if (!prof) return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 403 })

  if (!prof.is_admin) {
    const activePlans = resolvePlans(prof.plans, prof.plan)
    if (!canAccessAny(activePlans, 'grimorio')) {
      return NextResponse.json({ error: 'Exclusivo para Iniciados.' }, { status: 403 })
    }
  }

  const data = grimoireRes.data
  return NextResponse.json({
    content:    data?.content    ?? '',
    updated_at: data?.updated_at ?? null,
    chars_used: data?.content?.length ?? 0,
    limit:      PER_TX_LIMIT,
  })
}
