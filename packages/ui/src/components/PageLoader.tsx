import { cx } from "../lib/cx";
import { SiouveLoaderMark } from "./SiouveLoaderMark";

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
      <SiouveLoaderMark className="size-[4.5rem] text-primary" />

      <span className="type-ui text-ui font-semibold">{label}</span>
    </div>
  );
}
