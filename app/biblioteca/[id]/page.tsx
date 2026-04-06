import { redirect, notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { canAccessAny, resolvePlans } from '@/lib/plans'
import PdfReader from '@/components/biblioteca/PdfReader'
import type { Metadata } from 'next'

export const revalidate = 0

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const service = createServiceClient()
  const { data: book } = await service.from('biblioteca').select('title, author').eq('id', params.id).single()
  if (!book) return { title: 'Livro não encontrado' }
  return { title: `${(book as any).title} — Biblioteca` }
}

export default async function BookPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const service  = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/login?redirect=/biblioteca/${params.id}`)

  // Check plan
  const { data: profile } = await supabase.from('profiles').select('plan, plans, is_admin').eq('id', user.id).single()
  const isAdmin  = (profile as any)?.is_admin ?? false
  const activePlans = resolvePlans((profile as any)?.plans, (profile as any)?.plan)

  if (!canAccessAny(activePlans, 'acervo') && !isAdmin) {
    redirect('/membros?upgrade=acervo')
  }

  // Fetch book (no file_url — that's only served via signed URL endpoint)
  const { data: book } = await service
    .from('biblioteca')
    .select('id, title, author, year, category, cover_url, is_published')
    .eq('id', params.id)
    .single()

  if (!book || (!(book as any).is_published && !isAdmin)) notFound()

  // Get current progress
  const { data: prog } = await service
    .from('biblioteca_progress')
    .select('current_page, total_pages')
    .eq('user_id', user.id)
    .eq('book_id', params.id)
    .single()

  return (
    <PdfReader
      bookId={params.id}
      title={(book as any).title}
      author={(book as any).author}
      initialPage={(prog as any)?.current_page ?? 1}
      initialTotal={(prog as any)?.total_pages ?? 0}
    />
  )
}
