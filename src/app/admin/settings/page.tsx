import { getKnowledgeBase } from "@/lib/config/knowledgeService";
import { ProductsEditor } from "@/components/admin/ProductsEditor";
import { LEAD_STATUS_VALUES } from "@/lib/ai/tools";

export const dynamic = "force-dynamic";

const WEEKDAYS = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
];

export default async function AdminSettingsPage({ searchParams }: { searchParams: { saved?: string; error?: string } }) {
  const kb = await getKnowledgeBase({ skipCache: true });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">Base de conhecimento da Fast EPS</h1>
        <p className="text-sm text-slate-500">
          Estas informações alimentam o prompt da IA em tempo real — qualquer alteração aqui vale para a próxima
          mensagem recebida, sem precisar reimplantar o sistema. Campos deixados em branco continuam sinalizando
          &quot;não confirmado&quot; para a IA (que nunca inventa esse tipo de informação).
        </p>
        {searchParams.saved && (
          <p className="mt-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Seção {searchParams.saved} salva com sucesso.</p>
        )}
        {searchParams.error && <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{searchParams.error}</p>}
      </div>

      <Section title="Informações da empresa" sectionKey="COMPANY_INFO">
        <TextField label="Nome" name="name" defaultValue={kb.COMPANY_INFO.name} />
        <TextField label="Segmento" name="segment" defaultValue={kb.COMPANY_INFO.segment} />
        <TextAreaField label="Descrição" name="description" defaultValue={kb.COMPANY_INFO.description} />
        <LinesField label="Traços de marca (um por linha)" name="brandTraits" defaultValue={kb.COMPANY_INFO.brandTraits} />
        <TextField label="Tom de voz" name="toneOfVoice" defaultValue={kb.COMPANY_INFO.toneOfVoice} />
        <TextField label="Anos de mercado" name="yearsInBusiness" defaultValue={kb.COMPANY_INFO.yearsInBusiness ?? ""} />
        <TextAreaField label="Aviso: nunca inventar" name="disclaimerNoInvent" defaultValue={kb.COMPANY_INFO.disclaimerNoInvent} />
      </Section>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Produtos (molduras / painel monolítico)</h2>
        <ProductsEditor initialProducts={kb.PRODUCTS} />
      </div>

      <Section title="Preços" sectionKey="PRICING">
        <TextAreaField label="Política de preços" name="policy" defaultValue={kb.PRICING.policy} />
        <JsonField label="Tabela de preços por produto (JSON)" name="priceTablesJson" value={kb.PRICING.priceTables} />
      </Section>

      <Section title="Entrega / frete" sectionKey="DELIVERY">
        <TextAreaField label="Política de entrega" name="policy" defaultValue={kb.DELIVERY.policy} />
        <LinesField label="Cidades atendidas (uma por linha)" name="citiesServed" defaultValue={kb.DELIVERY.citiesServed} />
        <JsonField label="Tabela de frete (JSON)" name="freightTableJson" value={kb.DELIVERY.freightTable} />
      </Section>

      <Section title="Instalação" sectionKey="INSTALLATION">
        <label className="flex flex-col text-sm">
          <span className="mb-1 text-slate-500">Oferece instalação?</span>
          <select name="offersInstallation" defaultValue={kb.INSTALLATION.offersInstallation === null ? "" : String(kb.INSTALLATION.offersInstallation)} className="select">
            <option value="">Não confirmado</option>
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </select>
        </label>
        <TextAreaField label="Política de instalação" name="policy" defaultValue={kb.INSTALLATION.policy} />
        <LinesField label="Regiões atendidas (uma por linha)" name="regionsAvailable" defaultValue={kb.INSTALLATION.regionsAvailable} />
      </Section>

      <Section title="Informações técnicas" sectionKey="TECHNICAL_INFORMATION">
        <TextAreaField label="Isolamento térmico" name="thermalInsulation" defaultValue={kb.TECHNICAL_INFORMATION.thermalInsulation} />
        <TextAreaField label="Isolamento acústico" name="acousticInsulation" defaultValue={kb.TECHNICAL_INFORMATION.acousticInsulation} />
        <TextAreaField label="Notas estruturais" name="structuralNotes" defaultValue={kb.TECHNICAL_INFORMATION.structuralNotes} />
        <TextAreaField label="Compatibilidade com pintura" name="paintingCompatibility" defaultValue={kb.TECHNICAL_INFORMATION.paintingCompatibility} />
        <TextAreaField label="Uso externo" name="outdoorUse" defaultValue={kb.TECHNICAL_INFORMATION.outdoorUse} />
      </Section>

      <Section title="Contato" sectionKey="CONTACT_INFORMATION">
        <TextAreaField label="Observação para equipe de vendas" name="salesTeamNote" defaultValue={kb.CONTACT_INFORMATION.salesTeamNote} />
        <TextField label="Telefone de suporte" name="supportPhone" defaultValue={kb.CONTACT_INFORMATION.supportPhone ?? ""} />
        <TextField label="E-mail de suporte" name="supportEmail" defaultValue={kb.CONTACT_INFORMATION.supportEmail ?? ""} />
        <TextField label="Site" name="website" defaultValue={kb.CONTACT_INFORMATION.website ?? ""} />
        <TextField label="Instagram" name="instagram" defaultValue={kb.CONTACT_INFORMATION.instagram ?? ""} />
      </Section>

      <Section title="Horário comercial" sectionKey="BUSINESS_HOURS">
        <TextField label="Fuso horário" name="timezone" defaultValue={kb.BUSINESS_HOURS.timezone} />
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="Início (hora)" name="startHour" defaultValue={kb.BUSINESS_HOURS.startHour} />
          <NumberField label="Fim (hora)" name="endHour" defaultValue={kb.BUSINESS_HOURS.endHour} />
        </div>
        <fieldset className="flex flex-col text-sm">
          <legend className="mb-1 text-slate-500">Dias da semana</legend>
          <div className="flex flex-wrap gap-3">
            {WEEKDAYS.map((day) => (
              <label key={day.value} className="flex items-center gap-1 text-slate-600">
                <input type="checkbox" name="daysOfWeek" value={day.value} defaultChecked={kb.BUSINESS_HOURS.daysOfWeek.includes(day.value)} />
                {day.label}
              </label>
            ))}
          </div>
        </fieldset>
        <TextAreaField label="Aviso fora do horário" name="outOfHoursNotice" defaultValue={kb.BUSINESS_HOURS.outOfHoursNotice} />
      </Section>

      <Section title="Follow-up automático" sectionKey="FOLLOW_UP_SETTINGS">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" name="enabled" value="1" defaultChecked={kb.FOLLOW_UP_SETTINGS.enabled} />
          Follow-up automático habilitado
        </label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <NumberField label="Horas sem resposta p/ disparar" name="delayHoursAfterNoResponse" defaultValue={kb.FOLLOW_UP_SETTINGS.delayHoursAfterNoResponse} />
          <NumberField label="Máx. de tentativas" name="maxAttempts" defaultValue={kb.FOLLOW_UP_SETTINGS.maxAttempts} />
          <NumberField label="Horas mín. entre tentativas" name="minHoursBetweenAttempts" defaultValue={kb.FOLLOW_UP_SETTINGS.minHoursBetweenAttempts} />
        </div>
        <fieldset className="flex flex-col text-sm">
          <legend className="mb-1 text-slate-500">Status aplicáveis</legend>
          <div className="flex flex-wrap gap-3">
            {LEAD_STATUS_VALUES.map((status) => (
              <label key={status} className="flex items-center gap-1 text-slate-600">
                <input
                  type="checkbox"
                  name="applicableStatuses"
                  value={status}
                  defaultChecked={kb.FOLLOW_UP_SETTINGS.applicableStatuses.includes(status)}
                />
                {status}
              </label>
            ))}
          </div>
        </fieldset>
        <TextField label="Nome do template de mensagem" name="messageTemplateName" defaultValue={kb.FOLLOW_UP_SETTINGS.messageTemplateName} />
        <TextAreaField label="Mensagem de fallback" name="fallbackMessage" defaultValue={kb.FOLLOW_UP_SETTINGS.fallbackMessage} />
      </Section>

      <Section title="Transferência para humano" sectionKey="HUMAN_HANDOFF_SETTINGS">
        <TextAreaField label="Mensagem de transferência" name="handoffMessage" defaultValue={kb.HUMAN_HANDOFF_SETTINGS.handoffMessage} />
        <TextAreaField label="Mensagem de transferência fora do horário" name="outOfHoursHandoffMessage" defaultValue={kb.HUMAN_HANDOFF_SETTINGS.outOfHoursHandoffMessage} />
        <LinesField label="Gatilhos de transferência (um por linha)" name="triggersDescription" defaultValue={kb.HUMAN_HANDOFF_SETTINGS.triggersDescription} />
      </Section>

      <Section title="Mensagens de saudação" sectionKey="GREETING_SETTINGS">
        <TextAreaField label="Primeira mensagem" name="firstMessage" defaultValue={kb.GREETING_SETTINGS.firstMessage} />
        <TextAreaField label="Mensagem de menu" name="menuMessage" defaultValue={kb.GREETING_SETTINGS.menuMessage} />
        <TextAreaField label="Mensagem de erro (fallback)" name="fallbackErrorMessage" defaultValue={kb.GREETING_SETTINGS.fallbackErrorMessage} />
      </Section>
    </div>
  );
}

