import type { Metadata } from 'next'
import LegalLayout, { LegalH2, LegalP, LegalUL, LegalLI, LegalHighlight, S } from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'Política de Assinatura',
  description: 'Tudo sobre o Plano Iniciado do QHIETHUS — cobrança, cancelamento, reembolso e garantias.',
}

export default function PoliticaAssinaturaPage() {
  return (
    <LegalLayout
      label="Política de Assinatura"
      title="POLÍTICA DE ASSINATURA"
      date="Última atualização: Março de 2026"
      intro="Esta política descreve como funciona o Plano Iniciado do QHIETHUS — cobrança, cancelamento, reembolso e tudo que você precisa saber antes de assinar."
    >

      <LegalH2>Plano Iniciado</LegalH2>
      <LegalP>
        O Plano Iniciado dá acesso completo ao portal por uma assinatura mensal recorrente de{' '}
        <S>R$19,99/mês</S>. Os benefícios incluem:
      </LegalP>
      <LegalUL>
        <LegalLI>Acesso a todas as transmissões, incluindo conteúdo exclusivo para assinantes.</LegalLI>
        <LegalLI>4 livros de domínio público por mês enviados diretamente ao seu e-mail.</LegalLI>
        <LegalLI>Sistema completo de XP, rank global e badges.</LegalLI>
        <LegalLI>Quiz Hermes em todas as transmissões.</LegalLI>
        <LegalLI>Trilhas de estudo por domínio.</LegalLI>
      </LegalUL>

      <LegalH2>Cobrança</LegalH2>
      <LegalP>A assinatura é cobrada mensalmente de forma recorrente no cartão cadastrado:</LegalP>
      <LegalUL>
        <LegalLI>A primeira cobrança ocorre no momento da assinatura.</LegalLI>
        <LegalLI>As cobranças seguintes ocorrem no mesmo dia do mês a cada 30 dias.</LegalLI>
        <LegalLI>O processamento é realizado pelo Stripe, plataforma segura e certificada.</LegalLI>
        <LegalLI>Você receberá um recibo por e-mail a cada cobrança.</LegalLI>
      </LegalUL>

      <LegalHighlight>
        Não armazenamos dados do seu cartão. Todo o processamento é feito diretamente pelo
        Stripe em ambiente seguro e criptografado.
      </LegalHighlight>

      <LegalH2>Cancelamento</LegalH2>
      <LegalP>Você pode cancelar sua assinatura a qualquer momento, sem multa ou fidelidade mínima:</LegalP>
      <LegalUL>
        <LegalLI>Acesse <S>Perfil → Configurações → Gerenciar assinatura</S>.</LegalLI>
        <LegalLI>O cancelamento é imediato — nenhuma cobrança futura será realizada.</LegalLI>
        <LegalLI>O acesso ao Plano Iniciado continua ativo até o fim do período já pago.</LegalLI>
        <LegalLI>Após o término do período, sua conta passa automaticamente para o Plano Profano (gratuito).</LegalLI>
      </LegalUL>

      <LegalH2>Reembolso</LegalH2>
      <LegalP>Nossa política de reembolso é:</LegalP>
      <LegalUL>
        <LegalLI><S>Primeiros 7 dias:</S> reembolso integral garantido, sem perguntas. Basta solicitar em suporteqhiethus@gmail.com.</LegalLI>
        <LegalLI><S>Após 7 dias:</S> não oferecemos reembolso proporcional por período não utilizado. O acesso continua até o fim do período pago.</LegalLI>
        <LegalLI><S>Cobranças indevidas:</S> se identificar uma cobrança incorreta, entre em contato imediatamente. Reembolsos por erro são processados em até 5 dias úteis.</LegalLI>
      </LegalUL>

      <LegalH2>Falha de pagamento</LegalH2>
      <LegalP>Em caso de falha na cobrança mensal:</LegalP>
      <LegalUL>
        <LegalLI>O Stripe tentará a cobrança novamente automaticamente por até 3 vezes.</LegalLI>
        <LegalLI>Você receberá um e-mail notificando a falha com instruções para atualizar o cartão.</LegalLI>
        <LegalLI>Após as tentativas sem sucesso, a assinatura é cancelada e a conta passa para o Plano Profano.</LegalLI>
        <LegalLI>Seu histórico de leitura, XP e badges são mantidos.</LegalLI>
      </LegalUL>

      <LegalH2>Alteração de preço</LegalH2>
      <LegalP>O QHIETHUS pode ajustar o valor da assinatura:</LegalP>
      <LegalUL>
        <LegalLI>Qualquer alteração de preço será comunicada por e-mail com <S>30 dias de antecedência</S>.</LegalLI>
        <LegalLI>O novo valor só passa a valer após o aviso prévio.</LegalLI>
        <LegalLI>Você pode cancelar sem custo se não concordar com o novo valor.</LegalLI>
      </LegalUL>

      <LegalH2>Atualizar método de pagamento</LegalH2>
      <LegalP>
        Para atualizar seu cartão acesse{' '}
        <S>Perfil → Configurações → Gerenciar assinatura</S>.
        Você será redirecionado para o portal seguro do Stripe.
      </LegalP>

      <LegalH2>Dúvidas sobre cobrança</LegalH2>
      <LegalP>
        Para qualquer questão relacionada à sua assinatura, entre em contato:{' '}
        <S>suporteqhiethus@gmail.com</S>
      </LegalP>
      <LegalP>Responderemos em até 48 horas úteis.</LegalP>

    </LegalLayout>
  )
}
