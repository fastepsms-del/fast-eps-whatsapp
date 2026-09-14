import { LEAD_STATUS_VALUES } from "@/lib/ai/tools";
import type { KnowledgeKey } from "./types";

function str(form: FormData, key: string): string {
  return String(form.get(key) ?? "").trim();
}

function strOrNull(form: FormData, key: string): string | null {
  const value = str(form, key);
  return value.length > 0 ? value : null;
}

function num(form: FormData, key: string, fallback = 0): number {
  const value = Number(form.get(key));
  return Number.isFinite(value) ? value : fallback;
}

function bool(form: FormData, key: string): boolean {
  return form.get(key) === "1" || form.get(key) === "on";
}

function lines(form: FormData, key: string): string[] {
  return str(form, key)
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

function jsonOrDefault<T>(form: FormData, key: string, fallback: T): T {
  const raw = str(form, key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function buildSectionFromForm(key: KnowledgeKey, form: FormData): unknown {
  switch (key) {
    case "COMPANY_INFO":
      return {
        name: str(form, "name"),
        segment: str(form, "segment"),
        description: str(form, "description"),
        brandTraits: lines(form, "brandTraits"),
        toneOfVoice: str(form, "toneOfVoice"),
        yearsInBusiness: strOrNull(form, "yearsInBusiness"),
        disclaimerNoInvent: str(form, "disclaimerNoInvent"),
      };
    case "PRICING":
      return {
        policy: str(form, "policy"),
        priceTables: jsonOrDefault(form, "priceTablesJson", { MOLDURA_EPS: null, PAINEL_MONOLITICO: null }),
      };
    case "DELIVERY":
      return {
        policy: str(form, "policy"),
        citiesServed: lines(form, "citiesServed"),
        freightTable: jsonOrDefault(form, "freightTableJson", null),
      };
    case "INSTALLATION": {
      const raw = form.get("offersInstallation");
      const offersInstallation = raw === "true" ? true : raw === "false" ? false : null;
      return {
        policy: str(form, "policy"),
        offersInstallation,
        regionsAvailable: lines(form, "regionsAvailable"),
      };
    }
    case "TECHNICAL_INFORMATION":
      return {
        thermalInsulation: str(form, "thermalInsulation"),
        acousticInsulation: str(form, "acousticInsulation"),
        structuralNotes: str(form, "structuralNotes"),
        paintingCompatibility: str(form, "paintingCompatibility"),
        outdoorUse: str(form, "outdoorUse"),
      };
    case "CONTACT_INFORMATION":
      return {
        salesTeamNote: str(form, "salesTeamNote"),
        supportPhone: strOrNull(form, "supportPhone"),
        supportEmail: strOrNull(form, "supportEmail"),
        website: strOrNull(form, "website"),
        instagram: strOrNull(form, "instagram"),
      };
    case "BUSINESS_HOURS":
      return {
        timezone: str(form, "timezone") || "America/Sao_Paulo",
        startHour: num(form, "startHour", 7),
        endHour: num(form, "endHour", 18),
        daysOfWeek: form.getAll("daysOfWeek").map((d) => Number(d)),
        outOfHoursNotice: str(form, "outOfHoursNotice"),
      };
    case "FOLLOW_UP_SETTINGS":
      return {
        enabled: bool(form, "enabled"),
        delayHoursAfterNoResponse: num(form, "delayHoursAfterNoResponse", 24),
        maxAttempts: num(form, "maxAttempts", 2),
        minHoursBetweenAttempts: num(form, "minHoursBetweenAttempts", 48),
        applicableStatuses: form
          .getAll("applicableStatuses")
          .map(String)
          .filter((s) => (LEAD_STATUS_VALUES as readonly string[]).includes(s)),
        messageTemplateName: str(form, "messageTemplateName"),
        fallbackMessage: str(form, "fallbackMessage"),
      };
    case "HUMAN_HANDOFF_SETTINGS":
      return {
        handoffMessage: str(form, "handoffMessage"),
        outOfHoursHandoffMessage: str(form, "outOfHoursHandoffMessage"),
        triggersDescription: lines(form, "triggersDescription"),
      };
    case "GREETING_SETTINGS":
      return {
        firstMessage: str(form, "firstMessage"),
        menuMessage: str(form, "menuMessage"),
        fallbackErrorMessage: str(form, "fallbackErrorMessage"),
      };
    case "PRODUCTS":
      return null;
    default:
      return null;
  }
}
