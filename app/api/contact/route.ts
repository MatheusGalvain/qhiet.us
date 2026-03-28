import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

const SUPPORT_EMAIL = 'suporteqhiethus@gmail.com'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, title, message } = body

    // Basic validation
    if (!name?.trim() || !email?.trim() || !title?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios.' }, { status: 400 })
    }

    // Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 })
    }

    // Length limits
    if (name.trim().length > 100) {
      return NextResponse.json({ error: 'Nome muito longo.' }, { status: 400 })
    }
    if (title.trim().length > 200) {
      return NextResponse.json({ error: 'Título muito longo.' }, { status: 400 })
    }
    if (message.trim().length > 5000) {
      return NextResponse.json({ error: 'Mensagem muito longa (máx. 5000 caracteres).' }, { status: 400 })
    }

    // Instantiate inside the handler so RESEND_API_KEY is only read at runtime
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.error('[contact] RESEND_API_KEY not set')
      return NextResponse.json({ error: 'Serviço de e-mail não configurado.' }, { status: 500 })
    }
    const resend = new Resend(apiKey)

    const from = process.env.RESEND_FROM_EMAIL ?? 'livros@qhiethus.com'

    const { error } = await resend.emails.send({
      from,
      to: SUPPORT_EMAIL,
      reply_to: email.trim(),
      subject: `[Fale Conosco] ${title.trim()}`,
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head><meta charset="UTF-8"></head>
        <body style="background:#080503;color:#ede5d8;font-family:'Georgia',serif;padding:40px;max-width:600px;margin:0 auto;">
          <p style="font-family:monospace;font-size:11px;letter-spacing:4px;color:#b02a1e;text-transform:uppercase;margin-bottom:24px;">// QHIETHUS · Fale Conosco</p>
          <h2 style="font-size:22px;letter-spacing:2px;color:#ede5d8;margin-bottom:24px;">${title.trim()}</h2>
          <div style="border:1px solid #1a1410;padding:24px;margin-bottom:24px;">
            <p style="font-family:monospace;font-size:9px;letter-spacing:3px;color:#b02a1e;text-transform:uppercase;margin-bottom:8px;">Remetente</p>
            <p style="font-size:15px;color:#ede5d8;margin:0 0 4px;">${name.trim()}</p>
            <p style="font-family:monospace;font-size:12px;color:#9a9a9a;margin:0;">${email.trim()}</p>
          </div>
          <div style="border:1px solid #1a1410;padding:24px;margin-bottom:24px;">
            <p style="font-family:monospace;font-size:9px;letter-spacing:3px;color:#b02a1e;text-transform:uppercase;margin-bottom:12px;">Mensagem</p>
            <p style="font-size:15px;color:#ede5d8;line-height:1.8;white-space:pre-wrap;margin:0;">${message.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          </div>
          <p style="font-family:monospace;font-size:8px;letter-spacing:2px;color:#1a1410;text-transform:uppercase;border-top:1px solid #1a1410;padding-top:16px;">
            QHIETHUS · Portal Oculto · Est. MMXXVI
          </p>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error('[contact] Resend error:', error)
      return NextResponse.json({ error: 'Falha ao enviar mensagem. Tente novamente.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[contact] Unexpected error:', err)
    return NextResponse.json({ error: 'Erro inesperado. Tente novamente.' }, { status: 500 })
  }
}
