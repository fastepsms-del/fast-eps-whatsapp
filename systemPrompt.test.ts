import { describe, expect, it } from "vitest";
import { buildSystemPrompt } from "./systemPrompt";
import { DEFAULT_KNOWLEDGE_BASE } from "@/lib/config/defaults";
import type { Lead } from "@prisma/client";

function fakeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: "lead_1",
    phone: "5511999999999",
    name: null,
    profileName: "Cliente Teste",
    city: null,
    productInterest: "INDEFINIDO",
    quantity: null,
    measurements: null,
    hasProject: null,
    hasPhoto: false,
    desiredDate: null,
    wantsQuote: false,
    notes: null,
    status: "NOVO",
    temperature: "DESCONHECIDA",
    source: "DESCONHECIDA",
    humanHandoff: false,
    humanHandoffReason: null,
    humanHandoffCategory: null,
    humanHandoffAt: null,
    followUpCount: 0,
    lastFollowUpAt: null,
    followUpPaused: false,
    lastInboundAt: null,
    lastOutboundAt: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  } as Lead;
}

describe("buildSystemPrompt", () => {
  it("inclui o nome da empresa e a regra de não inventar informação", () => {
    const prompt = buildSystemPrompt({ knowledgeBase: DEFAULT_KNOWLEDGE_BASE, lead: fakeLead() });
    expect(prompt).toContain("Fast EPS");
    expect(prompt).toContain("NUNCA INVENTAR");
  });

  it("nunca inventa tempo de mercado quando não cadastrado", () => {
    const prompt = buildSystemPrompt({ knowledgeBase: DEFAULT_KNOWLEDGE_BASE, lead: fakeLead() });
    expect(prompt).toContain("NÃO CADASTRADO");
    expect(prompt).not.toMatch(/há \d+ anos/i);
  });

  it("reflete os dados já conhecidos do lead para não repetir perguntas", () => {
    const lead = fakeLead({ city: "Curitiba", productInterest: "MOLDURA_EPS", measurements: "3m x 1,2m" });
    const prompt = buildSystemPrompt({ knowledgeBase: DEFAULT_KNOWLEDGE_BASE, lead });
    expect(prompt).toContain("Curitiba");
    expect(prompt).toContain("MOLDURA_EPS");
    expect(prompt).toContain("3m x 1,2m");
  });

  it("indica corretamente se está dentro ou fora do horário comercial", () => {
    const withinHours = new Date("2026-01-14T13:00:00Z"); // 10h em São Paulo, quarta-feira
    const outsideHours = new Date("2026-01-14T23:00:00Z"); // 20h em São Paulo

    const promptWithin = buildSystemPrompt({ knowledgeBase: DEFAULT_KNOWLEDGE_BASE, lead: fakeLead(), now: withinHours });
    const promptOutside = buildSystemPrompt({ knowledgeBase: DEFAULT_KNOWLEDGE_BASE, lead: fakeLead(), now: outsideHours });

    expect(promptWithin).toContain("estamos DENTRO");
    expect(promptOutside).toContain("estamos FORA");
  });

  it("nunca promete preço quando não há tabela cadastrada", () => {
    const prompt = buildSystemPrompt({ knowledgeBase: DEFAULT_KNOWLEDGE_BASE, lead: fakeLead() });
    expect(prompt).toContain("SEM tabela de preço cadastrada");
  });
});
