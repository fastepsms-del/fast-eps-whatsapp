"use client";

import { useEffect, useState } from "react";

const APP_ID = "1403363668433200";
const CONFIG_ID = "1124240880457533";

declare global {
  interface Window {
    fbAsyncInit?: () => void;
    FB?: {
      init: (params: Record<string, unknown>) => void;
      login: (
        callback: (response: { authResponse?: { code?: string } }) => void,
        params: Record<string, unknown>,
      ) => void;
    };
  }
}

export default function WhatsAppConnectPage() {
  const [sdkReady, setSdkReady] = useState(false);
  const [events, setEvents] = useState<string[]>([]);
  const [signupData, setSignupData] = useState<Record<string, unknown> | null>(null);
  const [exchangeResult, setExchangeResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  function log(line: string) {
    setEvents((prev) => [...prev, `${new Date().toLocaleTimeString("pt-BR")} — ${line}`]);
  }

  useEffect(() => {
    window.fbAsyncInit = function () {
      window.FB?.init({ appId: APP_ID, autoLogAppEvents: true, xfbml: false, version: "v20.0" });
      setSdkReady(true);
      log("SDK do Facebook carregado.");
    };

    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/pt_BR/sdk.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    function handleMessage(event: MessageEvent) {
      if (event.origin !== "https://www.facebook.com" && event.origin !== "https://web.facebook.com") return;
      try {
        const data = JSON.parse(event.data);
        if (data.type === "WA_EMBEDDED_SIGNUP") {
          log(`Evento do Facebook: ${JSON.stringify(data.data ?? data)}`);
          if (data.data && (data.data.phone_number_id || data.data.waba_id)) {
            setSignupData(data.data);
          }
        }
      } catch {
        // mensagens não-JSON do Facebook são ignoradas
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  function startLogin() {
    setError(null);
    if (!window.FB) {
      setError("SDK do Facebook ainda não carregou. Espere alguns segundos e tente de novo.");
      return;
    }
    log("Abrindo o diálogo de conexão do WhatsApp...");
    window.FB.login(
      (response) => {
        const code = response.authResponse?.code;
        if (!code) {
          setError("Não recebi o código de autorização. O diálogo pode ter sido cancelado.");
          log("Login cancelado ou sem código retornado.");
          return;
        }
        log("Código de autorização recebido, trocando por token...");
        fetch("/api/admin/whatsapp-embedded-signup-exchange", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        })
          .then((r) => r.json())
          .then((result) => {
            setExchangeResult(result);
            log(result.ok ? "Troca concluída com sucesso." : `Erro na troca: ${JSON.stringify(result)}`);
          })
          .catch((e) => setError(String(e)));
      },
      {
        config_id: CONFIG_ID,
        response_type: "code",
        override_default_response_type: true,
        extras: {},
      },
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-2 text-lg font-semibold text-slate-800">Conectar WhatsApp (Coexistência)</h1>
      <p className="mb-4 text-sm text-slate-500">
        Clique no botão abaixo. Vai abrir uma janela do Facebook pedindo pra conectar o número
        +55 67 9338-2438. Se perguntar se você já usa o WhatsApp Business App nesse número,
        responda que sim.
      </p>

      <button
        onClick={startLogin}
        disabled={!sdkReady}
        className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {sdkReady ? "Conectar WhatsApp" : "Carregando..."}
      </button>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {signupData && (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3">
          <p className="mb-1 text-sm font-medium text-emerald-800">Dados do número conectado:</p>
          <pre className="overflow-auto text-xs text-emerald-900">{JSON.stringify(signupData, null, 2)}</pre>
        </div>
      )}

      {exchangeResult != null && (
        <pre className="mt-4 overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">
          {JSON.stringify(exchangeResult, null, 2)}
        </pre>
      )}

      <div className="mt-6">
        <h2 className="mb-1 text-sm font-semibold text-slate-700">Log</h2>
        <div className="max-h-64 overflow-auto rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          {events.map((e, i) => (
            <div key={i}>{e}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
