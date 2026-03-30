import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return data?.is_admin ? user : null
}

// GET — lista todas as trilhas com contagem de transmissões
export async function GET() {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('trails')
    .select('*, trail_transmissoes(count)')
    .order('order_index')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST — cria nova trilha
export async function POST(request: NextRequest) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createServiceClient()
  const body = await request.json()

  // Support both categories[] and legacy category string
  const categories: string[] = Array.isArray(body.categories) && body.categories.length > 0
    ? body.categories
    : (body.category ? [body.category] : [])

  const { data, error } = await supabase
    .from('trails')
    .insert({
      title:         body.title,
      description:   body.description ?? null,
      category:      categories[0] ?? '',   // legacy field
      categories:    categories,
      duration_days: body.duration_days ?? 30,
      xp_reward:     body.xp_reward ?? 500,
      is_published:  body.is_published ?? false,
      is_free:       body.is_free ?? false,
      order_index:   body.order_index ?? 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
