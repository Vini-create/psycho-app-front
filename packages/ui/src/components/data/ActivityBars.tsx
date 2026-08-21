import { cx } from "../../lib/cx";

export type ActivityPoint = {
  /** Rótulo do período, para o tooltip e o texto acessível. */
  label: string;
  /** Dias em que a pessoa conversou. */
  value: number;
  /** Dias do período — o teto da barra. */
  total: number;
};

/**
 * Faixa de atividade: quantos dias a pessoa conversou em cada período.
 *
 * Magnitude, não identidade — então rampa sequencial de uma matiz só, nunca
 * cores categóricas. Os degraus vêm dos tokens `--chart-*`, validados contra
 * as duas superfícies.
 *
 * Não é telemetria contínua: descreve somente a cobertura dos períodos para os
 * quais existem relatórios. Períodos sem relatório não são inferidos como zero.
 */
export function ActivityBars({
  points,
  className,
  height = 34,
  showLegend = false,
}: {
  points: ActivityPoint[];
  className?: string;
  height?: number;
  showLegend?: boolean;
}) {
  if (points.length === 0) return null;

  const summary = points
    .map((point) => `${point.label}: ${point.value} de ${point.total} dias`)
    .join("; ");
  const latest = points.at(-1);
  const previous = points.at(-2);
  const latestRatio =
    latest && latest.total > 0 ? latest.value / latest.total : 0;
  const previousRatio =
    previous && previous.total > 0 ? previous.value / previous.total : 0;
  const percentagePointChange = Math.round((latestRatio - previousRatio) * 100);

  return (
    <div className={cx("flex flex-col gap-3", className)}>
      <div
        role="img"
        aria-label={`Atividade por período — ${summary}`}
        className="flex items-end gap-1 pb-1.5"
        style={{ height }}
      >
        {points.map((point, index) => {
          const ratio = point.total > 0 ? point.value / point.total : 0;
          // Quatro degraus discretos: a cor reforça a altura em vez de repetir
          // a mesma informação num canal desperdiçado.
          const step = ratio === 0 ? 0 : Math.min(4, Math.ceil(ratio * 4));
          const isLast = index === points.length - 1;

          return (
            <span
              key={`${point.label}-${index}`}
              title={`${point.label} · ${point.value} de ${point.total} dias`}
              className="relative flex-1"
              style={{ height: "100%" }}
            >
              {/* Trilho: mostra o período inteiro, para zero não virar ausência. */}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 rounded-t-md bg-chart-track opacity-20"
                style={{ height: "100%" }}
              />
              {ratio > 0 && (
                <span
                  aria-hidden="true"
                  data-activity-fill
                  className={cx(
                    "absolute inset-x-0 bottom-0 rounded-t-md",
                    step === 1 && "bg-chart-1",
                    step === 2 && "bg-chart-2",
                    step === 3 && "bg-chart-3",
                    step === 4 && "bg-chart-4",
                  )}
                  style={{ height: `${Math.max(ratio * 100, 18)}%` }}
                />
              )}
              {/* Filete no período atual: marca "agora" sem gastar outra matiz
                  nem depender de um anel que some na superfície clara. */}
              {isLast && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 -bottom-1.5 h-0.5 rounded-full bg-chart-4"
                />
              )}
            </span>
          );
        })}
      </div>

      {showLegend && (
        <div className="flex flex-col gap-3">
          <p className="text-sm leading-relaxed text-secondary">
            Cada coluna reúne relatórios encerrados no mesmo período. A altura
            mostra a proporção de dias com mensagens dentro desses relatórios;
            quanto mais escura, maior a cobertura observada.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-utility text-caption font-bold text-secondary">
            <span className="inline-flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-2.5 w-8 rounded-full bg-chart-1"
              />
              Menor cobertura
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-2.5 w-8 rounded-full bg-chart-4"
              />
              Maior cobertura
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-0.5 w-8 rounded-full bg-chart-4"
              />
              Período mais recente
            </span>
          </div>
          {previous && (
            <p className="font-utility text-label-md font-bold text-primary">
              Último período: {percentagePointChange > 0 ? "+" : ""}
              {percentagePointChange} pontos percentuais em relação ao anterior.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
