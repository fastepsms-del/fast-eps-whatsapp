import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { LEAD_STATUS_VALUES, PRODUCT_INTEREST_VALUES } from "@/lib/ai/tools";
import {
  AssigneeBadge,
  PIPELINE_STAGE_LABELS,
  PIPELINE_STAGE_VALUES,
  PipelineStageBadge,
  StatusBadge,
  TemperatureBadge,
} from "@/components/StatusBadge";
import { LiveConversation } from "@/components/LiveConversation";
import { MediaSendForm } from "@/components/MediaSendForm";
import { CONVERSATION_MESSAGE_LIMIT, toClientMessage } from "@/lib/conversation/clientMessage";
import { MAX_MEDIA_BYTES } from "@/lib/conversation/mediaLimits";

export const dynamic = "force-dynamic";

const NOTICES: Record<string, string> = {
  sem_arquivo: "Escolha um arquivo para enviar.",
  arquivo_grande: `Arquivo grande demais (máximo ${MAX_MEDIA_BYTES / (1024 * 1024)} MB).`,
  falha_envio: "Não foi possível enviar o arquivo.",
};

export default async function LeadDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { notice?: string; detail?: string };
}) {
  const lead = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!lead) notFound();

  const recentMessages = await prisma.message.findMany({
    where: { leadId: lead.id },
    orderBy: { createdAt: "desc" },
    take: CONVERSATION_MESSAGE_LIMIT,
  });
  const messages = recentMessages.reverse().map(toClientMessage);
  const notice = searchParams.notice ? NOTICES[searchParams.notice] : undefined;

  const displayName = lead.name ?? lead.profileName ?? lead.phone;
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Link href="/admin/leads" className="mb-2 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600">
          ← Voltar para leads
        </Link>
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
            {initials || "?"}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold text-slate-800">{displayName}</h1>
            <p className="text-xs text-slate-400">{lead.phone}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <StatusBadge status={lead.status} handoff={lead.humanHandoff} />
            <TemperatureBadge temperature={lead.temperature} />
            <PipelineStageBadge stage={lead.pipelineStage} />
            <AssigneeBadge name={lead.assignedToName} />
          </div>
        </div>

        {notice && (
          <p className="mb-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {notice}
            {searchParams.notice === "falha_envio" && searchParams.detail ? ` (${searchParams.detail})` : ""}
          </p>
        )}

        <LiveConversation leadId={lead.id} initialMessages={messages} />

        <form action={`/api/admin/leads/${lead.id}/send`} method="POST" className="mt-3 flex gap-2">
          <input
            name="message"
            required
            placeholder="Responder manualmente ao cliente..."
            className="select flex-1"
          />
          <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            Enviar
          </button>
        </form>
        <MediaSendForm leadId={lead.id} />
        {!lead.humanHandoff && (
          <p className="mt-1 text-xs text-slate-400">
            Enviar aqui pausa a IA automaticamente para este lead — só o humano responde até alguém clicar em
            &quot;Reativar atendimento automático&quot;.
          </p>
        )}
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
            <LabeledInput label="Atendido por (nome)" name="assignedToName" defaultValue={lead.assignedToName ?? ""} />
            <LabeledSelect
              label="Etapa do processo"
              name="pipelineStage"
              defaultValue={lead.pipelineStage ?? ""}
              options={[...PIPELINE_STAGE_VALUES]}
              labels={PIPELINE_STAGE_LABELS}
              includeBlank
            />
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

function LabeledSelect({
  label,
  name,
  defaultValue,
  options,
  labels,
  includeBlank,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: string[];
  labels?: Record<string, string>;
  includeBlank?: boolean;
}) {
  return (
    <label className="flex flex-col">
      <span className="mb-1 text-slate-500">{label}</span>
      <select name={name} defaultValue={defaultValue} className="select">
        {includeBlank && <option value="">—</option>}
        {options.map((o) => (
          <option key={o} value={o}>
            {labels?.[o] ?? o}
          </option>
        ))}
      </select>
    </label>
  );
}