function Section({ title, sectionKey, children }: { title: string; sectionKey: string; children: React.ReactNode }) {
  return (
    <form action={`/api/admin/config/${sectionKey}`} method="POST" className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
      <div className="mt-3 flex justify-end">
        <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          Salvar seção
        </button>
      </div>
    </form>
  );
}

function TextField({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <label className="flex flex-col text-sm">
      <span className="mb-1 text-slate-500">{label}</span>
      <input name={name} defaultValue={defaultValue} className="select" />
    </label>
  );
}

function NumberField({ label, name, defaultValue }: { label: string; name: string; defaultValue: number }) {
  return (
    <label className="flex flex-col text-sm">
      <span className="mb-1 text-slate-500">{label}</span>
      <input type="number" name={name} defaultValue={defaultValue} className="select" />
    </label>
  );
}

function TextAreaField({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <label className="flex flex-col text-sm">
      <span className="mb-1 text-slate-500">{label}</span>
      <textarea name={name} defaultValue={defaultValue} rows={3} className="select" />
    </label>
  );
}

function LinesField({ label, name, defaultValue }: { label: string; name: string; defaultValue: string[] }) {
  return (
    <label className="flex flex-col text-sm">
      <span className="mb-1 text-slate-500">{label}</span>
      <textarea name={name} defaultValue={defaultValue.join("\n")} rows={4} className="select" />
    </label>
  );
}

function JsonField({ label, name, value }: { label: string; name: string; value: unknown }) {
  return (
    <label className="flex flex-col text-sm">
      <span className="mb-1 text-slate-500">{label}</span>
      <textarea
        name={name}
        defaultValue={JSON.stringify(value, null, 2)}
        rows={6}
        spellCheck={false}
        className="w-full rounded-md border border-slate-300 bg-slate-50 p-3 font-mono text-xs outline-none focus:border-brand-500"
      />
    </label>
  );
}
