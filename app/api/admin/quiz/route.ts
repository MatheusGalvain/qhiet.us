import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/admin/quiz?transmissao_id=xxx
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const transmissaoId = request.nextUrl.searchParams.get('transmissao_id')
  if (!transmissaoId) return NextResponse.json({ error: 'Missing transmissao_id' }, { status: 400 })

  const service = createServiceClient()
  const { data } = await service
    .from('quizzes')
    .select('*')
    .eq('transmissao_id', transmissaoId)
    .maybeSingle()

  return NextResponse.json(data ?? null)
}

// POST /api/admin/quiz  — upsert quiz for a transmissão
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { transmissao_id, questions, xp_reward } = await request.json()
  if (!transmissao_id || !Array.isArray(questions)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data, error } = await service
    .from('quizzes')
    .upsert(
      { transmissao_id, questions, xp_reward: xp_reward ?? 50 },
      { onConflict: 'transmissao_id' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/admin/quiz?transmissao_id=xxx
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const transmissaoId = request.nextUrl.searchParams.get('transmissao_id')
  if (!transmissaoId) return NextResponse.json({ error: 'Missing transmissao_id' }, { status: 400 })

  const service = createServiceClient()
  await service.from('quizzes').delete().eq('transmissao_id', transmissaoId)

  return NextResponse.json({ ok: true })
}
