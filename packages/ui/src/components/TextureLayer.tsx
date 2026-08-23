"use client";

import { useId } from "react";
import { cx } from "../lib/cx";

/* Brand Book V2 §11 — matéria e imperfeição.

   O V1 tinha variantes com gradiente roxo por baixo do ruído. O V2 proíbe
   gradient hero e "visual futurista sem significado" (§53), então sobrou o
   que a textura sempre deveria ter sido: granulado, e só.

   A intensidade não é escolhida pelo componente — vem de --texture-opacity
   e --texture-blend, que trocam com o tema. Light ~2.8% multiply, dark
   ~3.8% overlay. */

export type TextureVariant = "paper" | "paper-strong";

const VARIANTS: Record<
  TextureVariant,
  { scale: number; frequency: number; octaves: number }
> = {
  /* `scale` multiplica a opacidade do token. A textura é acabamento: a tela
     tem de continuar inteira com ela desligada (§35). */
  paper: { scale: 1, frequency: 0.85, octaves: 3 },
  "paper-strong": { scale: 1.6, frequency: 0.75, octaves: 4 },
};

/**
 * Granulado de fundo. Nunca filtro sobre texto, nunca animado.
 *
 * Regras de uso:
 * - somente em superfícies editoriais amplas — §11;
 * - nunca sob input ativo, modal ou parágrafo longo;
 * - some sozinho em `prefers-reduced-transparency` e alto contraste,
 *   pelo seletor [data-texture] em base.css.
 */
export function TextureLayer({
  variant = "paper",
  className,
}: {
  variant?: TextureVariant;
  className?: string;
}) {
  const filterId = useId().replace(/:/g, "");
  const config = VARIANTS[variant];

  return (
    <div
      data-texture={variant}
      aria-hidden="true"
      className={cx(
        "pointer-events-none absolute inset-0 isolate overflow-hidden",
        className,
      )}
      style={{
        opacity: `calc(var(--texture-opacity) * ${config.scale})`,
        mixBlendMode: "var(--texture-blend)" as never,
      }}
    >
      <svg className="absolute inset-0 size-full">
        <filter id={filterId}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency={config.frequency}
            numOctaves={config.octaves}
            stitchTiles="stitch"
          />
          {/* Ruído monocromático: descarta a cor do turbulence. */}
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${filterId})`} />
      </svg>
    </div>
  );
}
