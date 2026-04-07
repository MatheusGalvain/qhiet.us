import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { canAccessAny, resolvePlans } from '@/lib/plans'
import { r2, R2_BUCKET } from '@/lib/r2'
import { GetObjectCommand } from '@aws-sdk/client-s3'

/**
 * Proxy que faz stream de um livro mensal (monthly_books) direto do R2.
 * Evita problemas de CORS com URLs assinadas expostas ao browser.
 * Verifica se o usuário tem acesso ao plano do livro.
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, plans, is_admin')
    .eq('id', user.id)
    .single()

  const isAdmin     = (profile as any)?.is_admin ?? false
  const activePlans = resolvePlans((profile as any)?.plans, (profile as any)?.plan)

  // Busca o livro
  const { data: book } = await service
    .from('monthly_books')
    .select('id, file_key, plan_access, plan')
    .eq('id', params.id)
    .single()

  if (!book) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Verifica acesso: livros profano sempre liberados; premium exige transmissoes_exclusivas
  const isFree = Array.isArray(book.plan_access)
    ? book.plan_access.includes('profano')
    : book.plan === 'profano'

  if (!isFree && !canAccessAny(activePlans, 'transmissoes_exclusivas') && !isAdmin) {
    return NextResponse.json({ error: 'Plan upgrade required' }, { status: 403 })
  }

  if (!book.file_key) {
    return NextResponse.json({ error: 'File not configured' }, { status: 422 })
  }

  // Stream do R2
  const command = new GetObjectCommand({ Bucket: R2_BUCKET, Key: book.file_key })
  const r2Res   = await r2.send(command)

  if (!r2Res.Body) {
    return NextResponse.json({ error: 'File not available' }, { status: 502 })
  }

  const nodeStream = r2Res.Body as any
  const webStream  = new ReadableStream({
    start(controller) {
      nodeStream.on('data', (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)))
      nodeStream.on('end', () => controller.close())
      nodeStream.on('error', (err: Error) => controller.error(err))
    },
    cancel() { nodeStream.destroy?.() },
  })

  const headers: Record<string, string> = {
    'Content-Type':  'application/pdf',
    'Cache-Control': 'private, max-age=3600',
    'Accept-Ranges': 'bytes',
  }
  if (r2Res.ContentLength) {
    headers['Content-Length'] = String(r2Res.ContentLength)
  }

  return new NextResponse(webStream, { status: 200, headers })
}
