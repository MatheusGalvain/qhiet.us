import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  return profile?.is_admin ? user : null
}

// GET — list all transmissões (admin sees drafts too)
export async function GET() {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('transmissoes')
    .select('id, number, slug, title, categories, access, status, read_time_minutes, published_at, created_at')
    .order('number', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST — create transmissão
export async function POST(req: NextRequest) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const supabase = createServiceClient()

  // Auto-assign next number if not provided
  if (!body.number) {
    const { data: last } = await supabase
      .from('transmissoes')
      .select('number')
      .order('number', { ascending: false })
      .limit(1)
      .single()
    body.number = (last?.number ?? 0) + 1
  }

  const { data, error } = await supabase
    .from('transmissoes')
    .insert({
      slug:               body.slug,
      number:             body.number,
      title:              body.title,
      excerpt:            body.excerpt ?? '',
      content:            body.content ?? '',
      categories:         body.categories ?? [],
      access:             body.access ?? 'free',
      status:             body.status ?? 'draft',
      read_time_minutes:  body.read_time_minutes ?? 5,
      xp_reward:          body.xp_reward ?? 30,
      published_at:       body.status === 'published' ? new Date().toISOString() : null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
