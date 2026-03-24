'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveNextPostAt(date: string): Promise<{ ok: boolean; error?: string }> {
  // Auth: must be logged in admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado' }

  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return { ok: false, error: 'Sem permissão' }

  // Save to site_settings via service role
  const service = createServiceClient()
  const { error } = await service
    .from('site_settings')
    .upsert({
      key: 'next_post_at',
      value: JSON.stringify(date),
      updated_at: new Date().toISOString(),
    })

  if (error) return { ok: false, error: error.message }

  revalidatePath('/')
  revalidatePath('/admin/configuracoes')
  return { ok: true }
}
