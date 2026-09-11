import { useEffect, useRef } from "react";

import { gsap, prefersReducedMotion } from "@/motion/gsap";

/* A tela de abertura.

   Ela não é enfeite: existe para resolver um defeito real. A página pinta
   texto que depende de três coisas que chegam depois do HTML — as fontes, o
   primeiro quadro do WebGL e as divisões do SplitText. Sem cortina, o que se
   via era a página crua, uma travada e então tudo saltando para o lugar.

   O truque está em quem é dono do quê: o MARCADOR vive no `index.html`, para
   ser o primeiro paint; este componente só o ANIMA e o remove. Montar a
   cortina no React deixaria descoberta justamente a janela entre o HTML
   chegar e o bundle rodar.

   A barra mede milestones de verdade, não um relógio fingindo progresso:

     0–55%   as fontes (`document.fonts.ready`)
     55–92%  o primeiro quadro desenhado pelo WebGL
     92–100% o assentamento, para a barra não estourar em um salto

   E há um teto duro. Se qualquer etapa travar — GPU sem WebGL, fonte que não
   chega —, a cortina sai assim mesmo. Uma tela de carregamento que pode
   prender o usuário é pior que o defeito que ela conserta. */

const CEILING_MS = 4500;

export function Preloader({
  ready,
  onDone,
}: {
  /** O WebGL desenhou o primeiro quadro. */
  ready: boolean;
  onDone: () => void;
}) {
  /* O encerramento mora numa ref porque ele é acionado de DOIS lugares: o
     teto de tempo, dentro do efeito de montagem, e a chegada do WebGL, que é
     uma prop e portanto vive num efeito separado. Sem a ref, o segundo
     efeito teria de recriar o primeiro só para alcançá-lo — e reiniciar a
     barra do zero toda vez que a prop mudasse. */
  const finishRef = useRef<() => void>(() => {});
  const doneRef = useRef(false);

  useEffect(() => {
    const root = document.getElementById("preloader");
    const bar = document.getElementById("preloader-bar");
    const count = document.getElementById("preloader-count");

    if (!root) {
      onDone();
      return;
    }

    const state = { value: 0 };
    const reduced = prefersReducedMotion();

    const paint = () => {
      const pct = Math.round(state.value);
      if (bar) bar.style.inset = `0 ${100 - pct}% 0 0`;
      if (count) count.textContent = String(pct).padStart(3, "0");
    };

    let ceiling = 0;
    let tween: gsap.core.Tween | undefined;

    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      window.clearTimeout(ceiling);
      tween?.kill();

      const remove = () => {
        root.hidden = true;
        onDone();
      };

      if (reduced) {
        state.value = 100;
        paint();
        remove();
        return;
      }

      gsap
        .timeline({ onComplete: remove })
        .to(state, { value: 100, duration: 0.34, ease: "power2.out", onUpdate: paint })
        /* A cortina SOBE — o mesmo gesto de folha do resto do produto. Um
           fade faria a página "aparecer"; subindo, ela é descoberta. */
        .to(root, { yPercent: -100, duration: 0.62, ease: "power3.inOut" }, ">-0.05");
    };

    finishRef.current = finish;

    /* Teto duro: a cortina sai mesmo que nada mais chegue. */
    ceiling = window.setTimeout(finish, CEILING_MS);

    if (reduced) {
      finish();
      return;
    }

    tween = gsap.to(state, {
      value: 55,
      duration: 1.1,
      ease: "power1.out",
      onUpdate: paint,
    });

    void document.fonts.ready.then(() => {
      if (doneRef.current) return;
      tween?.kill();
      tween = gsap.to(state, {
        value: 92,
        duration: 0.5,
        ease: "power1.out",
        onUpdate: paint,
      });
    });

    return () => {
      window.clearTimeout(ceiling);
      tween?.kill();
    };
  }, [onDone]);

  useEffect(() => {
    if (!ready) return;
    /* Um quadro de folga para o primeiro paint do WebGL chegar à tela antes
       de a cortina começar a subir e revelá-lo. */
    const id = window.setTimeout(() => finishRef.current(), 80);
    return () => window.clearTimeout(id);
  }, [ready]);

  return null;
}
