import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { canAccessAny, resolvePlans } from '@/lib/plans'

/** Save reading progress */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('plan, plans').eq('id', user.id).single()
  const activePlans = resolvePlans((profile as any)?.plans, (profile as any)?.plan)
  if (!canAccessAny(activePlans, 'acervo')) {
    return NextResponse.json({ error: 'Plan required' }, { status: 403 })
  }

  const body = await request.json()
  const { current_page, total_pages } = body

  if (typeof current_page !== 'number' || typeof total_pages !== 'number') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const service = createServiceClient()
  const { error } = await service
    .from('biblioteca_progress')
    .upsert({
      user_id:      user.id,
      book_id:      params.id,
      current_page,
      total_pages,
      last_read_at: new Date().toISOString(),
    }, { onConflict: 'user_id,book_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

/** Remove book from reading list */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { error } = await service
    .from('biblioteca_progress')
    .delete()
    .eq('user_id', user.id)
    .eq('book_id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

/** Get reading progress */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { data } = await service
    .from('biblioteca_progress')
    .select('current_page, total_pages, last_read_at')
    .eq('user_id', user.id)
    .eq('book_id', params.id)
    .single()

  return NextResponse.json(data ?? { current_page: 1, total_pages: 0 })
}
