import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return data?.is_admin ? user : null
}

// DELETE — remove category with cascade cleanup on transmissões
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createServiceClient()
  const { id } = params

  try {
    // 1. Get the slug first (needed to clean transmissões)
    const { data: cat } = await supabase
      .from('categories')
      .select('slug')
      .eq('id', id)
      .single()

    if (!cat) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

    // 2. Remove slug from all transmissões that reference it
    const { data: transmissoes } = await supabase
      .from('transmissoes')
      .select('id, categories')
      .contains('categories', [cat.slug])

    if (transmissoes) {
      for (const t of transmissoes) {
        const newCats = (t.categories ?? []).filter((s: string) => s !== cat.slug)
        await supabase.from('transmissoes').update({ categories: newCats }).eq('id', t.id)
      }
    }

    // 3. Delete the category (category_content cascades via FK)
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

// PATCH — update category fields (label, slug, symbol, color, etc.) or toggle active
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createServiceClient()
  const { id } = params
  const body = await request.json()

  // Build update payload — only include fields that were sent
  const updates: Record<string, unknown> = {}
  if (typeof body.active    === 'boolean') updates.active      = body.active
  if (body.label     !== undefined)        updates.label       = body.label
  if (body.slug      !== undefined)        updates.slug        = body.slug
  if (body.symbol    !== undefined)        updates.symbol      = body.symbol
  if (body.color     !== undefined)        updates.color       = body.color
  if (body.description !== undefined)     updates.description = body.description
  if (body.sort_order !== undefined)      updates.sort_order  = body.sort_order

  // Cascade slug rename → update all transmissões + profiles.xp_by_domain
  const oldSlug: string | undefined = body.originalSlug
  const newSlug: string | undefined = body.slug
  if (oldSlug && newSlug && oldSlug !== newSlug) {
    // 1. Atualiza transmissoes.categories
    const { data: transmissoes } = await supabase
      .from('transmissoes')
      .select('id, categories')
      .contains('categories', [oldSlug])

    if (transmissoes?.length) {
      for (const t of transmissoes) {
        const updated = (t.categories ?? []).map((s: string) => s === oldSlug ? newSlug : s)
        await supabase.from('transmissoes').update({ categories: updated }).eq('id', t.id)
      }
    }

    // 2. Atualiza chaves do JSONB xp_by_domain nos perfis
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, xp_by_domain')
      .not('xp_by_domain', 'is', null)

    if (profiles?.length) {
      for (const p of profiles) {
        const xp = p.xp_by_domain as Record<string, number> | null
        if (xp && oldSlug in xp) {
          const updated: Record<string, number> = {}
          for (const [k, v] of Object.entries(xp)) {
            updated[k === oldSlug ? newSlug : k] = v
          }
          await supabase.from('profiles').update({ xp_by_domain: updated }).eq('id', p.id)
        }
      }
    }
  }

  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
