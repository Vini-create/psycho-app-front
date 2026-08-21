import Link from "next/link";
import {
  ActivityBars,
  Badge,
  Metadata,
  cx,
  formatDate,
  pluralize,
  type Tone,
} from "@sinapsa/ui";
import {
  ENGAGEMENT_LABEL,
  type Engagement,
  type PatientInsight,
} from "@/lib/insights";

const ENGAGEMENT_TONE: Record<Engagement, Tone> = {
  "sem-relatorio": "neutral",
  silencio: "warning",
  baixa: "info",
  regular: "success",
};

/** Abaixo disso a faixa lê como sublinhado, não como gráfico. */
const MIN_BARS = 3;

function lastContextLabel(insight: PatientInsight): string {
  if (!insight.latest) return "Nenhum contexto recebido";
  const days = insight.daysSinceLatest ?? 0;
  if (days <= 0) return "Contexto de hoje";
  if (days === 1) return "Contexto de ontem";
  if (days < 30) return `Contexto de ${days} dias atrás`;
  return `Contexto de ${formatDate(insight.latest.period_end)}`;
}

/**
 * A linha do paciente carrega o que decide se vale abrir: quanto a pessoa
 * conversou, há quanto tempo veio o último contexto, e o que ela autoriza.
 *
 * O estado nunca vem só da cor — a faixa de atividade é acompanhada do
 * número em texto, e o engajamento tem rótulo escrito.
 */
export function PatientRow({ insight }: { insight: PatientInsight }) {
  const { connection, latest } = insight;
  const active = connection.status === "active";

  return (
    <li className="relative" data-dashboard-row>
      <Link
        href={`/pacientes/${insight.connectionId}`}
        className={cx(
          "flex flex-col gap-4 rounded-lg bg-card p-5",
          "transition-[background-color,transform] duration-140 ease-sinapsa",
          "hover:bg-brand-surface sm:flex-row sm:items-center sm:gap-6",
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-editorial text-heading-md font-semibold text-primary">
              {connection.patient_display_name ?? "Paciente"}
            </span>
            {!active && <Badge tone="neutral">Encerrado</Badge>}
          </span>

          <Metadata>{lastContextLabel(insight)}</Metadata>

          {!insight.allowsReports && active && (
            <span className="pt-1">
              <Badge tone="warning">Não autoriza relatórios</Badge>
            </span>
          )}
        </div>

        {insight.activity.length >= MIN_BARS && (
          <div className="flex shrink-0 items-center gap-4">
            <ActivityBars points={insight.activity} className="w-28" />
            <span className="flex flex-col gap-1">
              {/* O número em texto: a barra sozinha nunca é o único sinal. */}
              <span className="font-utility text-label-md font-bold text-primary">
                {pluralize(latest?.coverage.active_day_count ?? 0, "dia", "dias")}
              </span>
              <Badge tone={ENGAGEMENT_TONE[insight.engagement]}>
                {ENGAGEMENT_LABEL[insight.engagement]}
              </Badge>
            </span>
          </div>
        )}

        {insight.activity.length < MIN_BARS && (
          <span className="flex shrink-0 items-center gap-3">
            {latest && (
              <span className="font-utility text-label-md font-bold text-primary">
                {pluralize(latest.coverage.active_day_count, "dia", "dias")}
              </span>
            )}
            <Badge tone={ENGAGEMENT_TONE[insight.engagement]}>
              {ENGAGEMENT_LABEL[insight.engagement]}
            </Badge>
          </span>
        )}
      </Link>
    </li>
  );
}
