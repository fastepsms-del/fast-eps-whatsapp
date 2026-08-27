import { getKnowledgeBase } from "@/lib/config/knowledgeService";
import type { KnowledgeKey } from "@/lib/config/types";

export const dynamic = "force-dynamic";

const SECTION_LABELS: Record<KnowledgeKey, string> = {
  COMPANY_INFO: "Informações da empresa",
  PRODUCTS: "Produtos (molduras / painel monolítico)",
  PRICING: "Preços",
  DELIVERY: "Entrega / frete",
  INSTALLATION: "Instalação",
  TECHNICAL_INFORMATION: "Informações técnicas",
  CONTACT_INFORMATION: "Contato",
  BUSINESS_HOURS: "Horário comercial",
  FOLLOW_UP_SETTINGS: "Follow-up automático",
  HUMAN_HANDOFF_SETTINGS: "Transferência para humano",
  GREETING_SETTINGS: "Mensagens de saudação",
};

export default async function AdminSettingsPage() {
  const kb = await getKnowledgeBase({ skipCache: true });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">Base de conhecimento da Fast EPS</h1>
        <p className="text-sm text-slate-500">
          Estas informações alimentam o prompt da IA em tempo real — qualquer alteração aqui vale para a
          próxima mensagem recebida, sem precisar reimplantar o sistema. Edite o JSON de cada seção com
          cuidado; campos deixados em branco/ null continuam sinalizando &quot;não confirmado&quot; para a IA
          (que nunca inventa esse tipo de informação).
        </p>
      </div>

      {(Object.keys(SECTION_LABELS) as KnowledgeKey[]).map((key) => (
        <SectionEditor key={key} sectionKey={key} label={SECTION_LABELS[key]} value={kb[key]} />
      ))}
    </div>
  );
}

function SectionEditor({ sectionKey, label, value }: { sectionKey: KnowledgeKey; label: string; value: unknown }) {
  const pretty = JSON.stringify(value, null, 2);
  const rows = Math.min(28, Math.max(6, pretty.split("\n").length + 1));

  return (
    <form action={`/api/admin/config/${sectionKey}`} method="POST" className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-2 text-sm font-semibold text-slate-700">{label}</h2>
      <textarea
        name="value"
        defaultValue={pretty}
        rows={rows}
        spellCheck={false}
        className="w-full rounded-md border border-slate-300 bg-slate-50 p-3 font-mono text-xs outline-none focus:border-brand-500"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-slate-400">Deve ser um JSON válido no mesmo formato exibido acima.</span>
        <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          Salvar seção
        </button>
      </div>
    </form>
  );
}
