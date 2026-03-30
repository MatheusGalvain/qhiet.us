import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VALID_TYPES = ['read', 'quiz'] as const
type XpType = typeof VALID_TYPES[number]

// XP por tipo — valor autoritativo no servidor, nunca do cliente
const XP_BY_TYPE: Record<XpType, (articleXp: number) => number> = {
  read: (xp) => xp,
  quiz: (xp) => Math.round(xp * 0.5), // quiz vale 50% do XP da transmissão
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { transmissaoId, type } = body

    // Whitelist de tipos válidos — rejeita qualquer outro valor
    if (!transmissaoId || !VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Busca XP do banco — nunca confia no valor enviado pelo cliente
    const { data: article } = await supabase
      .from('transmissoes')
      .select('xp_reward, categories')
      .eq('id', transmissaoId)
      .single()

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    const xp = XP_BY_TYPE[type as XpType](article.xp_reward ?? 30)

    // Prevent duplicate XP for same article+type
    const { data: existing } = await supabase
      .from('xp_events')
      .select('id')
      .eq('user_id', user.id)
      .eq('transmissao_id', transmissaoId)
      .eq('type', type)
      .single()

    if (existing) return NextResponse.json({ message: 'Already awarded' })

    // Insert XP event — UNIQUE constraint protege contra race condition
    const { error: insertError } = await supabase.from('xp_events').insert({
      user_id: user.id,
      transmissao_id: transmissaoId,
      type,
      xp,
    })

    if (insertError) {
      console.warn('[xp] insert failed, skipping profile update:', insertError.code)
      return NextResponse.json({ message: 'Already awarded' })
    }

    // Atualiza xp_total e xp_by_domain no perfil
    const { data: profile } = await supabase
      .from('profiles')
      .select('xp_total, xp_by_domain')
      .eq('id', user.id)
      .single()

    if (profile) {
      const newDomain = { ...(profile.xp_by_domain ?? {}) }
      if (article.categories?.length > 0) {
        const xpPerCat = Math.floor(xp / article.categories.length)
        for (const cat of article.categories) {
          newDomain[cat] = (newDomain[cat] ?? 0) + xpPerCat
        }
      }
      await supabase.from('profiles').update({
        xp_total: (profile.xp_total ?? 0) + xp,
        xp_by_domain: newDomain,
      }).eq('id', user.id)
    }

    return NextResponse.json({ awarded: xp })
  } catch (err) {
    console.error('[xp]', err)
    return NextResponse.json({ error: 'Failed to award XP' }, { status: 500 })
  }
}
