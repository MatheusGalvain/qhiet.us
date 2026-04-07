import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'
import { getSignedUploadUrl, deleteFromR2 } from '@/lib/r2'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return data?.is_admin ? user : null
}

// GET — presigned R2 upload URL
export async function GET(request: NextRequest) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const filename    = request.nextUrl.searchParams.get('filename')
  const contentType = request.nextUrl.searchParams.get('type') ?? 'application/pdf'
  if (!filename) return NextResponse.json({ error: 'Missing filename' }, { status: 400 })

  const key       = `livros/${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const signedUrl = await getSignedUploadUrl(key, contentType, 3600)

  return NextResponse.json({ signedUrl, key })
}

// POST — create book entry with R2 file_key
export async function POST(request: NextRequest) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { title, author, month, file_key, cover_url, plan } = body

  if (!title || !file_key || !month) {
    return NextResponse.json({ error: 'title, file_key e month obrigatórios' }, { status: 400 })
  }

  const planValue = plan ?? 'profano'
  const service   = createServiceClient()

  const { data, error } = await service
    .from('monthly_books')
    .insert({ title, author: author ?? '', month, file_key, file_url: null, cover_url: cover_url ?? null, plan: planValue, plan_access: [planValue] })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH — update book metadata
export async function PATCH(request: NextRequest) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const body = await request.json()
  const { title, author, month, cover_url, plan } = body
  const updates: Record<string, unknown> = {}
  if (title     !== undefined) updates.title     = title
  if (author    !== undefined) updates.author    = author
  if (month     !== undefined) updates.month     = month
  if (cover_url !== undefined) updates.cover_url = cover_url || null
  if (plan      !== undefined) { updates.plan = plan; updates.plan_access = [plan] }

  const service = createServiceClient()
  const { data, error } = await service.from('monthly_books').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE — remove DB record + R2 file
export async function DELETE(request: NextRequest) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const service = createServiceClient()
  const { data: book } = await service.from('monthly_books').select('file_key, file_url').eq('id', id).single()

  if (book?.file_key) await deleteFromR2(book.file_key).catch(() => {})
  if (book?.file_url?.includes('/storage/v1/object/public/livros/')) {
    const path = book.file_url.split('/storage/v1/object/public/livros/')[1]
    await service.storage.from('livros').remove([path]).catch(() => {})
  }

  const { error } = await service.from('monthly_books').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
