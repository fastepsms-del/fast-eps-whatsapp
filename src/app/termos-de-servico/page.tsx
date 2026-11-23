export default function TermosDeServicoPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10 text-slate-700">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Termos de Serviço — Fast EPS</h1>

      <p className="mb-4">
        Estes termos regem o uso do canal de atendimento via WhatsApp da Fast EPS para solicitação de
        informações, orçamentos e atendimento comercial sobre molduras em EPS e painéis monolíticos.
      </p>

      <h2 className="mb-2 mt-6 text-lg font-semibold text-slate-900">Natureza do atendimento</h2>
      <p className="mb-4">
        O atendimento inicial pode ser conduzido por um assistente automatizado, que coleta informações
        básicas e responde dúvidas frequentes. A qualquer momento, o atendimento pode ser transferido
        para um membro da equipe Fast EPS. Orçamentos e condições comerciais informadas pelo assistente
        automatizado têm caráter estimativo e devem ser confirmados pela equipe antes do fechamento.
      </p>

      <h2 className="mb-2 mt-6 text-lg font-semibold text-slate-900">Uso adequado</h2>
      <p className="mb-4">
        O canal deve ser usado para fins relacionados ao atendimento comercial da Fast EPS. A Fast EPS
        pode encerrar ou limitar o atendimento em casos de uso abusivo do canal.
      </p>

      <h2 className="mb-2 mt-6 text-lg font-semibold text-slate-900">Dados pessoais</h2>
      <p className="mb-4">
        O tratamento de dados pessoais coletados durante o atendimento segue a nossa{" "}
        <a href="/politica-de-privacidade" className="text-brand-600 underline">
          Política de Privacidade
        </a>
        .
      </p>

      <h2 className="mb-2 mt-6 text-lg font-semibold text-slate-900">Contato</h2>
      <p className="mb-4">Dúvidas sobre estes termos podem ser enviadas pelo WhatsApp oficial da Fast EPS.</p>

      <p className="mt-8 text-sm text-slate-400">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>
    </div>
  );
}
