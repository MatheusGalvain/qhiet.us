import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// POST — marca uma transmissão como concluída e verifica se a trilha foi completada
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  const { trail_id, transmissao_id } = await request.json()
  if (!trail_id || !transmissao_id) {
    return NextResponse.json({ error: 'trail_id e transmissao_id são obrigatórios.' }, { status: 400 })
  }

  // Busca a trilha para verificar is_free e dados de XP
  const { data: trail } = await service
    .from('trails')
    .select('xp_reward, categories, is_free, is_published')
    .eq('id', trail_id)
    .single()

  if (!trail || !trail.is_published) {
    return NextResponse.json({ error: 'Trilha não encontrada.' }, { status: 404 })
  }

  // Verifica acesso: trilha gratuita permite qualquer usuário autenticado;
  // trilhas premium exigem is_subscriber
  if (!trail.is_free) {
    const { data: profile } = await service
      .from('profiles')
      .select('is_subscriber, is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_subscriber && !profile?.is_admin) {
      return NextResponse.json({ error: 'Acesso exclusivo para Iniciados.' }, { status: 403 })
    }
  }

  // Registra progresso (ignora se já existe — UNIQUE constraint)
  const { error: progressError } = await service
    .from('user_trail_progress')
    .upsert(
      { user_id: user.id, trail_id, transmissao_id },
      { onConflict: 'user_id,trail_id,transmissao_id' }
    )

  if (progressError) return NextResponse.json({ error: progressError.message }, { status: 500 })

  // Busca todas as transmissões da trilha
  const { data: allTx } = await service
    .from('trail_transmissoes')
    .select('id')
    .eq('trail_id', trail_id)

  // Busca o progresso do usuário nessa trilha
  const { data: userProgress } = await service
    .from('user_trail_progress')
    .select('transmissao_id')
    .eq('user_id', user.id)
    .eq('trail_id', trail_id)

  const totalTx = (allTx ?? []).length
  const doneTx  = (userProgress ?? []).length
  const isTrailComplete = totalTx > 0 && doneTx >= totalTx

  if (!isTrailComplete) {
    return NextResponse.json({ completed: false, progress: { done: doneTx, total: totalTx } })
  }

  // Verifica se já ganhou XP por essa trilha
  const { data: existingCompletion } = await service
    .from('user_trail_completions')
    .select('id')
    .eq('user_id', user.id)
    .eq('trail_id', trail_id)
    .single()

  if (existingCompletion) {
    return NextResponse.json({ completed: true, xp_earned: 0, already_completed: true })
  }

  const xpReward = trail.xp_reward ?? 500
  const categories: string[] = trail.categories ?? []

  // Registra conclusão
  await service
    .from('user_trail_completions')
    .insert({ user_id: user.id, trail_id, xp_earned: xpReward })

  // Atualiza XP no perfil — busca dados atuais
  const { data: profile } = await service
    .from('profiles')
    .select('xp_total, xp_by_domain')
    .eq('id', user.id)
    .single()

  const newXpTotal = (profile?.xp_total ?? 0) + xpReward
  const xpByDomain = (profile?.xp_by_domain ?? {}) as Record<string, number>

  // Distribui XP entre todas as categorias da trilha (divisão proporcional)
  if (categories.length > 0) {
    const xpPerCat = Math.round(xpReward / categories.length)
    for (const cat of categories) {
      if (cat) xpByDomain[cat] = (xpByDomain[cat] ?? 0) + xpPerCat
    }
  }

  await service
    .from('profiles')
    .update({ xp_total: newXpTotal, xp_by_domain: xpByDomain })
    .eq('id', user.id)

  return NextResponse.json({ completed: true, xp_earned: xpReward, new_xp_total: newXpTotal })
}
