import type { Metadata } from 'next'
import LegalLayout, { LegalH2, LegalP, LegalUL, LegalLI, S } from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description: 'Como o QHIETHUS coleta, usa e protege seus dados pessoais, em conformidade com a LGPD.',
}

export default function PoliticaPrivacidadePage() {
  return (
    <LegalLayout
      label="Política de Privacidade"
      title="POLÍTICA DE PRIVACIDADE"
      date="Última atualização: Março de 2026"
      intro="O QHIETHUS respeita sua privacidade. Este documento explica de forma clara quais dados coletamos, como os utilizamos, e quais são seus direitos como titular. Estamos em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)."
    >

      <LegalH2>Quem somos</LegalH2>
      <LegalP>
        O QHIETHUS é um portal de conhecimento ocultista operado como pessoa jurídica brasileira.
        Para dúvidas sobre privacidade, entre em contato pelo e-mail{' '}
        <S>suporteqhiethus@gmail.com</S>.
      </LegalP>

      <LegalH2>Quais dados coletamos</LegalH2>
      <LegalP>Coletamos apenas os dados necessários para o funcionamento do portal:</LegalP>
      <LegalUL>
        <LegalLI><S>Dados de cadastro:</S> nome e endereço de e-mail fornecidos no momento do registro.</LegalLI>
        <LegalLI><S>Dados de uso:</S> histórico de leituras, XP acumulado, rank, progresso nas categorias, progresso de leitura na Biblioteca (página atual por livro) e anotações pessoais do Grimório.</LegalLI>
        <LegalLI><S>Dados de pagamento:</S> processados integralmente pelo Stripe. Não armazenamos dados de cartão de crédito.</LegalLI>
        <LegalLI><S>Dados técnicos:</S> endereço IP, tipo de navegador e dados de sessão para segurança e funcionamento do sistema.</LegalLI>
      </LegalUL>

      <LegalH2>Como utilizamos seus dados</LegalH2>
      <LegalUL>
        <LegalLI>Para autenticar seu acesso ao portal.</LegalLI>
        <LegalLI>Para calcular e exibir seu XP, rank e histórico de leitura.</LegalLI>
        <LegalLI>Para enviar o livro mensal.</LegalLI>
        <LegalLI>Para processar e gerenciar sua assinatura.</LegalLI>
        <LegalLI>Para melhorar o conteúdo e a experiência do portal.</LegalLI>
      </LegalUL>
      <LegalP>Não vendemos, alugamos ou compartilhamos seus dados com terceiros para fins de marketing.</LegalP>

      <LegalH2>Por quanto tempo guardamos seus dados</LegalH2>
      <LegalUL>
        <LegalLI>Dados de conta: enquanto sua conta estiver ativa.</LegalLI>
        <LegalLI>Histórico de leitura e XP: enquanto sua conta existir.</LegalLI>
        <LegalLI>Dados de pagamento: conforme exigido pela legislação fiscal brasileira (5 anos).</LegalLI>
        <LegalLI>Após exclusão da conta: os dados são removidos em até 30 dias, exceto os exigidos por lei.</LegalLI>
      </LegalUL>

      <LegalH2>Seus direitos</LegalH2>
      <LegalP>Como titular dos dados, você tem direito a:</LegalP>
      <LegalUL>
        <LegalLI>Confirmar a existência de tratamento dos seus dados.</LegalLI>
        <LegalLI>Acessar seus dados a qualquer momento.</LegalLI>
        <LegalLI>Corrigir dados incompletos, inexatos ou desatualizados.</LegalLI>
        <LegalLI>Solicitar a exclusão dos seus dados.</LegalLI>
        <LegalLI>Revogar o consentimento para uso dos dados.</LegalLI>
        <LegalLI>Portabilidade dos seus dados.</LegalLI>
      </LegalUL>
      <LegalP>
        Para exercer qualquer desses direitos, entre em contato:{' '}
        <S>suporteqhiethus@gmail.com</S>.
      </LegalP>

      <LegalH2>Cookies</LegalH2>
      <LegalP>
        Utilizamos cookies essenciais para manter sua sessão ativa e garantir o funcionamento
        do portal. Não utilizamos cookies de rastreamento ou publicidade.
      </LegalP>

      <LegalH2>Segurança</LegalH2>
      <LegalP>
        Seus dados são armazenados com criptografia em repouso e em trânsito. O acesso aos
        dados é restrito e monitorado. Utilizamos autenticação segura via Supabase Auth.
      </LegalP>

      <LegalH2>Alterações nesta política</LegalH2>
      <LegalP>
        Podemos atualizar esta política periodicamente. Em caso de mudanças relevantes,
        notificaremos por e-mail. O uso continuado do portal após as mudanças constitui
        aceite da nova política.
      </LegalP>

      <LegalH2>Contato</LegalH2>
      <LegalP>Dúvidas sobre privacidade: <S>suporteqhiethus@gmail.com</S></LegalP>

    </LegalLayout>
  )
}
