"use client";

import { useState } from "react";
import { MAX_MEDIA_BYTES } from "@/lib/conversation/mediaLimits";

/** Envio de foto, vídeo, áudio ou documento para o cliente, com legenda opcional. */
export function MediaSendForm({ leadId }: { leadId: string }) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={`/api/admin/leads/${leadId}/send-media`}
      method="POST"
      encType="multipart/form-data"
      className="mt-2 flex flex-wrap items-center gap-2"
    >
      <label className="cursor-pointer rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
        📎 Anexar arquivo
        <input
          type="file"
          name="file"
          required
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) {
              setFileName(null);
              setError(null);
              return;
            }
            setFileName(file.name);
            setError(file.size > MAX_MEDIA_BYTES ? "Arquivo grande demais (máximo 4 MB)." : null);
          }}
        />
      </label>
      {fileName && <span className="max-w-[200px] truncate text-xs text-slate-500">{fileName}</span>}
      <input name="caption" placeholder="Legenda (opcional)" className="select min-w-[160px] flex-1" />
      <button
        type="submit"
        disabled={!fileName || Boolean(error)}
        className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-40"
      >
        Enviar arquivo
      </button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </form>
  );
}
