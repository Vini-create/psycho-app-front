import type {
  ContextItem,
  ContextReport,
  EmotionalValence,
} from "@sinapsa/api-client";

const DAY_MS = 86_400_000;

export type ObservationGroupId =
  | "direction"
  | "events"
  | "experience"
  | "challenges"
  | "resources"
  | "attention"
  | "other";

export type ObservationGroup = {
  id: ObservationGroupId;
  label: string;
  shortLabel: string;
  kinds: string[];
  colorClass: string;
};

export const OBSERVATION_GROUPS: ObservationGroup[] = [
  {
    id: "direction",
    label: "Prioridades e assuntos abertos",
    shortLabel: "Direção",
    kinds: ["priority", "open_topic"],
    colorClass: "bg-chart-4",
  },
  {
    id: "events",
    label: "Acontecimentos e mudanças",
    shortLabel: "Eventos",
    kinds: ["event", "change"],
    colorClass: "bg-chart-3",
  },
  {
    id: "experience",
    label: "Emoções e pensamentos relatados",
    shortLabel: "Relatos",
    kinds: ["emotion", "thought"],
    colorClass: "bg-chart-2",
  },
  {
    id: "challenges",
    label: "Desafios e comportamentos",
    shortLabel: "Desafios",
    kinds: ["challenge", "behavior"],
    colorClass: "bg-chart-1",
  },
  {
    id: "resources",
    label: "Estratégias e apoios",
    shortLabel: "Recursos",
    kinds: ["strategy", "support"],
    colorClass: "bg-brand",
  },
  {
    id: "attention",
    label: "Contextos de atenção",
    shortLabel: "Atenção",
    kinds: ["safety_context"],
    colorClass: "bg-primary",
  },
];

export const EVIDENCE_ORDER = [
  "explicit_repeated",
  "explicit_once",
  "uncertain",
  "contradictory",
] as const;

export type EmotionalVariation =
  | "insufficient"
  | "consistent"
  | "varied";

export type EmotionalContextItem = ContextItem & {
  emotional_valence: EmotionalValence;
};

export function emotionalContextItems(
  items: ContextItem[],
): EmotionalContextItem[] {
  return items.filter(
    (item): item is EmotionalContextItem =>
      item.kind === "emotion" && Boolean(item.emotional_valence),
  );
}

/**
 * Compara somente emoções explicitamente nomeadas em datas diferentes.
 * O resultado descreve diversidade dos relatos, nunca estabilidade clínica.
 */
export function emotionalVariation(
  items: ContextItem[],
): EmotionalVariation {
  const dated = emotionalContextItems(items).filter((item) => item.occurred_at);
  const observedDays = new Set(
    dated.map((item) => item.occurred_at!.slice(0, 10)),
  );

  if (dated.length < 2 || observedDays.size < 2) return "insufficient";

  return new Set(dated.map((item) => item.emotional_valence)).size > 1
    ? "varied"
    : "consistent";
}

export function periodDays(report: ContextReport): number {
  const difference =
    Date.parse(report.period_end) - Date.parse(report.period_start);
  return Math.max(1, Math.round(difference / DAY_MS));
}

export function activeDayRatio(report: ContextReport): number {
  return Math.min(1, report.coverage.active_day_count / periodDays(report));
}

/**
 * Só compara períodos realmente anteriores. Relatórios sobrepostos podem
 * conter as mesmas mensagens e produziriam uma variação enganosa.
 */
export function previousComparableReport(
  report: ContextReport,
  reports: ContextReport[],
): ContextReport | null {
  const start = Date.parse(report.period_start);
  return (
    [...reports]
      .filter(
        (candidate) =>
          candidate.id !== report.id &&
          Date.parse(candidate.period_end) <= start,
      )
      .sort(
        (a, b) => Date.parse(b.period_end) - Date.parse(a.period_end),
      )[0] ?? null
  );
}

export function activeDayDelta(
  current: ContextReport,
  previous: ContextReport | null,
): number | null {
  if (!previous) return null;
  return Math.round((activeDayRatio(current) - activeDayRatio(previous)) * 100);
}

export function groupForItem(item: ContextItem): ObservationGroup {
  return (
    OBSERVATION_GROUPS.find((group) => group.kinds.includes(item.kind)) ?? {
      id: "events",
      label: "Outras observações",
      shortLabel: "Outros",
      kinds: [item.kind],
      colorClass: "bg-chart-muted",
    }
  );
}

export function itemsByGroup(items: ContextItem[]) {
  const knownKinds = new Set(OBSERVATION_GROUPS.flatMap((group) => group.kinds));
  const known = OBSERVATION_GROUPS.map((group) => ({
    ...group,
    items: items.filter((item) => group.kinds.includes(item.kind)),
  })).filter((group) => group.items.length > 0);
  const otherItems = items.filter((item) => !knownKinds.has(item.kind));
  return otherItems.length > 0
    ? [
        ...known,
        {
          id: "other" as const,
          label: "Outras observações",
          shortLabel: "Outros",
          kinds: [...new Set(otherItems.map((item) => item.kind))],
          colorClass: "bg-chart-muted",
          items: otherItems,
        },
      ]
    : known;
}

export function evidenceCounts(items: ContextItem[]): Record<string, number> {
  return items.reduce<Record<string, number>>((counts, item) => {
    counts[item.evidence_strength] =
      (counts[item.evidence_strength] ?? 0) + 1;
    return counts;
  }, {});
}

export function pointPosition(item: ContextItem, report: ContextReport): number {
  if (!item.occurred_at) return 0;
  const start = Date.parse(report.period_start);
  const end = Date.parse(report.period_end);
  const at = Date.parse(item.occurred_at);
  if (!Number.isFinite(at) || end <= start) return 0;
  return Math.max(0, Math.min(100, ((at - start) / (end - start)) * 100));
}
