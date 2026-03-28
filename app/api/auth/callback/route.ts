import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  const code       = searchParams.get('code')
  const tokenHash  = searchParams.get('token_hash')
  const type       = searchParams.get('type') as EmailOtpType | null
  const redirect   = searchParams.get('redirect') ?? '/perfil'

  const supabase = await createClient()

  // ── Flow 1: PKCE code exchange (OAuth, magic link via PKCE) ──────────
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${redirect}`)
    }
  }

  // ── Flow 2: token_hash (email confirmation, password reset OTP) ──────
  // This is what Supabase sends in the default "Confirm signup" email.
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (!error) {
      return NextResponse.redirect(`${origin}/login`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
