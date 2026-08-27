import type { Lead, MessageIntent } from "@prisma/client";
import { getClaudeClient, getClaudeModel, MAX_RESPONSE_TOKENS } from "./claudeClient";
import { aiTools, type ClassifyMessageArgs, type RequestHumanHandoffArgs, type SetLeadStatusArgs, type UpdateLeadArgs } from "./tools";
import { buildSystemPrompt } from "./systemPrompt";
import { getKnowledgeBase } from "@/lib/config/knowledgeService";
import { buildChatHistory, getRecentMessages, setMessageIntent } from "@/lib/conversation/messageService";
import { applyHumanHandoff, applyLeadStatus, applyLeadUpdate, getLeadById } from "@/lib/leads/leadService";
import type { ChatMessage, ContentBlock, ToolResultBlock, ToolUseBlock } from "./anthropicTypes";
import { logEvent } from "@/lib/logger";

export interface ProcessTurnResult {
  replyText: string;
  handedOff: boolean;
  intent: MessageIntent | null;
}

/**
 * Processa um turno completo do atendimento: monta o prompt com a base de
 * conhecimento e o estado do lead, chama o Claude com as ferramentas de
 * CRM, executa as ferramentas retornadas (atualizando o banco) e devolve o
 * texto final que deve ser enviado ao cliente.
 */
export async function processInboundTurn(
  lead: Lead,
  inboundMessageId: string,
  currentMessageBlocks: ContentBlock[],
): Promise<ProcessTurnResult> {
  const knowledgeBase = await getKnowledgeBase();
  const systemPrompt = buildSystemPrompt({ knowledgeBase, lead });

  const history = await getRecentMessages(lead.id);
  const chatHistory = buildChatHistory(history, { messageId: inboundMessageId, blocks: currentMessageBlocks });

  const client = getClaudeClient();
  const model = getClaudeModel();

  let handedOff = false;
  let classifiedIntent: MessageIntent | null = null;

  const firstResponse = await client.messages.create({
    model,
    max_tokens: MAX_RESPONSE_TOKENS,
    system: systemPrompt,
    tools: aiTools as never,
    tool_choice: { type: "auto" },
    messages: chatHistory as never,
  });

  const firstBlocks = firstResponse.content as unknown as Array<{ type: string } & Record<string, unknown>>;
  let replyText = extractText(firstBlocks);

  const toolResults = await executeToolBlocks(firstBlocks as unknown as ToolUseBlock[], lead, inboundMessageId, {
    onHandoff: () => (handedOff = true),
    onIntent: (intent) => (classifiedIntent = intent),
  });

  if (!replyText && toolResults.length > 0) {
    // O modelo só chamou ferramentas nesta rodada; pedimos a mensagem final
    // em uma segunda chamada, já com os resultados das ferramentas.
    const followUp = await client.messages.create({
      model,
      max_tokens: MAX_RESPONSE_TOKENS,
      system: systemPrompt,
      tools: aiTools as never,
      tool_choice: { type: "auto" },
      messages: [
        ...chatHistory,
        { role: "assistant", content: firstBlocks as unknown as ContentBlock[] },
        { role: "user", content: toolResults as unknown as ContentBlock[] },
      ] as never,
    });
    const followUpBlocks = followUp.content as unknown as Array<{ type: string } & Record<string, unknown>>;
    replyText = extractText(followUpBlocks);
  }

  if (!replyText) {
    replyText = knowledgeBase.GREETING_SETTINGS.fallbackErrorMessage;
    await logEvent({
      scope: "ai",
      level: "warn",
      message: "IA não retornou texto de resposta; usando fallback",
      metadata: { leadId: lead.id },
    });
  }

  return { replyText: replyText.trim(), handedOff, intent: classifiedIntent };
}

interface ExecuteToolsCallbacks {
  onHandoff: () => void;
  onIntent: (intent: MessageIntent) => void;
}

async function executeToolBlocks(
  blocks: ToolUseBlock[],
  lead: Lead,
  inboundMessageId: string,
  callbacks: ExecuteToolsCallbacks,
): Promise<ToolResultBlock[]> {
  const results: ToolResultBlock[] = [];

  for (const block of blocks) {
    if (block.type !== "tool_use") continue;

    try {
      switch (block.name) {
        case "classify_message": {
          const args = block.input as unknown as ClassifyMessageArgs;
          await setMessageIntent(inboundMessageId, args.intent as MessageIntent);
          callbacks.onIntent(args.intent as MessageIntent);
          results.push(toolResult(block.id, "ok"));
          break;
        }
        case "update_lead": {
          const args = block.input as unknown as UpdateLeadArgs;
          await applyLeadUpdate(lead.id, args);
          results.push(toolResult(block.id, "lead atualizado"));
          break;
        }
        case "set_lead_status": {
          const args = block.input as unknown as SetLeadStatusArgs;
          await applyLeadStatus(lead.id, args);
          results.push(toolResult(block.id, "status atualizado"));
          break;
        }
        case "request_human_handoff": {
          const args = block.input as unknown as RequestHumanHandoffArgs;
          await applyHumanHandoff(lead.id, args);
          callbacks.onHandoff();
          results.push(toolResult(block.id, "transferido para atendimento humano"));
          break;
        }
        default:
          results.push(toolResult(block.id, "ferramenta desconhecida", true));
      }
    } catch (error) {
      await logEvent({
        scope: "ai",
        level: "error",
        message: `Falha ao executar ferramenta ${block.name}`,
        metadata: { leadId: lead.id, error: String(error) },
      });
      results.push(toolResult(block.id, "erro ao aplicar ferramenta", true));
    }
  }

  return results;
}

function toolResult(toolUseId: string, content: string, isError = false): ToolResultBlock {
  return { type: "tool_result", tool_use_id: toolUseId, content, is_error: isError };
}

function extractText(blocks: Array<{ type: string } & Record<string, unknown>>): string {
  return blocks
    .filter((b): b is { type: "text"; text: string } => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

/** Usado pelo fallback quando a IA está indisponível (ver seção 42 do briefing). */
export async function buildUnavailableFallback(leadId: string): Promise<string> {
  const knowledgeBase = await getKnowledgeBase();
  const lead = await getLeadById(leadId);
  if (lead) {
    await applyHumanHandoff(leadId, {
      category: "OUTRO",
      reason: "Falha técnica ao processar mensagem com a IA — encaminhado automaticamente.",
    });
  }
  return knowledgeBase.GREETING_SETTINGS.fallbackErrorMessage;
}

export type { ChatMessage };
