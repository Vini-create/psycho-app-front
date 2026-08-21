import type { ReactNode } from "react";
import { cx } from "../../lib/cx";
import { ActivityBars, type ActivityPoint } from "./ActivityBars";

/**
 * Um número com contexto.
 *
 * O valor usa a condensada utilitária, nunca a serif editorial: em Sinapsa a
 * serif conduz leitura e a condensada organiza função — um número de painel é
 * função. Serif aqui leria como ornamento, não como dado.
 */
export function StatTile({
  label,
  value,
  hint,
  trend,
  tone = "neutral",
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  trend?: ActivityPoint[];
  tone?: "neutral" | "attention";
  className?: string;
}) {
  return (
    <div
      className={cx(
        "flex flex-col gap-2 rounded-lg p-5",
        tone === "attention"
          ? "bg-warning-surface text-warning"
          : "bg-card",
        className,
      )}
    >
      <p
        className={cx(
          "type-overline max-w-none",
          tone === "attention" ? "text-warning" : "text-secondary",
        )}
      >
        {label}
      </p>

      <p
        className={cx(
          "font-utility text-utility-xl font-bold",
          tone === "attention" ? "text-warning" : "text-primary",
        )}
      >
        {value}
      </p>

      {trend && trend.length > 0 && <ActivityBars points={trend} height={28} />}

      {hint && (
        <p
          className={cx(
            "text-body-md max-w-none",
            tone === "attention" ? "text-warning" : "text-secondary",
          )}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
