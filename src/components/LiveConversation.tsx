"use client";

import { useEffect, useRef, useState } from "react";
import type { ClientMessage } from "@/lib/conversation/clientMessage";
import { MessageBubble } from "./MessageBubble";

const POLL_INTERVAL_MS = 4000;

function signature(messages: ClientMessage[]): string {
  return messages.map((m) => `${m.id}:${m.status}`).join("|");
}

/** Conversa que se atualiza sozinha: busca as mensagens a cada poucos segundos e rola para o fim quando chega algo novo. */
export function LiveConversation({ leadId, initialMessages }: { leadId: string; initialMessages: ClientMessage[] }) {
  const [messages, setMessages] = useState(initialMessages);
  const containerRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const lastSignature = useRef(signature(initialMessages));

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      if (document.visibilityState !== "visible") return;
      try {
        const response = await fetch(`/api/admin/leads/${leadId}/messages`, { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { messages: ClientMessage[] };
        const next = signature(data.messages);
        if (!cancelled && next !== lastSignature.current) {
          lastSignature.current = next;
          setMessages(data.messages);
        }
      } catch {
        // Falha de rede passageira: tenta de novo no próximo ciclo.
      }
    }

    const timer = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [leadId]);

  useEffect(() => {
    const element = containerRef.current;
    if (element && stickToBottom.current) element.scrollTop = element.scrollHeight;
  }, [messages]);

  function handleScroll() {
    const element = containerRef.current;
    if (!element) return;
    stickToBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < 120;
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex h-[60vh] flex-col gap-3 overflow-y-auto rounded-lg border border-slate-200 bg-white p-4"
    >
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {messages.length === 0 && <p className="text-sm text-slate-400">Nenhuma mensagem ainda.</p>}
    </div>
  );
}
