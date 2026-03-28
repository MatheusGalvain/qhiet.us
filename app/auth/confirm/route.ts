import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { EmailOtpType } from '@supabase/supabase-js'

/**
 * GET /auth/confirm
 *
 * Supabase's default "Confirm signup" email template links to:
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
 *
 * This route handles that confirmation and redirects to /perfil on success.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  const tokenHash = searchParams.get('token_hash')
  const type      = searchParams.get('type') as EmailOtpType | null
  if (tokenHash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })

    if (!error) {
      return NextResponse.redirect(`${origin}/login`)
    }

    console.error('[auth/confirm] verifyOtp failed:', error.message)
  }

  // Token inválido, expirado ou já utilizado
  return NextResponse.redirect(`${origin}/login?error=link_invalido`)
}
