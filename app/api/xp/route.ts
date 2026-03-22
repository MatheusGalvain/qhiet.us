import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { transmissaoId, type, xp } = await request.json()
    if (!transmissaoId || !type || typeof xp !== 'number') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Prevent duplicate XP for same article+type
    const { data: existing } = await supabase
      .from('xp_events')
      .select('id')
      .eq('user_id', user.id)
      .eq('transmissao_id', transmissaoId)
      .eq('type', type)
      .single()

    if (existing) return NextResponse.json({ message: 'Already awarded' })

    // Insert XP event
    await supabase.from('xp_events').insert({
      user_id: user.id,
      transmissao_id: transmissaoId,
      type,
      xp,
    })

    // Get article categories for domain XP
    const { data: t } = await supabase
      .from('transmissoes')
      .select('categories')
      .eq('id', transmissaoId)
      .single()

    // Update profile: increment xp_total and xp_by_domain
    const { data: profile } = await supabase
      .from('profiles')
      .select('xp_total, xp_by_domain')
      .eq('id', user.id)
      .single()

    if (profile) {
      const newDomain = { ...(profile.xp_by_domain ?? {}) }
      if (t?.categories) {
        for (const cat of t.categories) {
          newDomain[cat] = (newDomain[cat] ?? 0) + Math.floor(xp / (t.categories.length))
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
