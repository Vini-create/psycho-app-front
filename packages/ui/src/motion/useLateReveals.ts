"use client";

import { useEffect, type RefObject } from "react";
import { gsap } from "./gsap";
import { resolveMotionVariant } from "./media";
import { distance, duration, ease, stagger } from "./tokens";

/* Conteúdo que chega depois da pasta.

   Quase toda tela do produto abre com skeleton e recebe os dados de uma
   query. Quando a coreografia da pasta roda, o corpo ainda contém o
   esqueleto — os blocos `.reveal` reais só existem uns 200ms depois. Sem
   isto eles apareceriam secos, e a pasta terminaria justamente na troca mais
   visível da tela (§26).

   Um observador no corpo da pasta resolve isso sem que nenhuma página
   precise saber que GSAP existe. Cada elemento anima no máximo uma vez — o
   WeakSet garante que um refetch que preserve o DOM não reanime nada. */
export function useLateReveals(
  bodyRef: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  useEffect(() => {
    const body = bodyRef.current;
    if (!body || !enabled) return;
    if (resolveMotionVariant() === "reduced") return;

    const seen = new WeakSet<Element>();
    /* O que já está na tela na hora em que o observador começa pertence à
       timeline da pasta, não a esta. */
    body.querySelectorAll(".reveal").forEach((element) => seen.add(element));

    let frame = 0;
    let pending: HTMLElement[] = [];

    const flush = () => {
      frame = 0;
      const targets = pending;
      pending = [];
      if (targets.length === 0) return;

      gsap.fromTo(
        targets,
        { autoAlpha: 0, y: distance.lift },
        {
          autoAlpha: 1,
          y: 0,
          duration: duration.page,
          ease: ease.enter,
          stagger: Math.min(stagger.block, 0.2 / targets.length),
          overwrite: "auto",
          clearProps: "opacity,visibility,transform",
        },
      );
    };

    const collect = (node: Node) => {
      if (!(node instanceof HTMLElement)) return;
      const found = node.matches(".reveal")
        ? [node]
        : Array.from(node.querySelectorAll<HTMLElement>(".reveal"));
      for (const element of found) {
        if (seen.has(element)) continue;
        seen.add(element);
        pending.push(element);
      }
    };

    const observer = new MutationObserver((records) => {
      for (const record of records) record.addedNodes.forEach(collect);
      /* Uma query resolvida insere vários blocos no mesmo tick; agrupá-los
         em um frame evita uma timeline por nó inserido. */
      if (pending.length > 0 && frame === 0) {
        frame = requestAnimationFrame(flush);
      }
    });

    observer.observe(body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (frame !== 0) cancelAnimationFrame(frame);
      if (pending.length > 0) gsap.set(pending, { clearProps: "opacity,visibility,transform" });
    };
  }, [bodyRef, enabled]);
}
