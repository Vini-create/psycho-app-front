"use client";

import { gsap } from "./gsap";
import { duration, ease, folderGeometry, stagger } from "./tokens";
import type { MotionScale } from "./tokens";

/* Abertura e fechamento das abas.

   Por que não Flip aqui: a geometria de repouso das duas posições é conhecida
   e constante — aberta 46px, fechada 38px (64/56 na doca). Não há nada a
   medir. Uma razão fixa entre dois números do design system anima sem tocar
   no layout, sem `absolute`, e continua correta se a fonte terminar de
   carregar no meio da transição (§54) ou se a viewport mudar de tamanho
   (§53). Flip fica para onde a geometria é de fato desconhecida: o indicador
   da conversa ativa. */

export interface TabParts {
  /** A forma colorida da aba. */
  shape: HTMLElement;
  /** Ícone + rótulo. Recebe a contra-escala. */
  inner: HTMLElement | null;
  /** Os ombros côncavos que ligam a aba à folha. */
  shoulders: HTMLElement[];
}

export interface TabSwapOptions {
  opening: TabParts | null;
  closing: TabParts | null;
  variant: MotionScale;
  /** "up": trilho superior, a aba cresce para cima. "down": doca do mobile. */
  grow: "up" | "down";
}

const CLEAR = "opacity,visibility,transform";

export function tabSwapTimeline({
  opening,
  closing,
  variant,
  grow,
}: TabSwapOptions): gsap.core.Timeline {
  const timeline = gsap.timeline({
    defaults: { ease: ease.folder, overwrite: "auto" },
  });

  /* A aba cresce presa à folha: base fixa no trilho, topo fixo na doca.
     Transladar a forma em vez de escalá-la abriria uma fenda no encontro. */
  const origin = grow === "up" ? "50% 100%" : "50% 0%";

  const open =
    grow === "up" ? folderGeometry.tab : folderGeometry.dock;
  const closed =
    grow === "up" ? folderGeometry.tabClosed : folderGeometry.dockClosed;

  if (variant === "reduced") {
    /* Sem movimento: a mudança de forma acontece na troca de classe, e os
       ombros aparecem sem transição. A leitura de pasta continua — ela é
       geométrica, não animada. */
    if (opening) {
      timeline.set(opening.shoulders, { clearProps: CLEAR });
      timeline.fromTo(
        opening.shoulders,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: duration.instant },
        0,
      );
    }
    if (closing) {
      timeline.to(closing.shoulders, { autoAlpha: 0, duration: 0.08 }, 0);
    }
    return timeline;
  }

  /* A aba lidera a troca: ela precisa ter chegado à frente antes de o
     conteúdo novo aparecer. Por isso ela abre com `power3.out` — autoridade
     no primeiro frame — e não com o inOut da pasta, que passaria os
     primeiros 100ms praticamente parada enquanto a folha já mudou de cor. */
  const speed = variant === "mobile" ? duration.ui : duration.folder * 0.85;

  if (closing) {
    /* A aba que sai parte da altura de aberta e volta ao repouso. Ela
       começa a descer antes de a nova subir — a pilha só tem uma pasta à
       frente por vez. */
    timeline.fromTo(
      closing.shape,
      { scaleY: open / closed, transformOrigin: origin },
      {
        scaleY: 1,
        duration: speed * 0.72,
        ease: ease.folder,
        clearProps: "transform,transform-origin",
      },
      0,
    );
    if (closing.inner) {
      timeline.fromTo(
        closing.inner,
        { scaleY: closed / open, transformOrigin: origin },
        {
          scaleY: 1,
          duration: speed * 0.72,
          ease: ease.folder,
          clearProps: "transform,transform-origin",
        },
        0,
      );
    }
    if (closing.shoulders.length > 0) {
      timeline.to(
        closing.shoulders,
        { autoAlpha: 0, scaleX: 0.4, duration: duration.fast, ease: ease.exit },
        0,
      );
    }
  }

  if (opening) {
    timeline.fromTo(
      opening.shape,
      { scaleY: closed / open, transformOrigin: origin },
      {
        scaleY: 1,
        duration: speed,
        ease: ease.enter,
        clearProps: "transform,transform-origin",
      },
      closing ? 0.04 : 0,
    );
    if (opening.inner) {
      timeline.fromTo(
        opening.inner,
        { scaleY: open / closed, transformOrigin: origin },
        {
          scaleY: 1,
          duration: speed,
          ease: ease.enter,
          clearProps: "transform,transform-origin",
        },
        closing ? 0.04 : 0,
      );
    }
    if (opening.shoulders.length > 0) {
      /* Os ombros são a costura entre aba e folha. Entram depois que a aba
         já subiu quase toda: primeiro a pasta chega à frente, depois ela
         encosta na folha. */
      timeline.fromTo(
        opening.shoulders,
        { autoAlpha: 0, scaleX: 0.4 },
        {
          autoAlpha: 1,
          scaleX: 1,
          duration: duration.ui,
          ease: ease.enter,
          stagger: stagger.tight,
          clearProps: CLEAR,
        },
        (closing ? 0.04 : 0) + speed * 0.3,
      );
    }
  }

  return timeline;
}
