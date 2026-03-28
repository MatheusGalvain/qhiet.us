import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * DELETE /api/account/delete
 *
 * Security layers:
 * 1. Requires authenticated session via Supabase Auth (cannot be spoofed)
 * 2. Verifies the user is NOT an admin — admins are never deletable via this endpoint
 * 3. Requires a confirmation token in the body matching the user's own email
 *    (prevents CSRF and accidental double-clicks)
 * 4. Uses service-role client ONLY for the actual deletion after all checks pass
 * 5. Does NOT accept any user-supplied id — always uses the session identity
 */
export async function DELETE(request: NextRequest) {
  try {
    // ── 1. Verify authenticated session ──────────────────────────────────
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // ── 2. Load profile — block admins unconditionally ───────────────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, email, is_subscriber, stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }

    if (profile.is_admin) {
      // Hard block — admins cannot self-delete through the API
      return NextResponse.json(
        { error: 'Contas de administrador não podem ser excluídas por esta via.' },
        { status: 403 }
      )
    }

    // ── 3. Require email confirmation token from the request body ────────
    const body = await request.json().catch(() => ({}))
    const { confirmEmail } = body as { confirmEmail?: string }

    if (!confirmEmail || confirmEmail.trim().toLowerCase() !== profile.email.trim().toLowerCase()) {
      return NextResponse.json(
        { error: 'E-mail de confirmação incorreto.' },
        { status: 400 }
      )
    }

    // ── 4. Cancel Stripe subscription before deleting (best-effort) ──────
    if (profile.is_subscriber && profile.stripe_customer_id) {
      try {
        const { stripe } = await import('@/lib/stripe/client')
        const subscriptions = await stripe.subscriptions.list({
          customer: profile.stripe_customer_id,
          status: 'active',
          limit: 5,
        })
        for (const sub of subscriptions.data) {
          await stripe.subscriptions.cancel(sub.id)
        }
      } catch (stripeErr) {
        // Log but don't block deletion — account should still be removed
        console.error('[delete-account] Stripe cancel failed:', stripeErr)
      }
    }

    // ── 5. Delete all user data using service role ────────────────────────
    // Order matters: child rows first, then auth user
    const service = createServiceClient()

    await Promise.all([
      service.from('xp_events').delete().eq('user_id', user.id),
      service.from('reading_history').delete().eq('user_id', user.id),
      service.from('quiz_attempts').delete().eq('user_id', user.id),
    ])

    await service.from('profiles').delete().eq('id', user.id)

    // Delete the Supabase Auth user — this invalidates all sessions
    const { error: deleteError } = await service.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error('[delete-account] Failed to delete auth user:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao excluir conta. Contacte o suporte.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[delete-account] Unexpected error:', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
