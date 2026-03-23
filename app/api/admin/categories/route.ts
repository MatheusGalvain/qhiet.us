import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return data?.is_admin ? user : null
}

// GET — list all categories
export async function GET() {
  const service = createServiceClient()
  const { data } = await service.from('categories').select('*').order('sort_order')
  return NextResponse.json(data ?? [])
}

// POST — create or update category
export async function POST(request: NextRequest) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { slug, label, symbol, color, description, sort_order, tags } = body

  if (!slug || !label) return NextResponse.json({ error: 'slug e label obrigatórios' }, { status: 400 })

  const service = createServiceClient()
  const { data, error } = await service
    .from('categories')
    .upsert({
      slug,
      label,
      symbol:     symbol     || '◉',
      color:      color      || '#b02a1e',
      description,
      sort_order: sort_order ?? 99,
      tags:       tags       ?? [],
    }, { onConflict: 'slug' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE — remove category
export async function DELETE(request: NextRequest) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const slug = request.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })

  const service = createServiceClient()
  await service.from('categories').delete().eq('slug', slug)
  return NextResponse.json({ ok: true })
}
