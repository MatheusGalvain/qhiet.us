import type { Metadata } from 'next'
import LegalLayout, { LegalH2, LegalP, LegalUL, LegalLI, S } from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'Termos de Uso',
  description: 'Termos e condições de uso do portal QHIETHUS.',
}

export default function TermosUsoPage() {
  return (
    <LegalLayout
      label="Termos de Uso"
      title="TERMOS DE USO"
      date="Última atualização: Março de 2026"
      intro="Ao acessar ou utilizar o QHIETHUS, você concorda com estes Termos de Uso. Leia com atenção antes de criar sua conta. Se não concordar com algum item, não utilize o portal."
    >

      <LegalH2>O que é o QHIETHUS</LegalH2>
      <LegalP>
        O QHIETHUS é um portal de conhecimento dedicado às tradições herméticas, cabalísticas,
        gnósticas e correlatas. Oferece transmissões escritas, sistema de XP e ranking, quiz de
        conhecimento gerado por inteligência artificial e curadoria mensal de livros.
      </LegalP>

      <LegalH2>Elegibilidade</LegalH2>
      <LegalP>Para utilizar o QHIETHUS você deve:</LegalP>
      <LegalUL>
        <LegalLI>Ter pelo menos 18 anos de idade.</LegalLI>
        <LegalLI>Fornecer informações verdadeiras no cadastro.</LegalLI>
        <LegalLI>Ser responsável pela segurança da sua conta e senha.</LegalLI>
      </LegalUL>

      <LegalH2>Planos e acesso</LegalH2>
      <LegalP>O portal oferece dois planos:</LegalP>
      <LegalUL>
        <LegalLI><S>Plano Profano (gratuito):</S> acesso às transmissões de leitura livre, 1 livro por mês por e-mail e quiz básico.</LegalLI>
        <LegalLI><S>Plano Iniciado (R$19,99/mês):</S> acesso completo a todas as transmissões, 4 livros por mês, XP completo, rank global e trilhas de estudo.</LegalLI>
      </LegalUL>
      <LegalP>Os benefícios de cada plano podem ser alterados mediante aviso prévio por e-mail.</LegalP>

      <LegalH2>Propriedade intelectual</LegalH2>
      <LegalP>
        Todo o conteúdo do QHIETHUS — textos, curadoria, quiz, código e design — é de propriedade
        do portal ou licenciado adequadamente. É proibido:
      </LegalP>
      <LegalUL>
        <LegalLI>Reproduzir, copiar ou distribuir o conteúdo sem autorização expressa.</LegalLI>
        <LegalLI>Usar o conteúdo para fins comerciais sem licença.</LegalLI>
        <LegalLI>Fazer engenharia reversa da plataforma.</LegalLI>
        <LegalLI>Criar conteúdo derivado sem autorização.</LegalLI>
      </LegalUL>
      <LegalP>Os livros distribuídos mensalmente são obras de domínio público e podem ser compartilhados livremente.</LegalP>

      <LegalH2>Conduta do usuário</LegalH2>
      <LegalP>Ao utilizar o portal, você concorda em não:</LegalP>
      <LegalUL>
        <LegalLI>Compartilhar suas credenciais de acesso com terceiros.</LegalLI>
        <LegalLI>Tentar burlar o sistema de XP ou ranking.</LegalLI>
        <LegalLI>Utilizar bots ou automações para interagir com o portal.</LegalLI>
        <LegalLI>Praticar qualquer ato que prejudique outros usuários ou o funcionamento do sistema.</LegalLI>
      </LegalUL>

      <LegalH2>Conteúdo gerado por IA</LegalH2>
      <LegalP>
        O quiz Hermes é gerado por inteligência artificial com base no conteúdo das transmissões.
        As perguntas têm caráter educativo e podem conter imprecisões. O QHIETHUS não se
        responsabiliza por eventuais erros nas questões geradas.
      </LegalP>

      <LegalH2>Limitação de responsabilidade</LegalH2>
      <LegalP>
        O QHIETHUS fornece conteúdo de natureza filosófica, histórica e cultural. O portal não
        oferece aconselhamento religioso, espiritual, médico ou psicológico. O uso do conteúdo é
        de responsabilidade exclusiva do usuário.
      </LegalP>

      <LegalH2>Encerramento de conta</LegalH2>
      <LegalP>
        Você pode encerrar sua conta a qualquer momento em Perfil → Configurações. O QHIETHUS
        pode suspender ou encerrar contas que violem estes termos, sem aviso prévio em casos graves.
      </LegalP>

      <LegalH2>Alterações nos termos</LegalH2>
      <LegalP>
        Podemos atualizar estes termos periodicamente. Em caso de mudanças relevantes, notificaremos
        por e-mail com 15 dias de antecedência. O uso continuado após as mudanças constitui aceite
        dos novos termos.
      </LegalP>

      <LegalH2>Lei aplicável</LegalH2>
      <LegalP>
        Estes termos são regidos pela legislação brasileira. Fica eleito o foro da comarca de
        Porto Alegre/RS para resolução de disputas.
      </LegalP>

      <LegalH2>Contato</LegalH2>
      <LegalP>Dúvidas sobre os termos: <S>contato@qhiethus.com.br</S></LegalP>

    </LegalLayout>
  )
}
