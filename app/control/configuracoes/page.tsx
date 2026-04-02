import { createServiceClient } from '@/lib/supabase/server'
import ConfiguracoesForm from '@/components/admin/ConfiguracoesForm'

export const revalidate = 0

async function getSettings() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('site_settings')
    .select('key, value')
  const map: Record<string, string> = {}
  for (const row of data ?? []) {
    map[row.key] = typeof row.value === 'string' ? row.value : JSON.parse(JSON.stringify(row.value))
  }
  return map
}

export default async function ConfiguracoesPage() {
  const settings = await getSettings()
  const nextPostAt: string = settings['next_post_at'] ?? ''

  return (
    <div>
      <div style={{ marginBottom: 40 }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--red)', marginBottom: 8 }}>
          Painel de Controle
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, letterSpacing: 2, color: 'var(--cream)', lineHeight: 1 }}>
          Configurações
        </h1>
      </div>

      {/* Countdown */}
      <section style={{ border: '1px solid var(--faint)', padding: '32px', maxWidth: 520, marginBottom: 32 }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--red)', marginBottom: 4 }}>
          // Próxima Postagem
        </p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.6 }}>
          Data exibida no contador da home page. Aparece no card do artigo em destaque como "Em X dias".
        </p>
        <ConfiguracoesForm nextPostAt={nextPostAt} />
      </section>
    </div>
  )
}
