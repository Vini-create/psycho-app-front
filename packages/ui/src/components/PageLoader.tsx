import { cx } from "../lib/cx";

export type PageLoaderProps = {
  /** Texto visível e anunciado por leitores de tela. */
  label?: string;
  className?: string;
};

/**
 * Carregamento de página da Siouve.
 *
 * Cada raio parte do centro do símbolo e encurta pela extremidade, criando
 * uma pulsação orgânica sem descaracterizar a marca. O spinner circular fica
 * reservado aos estados compactos de botões e controles.
 */
export function PageLoader({
  label = "Carregando…",
  className,
}: PageLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cx(
        "flex flex-col items-center justify-center gap-4 text-secondary",
        className,
      )}
    >
      <svg
        viewBox="0 0 120 120"
        fill="none"
        aria-hidden="true"
        className="size-[4.5rem] overflow-visible text-primary"
      >
        <g
          className="siouve-page-loader__rays"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path pathLength="1" d="M60 58 C61 43 63 25 64 9" />
          <path pathLength="1" d="M60 58 C74 55 89 49 105 44" />
          <path pathLength="1" d="M60 58 C68 68 77 78 85 87" />
          <path pathLength="1" d="M60 58 C60 76 61 95 62 112" />
          <path pathLength="1" d="M60 58 C51 67 43 77 34 86" />
          <path pathLength="1" d="M60 58 C43 61 27 65 10 67" />
          <path pathLength="1" d="M60 58 C51 48 43 38 34 28" />
        </g>
      </svg>

      <span className="type-ui text-ui font-semibold">{label}</span>
    </div>
  );
}
