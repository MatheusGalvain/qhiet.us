import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { canAccessAny, resolvePlans } from '@/lib/plans'
import { getSignedDownloadUrl } from '@/lib/r2'

/**
 * Secure endpoint: returns a short-lived signed URL for a book's PDF.
 * Never exposes the real R2 URL to the client.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const service  = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check plan access
  const { data: profile } = await supabase.from('profiles').select('plan, plans, is_admin').eq('id', user.id).single()
  const isAdmin  = (profile as any)?.is_admin ?? false
  const activePlans = resolvePlans((profile as any)?.plans, (profile as any)?.plan)

  if (!canAccessAny(activePlans, 'acervo') && !isAdmin) {
    return NextResponse.json({ error: 'Plan upgrade required' }, { status: 403 })
  }

  // Fetch book
  const { data: book } = await service
    .from('biblioteca')
    .select('id, file_url, is_published')
    .eq('id', params.id)
    .single()

  if (!book || (!book.is_published && !isAdmin)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Generate signed URL (valid 1 hour)
  // file_url is stored as R2 key (not a full URL)
  const signedUrl = await getSignedDownloadUrl(book.file_url, 3600)

  return NextResponse.json({ url: signedUrl })
}
