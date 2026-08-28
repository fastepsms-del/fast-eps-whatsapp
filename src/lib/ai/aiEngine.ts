import type { Lead, MessageIntent } from "@prisma/client";
import type { Content, FunctionCall, Part } from "@google/genai";
import { FunctionCallingConfigMode } from "@google/genai";
import { getGeminiClient, getGeminiModel, MAX_RESPONSE_TOKENS } from "./geminiClient";
import { aiTools, type ClassifyMessageArgs, type RequestHumanHandoffArgs, type SetLeadStatusArgs, type UpdateLeadArgs } from "./tools";
import { buildSystemPrompt } from "./systemPrompt";
import { getKnowledgeBase } from "@/lib/config/knowledgeService";
import { buildChatHistory, getRecentMessages, setMessageIntent } from "@/lib/conversation/messageService";
import { applyHumanHandoff, applyLeadStatus, applyLeadUpdate, getLeadById } from "@/lib/leads/leadService";
import { logEvent } from "@/lib/logger";

export interface ProcessTurnResult {
    replyText: string;
    handedOff: boolean;
    intent: MessageIntent | null;
}

/**
 * Processa um turno completo do atendimento: monta o prompt com a base de
 * conhecimento e o estado do lead, chama o Gemini com as ferramentas de
 * CRM, executa as ferramentas retornadas (atualizando o banco) e devolve o
 * texto final que deve ser enviado ao cliente.
 */
export async function processInboundTurn(
    lead: Lead,
    inboundMessageId: string,
    currentMessageParts: Part[],
  ): Promise<ProcessTurnResult> {
    const knowledgeBase = await getKnowledgeBase();
    const systemPrompt = buildSystemPrompt({ knowledgeBase, lead });

  const history = await getRecentMessages(lead.id);
    const contents = buildChatHistory(history, { messageId: inboundMessageId, parts: currentMessageParts });

  const client = getGeminiClient();
    const model = getGeminiModel();
    const config = {
          systemInstruction: systemPrompt,
          tools: [{ functionDeclarations: aiTools }],
          toolConfig: { functionCallingConfig: { mode: FunctionCallingConfigMode.AUTO } },
          maxOutputTokens: MAX_RESPONSE_TOKENS,
    };

  let handedOff = false;
    let classifiedIntent: MessageIntent | null = null;

  const firstResponse = await client.models.generateContent({ model, contents, config });
    let replyText = (firstResponse.text ?? "").trim();
    const functionCalls = firstResponse.functionCalls ?? [];

  const toolResultParts = await executeFunctionCalls(functionCalls, lead, inboundMessageId, {
        onHandoff: () => (handedOff = true),
        onIntent: (intent) => (classifiedIntent = intent),
  });

  if (!replyText && toolResultParts.length > 0) {
        // O modelo só chamou ferramentas nesta rodada; pedimos a mensagem final
      // em uma segunda chamada, já com os resultados das ferramentas.
      const modelTurn: Content = firstResponse.candidates?.[0]?.content ?? {
              role: "model",
              parts: functionCalls.map((call) => ({ functionCall: call })),
      };
        const followUp = await client.models.generateContent({
                model,
                contents: [...contents, modelTurn, { role: "user", parts: toolResultParts }],
                config,
        });
        replyText = (followUp.text ?? "").trim();
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

async function executeFunctionCalls(
    calls: FunctionCall[],
    lead: Lead,
    inboundMessageId: string,
    callbacks: ExecuteToolsCallbacks,
  ): Promise<Part[]> {
    const results: Part[] = [];

  for (const call of calls) {
        if (!call.name) continue;
        const args = (call.args ?? {}) as Record<string, unknown>;

      try {
              switch (call.name) {
                case "classify_message": {
                            const typedArgs = args as unknown as ClassifyMessageArgs;
                            await setMessageIntent(inboundMessageId, typedArgs.intent as MessageIntent);
                            callbacks.onIntent(typedArgs.intent as MessageIntent);
                            results.push(functionResponsePart(call, { output: "ok" }));
                            break;
                }
                case "update_lead": {
                            const typedArgs = args as unknown as UpdateLeadArgs;
                            await applyLeadUpdate(lead.id, typedArgs);
                            results.push(functionResponsePart(call, { output: "lead atualizado" }));
                            break;
                }
                case "set_lead_status": {
                            const typedArgs = args as unknown as SetLeadStatusArgs;
                            await applyLeadStatus(lead.id, typedArgs);
                            results.push(functionResponsePart(call, { output: "status atualizado" }));
                            break;
                }
                case "request_human_handoff": {
                            const typedArgs = args as unknown as RequestHumanHandoffArgs;
                            await applyHumanHandoff(lead.id, typedArgs);
                            callbacks.onHandoff();
                            results.push(functionResponsePart(call, { output: "transferido para atendimento humano" }));
                            break;
                }
                default:
                            results.push(functionResponsePart(call, { error: "ferramenta desconhecida" }));
              }
      } catch (error) {
              await logEvent({
                        scope: "ai",
                        level: "error",
                        message: `Falha ao executar ferramenta ${call.name}`,
                        metadata: { leadId: lead.id, error: String(error) },
              });
              results.push(functionResponsePart(call, { error: "erro ao aplicar ferramenta" }));
      }
  }

  return results;
}

function functionResponsePart(call: FunctionCall, response: Record<string, unknown>): Part {
    return {
          functionResponse: {
                  id: call.id,
                  name: call.name ?? "",
                  response,
          },
    };
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
