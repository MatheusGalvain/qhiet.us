import { Resend } from 'resend'
import nodemailer from 'nodemailer'
import type { Plan } from '@/types'

/** Instancia o Resend sob demanda — evita crash se RESEND_API_KEY não estiver definida */
export function getResend(): Resend {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY não configurada')
  return new Resend(key)
}

/** @deprecated use getResend() — mantido para compatibilidade com imports existentes */
export const resend = { emails: { send: (payload: any) => getResend().emails.send(payload) } } as unknown as Resend

const FROM    = process.env.RESEND_FROM_EMAIL ?? 'livros@qhiethus.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.qhiethus.com.br'

/** Nodemailer transporter usando a conta Gmail do QHIETHUS */
function createGmailTransport() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}

/* ─── Shared layout helpers ─────────────────────────────────────── */
const emailWrap = (body: string) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#080503;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080503;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#080503;">
        <!-- Header -->
        <tr><td style="padding-bottom:32px;border-bottom:1px solid #1a1410;">
          <p style="margin:0;font-family:monospace;font-size:10px;letter-spacing:5px;color:#b02a1e;text-transform:uppercase;">
            ✦ QHIETHUS · PORTAL OCULTO
          </p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding-top:40px;">
          ${body}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding-top:48px;border-top:1px solid #1a1410;margin-top:48px;">
          <p style="margin:0;font-family:monospace;font-size:8px;letter-spacing:3px;color:#2a2018;text-transform:uppercase;">
            QHIETHUS · PORTAL OCULTO · EST. MMXXVI<br>
            <a href="${APP_URL}/politica-de-privacidade" style="color:#2a2018;text-decoration:none;">Política de Privacidade</a>
            &nbsp;·&nbsp;
            <a href="${APP_URL}/termos-de-uso" style="color:#2a2018;text-decoration:none;">Termos de Uso</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

const ctaBtn = (url: string, label: string, color = '#b02a1e') =>
  `<a href="${url}" style="display:inline-block;background:${color};color:#fff;font-family:monospace;font-size:10px;letter-spacing:4px;text-transform:uppercase;padding:16px 36px;text-decoration:none;">${label}</a>`

const infoBox = (tagline: string, lines: string[]) =>
  `<div style="border:1px solid #1a1410;padding:24px;margin:32px 0;">
    <p style="margin:0 0 16px;font-family:monospace;font-size:9px;letter-spacing:3px;color:#b02a1e;text-transform:uppercase;">${tagline}</p>
    ${lines.map(l => `<p style="margin:0 0 8px;font-family:monospace;font-size:12px;color:#9a9a9a;line-height:1.7;">${l}</p>`).join('')}
  </div>`

/* ─── Welcome emails ─────────────────────────────────────────────── */

/**
 * Envia o e-mail de boas-vindas correto para o plano do usuário.
 * Usa Resend idempotencyKey para evitar envios duplicados (webhook + activate).
 */
