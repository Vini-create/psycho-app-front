import { cx } from "@/lib/cx";
import { SYMBOL_PATH, SYMBOL_VIEWBOX } from "@/lib/symbol-path";

/* A assinatura da marca, nas proporções aprovadas em 11 set. 2026.

   Réplica fiel de `packages/ui/src/components/BrandLogo.tsx`: mesma ordem
   (palavra, ™, símbolo à direita), mesmo `0.6em` entre palavra e símbolo,
   mesmo símbolo de `1.4em`, mesmo ™ de `0.6em` em `top: 0.15em` /
   `right: -0.95em`, mesmo `stroke-width="24"` com junções arredondadas.

   Só o TAMANHO é livre aqui, e é a única liberdade que a identidade concede
   à landing: `1.6rem` na navegação — o mesmo valor do produto — e a escala
   grande do rodapé, que mantém todas as proporções internas porque tudo
   neste componente é medido em `em`. */

export function BrandLogo({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-[0.6em] font-editorial text-[1.75rem] font-normal tracking-[-0.04em] text-primary",
        className,
      )}
    >
      <span className="relative">
        Siouve.
        <sup className="absolute -right-[0.95em] top-[0.15em] font-sans text-[0.6em] leading-none tracking-normal">
          ™
        </sup>
      </span>
      <svg
        viewBox={`0 0 ${SYMBOL_VIEWBOX} ${SYMBOL_VIEWBOX}`}
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={24}
        strokeLinejoin="round"
        aria-hidden="true"
        className="h-[1.4em] w-[1.4em] shrink-0"
      >
        <path d={SYMBOL_PATH} />
      </svg>
    </span>
  );
}

/** O símbolo sozinho — marca-d'água, bullet, selo. Nunca substitui a assinatura. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${SYMBOL_VIEWBOX} ${SYMBOL_VIEWBOX}`}
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={24}
      strokeLinejoin="round"
      aria-hidden="true"
      className={cx("shrink-0", className)}
    >
      <path d={SYMBOL_PATH} />
    </svg>
  );
}
