import { Resend } from 'resend'
import type { Plan } from '@/types'

export const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.RESEND_FROM_EMAIL ?? 'livros@qhiethus.com'

/** Books per plan per month */
export const BOOKS_PER_PLAN: Record<Plan, number> = {
  profano:  1,
  iniciado: 4,
}

export async function sendMonthlyBook({
  to,
  name,
  plan,
  bookTitle,
  bookAuthor,
  fileUrl,
  month,
}: {
  to: string
  name: string
  plan: Plan
  bookTitle: string
  bookAuthor: string
  fileUrl: string
  month: string
}) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `📚 Seu livro de ${month} — ${bookTitle}`,
    html: `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head><meta charset="UTF-8"></head>
      <body style="background:#080503;color:#ede5d8;font-family:'Georgia',serif;padding:40px;max-width:600px;margin:0 auto;">
        <p style="font-family:monospace;font-size:11px;letter-spacing:4px;color:#b02a1e;text-transform:uppercase;margin-bottom:24px;">// QHIETHUS · Portal Oculto</p>
        <h1 style="font-size:32px;letter-spacing:4px;color:#ede5d8;margin-bottom:8px;">Sua transmissão<br>chegou.</h1>
        <p style="color:#9a9a9a;margin:16px 0 32px;line-height:1.8;">
          ${name}, como ${plan === 'iniciado' ? 'Iniciado' : 'Profano'} do QHIETHUS,
          aqui está o seu livro do mês de ${month}.
        </p>
        <div style="border:1px solid #1a1410;padding:24px;margin-bottom:32px;">
          <p style="font-family:monospace;font-size:9px;letter-spacing:3px;color:#b02a1e;text-transform:uppercase;margin-bottom:8px;">Livro do Mês</p>
          <p style="font-size:22px;font-style:italic;color:#ede5d8;margin-bottom:4px;">${bookTitle}</p>
          <p style="font-family:monospace;font-size:9px;letter-spacing:2px;color:#9a9a9a;text-transform:uppercase;">${bookAuthor}</p>
        </div>
        <a href="${fileUrl}"
           style="display:inline-block;background:#b02a1e;color:#fff;font-family:monospace;font-size:10px;letter-spacing:4px;text-transform:uppercase;padding:16px 36px;text-decoration:none;margin-bottom:32px;">
          Baixar Livro →
        </a>
        <p style="font-family:monospace;font-size:8px;letter-spacing:2px;color:#1a1410;text-transform:uppercase;border-top:1px solid #1a1410;padding-top:16px;">
          QHIETHUS · Portal Oculto · Est. MMXXVI
        </p>
      </body>
      </html>
    `,
  })
}
