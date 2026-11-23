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

      {setupResult != null && (
        <pre className="mt-4 max-h-[50vh] overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">
          {JSON.stringify(setupResult, null, 2)}
        </pre>
      )}
    </div>
  );
}
