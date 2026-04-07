import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadToR2 } from '@/lib/r2'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return data?.is_admin ? user : null
}

export async function POST(request: NextRequest) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })

  const safeName    = `livros/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const buffer      = Buffer.from(await file.arrayBuffer())
  const contentType = file.type || 'application/pdf'

  await uploadToR2(safeName, buffer, contentType)

  return NextResponse.json({ key: safeName })
}
