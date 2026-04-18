import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return data?.is_admin ? user : null
}

/** POST — recebe uma imagem de capa (JPEG/PNG) e salva no Storage.
 *  Retorna { cover_url } com a URL pública. */
export async function POST(request: NextRequest) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('cover') as File | null
  if (!file || file.size === 0) {
    return NextResponse.json({ error: 'Nenhuma imagem enviada.' }, { status: 400 })
  }

  const service   = createServiceClient()
  const coverName = `livros-${Date.now()}.jpg`
  const buffer    = Buffer.from(await file.arrayBuffer())

  const { data: uploadData, error: uploadErr } = await service.storage
    .from('biblioteca-covers')
    .upload(coverName, buffer, { contentType: 'image/jpeg', upsert: false })

  if (uploadErr || !uploadData) {
    console.error('[upload-cover]', uploadErr)
    return NextResponse.json({ error: uploadErr?.message ?? 'Erro ao salvar imagem.' }, { status: 500 })
  }

  const { data: urlData } = service.storage
    .from('biblioteca-covers')
    .getPublicUrl(uploadData.path)

  return NextResponse.json({ cover_url: urlData.publicUrl })
}
