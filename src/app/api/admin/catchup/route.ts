import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { recordMessage } from "@/lib/conversation/messageService";
import { processInboundTurn, buildUnavailableFallback, TECHNICAL_FAILURE_HANDOFF_REASON } from "@/lib/ai/aiEngine";
import { sendTextMessage } from "@/lib/whatsapp/client";
import { touchLeadOutbound, reactivateAutomation } from "@/lib/leads/leadService";
import { logEvent } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 60;

const FREE_TEXT_WINDOW_HOURS = 24;

/**
 * Varredura manual (disparada pelo painel admin) pra responder leads que
 * ficaram sem resposta por algum motivo (falha de token, bug, cota da IA
 * estourada, etc.). Dois passos:
 *
 * 1. Reativa automaticamente todo lead que foi marcado como "atendimento
 *    humano" pelo PRÓPRIO SISTEMA por causa de uma falha técnica (o texto
 *    exato do motivo é TECHNICAL_FAILURE_HANDOFF_REASON) — nunca mexe em
 *    leads transferidos de verdade por decisão humana/da IA por outro
 *    motivo, só desfaz o efeito colateral de um erro técnico passageiro.
 * 2. Busca todo lead com automação ativa cuja última mensagem foi do
 *    cliente (sem resposta nossa depois — incluindo os que acabaram de ser
 *    reativados no passo 1), reprocessa com a IA usando o texto da última
 *    mensagem guardada, e envia a resposta.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const stuckByTechnicalFailure = await prisma.lead.findMany({
    where: { humanHandoff: true, humanHandoffReason: TECHNICAL_FAILURE_HANDOFF_REASON },
  });

  for (const lead of stuckByTechnicalFailure) {
    await reactivateAutomation(lead.id);
  }

  if (stuckByTechnicalFailure.length > 0) {
    await logEvent({
      scope: "admin",
      level: "info",
      message: `Catch-up: reativados ${stuckByTechnicalFailure.length} lead(s) que ficaram presos em "atendimento humano" por falha técnica.`,
    });
  }

  const candidates = await prisma.lead.findMany({
    where: { humanHandoff: false, lastInboundAt: { not: null } },
  });

  const pending = candidates.filter((lead) => !lead.lastOutboundAt || lead.lastInboundAt! > lead.lastOutboundAt);

  let processed = 0;
  let failed = 0;
  let skippedOutsideWindow = 0;

  for (const lead of pending) {
    const hoursSinceLastInbound = (Date.now() - lead.lastInboundAt!.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastInbound >= FREE_TEXT_WINDOW_HOURS) {
      skippedOutsideWindow += 1;
      continue;
    }

    const lastInbound = await prisma.message.findFirst({
      where: { leadId: lead.id, direction: "INBOUND" },
      orderBy: { createdAt: "desc" },
    });
    if (!lastInbound) continue;

    let replyText: string;
    try {
      const result = await processInboundTurn(lead, lastInbound.id, [
        { text: lastInbound.content ?? "[mensagem anterior sem texto disponível]" },
      ]);
      replyText = result.replyText;
    } catch (error) {
      await logEvent({
        scope: "ai",
        level: "error",
        message: `Catch-up: falha ao processar lead ${lead.id}: ${String(error)}`,
        metadata: { leadId: lead.id },
      });
      replyText = await buildUnavailableFallback(lead.id);
    }

    const sendResult = await sendTextMessage(lead.phone, replyText);
    await recordMessage(lead.id, {
      direction: "OUTBOUND",
      type: "TEXT",
      content: replyText,
      whatsappMessageId: sendResult.whatsappMessageId ?? null,
      status: sendResult.ok ? "SENT" : "FAILED",
    });
    await touchLeadOutbound(lead.id);

    if (sendResult.ok) processed += 1;
    else failed += 1;
  }

  await logEvent({
    scope: "admin",
    level: "info",
    message: `Catch-up manual: ${stuckByTechnicalFailure.length} reativados, ${processed} respondidos, ${failed} falharam ao enviar, ${skippedOutsideWindow} fora da janela de 24h`,
    metadata: { totalPendentes: pending.length },
  });

  const url = new URL("/admin/leads", request.url);
  url.searchParams.set(
    "catchup",
    `${pending.length}|${processed}|${failed}|${skippedOutsideWindow}|${stuckByTechnicalFailure.length}`,
  );
  return NextResponse.redirect(url, { status: 303 });
}
