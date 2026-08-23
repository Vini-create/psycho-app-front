import {
  Card,
  Metadata,
  Overline,
  formatDateShort,
  pluralize,
} from "@sinapsa/ui";
import type { ContextReport, EmotionalValence } from "@sinapsa/api-client";
import {
  emotionalValenceLabel,
  evidenceLabel,
} from "@/lib/report-labels";
import {
  EVIDENCE_ORDER,
  activeDayDelta,
  activeDayRatio,
  emotionalContextItems,
  emotionalVariation,
  evidenceCounts,
  itemsByGroup,
  periodDays,
  pointPosition,
} from "@/lib/report-analytics";

const EMOTIONAL_ROWS: Array<{
  value: EmotionalValence;
  colorClass: string;
}> = [
  { value: "pleasant", colorClass: "bg-chart-4" },
  { value: "mixed", colorClass: "bg-chart-3" },
  { value: "neutral", colorClass: "bg-chart-2" },
  { value: "unpleasant", colorClass: "bg-chart-1" },
];

function CoveragePulse({
  report,
  previousReport,
}: {
  report: ContextReport;
  previousReport: ContextReport | null;
}) {
  const period = periodDays(report);
  const ratio = activeDayRatio(report);
  const percentage = Math.round(ratio * 100);
  const delta = activeDayDelta(report, previousReport);
  const messagesPerActiveDay =
    report.coverage.active_day_count > 0
      ? report.coverage.user_message_count / report.coverage.active_day_count
      : 0;

  return (
    <Card variant="inverse" className="min-h-0 justify-between gap-5 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Overline as="h4" className="text-on-inverse-muted">
            Ritmo do período
          </Overline>
          <p className="mt-2 flex items-end gap-2">
            <span className="font-ui text-[3.5rem] leading-[0.82] font-bold tracking-[-0.04em] text-on-inverse">
              {percentage}%
            </span>
            <span className="max-w-[10ch] pb-1 text-sm leading-tight text-on-inverse-muted">
              dos dias com registros
            </span>
          </p>
        </div>
        <Metadata className="text-right text-on-inverse-muted">
          {report.coverage.active_day_count}/{period} dias
        </Metadata>
      </div>

      <div
        className="h-2 overflow-hidden rounded-full bg-chart-track/30"
        role="img"
        aria-label={`${percentage}% dos dias do período tiveram registros`}
      >
        <span
          className="block h-full rounded-full bg-chart-2"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <dl className="grid grid-cols-2 gap-3">
        <div className="rounded-md bg-white/10 p-3">
          <dt className="type-eyebrow text-on-inverse-muted">Mensagens</dt>
          <dd className="mt-1 font-ui text-xl font-bold text-on-inverse">
            {report.coverage.user_message_count}
          </dd>
        </div>
        <div className="rounded-md bg-white/10 p-3">
          <dt className="type-eyebrow text-on-inverse-muted">Por dia ativo</dt>
          <dd className="mt-1 font-ui text-xl font-bold text-on-inverse">
            {messagesPerActiveDay.toLocaleString("pt-BR", {
              maximumFractionDigits: 1,
            })}
          </dd>
        </div>
      </dl>

      <p className="type-ui text-ui font-semibold text-on-inverse">
        {delta === null
          ? "Primeiro período comparável deste acompanhamento."
          : delta === 0
            ? "Mesma proporção de dias ativos do período anterior."
            : `${delta > 0 ? "+" : ""}${delta} pontos percentuais em relação ao período anterior.`}
      </p>
    </Card>
  );
}

