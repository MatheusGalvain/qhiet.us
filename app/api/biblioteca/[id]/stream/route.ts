import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { canAccessAny, resolvePlans } from '@/lib/plans'
import { r2, R2_BUCKET } from '@/lib/r2'
import { GetObjectCommand } from '@aws-sdk/client-s3'

/**
 * Proxy endpoint: streams a book PDF directly from R2 through Next.js.
 * Avoids CORS issues that arise when passing signed R2 URLs to the browser.
 * Auth check is the same as /url route.
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
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, plans, is_admin')
    .eq('id', user.id)
    .single()

  const isAdmin     = (profile as any)?.is_admin ?? false
  const activePlans = resolvePlans((profile as any)?.plans, (profile as any)?.plan)

  if (!canAccessAny(activePlans, 'acervo') && !isAdmin) {
    return NextResponse.json({ error: 'Plan upgrade required' }, { status: 403 })
  }

  // Fetch book record
  const { data: book } = await service
    .from('biblioteca')
    .select('id, file_url, is_published')
    .eq('id', params.id)
    .single()

  if (!book || (!book.is_published && !isAdmin)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Stream directly from R2 (server-side — no CORS issues)
  const command = new GetObjectCommand({ Bucket: R2_BUCKET, Key: book.file_url })
  const r2Res   = await r2.send(command)

  if (!r2Res.Body) {
    return NextResponse.json({ error: 'File not available' }, { status: 502 })
  }

  // Support byte-range requests so pdf.js can load efficiently
  const rangeHeader  = request.headers.get('range')
  const contentLength = r2Res.ContentLength

  // Convert R2 stream to a Web ReadableStream
  const nodeStream = r2Res.Body as any
  const webStream  = new ReadableStream({
    start(controller) {
      nodeStream.on('data', (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)))
      nodeStream.on('end', () => controller.close())
      nodeStream.on('error', (err: Error) => controller.error(err))
    },
    cancel() {
      nodeStream.destroy?.()
    },
  })

  const headers: Record<string, string> = {
    'Content-Type':        'application/pdf',
    'Cache-Control':       'private, max-age=3600',
    'Accept-Ranges':       'bytes',
    'Access-Control-Allow-Origin': '*',
  }

  if (contentLength) {
    headers['Content-Length'] = String(contentLength)
  }

  return new NextResponse(webStream, {
    status: rangeHeader ? 206 : 200,
    headers,
  })
}
