import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { logEvent } from "@/lib/logger";
import { findOrCreateLeadByPhone, applyHumanHandoff, touchLeadOutbound } from "@/lib/leads/leadService";
import { recordMessage } from "@/lib/conversation/messageService";
import { handleInboundMessage, handleStatusUpdate } from "@/lib/whatsapp/inboundHandler";
import {
  describeForRecord,
  mapEvolutionStatus,
  normalizeEvent,
  phoneFromKey,
  toInboundMessage,
  type EvolutionMessageData,
} from "@/lib/whatsapp/evolutionWebhook";

export const runtime = "nodejs";
export const maxDuration = 60;

const PHONE_HANDOFF_REASON = "Atendente respondeu direto pelo celular — atendimento humano assumiu a conversa.";

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Webhook do Evolution API. A URL cadastrada no Evolution deve conter
 * `?secret=<EVOLUTION_WEBHOOK_SECRET>`, já que o Evolution não assina as
 * requisições. Eventos tratados: messages.upsert (mensagem do cliente ou
 * enviada pelo celular), messages.update (status de entrega) e
 * connection.update (só registra no log).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const expected = process.env.EVOLUTION_WEBHOOK_SECRET;
  const received = request.nextUrl.searchParams.get("secret") ?? "";
  if (!expected || !safeEqual(received, expected)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let payload: { event?: string; instance?: string; data?: unknown };
  try {
    payload = await request.json();
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const instance = process.env.EVOLUTION_INSTANCE;
  if (instance && payload.instance && payload.instance !== instance) {
    return NextResponse.json({ received: true, ignored: "other_instance" });
  }

  try {
    const event = normalizeEvent(payload.event);
    if (event === "messages.upsert") {
      for (const data of asArray(payload.data as EvolutionMessageData | EvolutionMessageData[])) {
        await handleUpsert(data);
      }
    } else if (event === "messages.update") {
      for (const data of asArray(payload.data as Record<string, unknown> | Record<string, unknown>[])) {
        const id = String(data.keyId ?? data.messageId ?? "");
        const status = mapEvolutionStatus(data.status);
        if (id && status) await handleStatusUpdate({ id, status });
      }
    } else if (event === "connection.update") {
      await logEvent({ scope: "whatsapp", level: "info", message: `Evolution: conexão atualizada`, metadata: { data: payload.data } });
    }
  } catch (error) {
    await logEvent({ scope: "webhook", level: "error", message: `Erro não tratado processando webhook do Evolution: ${String(error)}` });
  }

  return NextResponse.json({ received: true });
}

async function handleUpsert(data: EvolutionMessageData): Promise<void> {
  const key = data.key;
  if (!key?.id) return;

  const phone = phoneFromKey(key);
  if (!phone) {
    // Grupos, status e canais são ignorados de propósito; só avisa quando o JID é um @lid sem telefone.
    if (key.remoteJid?.endsWith("@lid")) {
      await logEvent({ scope: "webhook", level: "warn", message: "Evolution: mensagem de contato @lid sem telefone disponível, ignorada", metadata: { remoteJid: key.remoteJid } });
    }
    return;
  }

  const inbound = toInboundMessage(data, phone);
  if (!inbound) return;

  if (!key.fromMe) {
    await handleInboundMessage(inbound, data.pushName);
    return;
  }

  // Mensagens enviadas pelo bot ou pelo painel já são gravadas por quem enviou
  // (com o mesmo id). Espera um pouco para esse registro existir e só trata como
  // "atendente no celular" o que ainda não está no banco.
  await sleep(3000);
  if (await prisma.message.findUnique({ where: { whatsappMessageId: key.id } })) return;

  const lead = await findOrCreateLeadByPhone(phone);
  const { type, content } = describeForRecord(inbound);
  await recordMessage(lead.id, {
    direction: "OUTBOUND",
    type,
    content,
    whatsappMessageId: key.id,
    isAutomated: false,
  });
  await touchLeadOutbound(lead.id);
  if (!lead.humanHandoff) {
    await applyHumanHandoff(lead.id, { category: "OUTRO", reason: PHONE_HANDOFF_REASON });
  }
}
