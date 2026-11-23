"use client";

import type { ClientMessage } from "@/lib/conversation/clientMessage";

const TIME_ZONE = "America/Campo_Grande";

/** Data/hora no fuso da empresa, igual no servidor e no navegador. */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { timeZone: TIME_ZONE });
}

const SENT_MEDIA_LABELS: Record<string, string> = {
  IMAGE: "📷 Foto enviada",
  AUDIO: "🎤 Áudio enviado",
  VIDEO: "🎬 Vídeo enviado",
  DOCUMENT: "📎 Arquivo enviado",
};

export function MessageBubble({ message }: { message: ClientMessage }) {
  const inbound = message.direction === "INBOUND";
  const mediaUrl = message.hasMedia ? `/api/admin/media/${message.id}` : null;
  const sentLabel = !message.hasMedia ? SENT_MEDIA_LABELS[message.type] : undefined;
  const text = message.content ?? (message.hasMedia || sentLabel ? "" : `[${message.type}]`);

  return (
    <div
      className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
        inbound ? "self-start bg-slate-100 text-slate-800" : "self-end bg-brand-600 text-white"
      }`}
    >
      {mediaUrl && message.type === "IMAGE" && (
        <a href={mediaUrl} target="_blank" rel="noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mediaUrl} alt="Foto da conversa" loading="lazy" className="mb-1 max-h-64 rounded" />
        </a>
      )}
      {mediaUrl && message.type === "AUDIO" && <audio controls preload="none" src={mediaUrl} className="mb-1 max-w-full" />}
      {mediaUrl && (message.type === "DOCUMENT" || message.type === "VIDEO") && (
        <a href={mediaUrl} target="_blank" rel="noreferrer" className="mb-1 block underline">
          {message.type === "VIDEO" ? "Abrir vídeo" : "Abrir documento"}
        </a>
      )}
      {sentLabel && <div className="mb-1 text-xs opacity-80">{sentLabel}</div>}
      {text && <div className="whitespace-pre-wrap">{text}</div>}
      <div className={`mt-1 flex items-center gap-1 text-[10px] ${inbound ? "text-slate-400" : "text-brand-100"}`}>
        <span>{formatDateTime(message.createdAt)}</span>
        {message.isFollowUp && <span>· follow-up</span>}
        {!inbound && !message.isAutomated && <span>· manual</span>}
        {message.intent && <span>· {message.intent}</span>}
        {!inbound && <MessageStatusIcon status={message.status} />}
      </div>
    </div>
  );
}

function MessageStatusIcon({ status }: { status: string }) {
  if (status === "FAILED") {
    return (
      <svg viewBox="0 0 16 16" className="h-3 w-3 text-red-300" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }
  if (status === "QUEUED" || status === "SENT") {
    return (
      <svg viewBox="0 0 16 16" className="h-3 w-3 text-brand-200" fill="none">
        <path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 16" className={`h-3 w-4 ${status === "READ" ? "text-sky-200" : "text-brand-200"}`} fill="none">
      <path d="M1 8.5 4.5 12 11 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 8.5 10.5 12 19 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
