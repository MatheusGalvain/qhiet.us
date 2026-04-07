import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'
import { deleteFromR2 } from '@/lib/r2'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const service = createServiceClient()
  const { data } = await service.from('profiles').select('is_admin').eq('id', user.id).single()
  return (data as any)?.is_admin ? user : null
}

/**
 * POST — create a new biblioteca entry
 * Accepts multipart/form-data:
 *   title, author, year, category, era, description, is_published, order_index
 *   file_key  (string) — R2 key returned by /api/admin/biblioteca/upload-url
 *   cover     (File)   — optional image
 *   cover_url_input (string) — optional cover URL
 */
export async function POST(request: NextRequest) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const title        = (formData.get('title') as string)?.trim()
  const author       = (formData.get('author') as string)?.trim()
  const year         = formData.get('year') ? Number(formData.get('year')) : null
  const category     = (formData.get('category') as string) ?? 'Hermetismo'
  const era          = (formData.get('era') as string) ?? 'Moderno'
  const description  = (formData.get('description') as string) ?? ''
  const is_published = formData.get('is_published') === 'true'
  const order_index  = formData.get('order_index') ? Number(formData.get('order_index')) : 0
  const fileKey      = (formData.get('file_key') as string)?.trim()
  const coverFile    = formData.get('cover') as File | null
  const coverUrlInput = (formData.get('cover_url_input') as string)?.trim() || null

  if (!title || !author) {
    return NextResponse.json({ error: 'Título e autor são obrigatórios.' }, { status: 400 })
  }
  if (!fileKey) {
    return NextResponse.json({ error: 'Arquivo PDF obrigatório (file_key ausente).' }, { status: 400 })
  }

  // Cover: prefer file upload, fall back to URL string
  const service = createServiceClient()
  let cover_url: string | null = null
  if (coverFile && coverFile.size > 0) {
    const coverBuffer = Buffer.from(await coverFile.arrayBuffer())
    const coverName   = `${Date.now()}-${coverFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const { data: coverData, error: coverErr } = await service.storage
      .from('biblioteca-covers')
      .upload(coverName, coverBuffer, { contentType: coverFile.type, upsert: false })
    if (!coverErr && coverData) {
      const { data: urlData } = service.storage.from('biblioteca-covers').getPublicUrl(coverData.path)
      cover_url = urlData.publicUrl
    }
  } else if (coverUrlInput) {
    cover_url = coverUrlInput
  }

  const { data, error } = await service
    .from('biblioteca')
    .insert({
      title,
      author,
      year: year ?? null,
      category,
      era,
      description,
      is_published,
      order_index,
      file_url: fileKey,   // R2 key stored in file_url column
      cover_url,
    })
    .select()
    .single()

  if (error) {
    // Clean up uploaded PDF if insert fails
    await deleteFromR2(fileKey).catch(() => {})
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

/**
 * PATCH — update an existing biblioteca entry
 * Accepts multipart/form-data: same fields as POST, plus `id`
 * file_key and cover are optional (only replace if provided)
 */
export async function PATCH(request: NextRequest) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const id = (formData.get('id') as string)?.trim()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const service = createServiceClient()

  // Fetch existing record
  const { data: existing, error: fetchErr } = await service
    .from('biblioteca')
    .select('file_url, cover_url')
    .eq('id', id)
    .single()
  if (fetchErr || !existing) return NextResponse.json({ error: 'Obra não encontrada.' }, { status: 404 })

  const updates: Record<string, unknown> = {}

  const title       = (formData.get('title') as string)?.trim()
  const author      = (formData.get('author') as string)?.trim()
  if (title)  updates.title  = title
  if (author) updates.author = author

  const year = formData.get('year')
  if (year !== null && year !== '') updates.year = Number(year)

  const category = formData.get('category') as string
  if (category) updates.category = category

  const era = formData.get('era') as string
  if (era) updates.era = era

  const description = formData.get('description') as string
  if (description !== null) updates.description = description

  const is_published = formData.get('is_published')
  if (is_published !== null) updates.is_published = is_published === 'true'

  const order_index = formData.get('order_index')
  if (order_index !== null && order_index !== '') updates.order_index = Number(order_index)

  // Replace PDF if a new R2 key is provided
  const newFileKey = (formData.get('file_key') as string)?.trim()
  if (newFileKey) {
    // Delete old R2 key
    if ((existing as any).file_url) {
      await deleteFromR2((existing as any).file_url).catch(() => {})
    }
    updates.file_url = newFileKey
  }

  // Replace cover if provided (file or URL)
  const coverFile     = formData.get('cover') as File | null
  const coverUrlInput = (formData.get('cover_url_input') as string)?.trim() || null
  if (coverFile && coverFile.size > 0) {
    const coverBuffer = Buffer.from(await coverFile.arrayBuffer())
    const coverName   = `${Date.now()}-${coverFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const { data: coverData, error: coverErr } = await service.storage
      .from('biblioteca-covers')
      .upload(coverName, coverBuffer, { contentType: coverFile.type, upsert: false })
    if (!coverErr && coverData) {
      const { data: urlData } = service.storage.from('biblioteca-covers').getPublicUrl(coverData.path)
      updates.cover_url = urlData.publicUrl
    }
  } else if (coverUrlInput) {
    updates.cover_url = coverUrlInput
  }

  const { data, error } = await service
    .from('biblioteca')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

/**
 * DELETE — remove a biblioteca entry (and its R2 PDF)
 */
export async function DELETE(request: NextRequest) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const service = createServiceClient()

  const { data: book } = await service
    .from('biblioteca')
    .select('file_url')
    .eq('id', id)
    .single()

  if (book && (book as any).file_url) {
    await deleteFromR2((book as any).file_url).catch(() => {})
  }

  const { error } = await service.from('biblioteca').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
