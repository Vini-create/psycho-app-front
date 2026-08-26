import { describe, expect, it } from "vitest";
import { daysBetween, eachDay, formatDay, formatDayShort } from "./format";

/* O dia de um check-in é dia local de quem respondeu, não instante.
   `new Date("2026-08-26")` é meia-noite UTC: formatado em qualquer fuso a
   oeste, devolve 25. Estes testes protegem exatamente esse deslocamento —
   e por isso comparam o número do dia com o que veio na string, o que vale
   em qualquer fuso onde a suíte rodar. */

describe("dia local", () => {
  it("formata o mesmo dia que recebeu", () => {
    for (const day of ["2026-08-26", "2026-01-01", "2026-12-31", "2026-03-01"]) {
      const expected = day.slice(8);
      expect(formatDay(day).startsWith(expected)).toBe(true);
      expect(formatDayShort(day).startsWith(expected)).toBe(true);
    }
  });

  it("conta os dois extremos do período", () => {
    expect(daysBetween("2026-08-26", "2026-08-26")).toBe(1);
    expect(daysBetween("2026-08-20", "2026-08-26")).toBe(7);
    // Virada de mês e de ano precisam continuar contando dias de calendário.
    expect(daysBetween("2026-01-28", "2026-02-03")).toBe(7);
    expect(daysBetween("2025-12-30", "2026-01-02")).toBe(4);
  });

  it("enumera o calendário do período, inclusive as pontas", () => {
    expect(eachDay("2026-08-24", "2026-08-27")).toEqual([
      "2026-08-24",
      "2026-08-25",
      "2026-08-26",
      "2026-08-27",
    ]);
    expect(eachDay("2026-08-26", "2026-08-26")).toEqual(["2026-08-26"]);
    // Fim antes do início não é período: devolve nada em vez de laço infinito.
    expect(eachDay("2026-08-26", "2026-08-24")).toEqual([]);
  });

  it("atravessa a virada de mês sem pular nem repetir dia", () => {
    const days = eachDay("2026-02-27", "2026-03-02");
    expect(days).toEqual([
      "2026-02-27",
      "2026-02-28",
      "2026-03-01",
      "2026-03-02",
    ]);
    expect(new Set(days).size).toBe(days.length);
  });
});
