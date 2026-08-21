import { describe, expect, it } from "vitest";
import type { Connection, ContextReport, Invitation } from "@sinapsa/api-client";
import {
  activityPoints,
  aggregateActivity,
  attentionItems,
  buildInsight,
  engagementOf,
  subscriptionOf,
} from "./insights";

const DAY = 86_400_000;
const ago = (days: number) => new Date(Date.now() - days * DAY).toISOString();
const ahead = (days: number) => new Date(Date.now() + days * DAY).toISOString();

function report(overrides: Partial<ContextReport> = {}): ContextReport {
  return {
    id: "r1",
    connection_id: "c1",
    schema_version: "journey-report-v1",
    title: "Relatório",
    period_start: ago(7),
    period_end: ago(0),
    coverage: {
      conversation_count: 2,
      user_message_count: 10,
      active_day_count: 5,
      completeness: "partial",
    },
    summary: "",
    timeline: [],
    items: [],
    limitations: [],
    provider: "mock",
    model: "m",
    prompt_version: "p",
    graph_version: "g",
    review_status: "approved",
    reviewed_at: ago(0),
    created_at: ago(0),
    ...overrides,
  };
}

function connection(overrides: Partial<Connection> = {}): Connection {
  return {
    id: "c1",
    connection_id: "c1",
    status: "active",
    consent_scopes: ["summaries"],
    activated_at: ago(60),
    ended_at: null,
    created_at: ago(61),
    patient_display_name: "Helena",
    ...overrides,
  };
}

describe("activityPoints", () => {
  it("ordena do período mais antigo para o mais recente", () => {
    const points = activityPoints([
      report({ id: "a", period_end: ago(0), period_start: ago(7) }),
      report({ id: "b", period_end: ago(14), period_start: ago(21) }),
    ]);
    expect(points).toHaveLength(2);
    // O mais recente fica por último — é onde o olho termina.
    expect(points[1]!.total).toBe(7);
  });

  it("limita a quantidade de barras", () => {
    const many = Array.from({ length: 20 }, (_, i) =>
      report({ id: `r${i}`, period_end: ago(i * 7), period_start: ago(i * 7 + 7) }),
    );
    expect(activityPoints(many, 8)).toHaveLength(8);
  });

  it("nunca divide por zero quando o período é degenerado", () => {
    const points = activityPoints([
      report({ period_start: ago(0), period_end: ago(0) }),
    ]);
    expect(points[0]!.total).toBeGreaterThan(0);
  });
});

describe("engagementOf", () => {
  it("distingue silêncio, pouca conversa e conversa regular", () => {
    const coverage = (days: number) => ({
      conversation_count: 1,
      user_message_count: 1,
      active_day_count: days,
      completeness: "partial",
    });
    expect(engagementOf(null)).toBe("sem-relatorio");
    expect(engagementOf(report({ coverage: coverage(0) }))).toBe("silencio");
    expect(engagementOf(report({ coverage: coverage(2) }))).toBe("baixa");
    expect(engagementOf(report({ coverage: coverage(5) }))).toBe("regular");
  });
});

describe("subscriptionOf", () => {
  it("trata trial como assinatura vigente", () => {
    expect(subscriptionOf({ plan: { code: "single", status: "trialing" } } as never).active).toBe(true);
    expect(subscriptionOf({ plan: { code: "single", status: "active" } } as never).active).toBe(true);
  });

  it("bloqueia quando não há assinatura vigente", () => {
    for (const status of ["past_due", "canceled", "none"]) {
      expect(subscriptionOf({ plan: { code: "single", status } } as never).active).toBe(false);
    }
    expect(subscriptionOf(null).active).toBe(false);
    expect(subscriptionOf(undefined).active).toBe(false);
  });
});

describe("attentionItems", () => {
  const activeSub = subscriptionOf({
    plan: { code: "single", status: "active" },
  } as never);

  it("põe a assinatura inativa em primeiro lugar", () => {
    const items = attentionItems({
      insights: [],
      invitations: [],
      subscription: subscriptionOf(null),
    });
    expect(items[0]!.id).toBe("assinatura");
    expect(items[0]!.tone).toBe("danger");
  });

  it("não inventa itens quando está tudo em ordem", () => {
    const items = attentionItems({
      insights: [buildInsight(connection(), [report()])],
      invitations: [],
      subscription: activeSub,
    });
    expect(items).toEqual([]);
  });

  it("avisa sobre convite expirando nos próximos três dias", () => {
    const invitation: Invitation = {
      id: "i1",
      email: "joana@exemplo.com",
      status: "pending",
      expires_at: ahead(2),
      created_at: ago(5),
    };
    const items = attentionItems({
      insights: [],
      invitations: [invitation],
      subscription: activeSub,
    });
    expect(items.some((item) => item.id === "convites-expirando")).toBe(true);
  });

  it("ignora convite que ainda tem prazo folgado", () => {
    const invitation: Invitation = {
      id: "i1",
      email: "joana@exemplo.com",
      status: "pending",
      expires_at: ahead(10),
      created_at: ago(1),
    };
    const items = attentionItems({
      insights: [],
      invitations: [invitation],
      subscription: activeSub,
    });
    expect(items.some((item) => item.id === "convites-expirando")).toBe(false);
  });

  it("sinaliza paciente que revogou o consentimento de relatórios", () => {
    const items = attentionItems({
      insights: [buildInsight(connection({ consent_scopes: ["events"] }), [])],
      invitations: [],
      subscription: activeSub,
    });
    expect(items.some((item) => item.id === "sem-consentimento")).toBe(true);
  });

  it("não cobra contexto de vínculo recém-ativado", () => {
    const items = attentionItems({
      insights: [buildInsight(connection({ activated_at: ago(3) }), [])],
      invitations: [],
      subscription: activeSub,
    });
    expect(items.some((item) => item.id === "sem-relatorio")).toBe(false);
  });

  it("sinaliza contexto parado há mais de três semanas", () => {
    const old = report({ period_end: ago(30), period_start: ago(37) });
    const items = attentionItems({
      insights: [buildInsight(connection(), [old])],
      invitations: [],
      subscription: activeSub,
    });
    expect(items.some((item) => item.id === "contexto-antigo")).toBe(true);
  });

  it("ignora acompanhamento encerrado", () => {
    const items = attentionItems({
      insights: [
        buildInsight(
          connection({ status: "ended", consent_scopes: [], ended_at: ago(5) }),
          [],
        ),
      ],
      invitations: [],
      subscription: activeSub,
    });
    expect(items).toEqual([]);
  });
});

describe("aggregateActivity", () => {
  it("soma dias ativos e dias possíveis por período", () => {
    const week = { period_start: ago(7), period_end: ago(0) };
    const cover = (days: number) => ({
      conversation_count: 1,
      user_message_count: 1,
      active_day_count: days,
      completeness: "partial",
    });

    const points = aggregateActivity([
      buildInsight(connection({ id: "a" }), [
        report({ id: "a1", ...week, coverage: cover(5) }),
      ]),
      buildInsight(connection({ id: "b" }), [
        report({ id: "b1", ...week, coverage: cover(2) }),
      ]),
    ]);

    expect(points).toHaveLength(1);
    expect(points[0]!.value).toBe(7);
    expect(points[0]!.total).toBe(14);
  });

  it("devolve vazio quando não há relatório nenhum", () => {
    expect(aggregateActivity([buildInsight(connection(), [])])).toEqual([]);
  });
});
