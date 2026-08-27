import { describe, expect, it } from "vitest";
import { isWithinBusinessHours } from "./businessHours";
import type { BusinessHoursConfig } from "./config/types";

const config: BusinessHoursConfig = {
  timezone: "America/Sao_Paulo",
  startHour: 7,
  endHour: 18,
  daysOfWeek: [1, 2, 3, 4, 5, 6],
  outOfHoursNotice: "fora do horário",
};

describe("isWithinBusinessHours", () => {
  it("retorna true durante o horário comercial em um dia útil", () => {
    // Quarta-feira, 10:00 em São Paulo (UTC-3) -> 13:00 UTC
    const date = new Date("2026-01-14T13:00:00Z");
    expect(isWithinBusinessHours(config, date)).toBe(true);
  });

  it("retorna false antes das 7h", () => {
    // 06:59 em São Paulo -> 09:59 UTC
    const date = new Date("2026-01-14T09:59:00Z");
    expect(isWithinBusinessHours(config, date)).toBe(false);
  });

  it("retorna false às 18h em diante (limite exclusivo)", () => {
    // 18:00 em São Paulo -> 21:00 UTC
    const date = new Date("2026-01-14T21:00:00Z");
    expect(isWithinBusinessHours(config, date)).toBe(false);
  });

  it("retorna false aos domingos (não incluído em daysOfWeek)", () => {
    // Domingo, 10:00 em São Paulo -> 13:00 UTC
    const date = new Date("2026-01-18T13:00:00Z");
    expect(isWithinBusinessHours(config, date)).toBe(false);
  });

  it("retorna true no limite inferior (7h em ponto)", () => {
    const date = new Date("2026-01-14T10:00:00Z"); // 07:00 em São Paulo
    expect(isWithinBusinessHours(config, date)).toBe(true);
  });
});
