"use client";

import { gsap } from "./gsap";
import { duration, ease, scale as scaleToken, stagger } from "./tokens";
import type { MotionScale } from "./tokens";

/* Coreografia da pilha — o gesto de puxar uma pasta para a frente.

   Uma troca de rota aqui não é um fade nem um slide de página: é um objeto
   que sai de onde estava, passa por cima dos outros e assenta. Como aba,
   corpo, textura, sombra e conteúdo vivem todos dentro do mesmo elemento
   (ver FolderSheet), esta timeline só precisa escrever `y` e `scale` na
   raiz de cada folha. Nada mais se move por conta própria, e é isso que
   torna impossível a aba descolar do corpo no meio do movimento.

   Quatro tempos, na ordem em que a mão faria:

     1. a folha escolhida se desprende — sobe alguns pixels;
     2. as outras recuam para seus degraus;
     3. a escolhida desce à frente, com um assentamento de ~1px;
     4. só então o conteúdo fica legível.

   O z-index não é animado: ele muda no mesmo commit do React que muda a
   rota, ou seja, no primeiro frame — a folha que está sendo puxada precisa
   já estar por cima quando começa a se mover. */

export interface StackMember {
  element: HTMLElement;
  /** Posição de repouso desta folha na pilha, em pixels. */
  y: number;
}

export interface StackSwapOptions {
  /** A folha que vem para a frente. */
  incoming: HTMLElement | null;
  /** O corpo impresso da folha nova. Entra depois do movimento. */
  incomingContent: HTMLElement | null;
  /** Todas as demais, já com seus novos degraus. */
  resting: StackMember[];
  variant: MotionScale;
}

const CLEAR = "transform,will-change";

/** Coloca a pilha inteira em repouso, sem encenação. */
export function settleStack(members: StackMember[]): void {
  members.forEach(({ element, y }) => {
    gsap.killTweensOf(element);
    gsap.set(element, { y, scale: 1, willChange: "transform" });
  });
}

export function stackSwapTimeline({
  incoming,
  incomingContent,
  resting,
  variant,
}: StackSwapOptions): gsap.core.Timeline {
  const timeline = gsap.timeline({ defaults: { overwrite: "auto" } });

  if (variant === "reduced") {
    /* Movimento reduzido não significa "sem hierarquia": a mudança de
       camada continua acontecendo, só não é encenada. */
    if (incoming) timeline.set(incoming, { y: 0, scale: 1 });
    resting.forEach(({ element, y }) => timeline.set(element, { y, scale: 1 }, 0));
    if (incomingContent) {
      timeline.fromTo(
        incomingContent,
        { autoAlpha: 0.6 },
        { autoAlpha: 1, duration: duration.instant, clearProps: "opacity,visibility" },
        0,
      );
    }
    return timeline;
  }

  const mobile = variant === "mobile";
  const travel = mobile ? duration.ui : duration.folder;

  if (incoming) {
    /* Fase 1 e 2 — a folha se desprende da pilha. `+=` mantém o movimento
       relativo à posição atual, o que deixa a troca interrompível: um
       segundo clique no meio do gesto continua de onde o objeto está, em
       vez de saltar para uma origem imaginária. */
    timeline.to(
      incoming,
      {
        y: `-=${mobile ? 3 : 7}`,
        scale: mobile ? 1 : 1 + (1 - scaleToken.press) * 0.8,
        duration: travel * 0.2,
        ease: ease.ui,
        willChange: "transform",
      },
      0,
    );

    /* Fase 3 e 4 — desce à frente e assenta com peso. O 1.2px de excesso é
       inércia, não bounce: passa uma vez e volta. */
    timeline.to(
      incoming,
      {
        y: mobile ? 0 : 1.2,
        scale: 1,
        duration: travel * 0.64,
        ease: ease.folder,
      },
      travel * 0.2,
    );

    if (!mobile) {
      timeline.to(
        incoming,
        {
          y: 0,
          duration: travel * 0.18,
          ease: ease.ui,
          clearProps: "will-change",
        },
        travel * 0.84,
      );
    }
  }

  /* As outras recuam. Começam um instante depois: primeiro alguém puxa,
     depois a pilha cede. */
  resting.forEach(({ element, y }) => {
    timeline.to(
      element,
      {
        y,
        scale: 1,
        duration: travel * 0.66,
        ease: ease.folder,
        willChange: "transform",
      },
      travel * 0.08,
    );
  });

  /* O conteúdo não é o protagonista: ele fica disponível quando a folha já
     está quase parada. */
  if (incomingContent) {
    timeline.fromTo(
      incomingContent,
      { autoAlpha: 0.35, y: 5 },
      {
        autoAlpha: 1,
        y: 0,
        duration: duration.page,
        ease: ease.enter,
        clearProps: "opacity,visibility,transform,will-change",
      },
      travel * 0.38,
    );
  }

  return timeline;
}

