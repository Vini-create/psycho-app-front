"use client";

import { useLayoutEffect, type RefObject } from "react";
import { gsap } from "./gsap";
import { resolveMotionVariant } from "./media";
import { distance, duration, ease, scale, stagger } from "./tokens";

/* Abertura e fechamento de um <dialog>.

   Nível 2 da hierarquia: mais curto que a troca de pasta e sem deslocamento
   lateral, para nunca disputar atenção com ela. O backdrop é do browser e
   fica com a transição declarada no CSS; aqui só anda a superfície.

   Mora no motion system, e não dentro do Modal, para que o componente
   continue legível como componente — §59. */
export function useDialogMotion(
  ref: RefObject<HTMLDialogElement | null>,
  open: boolean,
) {
  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    const variant = resolveMotionVariant();
    const reduced = variant === "reduced";

    if (open) {
      if (!dialog.open) dialog.showModal();
      if (reduced) {
        gsap.set(dialog, { clearProps: "all" });
        return;
      }

      const content = dialog.firstElementChild;
      const timeline = gsap.timeline({ defaults: { overwrite: "auto" } });

      timeline.fromTo(
        dialog,
        { autoAlpha: 0, y: distance.lift, scale: scale.panel },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: duration.ui,
          ease: ease.enter,
          clearProps: "opacity,visibility,transform",
        },
      );

      if (content) {
        timeline.fromTo(
          Array.from(content.children),
          { autoAlpha: 0, y: distance.step },
          {
            autoAlpha: 1,
            y: 0,
            duration: duration.fast,
            stagger: stagger.tight,
            ease: ease.ui,
            clearProps: "opacity,visibility,transform",
          },
          0.04,
        );
      }

      return () => {
        timeline.revert();
      };
    }

    if (!dialog.open) return;
    if (reduced) {
      dialog.close();
      return;
    }

    const tween = gsap.to(dialog, {
      autoAlpha: 0,
      y: distance.step,
      scale: 0.99,
      duration: duration.fast,
      ease: ease.exit,
      overwrite: "auto",
      onComplete: () => {
        dialog.close();
        gsap.set(dialog, { clearProps: "opacity,visibility,transform" });
      },
    });

    return () => {
      tween.kill();
    };
  }, [open, ref]);
}
