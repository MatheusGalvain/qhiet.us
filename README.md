# QHIETHUS — Portal Oculto

Portal de conhecimento gnóstico, cabalístico e hermético construído com **Next.js 14 App Router**, **Supabase**, **Stripe** e **Resend**.

---

## Stack

| Serviço | Uso |
|---|---|
| **Next.js 14** | Framework (App Router, Server Components, ISR) |
| **Supabase** | Auth (email + Google OAuth), banco de dados, RLS |
| **Stripe** | Plano Iniciado (R$29/mês) + webhook |
| **Resend** | Envio de livros mensais por e-mail |
| **OpenAI GPT-4o-mini** | Geração do quiz Hermes |
| **Vercel** | Deploy + Edge Runtime |

---

## Estrutura de Pastas

```
qhiethus/
├── app/
│   ├── page.tsx                    ← Home
│   ├── transmissoes/page.tsx       ← Lista de artigos
│   ├── artigo/[slug]/page.tsx      ← Artigo interno + paywall + quiz
│   ├── categorias/
│   │   ├── page.tsx                ← Lista de categorias
│   │   └── [slug]/page.tsx         ← Categoria interna
│   ├── membros/page.tsx            ← Planos + comparação
│   ├── perfil/page.tsx             ← XP, histórico, livros
│   ├── login/page.tsx              ← Login + Cadastro
│   └── api/
│       ├── checkout/route.ts       ← Redireciona para Stripe
│       ├── webhooks/stripe/route.ts← Webhook Stripe → atualiza DB
│       ├── quiz/route.ts           ← Gera quiz via OpenAI
│       ├── xp/route.ts             ← Registra XP
│       └── auth/{callback,logout}/ ← Auth callbacks
├── components/
│   ├── layout/   Nav · NoiseOverlay · HermesBot
│   ├── ui/       Wordmark · Sigil · Avatar · CategoryTag
│   ├── home/     Hero
│   ├── transmissoes/  TransmissaoCard · FilterBar
│   ├── artigo/   ReadingProgress · PaywallOverlay · HermesQuiz
│   ├── categorias/    (via páginas)
│   ├── membros/       (via página)
│   └── perfil/        (via página)
├── lib/
│   ├── supabase/  client.ts · server.ts
│   ├── stripe/    client.ts
│   ├── resend/    client.ts
│   └── utils.ts
├── types/index.ts
├── middleware.ts       ← Auth guard
└── supabase/schema.sql ← Schema SQL completo
```

---

## Setup

### 1. Clonar e instalar

```bash
git clone <repo>
cd qhiethus
npm install
```

### 2. Variáveis de ambiente

Copie `.env.local.example` para `.env.local` e preencha:

```bash
cp .env.local.example .env.local
```

### 3. Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. No SQL Editor, rode todo o conteúdo de `supabase/schema.sql`
3. Em **Authentication → Providers**, habilite **Google** (OAuth)
4. Copie `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` das configurações do projeto
5. Copie `SUPABASE_SERVICE_ROLE_KEY` das configurações → API

### 4. Stripe

1. Crie um produto "Iniciado" com preço recorrente de R$29/mês
2. Copie o **Price ID** para `STRIPE_PRICE_INICIADO`
3. Configure o webhook no Stripe Dashboard apontando para `https://seu-dominio.com/api/webhooks/stripe`
4. Eventos necessários:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `customer.subscription.paused`
   - `customer.subscription.resumed`
   - `invoice.payment_succeeded`

### 5. Resend

1. Crie uma conta em [resend.com](https://resend.com)
2. Adicione e verifique seu domínio de envio
3. Copie a API Key para `RESEND_API_KEY`

### 6. Rodar localmente

```bash
npm run dev
# Abra http://localhost:3000
```

Para testar webhooks do Stripe localmente:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## Deploy (Vercel)

```bash
npx vercel --prod
```

Configure as variáveis de ambiente no painel da Vercel.

---

## Funcionalidades

### Acesso Livre vs Assinante (RLS)

O controle de acesso é feito em **duas camadas**:

1. **Supabase RLS** — políticas SQL bloqueiam queries de artigos `locked` para não-assinantes
2. **Page-level** — o server component verifica `is_subscriber` e renderiza `<PaywallOverlay>` se necessário

### Quiz Hermes (IA)

- Gerado por **GPT-4o-mini** na primeira vez que um assinante chega ao final de um artigo
- Armazenado na tabela `quizzes` para evitar re-geração
- 5 questões de múltipla escolha com explicação
- Concede XP proporcional ao acerto

### Sistema de XP & Rank

| Rank | XP mínimo |
|---|---|
| Profano | 0 |
| Neófito | 100 |
| Zelador | 300 |
| Teórico | 600 |
| Practicus | 1000 |
| Philosophus | 1800 |
| Adeptus | 3000 |
| Magister | 5000 |

### Livros Mensais (Resend)

- Tabela `monthly_books` com campo `plan_access` (`['profano']` ou `['profano','iniciado']`)
- Script de envio: crie um cron job (Vercel Cron ou Supabase Edge Function) chamando `/api/send-books`
- Profano: 1 livro/mês · Iniciado: 4 livros/mês

---

## Paleta & Tipografia

```css
--ink:    #080503  /* fundo */
--red:    #b02a1e  /* vermelho principal */
--gold:   #c8960a  /* dourado */
--cream:  #ede5d8  /* creme */

Fontes: Bebas Neue · Sorts Mill Goudy · DM Mono · Playfair Display
```
