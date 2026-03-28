import HermesBot from '@/components/layout/HermesBot'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export default async function TermosPage() {
  return (
    <div style={{ padding: 'clamp(40px,6vw,72px) var(--px)', borderRight: '1px solid var(--faint)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 24 }}>
      <div>
        {/* BreadCrumbs */}
        <p className="eyebrow" style={{ marginBottom: 20 }}>Você está em · Termos de Uso</p>

        {/* Titulo */}
        <h1 className="hero-title-xl" style={{ marginBottom: 40 }}>
          Termos <span style={{ color: 'var(--red)' }}> De </span> Uso
        </h1>

        {/* Body */}
        <div style={{ fontFamily: 'var(--font-mono)' }}>
          <p style={{ marginBottom: 20 }}>
            Ao acessar e utilizar o site <strong>QHIETHUS</strong>, você concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis ​​e concorda que é responsável pelo cumprimento de todas as leis locais aplicáveis.
          </p>

          <h3 style={{ color: 'var(--foreground)', marginBottom: 15, fontSize: '1.2em' }}>1. Licença de Uso</h3>
          <p style={{ marginBottom: 20 }}>
            É concedida permissão para baixar temporariamente uma cópia dos materiais (informações ou software) no site QHIETHUS, apenas para visualização pessoal e não comercial transitória. Sob esta licença, você não pode:
          </p>

          <ul style={{ paddingLeft: 20, marginBottom: 25, listStyleType: 'none' }}>
            <li style={{ marginBottom: 10 }}>
              <span style={{ color: 'var(--red)', marginRight: 10 }}>•</span>
              Modificar ou copiar os materiais;
            </li>
            <li style={{ marginBottom: 10 }}>
              <span style={{ color: 'var(--red)', marginRight: 10 }}>•</span>
              Usar os materiais para qualquer finalidade comercial;
            </li>
            <li style={{ marginBottom: 10 }}>
              <span style={{ color: 'var(--red)', marginRight: 10 }}>•</span>
              Tentar descompilar ou fazer engenharia reversa de qualquer software contido no portal;
            </li>
            <li style={{ marginBottom: 10 }}>
              <span style={{ color: 'var(--red)', marginRight: 10 }}>•</span>
              Remover quaisquer direitos autorais ou outras notações de propriedade.
            </li>
          </ul>

          <h3 style={{ color: 'var(--foreground)', marginBottom: 15, fontSize: '1.2em' }}>2. Isenção de Responsabilidade</h3>
          <p style={{ marginBottom: 20 }}>
            Os materiais no site da <strong>QHIETHUS</strong> são fornecidos 'como estão'. Não oferecemos garantias, expressas ou implícitas, e, por este meio, isentamos e negamos todas as outras garantias, incluindo, sem limitação, garantias implícitas ou condições de comercialização ou adequação a um fim específico.
          </p>

          <h3 style={{ color: 'var(--foreground)', marginBottom: 15, fontSize: '1.2em' }}>3. Limitações</h3>
          <p style={{ marginBottom: 20 }}>
            Em nenhum caso o <strong>QHIETHUS</strong> ou seus fornecedores serão responsáveis ​​por quaisquer danos decorrentes do uso ou da incapacidade de usar os materiais, mesmo que tenhamos sido notificados oralmente ou por escrito da possibilidade de tais danos.
          </p>

          <h3 style={{ color: 'var(--foreground)', marginBottom: 15, fontSize: '1.2em' }}>4. Precisão dos Materiais</h3>
          <p style={{ marginBottom: 20 }}>
            Os materiais exibidos no site podem incluir erros técnicos, tipográficos ou fotográficos. O QHIETHUS não garante que qualquer material em seu site seja preciso, completo ou atual, podendo realizar alterações sem aviso prévio.
          </p>

          <h3 style={{ color: 'var(--foreground)', marginBottom: 15, fontSize: '1.2em' }}>5. Links</h3>
          <p style={{ marginBottom: 20 }}>
            O <strong>QHIETHUS</strong> não analisou todos os sites vinculados e não é responsável pelo conteúdo de nenhum site de terceiros. A inclusão de qualquer link não implica endosso por nossa parte.
          </p>

          <p style={{ marginTop: 20, fontSize: '0.9em', opacity: 0.8 }}>
            Estes termos são efetivos a partir de <strong>Março/2026</strong>.
          </p>
        </div>
      </div>
    </div>
  )
}