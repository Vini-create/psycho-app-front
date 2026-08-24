"use client";

import { useRef, type RefObject } from "react";
import { Flip, useGSAP } from "./gsap";
import { resolveMotionVariant } from "./media";
import { duration, ease } from "./tokens";

/* O único lugar do produto onde Flip é a ferramenta certa.

   Um indicador de item ativo — a régua lateral da conversa aberta — muda de
   posição E de altura entre itens cujos tamanhos dependem do texto. A
   geometria de destino não é conhecida por nenhum token; precisa ser medida.

   O estado anterior é capturado no commit anterior, e não no clique: o hook
   guarda a geometria a cada render e a consome no render seguinte, quando a
   chave ativa muda. Assim funciona igual para clique, teclado, botão voltar
   do navegador e mudança programática de rota — nenhum deles precisa avisar
   o indicador de nada. */
export function useActiveIndicator(
  scopeRef: RefObject<HTMLElement | null>,
  flipId: string,
  activeKey: string | null,
) {
  const previousState = useRef<Flip.FlipState | null>(null);
  const previousKey = useRef<string | null>(null);

  useGSAP(
    () => {
      const scope = scopeRef.current;
      if (!scope) return;

      const target = scope.querySelector<HTMLElement>(
        `[data-flip-id="${flipId}"]`,
      );

      const changed =
        previousKey.current !== null && previousKey.current !== activeKey;
      previousKey.current = activeKey;

      const from = previousState.current;
      previousState.current = target ? Flip.getState(target) : null;

      if (!changed || !target || !from) return;
      if (resolveMotionVariant() === "reduced") return;

      Flip.from(from, {
        targets: target,
        duration: duration.ui,
        ease: ease.enter,
        scale: true,
        overwrite: "auto",
      });
    },
    { dependencies: [activeKey], scope: scopeRef },
  );
}