export function ObservationMap({
  report,
  compact = false,
  headingAs = "h3",
}: {
  report: ContextReport;
  compact?: boolean;
  headingAs?: "h3" | "h4";
}) {
  const grouped = itemsByGroup(report.items);
  const datedCount = report.items.filter((item) => item.occurred_at).length;
  const undatedCount = report.items.length - datedCount;

  return (
    <Card
      variant="standard"
      className={compact ? "min-h-0 gap-4 p-4 sm:p-5" : "min-h-0 gap-5 p-5 sm:p-6"}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Overline as={headingAs}>Mapa do período</Overline>
          <p className="mt-1 font-editorial text-h3 font-semibold text-primary">
            O que apareceu e quando.
          </p>
        </div>
        <Metadata>
          {pluralize(report.items.length, "observação", "observações")}
        </Metadata>
      </div>

      {grouped.length === 0 ? (
        <p className="rounded-md bg-raised p-4 text-body text-secondary">
          Este relatório não organizou observações individuais.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {grouped.map((group) => {
            const dated = group.items.filter((item) => item.occurred_at);
            return (
              <div
                key={group.id}
                className="grid items-center gap-2.5"
                style={{ gridTemplateColumns: compact ? "4.25rem minmax(0, 1fr)" : "5.5rem minmax(0, 1fr)" }}
              >
                <span className="type-meta leading-tight text-secondary">
                  {group.shortLabel}
                </span>
                <div className="relative h-7 rounded-full bg-raised/75">
                  {dated.map((item) => {
                    const position = Math.max(
                      3,
                      Math.min(97, pointPosition(item, report)),
                    );
                    const repeated = item.evidence_strength === "explicit_repeated";
                    const uncertain =
                      item.evidence_strength === "uncertain" ||
                      item.evidence_strength === "contradictory";
                    return (
                      <span
                        key={item.id}
                        title={`${item.title} · ${evidenceLabel(item.evidence_strength)}`}
                        role="img"
                        aria-label={`${item.title}, ${formatDateShort(item.occurred_at!)}, ${evidenceLabel(item.evidence_strength)}`}
                        className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ${group.colorClass} ${
                          repeated ? "size-4 ring-4 ring-surface" : "size-3"
                        } ${uncertain ? "opacity-55" : "opacity-100"}`}
                        style={{ left: `${position}%` }}
                      />
                    );
                  })}
                  {dated.length === 0 && (
                    <span className="absolute inset-0 grid place-items-center type-meta text-secondary">
                      sem data definida
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          <div
            className="grid gap-2.5"
            style={{ gridTemplateColumns: compact ? "4.25rem minmax(0, 1fr)" : "5.5rem minmax(0, 1fr)" }}
          >
            <span aria-hidden="true" />
            <div className="flex justify-between gap-4">
              <Metadata>{formatDateShort(report.period_start)}</Metadata>
              <Metadata>{formatDateShort(report.period_end)}</Metadata>
            </div>
          </div>
        </div>
      )}

      {!compact && grouped.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-2 type-meta text-secondary">
          <span className="inline-flex items-center gap-2">
            <span className="size-3 rounded-full bg-chart-3" aria-hidden="true" />
            Menção pontual
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="size-4 rounded-full bg-chart-3 ring-4 ring-surface" aria-hidden="true" />
            Menção repetida
          </span>
          {undatedCount > 0 && <span>{undatedCount} sem data definida</span>}
        </div>
      )}
    </Card>
  );
}

function ObservationComposition({ report }: { report: ContextReport }) {
  const groups = itemsByGroup(report.items);
  const counts = evidenceCounts(report.items);
  const total = Math.max(report.items.length, 1);

  if (report.items.length === 0) return null;

  return (
    <Card variant="standard" className="min-h-0 gap-5 p-5 sm:p-6">
      <div>
        <Overline as="h4">Composição da leitura</Overline>
        <p className="mt-1 max-w-[48ch] text-body text-secondary">
          Mostra como o relatório organizou os relatos. Não mede frequência,
          intensidade ou gravidade clínica.
        </p>
      </div>

      <div
        className="flex h-4 gap-1 overflow-hidden rounded-full bg-raised"
        role="img"
        aria-label={groups
          .map((group) => `${group.label}: ${group.items.length}`)
          .join("; ")}
      >
        {groups.map((group) => (
          <span
            key={group.id}
            className={`h-full ${group.colorClass}`}
            style={{ width: `${(group.items.length / total) * 100}%` }}
          />
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {groups.map((group) => (
          <div key={group.id} className="flex items-center justify-between gap-3">
            <span className="inline-flex min-w-0 items-center gap-2 text-sm text-secondary">
              <span className={`size-2.5 shrink-0 rounded-full ${group.colorClass}`} aria-hidden="true" />
              <span>{group.label}</span>
            </span>
            <span className="type-ui text-ui font-semibold text-primary">
              {group.items.length}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-raised p-4">
        <Overline as="h5" className="text-secondary">
          Força das evidências
        </Overline>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          {EVIDENCE_ORDER.map((strength) => (
            <div key={strength}>
              <dt className="text-sm leading-tight text-secondary">
                {evidenceLabel(strength)}
              </dt>
              <dd className="mt-1 font-ui text-xl font-bold text-primary">
                {counts[strength] ?? 0}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Card>
  );
}

function ReportedEmotionalContext({ report }: { report: ContextReport }) {
  const items = emotionalContextItems(report.items);
  const variation = emotionalVariation(report.items);

  if (items.length === 0) return null;

  const headline = {
    insufficient: "Ainda não há duas datas para comparar.",
    consistent: "Relatos semelhantes em dias diferentes.",
    varied: "Relatos diferentes apareceram no período.",
  }[variation];

  return (
    <Card variant="standard" className="min-h-0 gap-4 p-5 sm:p-6">
      <div className="grid grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] gap-4 sm:grid-cols-[minmax(12rem,0.7fr)_minmax(18rem,1.3fr)] sm:gap-7">
        <div className="self-center">
          <Overline as="h4">Contexto emocional relatado</Overline>
          <p className="mt-2 font-editorial text-xl font-semibold leading-tight text-primary sm:text-h3">
            {headline}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-secondary sm:text-sm">
            Organiza emoções nomeadas pela pessoa. Não mede intensidade,
            estabilidade ou diagnóstico.
          </p>
        </div>

        <div className="min-w-0">
          <div className="flex flex-col gap-1.5">
            {EMOTIONAL_ROWS.map((row) => {
              const rowItems = items.filter(
                (item) =>
                  item.emotional_valence === row.value && item.occurred_at,
              );
              return (
                <div
                  key={row.value}
                  className="grid grid-cols-[3.35rem_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[4.25rem_minmax(0,1fr)]"
                >
                  <span className="font-ui text-[0.6rem] font-bold leading-tight text-secondary sm:text-meta-lg">
                    {emotionalValenceLabel(row.value)}
                  </span>
                  <div className="relative h-6 rounded-full bg-raised/80">
                    {rowItems.map((item) => {
                      const position = Math.max(
                        4,
                        Math.min(96, pointPosition(item, report)),
                      );
                      return (
                        <span
                          key={item.id}
                          role="img"
                          title={`${item.title} · ${formatDateShort(item.occurred_at!)}`}
                          aria-label={`${item.title}, ${emotionalValenceLabel(row.value)}, ${formatDateShort(item.occurred_at!)}`}
                          className={`absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 ring-surface ${row.colorClass}`}
                          style={{ left: `${position}%` }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="ml-[4.1rem] mt-2 flex justify-between gap-3 sm:ml-[5.05rem]">
            <Metadata>{formatDateShort(report.period_start)}</Metadata>
            <Metadata>{formatDateShort(report.period_end)}</Metadata>
          </div>
          <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5" aria-label="Emoções relatadas no período">
            {items.slice(0, 4).map((item) => (
              <li key={item.id} className="type-meta text-secondary">
                <span className="font-bold text-primary">{item.title}</span>
                {item.occurred_at && ` · ${formatDateShort(item.occurred_at)}`}
              </li>
            ))}
            {items.length > 4 && (
              <li className="type-meta text-secondary">
                +{items.length - 4} observações
              </li>
            )}
            {items.some((item) => !item.occurred_at) && (
              <li className="type-meta text-secondary">
                Há observação sem data definida.
              </li>
            )}
          </ul>
        </div>
      </div>
    </Card>
  );
}

export function ReportSignals({
  report,
  previousReport,
}: {
  report: ContextReport;
  previousReport: ContextReport | null;
}) {
  return (
    <section className="flex flex-col gap-4" aria-labelledby={`signals-${report.id}`}>
      <div>
        <Overline as="h3" id={`signals-${report.id}`} className="text-secondary">
          Leitura estruturada
        </Overline>
        <p className="mt-1 font-editorial text-h2 leading-tight text-primary">
          Evidências do período, sem transformar relato em diagnóstico.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(15rem,0.78fr)_minmax(0,1.22fr)]">
        <CoveragePulse report={report} previousReport={previousReport} />
        <ObservationMap report={report} headingAs="h4" />
      </div>
      <ReportedEmotionalContext report={report} />
      <ObservationComposition report={report} />
    </section>
  );
}
