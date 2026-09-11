import { useLayoutEffect, useRef } from "react";

import {
  distance,
  duration,
  ease,
  gsap,
  prefersReducedMotion,
  stagger,
} from "./gsap";

/**
 * Entrada por rolagem dos blocos marcados com `.reveal` dentro do container.
 *
 * O contrato com o CSS é o `data-anim="ready"` que este hook escreve no
 * `<html>` na primeira execução: só a partir dele o `.reveal` fica invisível
 * no repouso. Quem chega sem JavaScript, com JS quebrado ou com movimento
 * reduzido nunca vê esse atributo, e portanto vê a página inteira — nada de
 * seção em branco esperando uma timeline que não virá.
 */
export function useReveal<T extends HTMLElement>(options?: {
  /** Segundos entre um bloco e o seguinte. */
  stagger?: number;
  /** Ponto do viewport em que a seção começa a entrar. */
  start?: string;
}) {
  const ref = useRef<T>(null);
  const step = options?.stagger ?? stagger.block;
  const start = options?.start ?? "top 82%";

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;

    const targets = root.querySelectorAll<HTMLElement>(".reveal");
    if (targets.length === 0) return;

    document.documentElement.dataset.anim = "ready";

    const context = gsap.context(() => {
      gsap.to(targets, {
        opacity: 1,
        y: 0,
        duration: duration.editorial,
        ease: ease.enter,
        stagger: step,
        scrollTrigger: { trigger: root, start, once: true },
      });
    }, root);

    return () => context.revert();
  }, [step, start]);

  return ref;
}

/**
 * Deslocamento lento de um elemento enquanto a seção passa pela tela.
 *
 * Parallax é proibido como decoração (MOTION.md §7). O uso legítimo aqui é
 * outro: manter uma coluna de metadata alinhada com a leitura de uma coluna
 * muito mais alta ao lado. `amount` é a distância total em pixels, e fica na
 * casa das dezenas — acima disso o cérebro lê "slide", não "profundidade".
 */
export function useDrift<T extends HTMLElement>(amount = distance.editorial * 2) {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || prefersReducedMotion()) return;

    const context = gsap.context(() => {
      gsap.fromTo(
        element,
        { y: amount / 2 },
        {
          y: -amount / 2,
          ease: "none",
          scrollTrigger: {
            trigger: element,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.6,
          },
        },
      );
    }, element);

    return () => context.revert();
  }, [amount]);

  return ref;
}
