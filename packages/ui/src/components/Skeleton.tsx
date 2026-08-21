import { cx } from "../lib/cx";

/**
 * Indicador de carregamento — não é ornamento.
 * A pulsação some em prefers-reduced-motion (regra global do base.css),
 * e nunca usamos bounce nem loop decorativo.
 */
export function Skeleton({
  className,
  "aria-label": ariaLabel,
}: {
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <div
      role={ariaLabel ? "status" : "presentation"}
      aria-label={ariaLabel}
      className={cx(
        "animate-pulse rounded-md bg-subtle motion-reduce:animate-none",
        className,
      )}
    />
  );
}
