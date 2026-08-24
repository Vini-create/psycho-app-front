"use client";

import { gsap } from "./gsap";
import { distance, duration, ease, scale, stagger } from "./tokens";
import type { MotionScale } from "./tokens";

/* Coreografia da troca de pasta — §05 do briefing, §09 do brandbook.

   Uma decisão explica todo o arquivo: quem se move NÃO é a folha, é o corpo
   da pasta dentro dela.

   A folha (`sheet`) é o objeto que carrega a cor da pasta aberta e encosta
   nas bordas da moldura. Escalá-la abriria, por meio segundo, uma fresta
   entre pasta e moldura com a cor da mesa aparecendo por baixo — o oposto
   da ilusão que queremos. O corpo (`body`) é transparente sobre a folha:
   qualquer folga que sua escala produza mostra a própria cor da pasta, e a
   leitura é a de uma folha assentando sob a aba que acabou de subir.

   Amplitudes: 3–8px no desktop, 2–4px no mobile. Nada aqui passa de 8px. */

export interface FolderBodyTargets {
  /** O corpo da pasta: wrapper transparente sobre a folha colorida. */
  body: HTMLElement;
  /** Blocos marcados com `.reveal` — 2 a 4 por tela. */
  reveals?: HTMLElement[];
  /** Itens de uma lista marcada com `data-motion-list`. */
  listItems?: HTMLElement[];
}

export interface FolderEnterOptions extends FolderBodyTargets {
  variant: MotionScale;
  /** -1 para a pasta à esquerda, 1 para a direita, 0 quando não se sabe. */
  direction: -1 | 0 | 1;
  /** `true` quando mudou a pasta; `false` quando só mudou a rota interna. */
  folderChanged: boolean;
}

const CLEAR = "opacity,visibility,transform";

/**
 * Entrada: a pasta nova assenta sob a própria aba e o conteúdo sobe.
 *
 * `transformOrigin` no topo é o que produz a leitura de dobradiça — o corpo
 * cresce a partir da borda onde a aba está encaixada, não do centro.
 */
export function folderEnterTimeline({
  body,
  reveals = [],
  listItems = [],
  variant,
  direction,
  folderChanged,
}: FolderEnterOptions): gsap.core.Timeline {
  const timeline = gsap.timeline({
    defaults: { ease: ease.enter, overwrite: "auto" },
  });

  if (variant === "reduced") {
    /* Sem deslocamento e sem escala. Resta uma troca de opacidade curta o
       bastante para marcar que a superfície é outra — §30. */
    timeline.fromTo(
      body,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: duration.instant, clearProps: CLEAR },
    );
    return timeline;
  }

  const mobile = variant === "mobile";
  const lift = mobile ? distance.step : distance.lift;
  const drift = folderChanged ? direction * (mobile ? 0 : distance.step) : 0;

  timeline.fromTo(
    body,
    {
      autoAlpha: 0,
      y: lift,
      x: drift,
      scaleY: folderChanged ? (mobile ? 0.997 : scale.sheet) : 1,
      transformOrigin: "50% 0%",
    },
    {
      autoAlpha: 1,
      y: 0,
      x: 0,
      scaleY: 1,
      /* O corpo segue a aba, nunca a antecede: ele assenta enquanto ela
         termina de subir. */
      duration: folderChanged ? duration.folder * 0.85 : duration.page,
      ease: ease.enter,
      clearProps: `${CLEAR},transform-origin`,
    },
    0.04,
  );

  /* Os blocos entram depois do corpo ter começado a assentar: primeiro o
     objeto, depois o que está escrito nele. */
  if (reveals.length > 0) {
    timeline.fromTo(
      reveals,
      { autoAlpha: 0, y: mobile ? distance.step : distance.lift },
      {
        autoAlpha: 1,
        y: 0,
        duration: duration.page,
        stagger: stagger.block,
        clearProps: CLEAR,
      },
      folderChanged ? 0.12 : 0.06,
    );
  }

  if (listItems.length > 0) {
    timeline.fromTo(
      listItems,
      { autoAlpha: 0, y: distance.step },
      {
        autoAlpha: 1,
        y: 0,
        duration: duration.ui,
        stagger: {
          /* Teto de 0.2s no total: uma lista de 40 itens não pode virar
             uma cascata de dois segundos. */
          amount: Math.min(0.2, listItems.length * stagger.tight),
          from: "start",
        },
        clearProps: CLEAR,
      },
      folderChanged ? 0.16 : 0.1,
    );
  }

  return timeline;
}

/**
 * Saída: o corpo da pasta recua um passo e apaga.
 *
 * Dispara no clique e NÃO segura a navegação (§17). Dura menos que o tempo
 * típico de um push do App Router com prefetch, e é sobrescrita pela entrada
 * assim que o conteúdo novo monta — as duas leem como um movimento só.
 */
export function folderExitTimeline({
  body,
  variant,
  direction,
}: {
  body: HTMLElement;
  variant: MotionScale;
  direction: -1 | 0 | 1;
}): gsap.core.Timeline {
  const timeline = gsap.timeline({ defaults: { overwrite: "auto" } });

  if (variant === "reduced") {
    timeline.to(body, { autoAlpha: 0, duration: 0.08, ease: "none" });
    return timeline;
  }

  const mobile = variant === "mobile";

  timeline.to(body, {
    autoAlpha: 0,
    y: mobile ? distance.nudge : distance.step,
    x: -direction * (mobile ? 0 : distance.nudge),
    scaleY: 0.997,
    transformOrigin: "50% 0%",
    duration: mobile ? duration.instant : duration.fast,
    ease: ease.exit,
  });

  return timeline;
}

/**
 * Entrada única da moldura, no primeiro carregamento — §27 do briefing.
 * Não se repete a cada rota: quem repete é a coreografia de pasta.
 */
export function shellIntroTimeline({
  frame,
  variant,
}: {
  frame: HTMLElement;
  variant: MotionScale;
}): gsap.core.Timeline {
  const timeline = gsap.timeline({ defaults: { overwrite: "auto" } });

  if (variant === "reduced") {
    timeline.fromTo(
      frame,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: duration.instant, clearProps: CLEAR },
    );
    return timeline;
  }

  timeline.fromTo(
    frame,
    { autoAlpha: 0, y: variant === "mobile" ? distance.step : distance.lift },
    {
      autoAlpha: 1,
      y: 0,
      duration: 0.36,
      ease: ease.enter,
      clearProps: CLEAR,
    },
  );

  return timeline;
}
