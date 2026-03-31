import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { name } = await req.json()
  const trimmed = (name ?? '').trim()

  if (trimmed.length < 2)
    return NextResponse.json({ error: 'Nome deve ter ao menos 2 caracteres.' }, { status: 400 })
  if (trimmed.length > 60)
    return NextResponse.json({ error: 'Nome muito longo.' }, { status: 400 })

  // Use service client to bypass RLS WITH CHECK
  const service = createServiceClient()
  const { error: dbError } = await service
    .from('profiles')
    .update({ name: trimmed })
    .eq('id', user.id)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ ok: true, name: trimmed })
}
