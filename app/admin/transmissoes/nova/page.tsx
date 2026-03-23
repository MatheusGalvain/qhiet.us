import TransmissaoForm from '@/components/admin/TransmissaoForm'
import Link from 'next/link'

export const metadata = { title: 'Nova Transmissão — Admin QHIETHUS' }

export default function NovaTransmissaoPage() {
  return (
    <div>
      <div style={{ marginBottom: 40 }}>
        <Link href="/admin/transmissoes" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--muted)', textDecoration: 'none' }}>
          ← Transmissões
        </Link>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, letterSpacing: 2, color: 'var(--cream)', lineHeight: 1, marginTop: 12 }}>
          Nova Transmissão
        </h1>
      </div>
      <TransmissaoForm mode="create" />
    </div>
  )
}
