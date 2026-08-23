import type { ReactNode } from "react";
import { cx } from "../../lib/cx";
import { Icon, type IconName } from "../../icons";

/* Brand Book V2 §20 — "A feature mais visualmente própria do Sinapsa."

   Princípio que dita o desenho: o evento NÃO é um card autônomo. Ele se
   ancora à linha por data/índice. Uma lista de cards desconectados é
   explicitamente o que o §34 proíbe nesta tela.

   O trilho é uma linha de 1px. Os nós são pequenos. O peso visual está na
   tipografia do acontecimento, não no cromo do gráfico. */

export type TimelineMarker =
  /** Acontecimento relatado. O caso comum. */
  | "event"
  /** Sessão com o profissional. Marcador com dobra — §20. */
  | "session"
  /** Item que o paciente guardou explicitamente. Ochre — §20. */
  | "bookmark"
  /** Faixa de recorrência: período, não ponto. */
  | "band";

const MARKER: Record<TimelineMarker, { dot: string; icon?: IconName }> = {
  event: { dot: "bg-surface-page border-border-strong" },
  session: { dot: "bg-panel-lavender border-accent-lavender", icon: "for-session" },
  bookmark: { dot: "bg-panel-ochre border-accent-ochre", icon: "for-session" },
  band: { dot: "bg-accent-fogblue border-accent-fogblue" },
};

export function TimelineRail({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    // A linha vive no ::before de cada item, não num elemento absoluto:
    // assim ela nunca desalinha quando o conteúdo muda de altura.
    <ol className={cx("flex flex-col", className)}>{children}</ol>
  );
}

export function TimelineEvent({
  date,
  marker = "event",
  title,
  children,
  meta,
  source,
  provenance,
  /** Último item: a linha para no nó em vez de continuar até o vazio. */
  last = false,
  className,
}: {
  date: ReactNode;
  marker?: TimelineMarker;
  title?: ReactNode;
  children?: ReactNode;
  meta?: ReactNode;
  source?: ReactNode;
  provenance?: ReactNode;
  last?: boolean;
  className?: string;
}) {
  const spec = MARKER[marker];

  return (
    <li className={cx("relative grid grid-cols-[auto_minmax(0,1fr)] gap-x-5", className)}>
      {/* Coluna do trilho */}
      <div className="relative flex w-4 justify-center">
        <span
          aria-hidden="true"
          className={cx(
            "absolute top-0 w-px bg-hairline",
            last ? "h-4" : "h-full",
          )}
        />
        <span
          aria-hidden="true"
          className={cx(
            "relative mt-1.5 grid size-4 place-items-center rounded-full border",
            spec.dot,
          )}
        >
          {spec.icon && marker !== "event" && (
            <Icon name={spec.icon} size={16} className="size-2.5 text-on-panel" />
          )}
        </span>
      </div>

      {/* Coluna do conteúdo */}
      <div className={cx("flex flex-col gap-2", last ? "pb-0" : "pb-8")}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="type-eyebrow text-tertiary tabular-nums">{date}</span>
          {provenance}
        </div>

        {title && (
          <h3 className="font-editorial text-body-l text-balance text-primary">
            {title}
          </h3>
        )}

        {children && <div className="measure text-body text-secondary">{children}</div>}

        {(meta || source) && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            {meta}
            {source}
          </div>
        )}
      </div>
    </li>
  );
}

/**
 * Faixa de recorrência — §20.
 *
 * Um tema que aparece por 3–14 dias vira uma faixa, não catorze pontos.
 * A linguagem é descritiva por construção: o componente recebe "apareceu
 * em 4 relatos", nunca "ansiedade +38%" (§24, §31).
 */
export function RecurrenceBand({
  label,
  period,
  description,
  /** 0–1. Presença relativa do tema no período, para largura da faixa. */
  presence = 1,
  family = "fogblue",
  source,
  className,
}: {
  label: ReactNode;
  period: ReactNode;
  description?: ReactNode;
  presence?: number;
  family?: "lavender" | "sage" | "clay" | "ochre" | "fogblue" | "dustrose";
  source?: ReactNode;
  className?: string;
}) {
  const width = Math.max(0.08, Math.min(1, presence));

  const BAND: Record<string, string> = {
    lavender: "bg-accent-lavender",
    sage: "bg-accent-sage",
    clay: "bg-accent-clay",
    ochre: "bg-accent-ochre",
    fogblue: "bg-accent-fogblue",
    dustrose: "bg-accent-dustrose",
  };

  return (
    <div className={cx("flex flex-col gap-2 py-4", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="type-ui text-ui font-semibold text-primary">{label}</span>
        <span className="type-meta text-tertiary">{period}</span>
      </div>

      {/* A faixa. Trilho sempre visível para que a leitura seja comparativa
          — sem o trilho, uma barra curta e uma barra longa não dizem nada. */}
      <div className="h-1.5 w-full overflow-hidden rounded-xs bg-inset">
        <div
          className={cx("h-full rounded-xs", BAND[family])}
          style={{ width: `${width * 100}%` }}
        />
      </div>

      {description && (
        <p className="text-body text-secondary">{description}</p>
      )}

      {source}
    </div>
  );
}
