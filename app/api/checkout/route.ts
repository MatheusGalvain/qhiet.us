import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const { data: profile } = await supabase
    .from('profiles').select('email, name').eq('id', user.id).single()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin

  const session = await createCheckoutSession({
    userId: user.id,
    userEmail: profile?.email ?? user.email!,
    successUrl: `${appUrl}/perfil?upgrade=success`,
    cancelUrl: `${appUrl}/membros`,
  })

  return NextResponse.redirect(session.url!)
}
