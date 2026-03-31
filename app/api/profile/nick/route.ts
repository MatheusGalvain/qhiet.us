import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const COOLDOWN_DAYS = 20

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await req.json()
  const trimmed = (body.nick ?? '').trim()

  // Validate
  if (trimmed.length < 2)
    return NextResponse.json({ error: 'Nick deve ter ao menos 2 caracteres.' }, { status: 400 })
  if (trimmed.length > 24)
    return NextResponse.json({ error: 'Nick deve ter no máximo 24 caracteres.' }, { status: 400 })
  if (/\s{2,}/.test(trimmed))
    return NextResponse.json({ error: 'Nick não pode ter espaços duplos.' }, { status: 400 })
  if (!/^[a-zA-Z0-9 _\-\.àáâãéêíóôõúüçÀÁÂÃÉÊÍÓÔÕÚÜÇ]+$/.test(trimmed))
    return NextResponse.json({ error: 'Nick só pode ter letras, números, espaço, _ - .' }, { status: 400 })

  const service = createServiceClient()

  // Check cooldown server-side (cannot trust client)
  const { data: profile } = await service
    .from('profiles')
    .select('nick, nick_updated_at')
    .eq('id', user.id)
    .single()

  if (profile?.nick_updated_at) {
    const diffDays = (Date.now() - new Date(profile.nick_updated_at).getTime()) / 86400000
    if (diffDays < COOLDOWN_DAYS) {
      const daysLeft = Math.ceil(COOLDOWN_DAYS - diffDays)
      return NextResponse.json(
        { error: `Você poderá alterar seu nick em ${daysLeft} dia${daysLeft > 1 ? 's' : ''}.` },
        { status: 400 }
      )
    }
  }

  // Check uniqueness (case-insensitive)
  const { data: existing } = await service
    .from('profiles')
    .select('id')
    .ilike('nick', trimmed)
    .neq('id', user.id)
    .maybeSingle()

  if (existing)
    return NextResponse.json({ error: 'Este nick já está em uso. Escolha outro.' }, { status: 400 })

  // Update via service client — bypasses RLS WITH CHECK
  const { error: dbError } = await service
    .from('profiles')
    .update({ nick: trimmed, nick_updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (dbError) {
    if (dbError.code === '23505')
      return NextResponse.json({ error: 'Este nick já está em uso. Escolha outro.' }, { status: 400 })
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, nick: trimmed })
}
