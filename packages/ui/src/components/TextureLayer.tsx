"use client";

import { useId } from "react";
import { cx } from "../lib/cx";

export type TextureVariant =
  | "paper"
  | "paper-strong"
  | "chromatic"
  | "obsidian";

/* design.md §2 — cada variante tem base, granulação e mistura próprias. */
const VARIANTS: Record<
  TextureVariant,
  { noiseOpacity: number; blend: string; frequency: number; octaves: number }
> = {
  paper: { noiseOpacity: 0.035, blend: "multiply", frequency: 0.85, octaves: 3 },
  "paper-strong": {
    noiseOpacity: 0.06,
    blend: "multiply",
    frequency: 0.75,
    octaves: 4,
  },
  chromatic: {
    noiseOpacity: 0.2,
    blend: "soft-light",
    frequency: 0.65,
    octaves: 4,
  },
  obsidian: { noiseOpacity: 0.11, blend: "soft-light", frequency: 0.9, octaves: 3 },
};

/**
 * Textura é expressão de marca, não padrão de toda superfície.
 *
 * Regras que este componente assume e que o uso precisa respeitar:
 * - nunca sob card, input, modal ou parágrafo longo;
 * - `chromatic` não recebe formulário nem tabela por cima;
 * - some em `prefers-reduced-transparency` e em alto contraste (base.css).
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
      className={cx("pointer-events-none absolute inset-0 isolate overflow-hidden", className)}
    >
      {variant === "chromatic" && (
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 12% 18%, var(--purple-soft) 0%, transparent 34%), radial-gradient(circle at 78% 28%, var(--purple-primary) 0%, transparent 42%), radial-gradient(circle at 48% 110%, var(--purple-dark) 0%, transparent 45%), linear-gradient(145deg, var(--purple-strong) 0%, var(--ink-900) 82%)",
          }}
        />
      )}
      {variant === "obsidian" && (
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 28% 15%, var(--purple-dark) 0%, transparent 42%), radial-gradient(circle at 90% 82%, var(--purple-strong) 0%, transparent 38%), var(--ink-900)",
          }}
        />
      )}
      <svg
        className="absolute inset-0 size-full"
        style={{
          opacity: config.noiseOpacity,
          mixBlendMode: config.blend as never,
        }}
      >
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