/** Entrada única do workspace, no primeiro carregamento. */
export function workspaceIntroTimeline({
  root,
  variant,
}: {
  root: HTMLElement;
  variant: MotionScale;
}): gsap.core.Timeline {
  const timeline = gsap.timeline({ defaults: { overwrite: "auto" } });

  if (variant === "reduced") {
    timeline.fromTo(
      root,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: duration.instant, clearProps: "opacity,visibility" },
    );
    return timeline;
  }

  timeline.fromTo(
    root,
    { autoAlpha: 0, y: 10 },
    {
      autoAlpha: 1,
      y: 0,
      duration: 0.42,
      ease: ease.enter,
      clearProps: `opacity,visibility,${CLEAR}`,
    },
  );

  return timeline;
}

/* --------------------------------------------------------------------------
   Entrada do que está impresso na folha.

   Separada da coreografia da pilha de propósito: a pasta é a protagonista do
   movimento, o texto não. Esta timeline só existe para que blocos e listas
   não apareçam todos no mesmo frame — e roda também quando a rota muda por
   dentro da mesma pasta, onde nenhuma folha se move.
   -------------------------------------------------------------------------- */

export interface ContentRevealOptions {
  content: HTMLElement;
  reveals?: HTMLElement[];
  listItems?: HTMLElement[];
  variant: MotionScale;
  /** `true` quando a pilha se moveu: aí o corpo já foi animado por ela. */
  folderChanged: boolean;
}

const REVEAL_CLEAR = "opacity,visibility,transform,will-change";

export function contentRevealTimeline({
  content,
  reveals = [],
  listItems = [],
  variant,
  folderChanged,
}: ContentRevealOptions): gsap.core.Timeline {
  const timeline = gsap.timeline({ defaults: { overwrite: "auto" } });

  if (variant === "reduced") {
    timeline.set([content, ...reveals, ...listItems], {
      autoAlpha: 1,
      clearProps: REVEAL_CLEAR,
    });
    return timeline;
  }

  const mobile = variant === "mobile";
  const rise = mobile ? 4 : 6;

  if (!folderChanged) {
    timeline.fromTo(
      content,
      { autoAlpha: 0, y: rise },
      {
        autoAlpha: 1,
        y: 0,
        duration: duration.page,
        ease: ease.enter,
        clearProps: REVEAL_CLEAR,
      },
      0,
    );
  }

  if (reveals.length > 0) {
    timeline.fromTo(
      reveals,
      { autoAlpha: 0, y: rise },
      {
        autoAlpha: 1,
        y: 0,
        duration: duration.page,
        ease: ease.enter,
        stagger: stagger.block,
        clearProps: REVEAL_CLEAR,
      },
      folderChanged ? duration.folder * 0.46 : 0.06,
    );
  }

  if (listItems.length > 0) {
    timeline.fromTo(
      listItems,
      { autoAlpha: 0, y: 4 },
      {
        autoAlpha: 1,
        y: 0,
        duration: duration.ui,
        ease: ease.enter,
        stagger: {
          /* Teto de 0.2s no total: uma lista de 40 itens não pode virar
             uma cascata de dois segundos. */
          amount: Math.min(0.2, listItems.length * stagger.tight),
          from: "start",
        },
        clearProps: REVEAL_CLEAR,
      },
      folderChanged ? duration.folder * 0.5 : 0.1,
    );
  }

  return timeline;
}
