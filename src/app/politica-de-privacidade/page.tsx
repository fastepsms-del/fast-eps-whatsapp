export default function PoliticaDePrivacidadePage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10 text-slate-700">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Política de Privacidade — Fast EPS</h1>

      <p className="mb-4">
        Esta política descreve como a Fast EPS coleta, usa e protege as informações de clientes que
        entram em contato pelo WhatsApp para solicitar informações, orçamentos ou atendimento sobre
        molduras em EPS e painéis monolíticos.
      </p>

      <h2 className="mb-2 mt-6 text-lg font-semibold text-slate-900">Quais dados coletamos</h2>
      <p className="mb-4">
        Coletamos o número de telefone, nome de exibição do WhatsApp e o conteúdo das mensagens
        trocadas durante o atendimento (texto, áudio, imagens, documentos e vídeos enviados pelo
        cliente), além de informações fornecidas voluntariamente durante a conversa, como cidade,
        produto de interesse, medidas e preferências de atendimento.
      </p>

      <h2 className="mb-2 mt-6 text-lg font-semibold text-slate-900">Como usamos os dados</h2>
      <p className="mb-4">
        Os dados são usados exclusivamente para conduzir o atendimento comercial, elaborar orçamentos,
        agendar instalação ou entrega, e dar continuidade ao relacionamento com o cliente (incluindo
        follow-ups sobre orçamentos em aberto). O atendimento inicial pode ser feito por um assistente
        automatizado; conversas são transferidas para um atendente humano quando necessário.
      </p>

      <h2 className="mb-2 mt-6 text-lg font-semibold text-slate-900">Compartilhamento</h2>
      <p className="mb-4">
        Não vendemos nem compartilhamos dados de clientes com terceiros para fins de marketing. Os
        dados trafegam pela infraestrutura da Meta (WhatsApp Business Platform) para entrega das
        mensagens, conforme os termos da própria Meta, e são armazenados em banco de dados da Fast EPS
        com acesso restrito à equipe de atendimento.
      </p>

      <h2 className="mb-2 mt-6 text-lg font-semibold text-slate-900">Retenção e direitos do titular</h2>
      <p className="mb-4">
        Os dados são mantidos pelo tempo necessário para o atendimento e relacionamento comercial. O
        cliente pode solicitar a exclusão dos seus dados ou esclarecimentos sobre o uso deles entrando
        em contato pelo mesmo canal de WhatsApp.
      </p>

      <h2 className="mb-2 mt-6 text-lg font-semibold text-slate-900">Contato</h2>
      <p className="mb-4">
        Dúvidas sobre esta política podem ser enviadas pelo WhatsApp oficial da Fast EPS.
      </p>

      <p className="mt-8 text-sm text-slate-400">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>
    </div>
  );
}
