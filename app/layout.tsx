import type { Metadata } from 'next'
import './globals.css'
import NoiseOverlay from '@/components/layout/NoiseOverlay'
import Nav from '@/components/layout/Nav'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/server'
import { canAccessAny, resolvePlans } from '@/lib/plans'
import type { Profile } from '@/types'
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

<link rel="icon" href="/favicon.ico" sizes="any" />

export const metadata: Metadata = {
  title: {
    default: 'QHIETHUS — Portal Oculto',
    template: '%s — QHIETHUS',
  },
  description:
    'Portal de conhecimento gnóstico, cabalístico e hermético. Transmissões, categorias e comunidade para os que buscam além do véu.',
  keywords: ['hermetismo', 'gnosticismo', 'alquimia', 'tarot', 'ocultismo', 'esoterismo'],
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
  // Fetch minimal profile data needed for Nav (name, plan badge, grimório access)
  let profile: Profile | null = null
  let canUseGrimorio = false
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('name, plan, plans, is_admin')
        .eq('id', user.id)
        .single()
      if (data) {
        profile = data as unknown as Profile
        const activePlans = resolvePlans((data as any).plans, (data as any).plan)
        canUseGrimorio = (data as any).is_admin || canAccessAny(activePlans, 'grimorio')
      }
    }
  } catch {
    // Not authenticated — render without profile
  }

  return (
    <html lang="pt-BR">
      <body>
        <NoiseOverlay />
        <Nav profile={profile} canUseGrimorio={canUseGrimorio} />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
