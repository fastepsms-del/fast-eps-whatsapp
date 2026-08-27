import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { LEAD_STATUS_VALUES, PRODUCT_INTEREST_VALUES } from "@/lib/ai/tools";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const lead = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!lead) notFound();

  const messages = await prisma.message.findMany({
    where: { leadId: lead.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-800">{lead.name ?? lead.profileName ?? lead.phone}</h1>
          {lead.humanHandoff && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
              Em atendimento humano
            </span>
          )}
        </div>

        <div className="flex h-[60vh] flex-col gap-3 overflow-y-auto rounded-lg border border-slate-200 bg-white p-4">
          {messages.map((m) => (
            <div key={m.id} className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${m.direction === "INBOUND" ? "self-start bg-slate-100 text-slate-800" : "self-end bg-brand-600 text-white"}`}>
              <div>{m.content ?? `[${m.type}]`}</div>
              <div className={`mt-1 text-[10px] ${m.direction === "INBOUND" ? "text-slate-400" : "text-brand-100"}`}>
                {new Date(m.createdAt).toLocaleString("pt-BR")}
                {m.isFollowUp ? " · follow-up" : ""}
                {m.direction === "OUTBOUND" && !m.isAutomated ? " · manual" : ""}
                {m.intent ? ` · ${m.intent}` : ""}
              </div>
            </div>
          ))}
          {messages.length === 0 && <p className="text-sm text-slate-400">Nenhuma mensagem ainda.</p>}
        </div>

        <form action={`/api/admin/leads/${lead.id}/send`} method="POST" className="mt-3 flex gap-2">
          <input
            name="message"
            required
            placeholder={lead.humanHandoff ? "Responder manualmente ao cliente..." : "Enviar mensagem manual (a IA continuará respondendo depois)"}
            className="select flex-1"
          />
          <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            Enviar
          </button>
        </form>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Dados do lead</h2>
          <form action={`/api/admin/leads/${lead.id}/update`} method="POST" className="flex flex-col gap-3 text-sm">
            <LabeledInput label="Nome" name="name" defaultValue={lead.name ?? ""} />
            <LabeledInput label="Cidade" name="city" defaultValue={lead.city ?? ""} />
            <LabeledSelect label="Produto" name="productInterest" defaultValue={lead.productInterest} options={[...PRODUCT_INTEREST_VALUES]} />
            <LabeledSelect label="Status" name="status" defaultValue={lead.status} options={[...LEAD_STATUS_VALUES]} />
            <LabeledInput label="Quantidade" name="quantity" defaultValue={lead.quantity ?? ""} />
            <LabeledInput label="Medidas" name="measurements" defaultValue={lead.measurements ?? ""} />
            <LabeledInput label="Previsão da obra" name="desiredDate" defaultValue={lead.desiredDate ?? ""} />
            <label className="flex items-center gap-2">
              <input type="checkbox" name="followUpPaused" value="1" defaultChecked={lead.followUpPaused} />
              Pausar follow-up automático
            </label>
            <textarea name="notes" defaultValue={lead.notes ?? ""} placeholder="Observações internas" className="select" rows={3} />
            <button type="submit" className="rounded-md bg-slate-800 py-2 text-sm font-medium text-white hover:bg-slate-900">
              Salvar
            </button>
          </form>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Origem &amp; qualificação</h2>
          <p>Origem: {lead.source}</p>
          <p>Temperatura: {lead.temperature}</p>
          <p>Possui projeto: {lead.hasProject === null ? "não informado" : lead.hasProject ? "sim" : "não"}</p>
          <p>Já enviou foto: {lead.hasPhoto ? "sim" : "não"}</p>
          <p>Quer orçamento: {lead.wantsQuote ? "sim" : "não confirmado"}</p>
        </div>

        {lead.humanHandoff ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="mb-2 font-medium">Motivo da transferência</p>
            <p className="mb-3">{lead.humanHandoffReason ?? "—"} ({lead.humanHandoffCategory ?? "—"})</p>
            <form action={`/api/admin/leads/${lead.id}/reactivate`} method="POST">
              <button type="submit" className="w-full rounded-md bg-amber-600 py-2 text-sm font-medium text-white hover:bg-amber-700">
                Reativar atendimento automático
              </button>
            </form>
          </div>
        ) : (
          <form action={`/api/admin/leads/${lead.id}/handoff`} method="POST" className="rounded-lg border border-slate-200 bg-white p-4">
            <button type="submit" className="w-full rounded-md border border-amber-300 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50">
              Transferir para atendimento humano
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function LabeledInput({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <label className="flex flex-col">
      <span className="mb-1 text-slate-500">{label}</span>
      <input name={name} defaultValue={defaultValue} className="select" />
    </label>
  );
}

function LabeledSelect({ label, name, defaultValue, options }: { label: string; name: string; defaultValue: string; options: string[] }) {
  return (
    <label className="flex flex-col">
      <span className="mb-1 text-slate-500">{label}</span>
      <select name={name} defaultValue={defaultValue} className="select">
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
