"use client";

import { useRef, type RefObject } from "react";
import { gsap, useGSAP } from "./gsap";
import { resolveMotionVariant } from "./media";
import { distance, duration, ease } from "./tokens";

/* Entrada de um elemento que aparece sozinho, fora de uma troca de rota:
   uma mensagem nova no chat, um bloco que acabou de ser inserido.

   Nível 2 da hierarquia de motion — deliberadamente mais curto e mais
   discreto que a troca de pasta, para nunca competir com ela. */

export interface EnterOnMountOptions {
  /** `false` desliga a animação sem mudar a ordem dos hooks. */
  enabled?: boolean;
}

export function useEnterOnMount(
  ref: RefObject<HTMLElement | null>,
  { enabled = true }: EnterOnMountOptions = {},
) {
  /* Só a primeira montagem anima. Sem isto, um re-render que trocasse o
     elemento faria a mensagem reaparecer piscando. */
  const played = useRef(false);

  useGSAP(
    () => {
      const element = ref.current;
      if (!element || !enabled || played.current) return;
      played.current = true;

      const variant = resolveMotionVariant();
      if (variant === "reduced") return;

      gsap.fromTo(
        element,
        {
          autoAlpha: 0,
          y: variant === "mobile" ? distance.lift : distance.shift,
        },
        {
          autoAlpha: 1,
          y: 0,
          duration: duration.ui,
          ease: ease.enter,
          overwrite: "auto",
          clearProps: "opacity,visibility,transform",
        },
      );
    },
    { dependencies: [enabled] },
  );
}
