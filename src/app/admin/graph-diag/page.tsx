"use client";

import { useState } from "react";

export default function GraphDiagPage() {
  const [token, setToken] = useState("");
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/graph-diag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      setResult(await response.json());
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-2 text-lg font-semibold text-slate-800">Diagnóstico direto na Graph API</h1>
      <p className="mb-4 text-sm text-slate-500">
        Cole o token abaixo (fica só nesta página, não vai pra URL nem é salvo) e clique em rodar.
      </p>

      <textarea
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="Cole o access token aqui..."
        className="mb-3 w-full rounded-md border border-slate-300 p-2 text-xs"
        rows={3}
      />

      <button
        onClick={run}
        disabled={loading || !token}
        className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {loading ? "Rodando..." : "Rodar diagnóstico"}
      </button>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {result != null && (
        <pre className="mt-4 max-h-[70vh] overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
