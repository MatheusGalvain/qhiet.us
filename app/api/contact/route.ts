import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export const dynamic = 'force-dynamic'

const TO = 'suporteqhiethus@gmail.com'
const COOLDOWN_MS = 60 * 1000 // 1 minuto entre envios por IP

// In-memory rate limit (resets com deploy — suficiente para anti-spam básico)
const lastSent = new Map<string, number>()

export async function POST(request: NextRequest) {
  try {
    // Rate limit por IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
             ?? request.headers.get('x-real-ip')
             ?? 'unknown'
    const now = Date.now()
    const last = lastSent.get(ip) ?? 0
    const remaining = Math.ceil((COOLDOWN_MS - (now - last)) / 1000)

    if (now - last < COOLDOWN_MS) {
      return NextResponse.json(
        { error: `Aguarde ${remaining}s antes de enviar outra mensagem.` },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { name, email, title, message } = body

    if (!name?.trim() || !email?.trim() || !title?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios.' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 })
    }

    if (name.trim().length > 100 || title.trim().length > 200 || message.trim().length > 5000) {
      return NextResponse.json({ error: 'Campo excede o tamanho máximo.' }, { status: 400 })
    }

    const user = process.env.GMAIL_USER
    const pass = process.env.GMAIL_APP_PASSWORD

    if (!user || !pass) {
      console.error('[contact] GMAIL_USER ou GMAIL_APP_PASSWORD não configurados')
      return NextResponse.json({ error: 'Serviço de e-mail não configurado.' }, { status: 500 })
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    })

    await transporter.sendMail({
      from:     `"QHIETHUS · Fale Conosco" <${user}>`,
      to:       TO,
      replyTo:  email.trim(),
      subject:  `[Fale Conosco] ${title.trim()}`,
      text:     `De: ${name.trim()} <${email.trim()}>\n\n${message.trim()}`,
      html: `
        <div style="background:#080503;color:#ede5d8;font-family:Georgia,serif;padding:40px;max-width:600px;margin:0 auto;">
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
          <p style="font-family:monospace;font-size:8px;letter-spacing:2px;color:#333;text-transform:uppercase;border-top:1px solid #1a1410;padding-top:16px;">QHIETHUS · Portal Oculto · Est. MMXXVI</p>
        </div>
      `,
    })

    // Registra o IP após envio bem-sucedido
    lastSent.set(ip, Date.now())

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[contact] erro ao enviar e-mail:', err)
    return NextResponse.json({ error: 'Erro ao enviar mensagem. Tente novamente.' }, { status: 500 })
  }
}
