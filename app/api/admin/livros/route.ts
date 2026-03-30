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

  const planValue = plan ?? 'profano'

  const service = createServiceClient()
  const { data, error } = await service
    .from('monthly_books')
    .insert({
      title,
      author: author ?? '',
      month,
      file_url,
      cover_url: cover_url ?? null,
      plan: planValue,
      plan_access: [planValue],
    })
    .select()
    .single()

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
  if (title !== undefined)     updates.title = title
  if (author !== undefined)    updates.author = author
  if (month !== undefined)     updates.month = month
  if (cover_url !== undefined) updates.cover_url = cover_url || null
  if (plan !== undefined) {
    updates.plan = plan
    updates.plan_access = [plan]
  }

  const service = createServiceClient()
  const { data, error } = await service
    .from('monthly_books')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE — removes DB record AND the file from Storage (if it was uploaded there)
export async function DELETE(request: NextRequest) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const service = createServiceClient()

  // 1. Fetch the record first so we know the file_url
  const { data: book } = await service
    .from('monthly_books')
    .select('file_url')
    .eq('id', id)
    .single()

  // 2. Delete from Supabase Storage if the file was uploaded there
  //    URL format: https://[project].supabase.co/storage/v1/object/public/livros/books/...
  if (book?.file_url) {
    const STORAGE_MARKER = '/storage/v1/object/public/livros/'
    const idx = book.file_url.indexOf(STORAGE_MARKER)
    if (idx !== -1) {
      const storagePath = book.file_url.slice(idx + STORAGE_MARKER.length)
      // Ignore storage deletion errors — the DB record must still be removed
      await service.storage.from('livros').remove([storagePath])
    }
  }

  // 3. Delete the DB record
  const { error } = await service.from('monthly_books').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

// GET — signed upload URL
export async function GET(request: NextRequest) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const filename = request.nextUrl.searchParams.get('filename')
  const contentType = request.nextUrl.searchParams.get('type') ?? 'application/pdf'
  if (!filename) return NextResponse.json({ error: 'Missing filename' }, { status: 400 })

  const service = createServiceClient()
  const ext = filename.split('.').pop() ?? 'pdf'
  const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const path = `books/${safeName}`

  const { data, error } = await service.storage
    .from('livros')
    .createSignedUploadUrl(path)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ signedUrl: data.signedUrl, path, token: data.token, contentType })
}
