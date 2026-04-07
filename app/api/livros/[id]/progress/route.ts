import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { current_page, total_pages } = await request.json()

  await supabase.from('livro_progress').upsert(
    { user_id: user.id, book_id: params.id, current_page, total_pages, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,book_id' }
  )

  return NextResponse.json({ ok: true })
}
