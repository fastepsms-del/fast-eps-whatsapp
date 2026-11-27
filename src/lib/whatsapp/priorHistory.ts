import { evolutionFindMessages } from "./evolutionClient";
import { isAutomatedMessage } from "./automatedMessages";
import { describeForRecord, toInboundMessage, type EvolutionMessageData } from "./evolutionWebhook";
import type { WhatsAppInboundMessage } from "./webhookTypes";

/**
 * Para um número que não existe no painel, confere no Evolution se já houve conversa de verdade com ele
 * (mensagens anteriores à atual, ignorando saudações automáticas). Devolve a data da mais antiga, ou null
 * se for um contato realmente novo ou se não deu para consultar (nesse caso trata como novo).
 */
export async function earliestPriorConversation(phone: string, current: WhatsAppInboundMessage): Promise<Date | null> {
  try {
    const currentSeconds = Number(current.timestamp);
    const records = (await evolutionFindMessages(`${phone}@s.whatsapp.net`, 1, 30)) as EvolutionMessageData[];
    let earliest: number | null = null;
    for (const record of records) {
      if (!record.key?.id || record.key.id === current.id) continue;
      const seconds = Number(record.messageTimestamp);
      if (!Number.isFinite(seconds) || seconds <= 0) continue;
      if (Number.isFinite(currentSeconds) && seconds >= currentSeconds) continue;
      const mapped = toInboundMessage(record, phone);
      if (!mapped) continue;
      const { content } = describeForRecord(mapped);
      if (isAutomatedMessage(content)) continue;
      if (earliest === null || seconds < earliest) earliest = seconds;
    }
    return earliest === null ? null : new Date(earliest * 1000);
  } catch {
    return null;
  }
}
