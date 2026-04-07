import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { canAccessAny, resolvePlans } from '@/lib/plans'
import PdfReader from '@/components/biblioteca/PdfReader'

export const revalidate = 0

async function getData(id: string) {
  const supabase = await createClient()
  const service  = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, plans, is_admin')
    .eq('id', user.id)
    .single()

  const isAdmin     = (profile as any)?.is_admin ?? false
  const activePlans = resolvePlans((profile as any)?.plans, (profile as any)?.plan)

  const { data: book } = await service
    .from('monthly_books')
    .select('id, title, author, file_key, plan_access, plan, month')
    .eq('id', id)
    .single()

  if (!book) redirect('/perfil')

  const isFree = Array.isArray(book.plan_access)
    ? book.plan_access.includes('profano')
    : book.plan === 'profano'

  if (!isFree && !canAccessAny(activePlans, 'transmissoes_exclusivas') && !isAdmin) {
    redirect('/membros?upgrade=true')
  }

  // Busca progresso salvo
  const { data: progress } = await supabase
    .from('livro_progress')
    .select('current_page, total_pages')
    .eq('user_id', user.id)
    .eq('book_id', id)
    .single()

  return {
    book,
    initialPage:  progress?.current_page  ?? 1,
    initialTotal: progress?.total_pages   ?? 0,
  }
}

export default async function LivroReaderPage({ params }: { params: { id: string } }) {
  const { book, initialPage, initialTotal } = await getData(params.id)

  return (
    <PdfReader
      bookId={book.id}
      title={book.title}
      author={book.author ?? ''}
      initialPage={initialPage}
      initialTotal={initialTotal}
      streamUrl={`/api/livros/${book.id}/stream`}
      progressUrl={`/api/livros/${book.id}/progress`}
      backHref="/perfil#livros"
      backLabel="← Livros"
    />
  )
}
