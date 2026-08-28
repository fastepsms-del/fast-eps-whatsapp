import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
    if (!client) {
          const apiKey = process.env.GEMINI_API_KEY;
          if (!apiKey) {
                  throw new Error("GEMINI_API_KEY não configurada");
          }
          client = new GoogleGenAI({ apiKey });
    }
    return client;
}

/**
 * Modelo padrão: "gemini-3.5-flash" — o modelo Flash de uso geral mais atual
 * do Gemini no momento em que este projeto foi construído (confirmado nas
 * amostras oficiais do SDK @google/genai). "Gemini 3.7 Flash" não é um model
 * ID reconhecido pelo SDK oficial até o momento; caso a Google lance uma
 * versão mais nova, basta atualizar a variável de ambiente GEMINI_MODEL,
 * sem precisar alterar código.
 */
export function getGeminiModel(): string {
    return process.env.GEMINI_MODEL || "gemini-3.5-flash";
}

export const MAX_RESPONSE_TOKENS = 700;
