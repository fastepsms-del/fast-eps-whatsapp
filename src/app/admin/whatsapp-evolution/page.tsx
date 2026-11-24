"use client";

import { useCallback, useEffect, useState } from "react";

interface StatusResponse {
  configured: boolean;
  provider?: string;
  instanceFound?: boolean;
  connected?: boolean;
  qr?: { base64?: string; pairingCode?: string | null } | null;
  error?: string;
  state?: unknown;
}

export default function WhatsAppEvolutionPage() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [setupResult, setSetupResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/evolution/status", { cache: "no-store" });
      setStatus(await response.json());
    } catch (error) {
      setStatus({ configured: false, error: String(error) });
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 8000);
    return () => clearInterval(timer);
  }, [refresh]);

  const [importLog, setImportLog] = useState<string>("");
  const [importing, setImporting] = useState(false);

  async function runImport() {
    setImporting(true);
    setImportLog("Importando...");
    let offset = 0;
    let messages = 0;
    let leads = 0;
    try {
      for (let guard = 0; guard < 2000; guard += 1) {
        const response = await fetch("/api/admin/evolution/import-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ offset }),
        });
        const json = await response.json();
        if (!json.ok) {
          setImportLog(`Erro: ${json.error ?? "falha"}`);
          return;
        }
        messages += json.messages;
        leads += json.newLeads;
        offset = json.next;
        setImportLog(`Conversa ${Math.min(offset, json.total)} de ${json.total}: ${messages} mensagens, ${leads} contatos novos...`);
        if (json.done) {
          setImportLog(`Pronto: ${messages} mensagens importadas e ${leads} contatos novos no painel.`);
          return;
        }
      }
    } catch (error) {
      setImportLog(`Erro: ${String(error)}`);
    } finally {
      setImporting(false);
    }
  }

  async function runSetup() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/evolution/setup", { method: "POST" });
      setSetupResult(await response.json());
      await refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-lg font-semibold text-slate-800">Conexão do WhatsApp (Evolution API)</h1>
      <p className="mb-4 text-sm text-slate-500">
        Provedor ativo no sistema: <strong>{status?.provider ?? "..."}</strong>
      </p>

      {status && !status.configured && (
        <p className="mb-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          Evolution ainda não configurado no Vercel (EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE).
        </p>
      )}

      {status?.configured && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 text-sm">
          {status.connected ? (
            <p className="font-medium text-emerald-700">Número conectado.</p>
          ) : status.instanceFound === false ? (
            <p className="text-slate-600">Instância não encontrada. Clique em &quot;Configurar&quot; para criá-la.</p>
          ) : status.qr?.base64 ? (
            <div>
              <p className="mb-2 text-slate-600">
                No celular: WhatsApp Business → Configurações → Aparelhos conectados → Conectar um aparelho, e leia o QR code.
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={status.qr.base64} alt="QR code do WhatsApp" className="h-64 w-64" />
            </div>
          ) : (
            <p className="text-slate-600">Aguardando o QR code do Evolution...</p>
          )}
          {status.error && <p className="mt-2 text-red-600">{status.error}</p>}
        </div>
      )}

      <button
        onClick={runSetup}
        disabled={loading || !status?.configured}
        className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {loading ? "Configurando..." : "Configurar instância e webhook"}
      </button>

      <button
        onClick={runImport}
        disabled={importing || !status?.connected}
        className="ml-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        title="Traz as conversas antigas do celular para o painel (a IA não responde nelas)"
      >
        {importing ? "Importando..." : "Importar histórico do celular"}
      </button>
      {importLog && <p className="mt-2 text-sm text-slate-600">{importLog}</p>}

      {setupResult != null && (
        <pre className="mt-4 max-h-[50vh] overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">
          {JSON.stringify(setupResult, null, 2)}
        </pre>
      )}
    </div>
  );
}
