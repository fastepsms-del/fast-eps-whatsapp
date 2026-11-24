import type { MessageType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { evolutionFindMessages } from "./evolutionClient";
import { describeForRecord, phoneFromKey, toInboundMessage, type EvolutionMessageData } from "./evolutionWebhook";

/* eslint-disable @typescript-eslint/no-explicit-any */

const MAX_PAGES_PER_CHAT = 5; // até 500 mensagens por conversa
const PAGE_SIZE = 100;

export interface ImportChatResult {
  skipped?: string;
  phone?: string;
  messages: number;
  createdLead: boolean;
}

/**
 * Traz o histórico de UMA conversa do Evolution para o painel. Idempotente (mensagens já
 * gravadas são ignoradas). Lead criado aqui recebe createdAt = data da 1ª mensagem, ficando
 * "anterior ao início da IA", então a IA nunca responde nem faz follow-up nele.
 */
export async function importChat(chat: any): Promise<ImportChatResult> {
  const remoteJid: string | undefined = chat?.remoteJid ?? chat?.id ?? chat?.jid;
  if (!remoteJid) return { skipped: "sem jid", messages: 0, createdLead: false };
  const phone = phoneFromKey({ remoteJid, remoteJidAlt: chat?.remoteJidAlt });
  if (!phone) return { skipped: "grupo/canal/sem telefone", messages: 0, createdLead: false };

  const rows: Array<{
    direction: "INBOUND" | "OUTBOUND";
    type: MessageType;
    content: string | null;
    mediaId: string | null;
    mediaMimeType: string | null;
    whatsappMessageId: string;
    isAutomated: boolean;
    createdAt: Date;
  }> = [];

  for (let page = 1; page <= MAX_PAGES_PER_CHAT; page += 1) {
    const records = await evolutionFindMessages(remoteJid, page, PAGE_SIZE);
    if (records.length === 0) break;
    for (const record of records as EvolutionMessageData[]) {
      const inbound = toInboundMessage(record, phone);
      if (!inbound) continue;
      const seconds = Number(record.messageTimestamp);
      if (!Number.isFinite(seconds) || seconds <= 0) continue;
      const described = describeForRecord(inbound);
      const fromMe = record.key?.fromMe === true;
      const media = inbound.image ?? inbound.audio ?? inbound.video ?? inbound.document ?? inbound.sticker;
      rows.push({
        direction: fromMe ? "OUTBOUND" : "INBOUND",
        type: described.type,
        content: described.content,
        mediaId: media ? inbound.id : null,
        mediaMimeType: media?.mime_type ?? null,
        whatsappMessageId: inbound.id,
        isAutomated: false,
        createdAt: new Date(seconds * 1000),
      });
    }
    if (records.length < PAGE_SIZE) break;
  }

  if (rows.length === 0) return { phone, messages: 0, createdLead: false };

  const first = rows.reduce((a, b) => (a.createdAt < b.createdAt ? a : b));
  const lastIn = rows.filter((r) => r.direction === "INBOUND").reduce<Date | null>((a, r) => (!a || r.createdAt > a ? r.createdAt : a), null);
  const lastOut = rows.filter((r) => r.direction === "OUTBOUND").reduce<Date | null>((a, r) => (!a || r.createdAt > a ? r.createdAt : a), null);

  let lead = await prisma.lead.findUnique({ where: { phone } });
  let createdLead = false;
  if (!lead) {
    lead = await prisma.lead.create({
      data: {
        phone,
        profileName: typeof chat?.pushName === "string" ? chat.pushName : typeof chat?.name === "string" ? chat.name : undefined,
        createdAt: first.createdAt,
        lastInboundAt: lastIn,
        lastOutboundAt: lastOut,
      },
    });
    createdLead = true;
  }

  const result = await prisma.message.createMany({
    data: rows.map((r) => ({ ...r, leadId: lead!.id, status: "SENT" as const })),
    skipDuplicates: true,
  });
  return { phone, messages: result.count, createdLead };
}
