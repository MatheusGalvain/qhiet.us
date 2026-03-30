import { createClient } from '@/lib/supabase/server'
import HermesBot from '@/components/layout/HermesBot'
import ContactForm from './ContactForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Fale Conosco' }

export default async function FaleConoscoPage() {
  // Try to get the logged-in user's profile (optional — page is public)
  let initialName  = ''
  let initialEmail = ''
  let emailLocked  = false

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', user.id)
        .single()

      if (profile) {
        initialName  = profile.name  ?? ''
        initialEmail = profile.email ?? user.email ?? ''
        emailLocked  = true
      }
    }
  } catch {
    // silently ignore — page still works for logged-out users
  }

  return (
    <main style={{ padding: '80px 24px', maxWidth: 640, margin: '0 auto', minHeight: '70vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 48 }}>
        <p style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      10,
          letterSpacing: 4,
          color:         'var(--red)',
          textTransform: 'uppercase',
          marginBottom:  16,
        }}>
          // Suporte
        </p>
        <h1 style={{
          fontFamily:    'var(--font-display)',
          fontSize:      'clamp(32px, 5vw, 48px)',
          letterSpacing: 4,
          color:         'var(--cream)',
          margin:        0,
          marginBottom:  16,
        }}>
          Fale Conosco
        </h1>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize:   15,
          color:      'var(--muted)',
          lineHeight: 1.8,
          margin:     0,
        }}>
          Dúvidas, sugestões ou problemas com o portal? Preencha o formulário abaixo
          e responderemos pelo seu e-mail o mais breve possível.
        </p>
      </div>

      <ContactForm
        initialName={initialName}
        initialEmail={initialEmail}
        emailLocked={emailLocked}
      />

      <HermesBot message="Se você tiver alguma dúvida, entre em contato conosco. Responderemos o mais breve possível." />
    </main>
  )
}
