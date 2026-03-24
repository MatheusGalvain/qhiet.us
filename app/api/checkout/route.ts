import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Guard: ensure Stripe env vars are present
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_ID_INICIADO) {
      console.error('[checkout] Missing Stripe env vars')
      return NextResponse.redirect(new URL('/membros?error=config', request.url))
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const { data: profile } = await supabase
      .from('profiles').select('email, name, is_subscriber').eq('id', user.id).single()

    // Guard: already a subscriber — don't open a new checkout session
    if ((profile as any)?.is_subscriber) {
      return NextResponse.redirect(new URL('/perfil', request.url))
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin

    const session = await createCheckoutSession({
      userId: user.id,
      userEmail: profile?.email ?? user.email!,
      successUrl: `${appUrl}/perfil?upgrade=success`,
      cancelUrl:  `${appUrl}/membros`,
    })

    if (!session.url) {
      console.error('[checkout] Stripe session has no URL')
      return NextResponse.redirect(new URL('/membros?error=stripe', request.url))
    }

    return NextResponse.redirect(session.url, { status: 303 })
  } catch (err) {
    console.error('[checkout] Error:', err)
    return NextResponse.redirect(new URL('/membros?error=stripe', request.url))
  }
}
