import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return data?.is_admin ? user : null
}

// POST — create book entry (after PDF uploaded to storage)
export async function POST(request: NextRequest) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { title, author, month, file_url, cover_url, plan } = body

  if (!title || !file_url || !month) {
    return NextResponse.json({ error: 'title, file_url e month obrigatórios' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data, error } = await service
    .from('monthly_books')
    .insert({ title, author: author ?? '', month, file_url, cover_url: cover_url ?? null, plan: plan ?? 'profano' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE
export async function DELETE(request: NextRequest) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const service = createServiceClient()
  await service.from('monthly_books').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}

// GET — signed upload URL
export async function GET(request: NextRequest) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const filename = request.nextUrl.searchParams.get('filename')
  if (!filename) return NextResponse.json({ error: 'Missing filename' }, { status: 400 })

  const service = createServiceClient()
  const path = `books/${Date.now()}-${filename}`

  const { data, error } = await service.storage
    .from('livros')
    .createSignedUploadUrl(path)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ signedUrl: data.signedUrl, path, token: data.token })
}
