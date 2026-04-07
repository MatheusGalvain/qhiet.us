import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'

/**
 * POST /api/revalidate
 * Limpa o cache das principais páginas do site.
 * Protegido por REVALIDATE_SECRET no env.
 *
 * Body (opcional): { paths?: string[], tags?: string[] }
 * Sem body: revalida todas as páginas principais.
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-revalidate-secret')
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const customPaths: string[] = body.paths ?? []
  const customTags:  string[] = body.tags  ?? []

  const defaultPaths = [
    '/',
    '/transmissoes',
    '/membros',
    '/ranking',
  ]

  const pathsToRevalidate = customPaths.length > 0 ? customPaths : defaultPaths

  for (const path of pathsToRevalidate) {
    revalidatePath(path)
  }
  for (const tag of customTags) {
    revalidateTag(tag)
  }

  return NextResponse.json({
    revalidated: true,
    paths: pathsToRevalidate,
    tags: customTags,
    timestamp: new Date().toISOString(),
  })
}

/**
 * GET /api/revalidate?secret=xxx&path=/
 * Versão GET para revalidar uma rota específica facilmente no browser/webhook.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const path   = searchParams.get('path') ?? '/'

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  revalidatePath(path)
  return NextResponse.json({ revalidated: true, path, timestamp: new Date().toISOString() })
}
