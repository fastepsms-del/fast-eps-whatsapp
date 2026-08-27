import type Anthropic from "@anthropic-ai/sdk";

// ============================================================================
// Ferramentas (tool use) que a IA pode chamar durante o atendimento.
//
// A IA nunca decide "na marra" via texto livre o que grava no CRM: ela chama
// estas ferramentas com argumentos estruturados, e o backend é quem de fato
// atualiza o lead no banco. Isso deixa o "cérebro" comercial (prompt) e o
// "estado" (banco) desacoplados e fáceis de auditar/testar.
// ============================================================================

export const LEAD_STATUS_VALUES = [
  "NOVO",
  "EM_ATENDIMENTO",
  "INTERESSADO",
  "AGUARDANDO_INFORMACOES",
  "ORCAMENTO_SOLICITADO",
  "ORCAMENTO_ENVIADO",
  "NEGOCIACAO",
  "AGUARDANDO_RESPOSTA",
  "CONVERTIDO",
  "PERDIDO",
  "ATENDIMENTO_HUMANO",
] as const;

export const PRODUCT_INTEREST_VALUES = ["INDEFINIDO", "MOLDURA_EPS", "PAINEL_MONOLITICO", "OUTRO"] as const;

export const LEAD_SOURCE_VALUES = [
  "DESCONHECIDA",
  "TRAFEGO_PAGO",
  "GOOGLE",
  "INSTAGRAM",
  "FACEBOOK",
  "INDICACAO",
  "ORGANICO",
  "OUTRO",
] as const;

export const MESSAGE_INTENT_VALUES = [
  "SAUDACAO",
  "MOLDURAS",
  "PAINEL_MONOLITICO",
  "ORCAMENTO",
  "PRECO",
  "MEDIDAS",
  "INSTALACAO",
  "ENTREGA",
  "LOCALIZACAO",
  "DUVIDA_TECNICA",
  "ENVIO_FOTO",
  "ENVIO_PROJETO",
  "COMPRA",
  "RECLAMACAO",
  "ATENDIMENTO_HUMANO",
  "INFORMACAO_INSTITUCIONAL",
  "OUTRO",
] as const;

export const HANDOFF_CATEGORY_VALUES = [
  "PEDIDO_EXPLICITO",
  "NEGOCIACAO_PRECO",
  "RECLAMACAO",
  "DUVIDA_TECNICA_COMPLEXA",
  "ANALISE_DE_PROJETO",
  "CONDICAO_COMERCIAL_ESPECIAL",
  "FORA_DA_BASE_DE_CONHECIMENTO",
  "DUVIDA_INSTALACAO",
  "ORCAMENTO_PERSONALIZADO",
  "INTENCAO_DE_COMPRA",
  "OUTRO",
] as const;

export const LEAD_TEMPERATURE_VALUES = ["FRIO", "MORNO", "QUENTE"] as const;

export const aiTools: Anthropic.Tool[] = [
  {
    name: "classify_message",
    description:
      "Classifica internamente a intenção da última mensagem do cliente. Uso interno apenas, nunca é " +
      "mostrado ao cliente. Chame isso em toda mensagem recebida do cliente.",
    input_schema: {
      type: "object",
      properties: {
        intent: { type: "string", enum: [...MESSAGE_INTENT_VALUES] },
      },
      required: ["intent"],
    },
  },
  {
    name: "update_lead",
    description:
      "Atualiza os dados cadastrais/comerciais do lead conforme informações que o cliente forneceu na " +
      "conversa. Envie apenas os campos que mudaram ou que foram informados agora — nunca envie um campo " +
      "com valor inventado.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Nome do cliente, se informado" },
        city: { type: "string", description: "Cidade da obra/projeto, se informada" },
        productInterest: { type: "string", enum: [...PRODUCT_INTEREST_VALUES] },
        quantity: { type: "string", description: "Quantidade aproximada em texto livre, ex: '30 metros'" },
        measurements: { type: "string", description: "Medidas informadas pelo cliente, em texto livre" },
        hasProject: { type: "boolean", description: "Se o cliente possui projeto arquitetônico/estrutural" },
        hasPhoto: { type: "boolean", description: "Se o cliente já enviou foto de referência do local/obra" },
        desiredDate: { type: "string", description: "Quando pretende realizar a obra, em texto livre" },
        wantsQuote: { type: "boolean", description: "Se o cliente demonstrou querer orçamento" },
        source: { type: "string", enum: [...LEAD_SOURCE_VALUES], description: "Origem do lead, se mencionada" },
        temperature: { type: "string", enum: [...LEAD_TEMPERATURE_VALUES], description: "Temperatura comercial percebida do lead" },
        notes: { type: "string", description: "Observação curta relevante para a equipe comercial" },
      },
    },
  },
  {
    name: "set_lead_status",
    description: "Atualiza o status do lead no funil de atendimento.",
    input_schema: {
      type: "object",
      properties: {
        status: { type: "string", enum: [...LEAD_STATUS_VALUES] },
      },
      required: ["status"],
    },
  },
  {
    name: "request_human_handoff",
    description:
      "Sinaliza que a conversa deve ser transferida para um atendente humano e que a IA deve parar de " +
      "responder automaticamente até a equipe reativar. Use nas situações previstas nas regras de " +
      "transferência (pedido explícito, negociação de preço, reclamação, dúvida técnica complexa, análise " +
      "de projeto, condição comercial especial, pergunta fora da base de conhecimento, dúvida sobre " +
      "instalação não confirmada, orçamento personalizado, ou intenção clara de compra que dependa de " +
      "intervenção humana).",
    input_schema: {
      type: "object",
      properties: {
        category: { type: "string", enum: [...HANDOFF_CATEGORY_VALUES] },
        reason: { type: "string", description: "Resumo curto do motivo, para a equipe entender o contexto rapidamente" },
      },
      required: ["category", "reason"],
    },
  },
];

export interface UpdateLeadArgs {
  name?: string;
  city?: string;
  productInterest?: (typeof PRODUCT_INTEREST_VALUES)[number];
  quantity?: string;
  measurements?: string;
  hasProject?: boolean;
  hasPhoto?: boolean;
  desiredDate?: string;
  wantsQuote?: boolean;
  source?: (typeof LEAD_SOURCE_VALUES)[number];
  temperature?: (typeof LEAD_TEMPERATURE_VALUES)[number];
  notes?: string;
}

export interface SetLeadStatusArgs {
  status: (typeof LEAD_STATUS_VALUES)[number];
}

export interface RequestHumanHandoffArgs {
  category: (typeof HANDOFF_CATEGORY_VALUES)[number];
  reason: string;
}

export interface ClassifyMessageArgs {
  intent: (typeof MESSAGE_INTENT_VALUES)[number];
}
