import { describe, expect, it } from "vitest";
import type { ContextReport } from "@sinapsa/api-client";
import {
  activeDayDelta,
  activeDayRatio,
  emotionalContextItems,
  emotionalVariation,
  evidenceCounts,
  pointPosition,
  previousComparableReport,
} from "./report-analytics";

const report = (overrides: Partial<ContextReport> = {}): ContextReport => ({
  id: "current",
  connection_id: "connection",
  schema_version: "journey-report-v1",
  title: "Relatório",
  period_start: "2026-08-08T00:00:00Z",
  period_end: "2026-08-15T00:00:00Z",
  coverage: {
    conversation_count: 2,
    user_message_count: 12,
    active_day_count: 4,
    completeness: "partial",
  },
  summary: "Resumo",
  timeline: [],
  items: [],
  limitations: [],
  provider: "mock",
  model: "mock",
  prompt_version: "journey-report-v1",
  graph_version: "journey-report-graph-v1",
  review_status: "approved",
  created_at: "2026-08-15T01:00:00Z",
  ...overrides,
});

describe("report analytics", () => {
  it("normaliza dias ativos pelo tamanho do período", () => {
    expect(activeDayRatio(report())).toBeCloseTo(4 / 7);
  });

  it("compara apenas com relatório anterior que não sobrepõe o atual", () => {
    const current = report();
    const overlapping = report({
      id: "overlap",
      period_start: "2026-08-05T00:00:00Z",
      period_end: "2026-08-10T00:00:00Z",
    });
    const previous = report({
      id: "previous",
      period_start: "2026-08-01T00:00:00Z",
      period_end: "2026-08-08T00:00:00Z",
      coverage: { ...current.coverage, active_day_count: 2 },
    });

    expect(previousComparableReport(current, [overlapping, previous])?.id).toBe(
      "previous",
    );
    expect(activeDayDelta(current, previous)).toBe(29);
  });

  it("posiciona observação dentro do período", () => {
    const current = report();
    expect(
      pointPosition(
        {
          id: "item",
          kind: "event",
          title: "Evento",
          description: "Descrição",
          evidence_strength: "explicit_once",
          occurred_at: "2026-08-11T12:00:00Z",
          limitations: [],
          included: true,
        },
        current,
      ),
    ).toBe(50);
  });

  it("conta a composição das evidências", () => {
    const items = ["explicit_once", "explicit_repeated", "explicit_once"].map(
      (strength, index) => ({
        id: String(index),
        kind: "event",
        title: "Evento",
        description: "Descrição",
        evidence_strength: strength,
        limitations: [],
        included: true,
      }),
    );
    expect(evidenceCounts(items).explicit_once).toBe(2);
    expect(evidenceCounts(items).explicit_repeated).toBe(1);
  });

  it("considera somente emoções com classificação explícita", () => {
    const items: ContextReport["items"] = [
      {
        id: "emotion",
        kind: "emotion",
        title: "Alívio",
        description: "Relatou alívio.",
        emotional_valence: "pleasant",
        evidence_strength: "explicit_once",
        occurred_at: "2026-08-10T12:00:00Z",
        limitations: [],
        included: true,
      },
      {
        id: "thought",
        kind: "thought",
        title: "Pensamento",
        description: "Relatou um pensamento.",
        evidence_strength: "explicit_once",
        occurred_at: "2026-08-11T12:00:00Z",
        limitations: [],
        included: true,
      },
    ];

    expect(emotionalContextItems(items).map((item) => item.id)).toEqual([
      "emotion",
    ]);
  });

  it("descreve diversidade entre relatos sem inferir instabilidade", () => {
    const items: ContextReport["items"] = [
      {
        id: "difficult",
        kind: "emotion",
        title: "Frustração",
        description: "Relatou frustração.",
        emotional_valence: "unpleasant",
        evidence_strength: "explicit_once",
        occurred_at: "2026-08-10T12:00:00Z",
        limitations: [],
        included: true,
      },
      {
        id: "pleasant",
        kind: "emotion",
        title: "Alívio",
        description: "Relatou alívio.",
        emotional_valence: "pleasant",
        evidence_strength: "explicit_once",
        occurred_at: "2026-08-12T12:00:00Z",
        limitations: [],
        included: true,
      },
    ];

    expect(emotionalVariation(items)).toBe("varied");
    expect(emotionalVariation(items.slice(0, 1))).toBe("insufficient");
  });
});