export async function sendWelcomeEmail({
  to,
  name,
  plan,
}: {
  to: string
  name: string
  plan: 'profano' | 'iniciado' | 'acervo' | 'adepto'
}) {
  const firstName = name.split(' ')[0] || name

  const configs: Record<typeof plan, { subject: string; html: string }> = {

    /* ── PROFANO ──────────────────────────────────────────────────── */
    profano: {
      subject: 'A porta se abriu — bem-vindo ao QHIETHUS',
      html: emailWrap(`
        <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:36px;letter-spacing:4px;color:#ede5d8;line-height:1.2;">
          A porta<br>se abriu.
        </h1>
        <p style="margin:24px 0 32px;font-family:Georgia,serif;font-size:15px;color:#9a9a9a;line-height:1.8;">
          ${firstName}, seu acesso ao <strong style="color:#ede5d8;">QHIETHUS</strong> está confirmado.
          O portal está à sua espera — o que você encontrar aqui
          dependerá apenas do quanto você está disposto a ver.
        </p>
        ${infoBox('O que está disponível para você', [
          '◎ &nbsp;Transmissões gratuitas — textos e reflexões do arquivo',
          '◎ &nbsp;Trilha de boas-vindas — sua primeira jornada iniciática',
          '◎ &nbsp;Categorias — Hermetismo, Gnose, Alquimia, Kabbalah e mais',
          '○ &nbsp;Livro do mês — 1 título por mês no Plano Profano',
        ])}
        ${ctaBtn(`${APP_URL}/perfil`, 'Entrar no Portal →')}
        <p style="margin:32px 0 0;font-family:monospace;font-size:11px;letter-spacing:2px;color:#3a2e22;line-height:1.8;">
          Quando estiver pronto para ir mais fundo, o Plano Iniciado
          abre as trilhas completas, o Grimório e o arquivo exclusivo.<br>
          <a href="${APP_URL}/membros" style="color:#b02a1e;text-decoration:none;">Ver planos →</a>
        </p>
      `),
    },

    /* ── INICIADO ─────────────────────────────────────────────────── */
    iniciado: {
      subject: 'Sua iniciação foi aceita — QHIETHUS Iniciado',
      html: emailWrap(`
        <p style="margin:0 0 16px;font-family:monospace;font-size:10px;letter-spacing:4px;color:#b02a1e;text-transform:uppercase;">
          ◈ Plano Iniciado Ativo
        </p>
        <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:36px;letter-spacing:4px;color:#ede5d8;line-height:1.2;">
          Sua iniciação<br>foi aceita.
        </h1>
        <p style="margin:24px 0 32px;font-family:Georgia,serif;font-size:15px;color:#9a9a9a;line-height:1.8;">
          ${firstName}, você cruzou o limiar. O QHIETHUS completo
          está agora aberto para você — as trilhas, o grimório, o arquivo e
          os livros que chegam mês a mês.
        </p>
        ${infoBox('Acesso completo desbloqueado', [
          '✦ &nbsp;Todas as Trilhas de Iniciação — com mapa interativo e progresso',
          '✦ &nbsp;Grimório pessoal — anote suas reflexões em cada trilha e livro',
          '✦ &nbsp;Arquivo completo de Transmissões — todo o conteúdo exclusivo',
          '✦ &nbsp;Até 4 livros por mês — enviados diretamente ao seu e-mail',
          '✦ &nbsp;XP e ranking — evolua na hierarquia do portal',
        ])}
        ${ctaBtn(`${APP_URL}/perfil/trilhas`, 'Iniciar minha Trilha →')}
        <p style="margin:32px 0 0;font-family:monospace;font-size:11px;letter-spacing:2px;color:#3a2e22;line-height:1.8;">
          Seu perfil e histórico de progresso ficam salvos para sempre.<br>
          Dúvidas? <a href="${APP_URL}/fale-conosco" style="color:#b02a1e;text-decoration:none;">Fale conosco →</a>
        </p>
      `),
    },

    /* ── ACERVO ───────────────────────────────────────────────────── */
    acervo: {
      subject: 'O Acervo está aberto — QHIETHUS Biblioteca',
      html: emailWrap(`
        <p style="margin:0 0 16px;font-family:monospace;font-size:10px;letter-spacing:4px;color:#b02a1e;text-transform:uppercase;">
          ◈ Plano Acervo Ativo
        </p>
        <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:36px;letter-spacing:4px;color:#ede5d8;line-height:1.2;">
          O Acervo<br>está aberto.
        </h1>
        <p style="margin:24px 0 32px;font-family:Georgia,serif;font-size:15px;color:#9a9a9a;line-height:1.8;">
          ${firstName}, a Biblioteca do QHIETHUS está disponível para você.
          Textos raros, tratados herméticos e obras essenciais das tradições
          ocultas — todos acessíveis no seu perfil.
        </p>
        ${infoBox('O que o Plano Acervo inclui', [
          '✦ &nbsp;Acesso completo à Biblioteca — leitura online no portal',
          '✦ &nbsp;Até 2 livros por mês via e-mail — para leitura offline',
          '✦ &nbsp;Grimório de leitura — anote reflexões em cada obra',
          '✦ &nbsp;Progresso salvo — continue de onde parou em qualquer dispositivo',
        ])}
        ${ctaBtn(`${APP_URL}/perfil/biblioteca`, 'Abrir a Biblioteca →')}
        <p style="margin:32px 0 0;font-family:monospace;font-size:11px;letter-spacing:2px;color:#3a2e22;line-height:1.8;">
          Quer também as Trilhas de Iniciação e o arquivo completo de transmissões?<br>
          <a href="${APP_URL}/membros" style="color:#b02a1e;text-decoration:none;">Conhecer o Plano Iniciado →</a>
        </p>
      `),
    },

    /* ── ADEPTO ───────────────────────────────────────────────────── */
    adepto: {
      subject: 'Você ascendeu — QHIETHUS Adepto',
      html: emailWrap(`
        <p style="margin:0 0 16px;font-family:monospace;font-size:10px;letter-spacing:4px;color:#d4af37;text-transform:uppercase;">
          ✦ Plano Adepto Ativo
        </p>
        <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:36px;letter-spacing:4px;color:#ede5d8;line-height:1.2;">
          Você<br>ascendeu.
        </h1>
        <p style="margin:24px 0 32px;font-family:Georgia,serif;font-size:15px;color:#9a9a9a;line-height:1.8;">
          ${firstName}, o grau de Adepto foi conferido. Você agora carrega
          acesso irrestrito ao QHIETHUS — as trilhas mais profundas, o arquivo
          completo, a biblioteca e os livros mensais. Nenhum véu permanece.
        </p>
        <div style="border:1px solid #4a3a10;background:rgba(212,175,55,0.04);padding:24px;margin:32px 0;">
          <p style="margin:0 0 16px;font-family:monospace;font-size:9px;letter-spacing:3px;color:#d4af37;text-transform:uppercase;">Acesso Completo — Grau Adepto</p>
          <p style="margin:0 0 8px;font-family:monospace;font-size:12px;color:#9a9a9a;line-height:1.7;">✦ &nbsp;Todas as Trilhas de Iniciação — incluindo os graus avançados</p>
          <p style="margin:0 0 8px;font-family:monospace;font-size:12px;color:#9a9a9a;line-height:1.7;">✦ &nbsp;Grimório pessoal — sem limites de anotações</p>
          <p style="margin:0 0 8px;font-family:monospace;font-size:12px;color:#9a9a9a;line-height:1.7;">✦ &nbsp;Arquivo completo de Transmissões — todo o conteúdo publicado</p>
          <p style="margin:0 0 8px;font-family:monospace;font-size:12px;color:#9a9a9a;line-height:1.7;">✦ &nbsp;Biblioteca completa — leitura online de todo o acervo</p>
          <p style="margin:0 0 8px;font-family:monospace;font-size:12px;color:#9a9a9a;line-height:1.7;">✦ &nbsp;Até 4 livros por mês — entregues no seu e-mail</p>
          <p style="margin:0;font-family:monospace;font-size:12px;color:#d4af37;line-height:1.7;">✦ &nbsp;XP e ranking — caminho até o topo da hierarquia</p>
        </div>
        ${ctaBtn(`${APP_URL}/perfil`, 'Entrar no Portal →', '#b8860b')}
        <p style="margin:32px 0 0;font-family:monospace;font-size:11px;letter-spacing:2px;color:#3a2e22;line-height:1.8;">
          Dúvidas ou questões sobre sua conta?<br>
          <a href="${APP_URL}/fale-conosco" style="color:#b02a1e;text-decoration:none;">Fale conosco →</a>
        </p>
      `),
    },
  }

  const { subject, html } = configs[plan]

  const transporter = createGmailTransport()
  return transporter.sendMail({
    from: `"QHIETHUS · Portal Oculto" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  })
}

/** Books per plan per month */
export const BOOKS_PER_PLAN: Record<Plan, number> = {
  profano:  1,
  iniciado: 4,
  adepto:   4,
  acervo:   2,
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
