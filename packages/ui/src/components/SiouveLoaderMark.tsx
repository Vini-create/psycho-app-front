import { cx } from "../lib/cx";

export type SiouveLoaderMarkProps = {
  className?: string;
};

/**
 * Símbolo de atividade da Siouve.
 *
 * É uma versão leve, em traços, dos sete braços da marca. O desenho fica
 * separado em paths para que cada braço possa recolher até o centro e voltar
 * antes de passar o pulso ao seguinte, em sentido horário.
 */
export function SiouveLoaderMark({ className }: SiouveLoaderMarkProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      className={cx("size-[1em] shrink-0 overflow-visible", className)}
    >
      <g
        className="siouve-loader-mark__arms"
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
  );
}
