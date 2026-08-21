import { cx } from "../lib/cx";

/**
 * Indicador de progresso indeterminado.
 * `aria-hidden` por padrão: quem comunica o estado é o texto ao redor,
 * não o desenho — design.md §10, estado nunca depende só de um sinal visual.
 */
export function Spinner({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      role={label ? "status" : undefined}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={cx("inline-flex items-center justify-center", className)}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="size-[1em] animate-spin motion-reduce:animate-none"
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.25"
        />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
