import type {
  Connection,
  ContextReport,
  Invitation,
  ProfessionalProfile,
} from "@sinapsa/api-client";
import type { ActivityPoint, Tone } from "@sinapsa/ui";

const DAY = 86_400_000;

export const daysBetween = (fromIso: string, to = Date.now()): number =>
  Math.floor((to - Date.parse(fromIso)) / DAY);

export const connectionIdOf = (connection: Connection): string =>
  connection.connection_id ?? connection.id;

/** Dias cobertos por um relatório, para o denominador da atividade. */
function periodLength(report: ContextReport): number {
  const days = Math.round(
    (Date.parse(report.period_end) - Date.parse(report.period_start)) / DAY,
  );
  return Math.max(days, 1);
}

/**
 * Quantos dias a pessoa conversou em cada período, do mais antigo ao mais
 * recente. É o sinal mais honesto que os dados existentes oferecem sobre
 * engajamento — `active_day_count` vem da cobertura declarada do relatório.
 */
export function activityPoints(
  reports: ContextReport[],
  limit = 8,
): ActivityPoint[] {
  return [...reports]
    .sort((a, b) => Date.parse(a.period_end) - Date.parse(b.period_end))
    .slice(-limit)
    .map((report) => ({
      label: new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
      }).format(new Date(report.period_end)),
      value: report.coverage.active_day_count,
      total: periodLength(report),
    }));
}

export type Engagement = "sem-relatorio" | "silencio" | "baixa" | "regular";

export function engagementOf(report: ContextReport | null): Engagement {
  if (!report) return "sem-relatorio";
  const ratio = report.coverage.active_day_count / periodLength(report);
  if (ratio === 0) return "silencio";
  if (ratio < 0.35) return "baixa";
  return "regular";
}

export const ENGAGEMENT_LABEL: Record<Engagement, string> = {
  "sem-relatorio": "Sem relatório ainda",
  silencio: "Nenhuma conversa no período",
  baixa: "Poucas conversas",
  regular: "Conversas regulares",
};

export type PatientInsight = {
  connection: Connection;
  connectionId: string;
  reports: ContextReport[];
  latest: ContextReport | null;
  daysSinceLatest: number | null;
  activity: ActivityPoint[];
  /** O paciente autorizou relatórios de período? */
  allowsReports: boolean;
  engagement: Engagement;
};

export function buildInsight(
  connection: Connection,
  reports: ContextReport[],
): PatientInsight {
  const sorted = [...reports].sort(
    (a, b) => Date.parse(b.period_end) - Date.parse(a.period_end),
  );
  const latest = sorted[0] ?? null;

  return {
    connection,
    connectionId: connectionIdOf(connection),
    reports: sorted,
    latest,
    daysSinceLatest: latest ? daysBetween(latest.period_end) : null,
    activity: activityPoints(reports),
    allowsReports: connection.consent_scopes.includes("summaries"),
    engagement: engagementOf(latest),
  };
}

/* ------------------------------------------------------------- assinatura */

export type SubscriptionState = {
  active: boolean;
  status: string;
  trialing: boolean;
  label: string;
};

/**
 * Regra de negócio: relatório de contexto só existe em conexão com
 * profissional assinante. Trial conta como assinatura vigente.
 */
export function subscriptionOf(
  profile: ProfessionalProfile | null | undefined,
): SubscriptionState {
  const status = profile?.plan?.status ?? "none";
  const trialing = status === "trialing";
  const active = status === "active" || trialing;

  const LABEL: Record<string, string> = {
    active: "Assinatura ativa",
    trialing: "Período de avaliação",
    past_due: "Pagamento pendente",
    canceled: "Assinatura cancelada",
    none: "Sem assinatura",
  };

  return { active, trialing, status, label: LABEL[status] ?? status };
}

/* --------------------------------------------------------- fila de atenção */

export type AttentionItem = {
  id: string;
  tone: Tone;
  title: string;
  detail: string;
  href?: string;
  actionLabel?: string;
};

const EXPIRING_SOON_DAYS = 3;
const STALE_REPORT_DAYS = 21;
const NO_REPORT_GRACE_DAYS = 14;

/**
 * O que exige decisão do profissional agora — em ordem de urgência.
 *
 * Tudo aqui é derivado dos dados que a API já entrega. Nenhum item existe
 * "porque o dado existe": cada um corresponde a uma ação possível.
 */
