import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getSignedUploadUrl } from '@/lib/r2'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const service = createServiceClient()
  const { data } = await service.from('profiles').select('is_admin').eq('id', user.id).single()
  return (data as any)?.is_admin ? user : null
}

/**
 * GET /api/admin/biblioteca/upload-url?filename=...&type=...
 * Returns a presigned R2 PUT URL so the browser can upload large PDFs
 * directly to R2 without going through the Next.js server (bypasses 4.5MB limit).
 */
export async function GET(request: NextRequest) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const filename    = request.nextUrl.searchParams.get('filename') ?? 'documento.pdf'
  const contentType = request.nextUrl.searchParams.get('type') ?? 'application/pdf'

  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  const key  = `biblioteca/${Date.now()}-${safe}`

  const presignedUrl = await getSignedUploadUrl(key, contentType, 3600)

  return NextResponse.json({ presignedUrl, key })
}
