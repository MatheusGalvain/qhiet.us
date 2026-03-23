import type { Metadata } from 'next'
import './globals.css'
import NoiseOverlay from '@/components/layout/NoiseOverlay'
import Nav from '@/components/layout/Nav'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types'

export const metadata: Metadata = {
  title: {
    default: 'QHIETHUS — Portal Oculto',
    template: '%s — QHIETHUS',
  },
  description:
    'Portal de conhecimento gnóstico, cabalístico e hermético. Transmissões, categorias e comunidade para os que buscam além do véu.',
  keywords: ['hermetismo', 'cabala', 'gnosticismo', 'alquimia', 'tarot', 'ocultismo', 'esoterismo'],
  openGraph: {
    title: 'QHIETHUS — Portal Oculto',
    description: 'Conhecimento além do véu.',
    siteName: 'QHIETHUS',
    locale: 'pt_BR',
    type: 'website',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Fetch user profile server-side for Nav
  let profile: Profile | null = null
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      profile = data
    }
  } catch {
    // Not authenticated — render without profile
  }

  return (
    <html lang="pt-BR">
      <body>
        <NoiseOverlay />
        <Nav profile={profile} />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
