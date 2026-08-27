import type { BusinessHoursConfig } from "@/lib/config/types";

/**
 * Verifica se um instante (default: agora) cai dentro do horário comercial
 * configurado, usando o fuso horário informado (ex: "America/Sao_Paulo").
 */
export function isWithinBusinessHours(config: BusinessHoursConfig, date: Date = new Date()): boolean {
  const parts = getZonedParts(date, config.timezone);
  if (!config.daysOfWeek.includes(parts.weekday)) return false;
  if (parts.hour < config.startHour) return false;
  if (parts.hour >= config.endHour) return false;
  return true;
}

function getZonedParts(date: Date, timeZone: string): { weekday: number; hour: number } {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "numeric",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const weekdayStr = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const hourStr = parts.find((p) => p.type === "hour")?.value ?? "0";

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  // A formatação "hour: numeric, hour12: false" pode retornar "24" à meia-noite
  // em alguns runtimes; normalizamos para 0-23.
  let hour = parseInt(hourStr, 10);
  if (hour === 24) hour = 0;

  return { weekday: weekdayMap[weekdayStr] ?? 0, hour };
}
