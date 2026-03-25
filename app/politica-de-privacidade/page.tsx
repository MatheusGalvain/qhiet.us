import HermesBot from '@/components/layout/HermesBot'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export default async function PoliticaPage() {
    return(
        <div style={{ padding: 'clamp(40px,6vw,72px) var(--px)', borderRight: '1px solid var(--faint)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 24 }}>
          <div>
            <p className="eyebrow" style={{ marginBottom: 20 }}>Você está em · Politica de Privacidade</p>

            <h1 className="hero-title-xl" style={{ marginBottom: 40 }}>
              Políticas <span style={{ color: 'var(--red)' }}> De </span> Privacidade
            </h1>

            <p style={{ marginBottom: 20 }}>
                A sua privacidade é importante para nós. É política do <strong>QHIETHUS</strong> respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar no site, e outros sites que possuímos e operamos.
            </p>

            <p style={{ marginBottom: 20 }}>
                Solicitamos informações pessoais apenas quando realmente precisamos delas para lhe fornecer um serviço. Fazemo-lo por meios justos e legais, com o seu conhecimento e consentimento. Também informamos por que estamos coletando e como será usado.
            </p>

            <p style={{ marginBottom: 20 }}>
                Apenas retemos as informações coletadas pelo tempo necessário para fornecer o serviço solicitado. Protegemos os dados dentro de meios comercialmente aceitáveis ​​para evitar perdas e roubos, bem como acesso, divulgação ou modificação não autorizados.
            </p>

            <p style={{ marginBottom: 20 }}>
                Não compartilhamos informações de identificação pessoal publicamente ou com terceiros, exceto quando exigido por lei. Nosso site pode conter links para sites externos; esteja ciente de que não temos controle sobre o conteúdo e práticas desses sites.
            </p>

            <h3 style={{ color: 'var(--foreground)', marginBottom: 15, fontSize: '1.2em' }}>Compromisso do Usuário</h3>
            
            <p style={{ marginBottom: 15 }}>
                O usuário se compromete a fazer uso adequado dos conteúdos e da informação que o <strong>QHIETHUS</strong> oferece, o que inclui, mas não se limita a:
            </p>

            <ul style={{ paddingLeft: 20, marginBottom: 25, listStyleType: 'none' }}>
                <li style={{ marginBottom: 10 }}>
                <span style={{ color: 'var(--red)', marginRight: 10 }}>A)</span> 
                Não se envolver em atividades ilegais ou contrárias à boa fé e à ordem pública;
                </li>
                <li style={{ marginBottom: 10 }}>
                <span style={{ color: 'var(--red)', marginRight: 10 }}>B)</span> 
                Não difundir propaganda de natureza racista, xenofóbica, jogos de azar ou apologia ao terrorismo;
                </li>
                <li style={{ marginBottom: 10 }}>
                <span style={{ color: 'var(--red)', marginRight: 10 }}>C)</span> 
                Não causar danos aos sistemas físicos (hardware) e lógicos (software) do portal ou de terceiros.
                </li>
            </ul>

            <h3 style={{ color: 'var(--foreground)', marginBottom: 15, fontSize: '1.2em' }}>Mais informações</h3>
            
            <p>
                Esperamos que esteja esclarecido. Como mencionado anteriormente, se houver algo que você não tem certeza se precisa ou não, geralmente é mais seguro deixar os cookies ativados, caso interaja com um dos recursos que você usa em nosso site.
            </p>
            
            <p style={{ marginTop: 20, fontSize: '0.9em', opacity: 0.8 }}>
                Esta política é efetiva a partir de <strong>Março/2026</strong>.
            </p>
          </div>
        </div>
    )
}