"use client";

import { useEffect, useState } from "react";
import type { MotionScale } from "./tokens";

/* Consultas de mídia do sistema de motion.

   Três faixas, e só três: desktop, mobile e movimento reduzido. Toda
   coreografia estrutural escolhe uma delas — nenhuma lê largura de tela por
   conta própria. */
export const MOTION_QUERY = {
  desktop: "(min-width: 640px) and (prefers-reduced-motion: no-preference)",
  mobile: "(max-width: 639px) and (prefers-reduced-motion: no-preference)",
  reduced: "(prefers-reduced-motion: reduce)",
} as const;

export const REDUCED_MOTION_QUERY = MOTION_QUERY.reduced;

/** Leitura pontual, para código imperativo fora de um contexto GSAP. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/**
 * Assinatura reativa da preferência de movimento.
 *
 * Começa em `false` no servidor e no primeiro render do cliente — o valor
 * real chega no efeito. Componentes que dependem disso devem escolher o
 * comportamento sem movimento como estado inicial seguro, nunca o contrário.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    setReduced(query.matches);

    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

/**
 * Faixa de movimento vigente neste instante.
 *
 * Lida no momento em que a animação começa, e não dentro de
 * `gsap.matchMedia()`, de propósito: as coreografias do shell são disparos
 * únicos. Num contexto de matchMedia, atravessar o breakpoint de 640px com o
 * mouse faria a página inteira re-encenar sua entrada, porque o contexto é
 * recriado a cada mudança de condição. Como nenhuma delas guarda medidas de
 * layout — são só transform e opacity, limpos ao final —, redimensionar
 * durante a transição não deixa resíduo e o CSS responsivo continua sendo a
 * autoridade sobre o layout (§53).
 */
export function resolveMotionVariant(): MotionScale {
  if (typeof window === "undefined") return "reduced";
  if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return "reduced";
  return window.matchMedia("(max-width: 639px)").matches ? "mobile" : "desktop";
}
