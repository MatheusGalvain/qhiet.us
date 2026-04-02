import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import AdminNav from '@/components/admin/AdminNav'

export const metadata = { title: 'QHIETHUS' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Allow /admin/login to render without auth — avoids redirect loop
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? ''
  if (pathname === '/control/login') {
    return <>{children}</>
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/control/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, name, email')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/control/login')

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <AdminNav adminName={profile.name} adminEmail={profile.email} />
      <main style={{ flex: 1, padding: '40px 48px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
