import type { ReactNode } from "react";
import { cx } from "../../lib/cx";

/* Brand Book V2 §24 — poucos gráficos, escolhidos por pergunta.

   As duas regras que este arquivo existe para impor:

   1. Nada aqui quantifica emoção. O produto trabalha com relatos, não com
      medidas clínicas. "apareceu em 4 relatos" é permitido; "ansiedade
      +38%" não é (§24, §31).
   2. Pastel distingue série; nunca codifica bom vs ruim. Não há verde de
      "melhorou" nem vermelho de "piorou" neste sistema (§04, §29). */

/**
 * StatBlock — o número como elemento gráfico.
 *
 * Archivo apertado, grande, com rótulo mono acima. Não é um card: é
 * tipografia. O §13 pede exatamente isso antes de qualquer caixa.
 */
export function StatBlock({
  label,
  value,
  context,
  size = "md",
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  /** A base da contagem. Sem ela um número agregado não significa nada. */
  context?: ReactNode;
  size?: "lg" | "md" | "sm";
  className?: string;
}) {
  const SIZE = {
    lg: "text-display-xl",
    md: "text-h1-system",
    sm: "text-h2",
  } as const;

  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <span className="type-eyebrow text-tertiary">{label}</span>
      <span className={cx("type-display text-primary", SIZE[size])} data-numeric>
        {value}
      </span>
      {context && (
        <span className="type-meta text-tertiary">{context}</span>
      )}
    </div>
  );
}

/**
 * BarStrip — atividade ao longo do tempo.
 *
 * Column strip, não donut decorativo (§24). Cada barra carrega um título
 * acessível com contagem e data; a cor é uma só, porque a pergunta é
 * "quanto", não "de que tipo".
 */
export function BarStrip({
  points,
  label,
  family = "lavender",
  className,
}: {
  points: Array<{ label: string; value: number }>;
  /** Rótulo acessível do conjunto — o gráfico precisa se explicar sem cor. */
  label: string;
  family?: "lavender" | "sage" | "clay" | "ochre" | "fogblue" | "dustrose";
  className?: string;
}) {
  const max = Math.max(1, ...points.map((point) => point.value));

  const FILL: Record<string, string> = {
    lavender: "bg-accent-lavender",
    sage: "bg-accent-sage",
    clay: "bg-accent-clay",
    ochre: "bg-accent-ochre",
    fogblue: "bg-accent-fogblue",
    dustrose: "bg-accent-dustrose",
  };

  return (
    <figure className={cx("flex flex-col gap-3", className)} role="group" aria-label={label}>
      <div className="flex h-16 items-end gap-1">
        {points.map((point, index) => {
          const ratio = point.value / max;
          return (
            <div
              key={index}
              // `h-full` é obrigatório: a altura percentual da barra só
              // resolve contra um pai de altura definida, e `items-end`
              // encolheria esta célula até o conteúdo.
              className="flex h-full min-w-0 flex-1 items-end"
              // O título é a única leitura disponível para quem não vê a
              // barra; precisa conter a contagem, não a interpretação (§24).
              title={`${point.label}: ${point.value}`}
            >
              <div
                className={cx(
                  "w-full rounded-t-xs",
                  point.value > 0 ? FILL[family] : "bg-inset",
                )}
                // Piso de 2px: um dia sem registro continua ocupando lugar
                // na régua, senão o eixo temporal mente.
                style={{ height: `${Math.max(2, ratio * 100)}%` }}
              />
            </div>
          );
        })}
      </div>

      <figcaption className="type-meta flex justify-between text-tertiary">
        <span>{points[0]?.label}</span>
        <span>{points[points.length - 1]?.label}</span>
      </figcaption>
    </figure>
  );
}

/**
 * ComparisonNote — §24, "Comparar dois períodos: duas barras / delta textual".
 *
 * Deliberadamente textual. A comparação de períodos num produto de saúde
 * mental é uma frase descritiva com a base explícita, não um gauge.
 */
export function ComparisonNote({
  children,
  basis,
  source,
  className,
}: {
  children: ReactNode;
  /** "14–21 AGO vs 07–14 AGO". Sempre exibir período e base (§24). */
  basis: ReactNode;
  source?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col gap-2 border-l-2 border-accent-fogblue pl-4", className)}>
      <p className="measure text-body text-primary">{children}</p>
      <p className="type-meta text-tertiary">{basis}</p>
      {source}
    </div>
  );
}