export function attentionItems({
  insights,
  invitations,
  subscription,
}: {
  insights: PatientInsight[];
  invitations: Invitation[];
  subscription: SubscriptionState;
}): AttentionItem[] {
  const items: AttentionItem[] = [];

  if (!subscription.active) {
    items.push({
      id: "assinatura",
      tone: "danger",
      title: subscription.label,
      detail:
        "Relatórios de contexto só podem ser solicitados com assinatura vigente. Os vínculos e os relatórios já gerados continuam acessíveis.",
      href: "/conta",
      actionLabel: "Ver assinatura",
    });
  }

  const expiring = invitations.filter(
    (invitation) =>
      invitation.status === "pending" &&
      daysBetween(invitation.expires_at) >= -EXPIRING_SOON_DAYS &&
      daysBetween(invitation.expires_at) < 0,
  );
  if (expiring.length > 0) {
    items.push({
      id: "convites-expirando",
      tone: "warning",
      title:
        expiring.length === 1
          ? "Um convite expira em breve"
          : `${expiring.length} convites expiram em breve`,
      detail: expiring.map((invitation) => invitation.email).join(", "),
      href: "/convites",
      actionLabel: "Ver convites",
    });
  }

  const blocked = insights.filter(
    (insight) =>
      insight.connection.status === "active" && !insight.allowsReports,
  );
  if (blocked.length > 0) {
    items.push({
      id: "sem-consentimento",
      tone: "warning",
      title:
        blocked.length === 1
          ? "Um paciente não autoriza relatórios"
          : `${blocked.length} pacientes não autorizam relatórios`,
      detail: `${blocked
        .map((insight) => insight.connection.patient_display_name ?? "Paciente")
        .join(", ")} — a permissão é revogável e pode ser reativada por eles.`,
    });
  }

  const neverReported = insights.filter(
    (insight) =>
      insight.connection.status === "active" &&
      insight.allowsReports &&
      insight.reports.length === 0 &&
      insight.connection.activated_at !== null &&
      daysBetween(insight.connection.activated_at) > NO_REPORT_GRACE_DAYS,
  );
  if (neverReported.length > 0) {
    items.push({
      id: "sem-relatorio",
      tone: "info",
      title:
        neverReported.length === 1
          ? "Um acompanhamento ainda sem contexto"
          : `${neverReported.length} acompanhamentos ainda sem contexto`,
      detail: neverReported
        .map((insight) => insight.connection.patient_display_name ?? "Paciente")
        .join(", "),
    });
  }

  const stale = insights.filter(
    (insight) =>
      insight.connection.status === "active" &&
      insight.allowsReports &&
      insight.daysSinceLatest !== null &&
      insight.daysSinceLatest > STALE_REPORT_DAYS,
  );
  if (stale.length > 0) {
    items.push({
      id: "contexto-antigo",
      tone: "info",
      title:
        stale.length === 1
          ? "Um contexto passou de três semanas"
          : `${stale.length} contextos passaram de três semanas`,
      detail: stale
        .map(
          (insight) =>
            `${insight.connection.patient_display_name ?? "Paciente"} (${insight.daysSinceLatest} dias)`,
        )
        .join(", "),
    });
  }

  return items;
}

/** Relatórios gerados na última semana — o que há de novo para ler. */
export function recentlyGenerated(insights: PatientInsight[], days = 7) {
  return insights.flatMap((insight) =>
    insight.reports
      .filter((report) => daysBetween(report.created_at) < days)
      .map((report) => ({ insight, report })),
  );
}

/**
 * Cobertura somada dos relatórios que terminam na mesma data.
 *
 * Não é telemetria contínua de uso: períodos sem relatório não existem nesta
 * série. A razão soma dias com mensagens sobre dias cobertos pelos relatórios.
 */
export function aggregateActivity(
  insights: PatientInsight[],
  limit = 8,
): ActivityPoint[] {
  // Agrupa pela data real do fim do período, não pelo rótulo formatado:
  // ordenar por ordem de inserção num Map daria resultado diferente conforme
  // a ordem dos pacientes, e "23 de ago." de anos distintos colidiria.
  const buckets = new Map<string, { at: number; value: number; total: number }>();

  for (const insight of insights) {
    for (const report of insight.reports) {
      const at = Date.parse(report.period_end);
      const key = new Date(at).toISOString().slice(0, 10);
      const bucket = buckets.get(key) ?? { at, value: 0, total: 0 };
      bucket.value += report.coverage.active_day_count;
      bucket.total += periodLength(report);
      buckets.set(key, bucket);
    }
  }

  return [...buckets.values()]
    .sort((a, b) => a.at - b.at)
    .slice(-limit)
    .map((bucket) => ({
      label: new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
      }).format(new Date(bucket.at)),
      value: bucket.value,
      total: bucket.total,
    }));
}
