# Cloudflare R2 — Setup para a Biblioteca QHIETHUS

## 1. Criar o bucket

No dashboard da Cloudflare:
1. Vá em **R2 Object Storage** → **Create bucket**
2. Nome: `qhiethus-biblioteca` (ou o nome que quiser, vai virar a env var)
3. Location: **Automatic** (ou escolha `ENAM` para América do Norte/Sul)
4. Clique em **Create bucket**

---

## 2. Criar API Token (chaves de acesso)

1. Em R2 → **Manage R2 API tokens** → **Create API token**
2. Permissões: **Object Read & Write**
3. Bucket: selecione somente `qhiethus-biblioteca`
4. Copie:
   - **Access Key ID** → `CLOUDFLARE_R2_ACCESS_KEY_ID`
   - **Secret Access Key** → `CLOUDFLARE_R2_SECRET_ACCESS_KEY`

---

## 3. Pegar o Account ID

Na sidebar do Cloudflare (qualquer página) → lado direito → **Account ID**
→ `CLOUDFLARE_R2_ACCOUNT_ID`

---

## 4. Configurar CORS no bucket

No bucket → **Settings** → **CORS Policy** → cole:

```json
[
  {
    "AllowedOrigins": [
      "https://qhiethus.com",
      "https://www.qhiethus.com",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

> **Importante:** troque `qhiethus.com` pelo seu domínio real.

---

## 5. Variáveis de ambiente

Adicione ao `.env.local` (desenvolvimento) e no painel da Vercel (produção):

```env
CLOUDFLARE_R2_ACCOUNT_ID=seu_account_id_aqui
CLOUDFLARE_R2_ACCESS_KEY_ID=sua_access_key_aqui
CLOUDFLARE_R2_SECRET_ACCESS_KEY=sua_secret_key_aqui
CLOUDFLARE_R2_BUCKET_NAME=qhiethus-biblioteca
```

Na Vercel: **Project → Settings → Environment Variables**

---

## 6. Testar a conexão

Depois de configurar as envs, rode localmente:

```bash
npm run dev
```

Acesse `/control/biblioteca`, crie uma obra de teste com um PDF pequeno.
Se o upload funcionar, o arquivo aparece em **R2 → qhiethus-biblioteca → biblioteca/**.

---

## Como os PDFs ficam organizados no R2

```
qhiethus-biblioteca/
└── biblioteca/
    ├── 1704067200000-livro-hermético.pdf
    ├── 1704067300000-kybalion.pdf
    └── ...
```

A coluna `file_url` na tabela `biblioteca` guarda apenas a **chave** (ex: `biblioteca/1704067200000-livro.pdf`), nunca a URL real.
Quando o leitor abre um livro, o servidor gera uma URL assinada válida por 1 hora via `/api/biblioteca/[id]/url`.
