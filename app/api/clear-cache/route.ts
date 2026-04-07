import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const PATHS = ['/', '/transmissoes', '/membros', '/ranking', '/categorias']

export async function GET(request: NextRequest) {
  // Verifica se é admin
  const supabase  = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', request.url))

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Revalida todas as páginas principais
  for (const path of PATHS) revalidatePath(path)

  // Retorna HTML simples para poder visitar no browser
  return new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Cache limpo</title>
    <style>body{background:#080503;color:#ede5d8;font-family:monospace;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;flex-direction:column;gap:16px}
    a{color:#b02a1e;text-decoration:none;letter-spacing:3px;font-size:11px;text-transform:uppercase}</style>
    </head><body>
    <p style="font-size:11px;letter-spacing:4px;color:#b02a1e;text-transform:uppercase">✓ Cache limpo</p>
    <p style="font-size:13px;color:#9a9a9a;letter-spacing:1px">${PATHS.join(', ')}</p>
    <a href="/">← Voltar ao site</a>
    </body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html' } }
  )
}
