import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { sendWelcomeEmail } from '@/lib/resend/client'

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
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })

    if (!error) {
      // Envia e-mail de boas-vindas apenas para novos cadastros (type=email)
      // Não envia em reset de senha (type=recovery) ou outras confirmações
      if (type === 'email' && data.user) {
        const user  = data.user
        const email = user.email ?? ''
        const name  = (user.user_metadata?.name as string | undefined)
                   ?? (user.user_metadata?.full_name as string | undefined)
                   ?? email.split('@')[0]
        // Fire-and-forget — não bloqueia o redirect se o e-mail falhar
        sendWelcomeEmail({ to: email, name, plan: 'profano' }).catch(err =>
          console.error('[auth/confirm] welcome email error:', err)
        )
      }

      return NextResponse.redirect(`${origin}/login`)
    }

    console.error('[auth/confirm] verifyOtp failed:', error.message)
  }

  // Token inválido, expirado ou já utilizado
  return NextResponse.redirect(`${origin}/login?error=link_invalido`)
}
