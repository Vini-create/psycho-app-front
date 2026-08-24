"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { gsap, useGSAP } from "./gsap";
import { resolveMotionVariant } from "./media";
import { duration, ease } from "./tokens";
import { useLateReveals } from "./useLateReveals";
import {
  folderEnterTimeline,
  folderExitTimeline,
  shellIntroTimeline,
} from "./folder-motion";

/* Controlador da troca de pasta.

   O modelo é deliberadamente pequeno — três fatos e duas transições:

     pathname → resolveFolder → activeId → coreografia

   A URL continua sendo a única fonte de verdade. Este provider não guarda
   "pasta ativa" em estado: ele recebe `activeId` já derivado da rota e só
   reage à mudança. Não existe janela em que a aba desenhada e a URL
   discordem — o que elimina de saída a classe de bugs de estado paralelo do
   §16, sem precisar de máquina de estados (§39).

   O clique adianta a saída; ele não a espera. `requestFolder` roda a fase de
   recuo e devolve o controle na mesma tick, para o `router.push` acontecer
   sem atraso (§17). Quando o conteúdo novo monta, a entrada sobrescreve o
   que estiver correndo (`overwrite: "auto"`). */

interface FolderMotionValue {
  activeId: string;
  /** Adianta o recuo da pasta atual. Seguro chamar com o id já ativo. */
  requestFolder: (nextId: string) => void;
}

const FolderMotionContext = createContext<FolderMotionValue>({
  activeId: "",
  requestFolder: () => {},
});

/** Refs internas, entregues ao AppFrame para ele plugar a moldura. */
interface FolderMotionRefs {
  frameRef: RefObject<HTMLDivElement | null>;
  bodyRef: RefObject<HTMLDivElement | null>;
}

const FolderMotionRefsContext = createContext<FolderMotionRefs | null>(null);

/** Usado pela navegação: quem sabe o id da pasta de destino. */
export function useFolderMotion(): FolderMotionValue {
  return useContext(FolderMotionContext);
}

/** Usado apenas pelo AppFrame. */
export function useFolderMotionRefs(): FolderMotionRefs | null {
  return useContext(FolderMotionRefsContext);
}

function directionBetween(
  order: readonly string[],
  from: string,
  to: string,
): -1 | 0 | 1 {
  const a = order.indexOf(from);
  const b = order.indexOf(to);
  if (a < 0 || b < 0 || a === b) return 0;
  return b > a ? 1 : -1;
}

export interface FolderMotionProviderProps {
  children: ReactNode;
  /** Pasta aberta, derivada da rota pela app hospedeira. */
  activeId: string;
  /** Ordem das pastas no trilho. Define o sentido do deslocamento. */
  order: readonly string[];
  /** Identidade da rota dentro da pasta. Reinicia só a entrada de conteúdo. */
  motionKey?: string;
}

export function FolderMotionProvider({
  children,
  activeId,
  order,
  motionKey,
}: FolderMotionProviderProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const previousId = useRef<string | null>(null);
  /** Devolve o corpo ao repouso se a navegação prometida nunca acontecer. */
  const recoveryTimer = useRef<number | null>(null);

  const clearRecovery = useCallback(() => {
    if (recoveryTimer.current !== null) {
      window.clearTimeout(recoveryTimer.current);
      recoveryTimer.current = null;
    }
  }, []);

  const requestFolder = useCallback(
    (nextId: string) => {
      const body = bodyRef.current;
      if (!body || nextId === activeId) return;

      folderExitTimeline({
        body,
        variant: resolveMotionVariant(),
        direction: directionBetween(order, activeId, nextId),
      });

      /* Rede de segurança do §15: se um portão redirecionar, se a rota for
         cancelada ou se a navegação simplesmente não vier, o conteúdo não
         pode ficar preso em opacity 0. */
      clearRecovery();
      recoveryTimer.current = window.setTimeout(() => {
        recoveryTimer.current = null;
        gsap.to(body, {
          autoAlpha: 1,
          x: 0,
          y: 0,
          scaleY: 1,
          duration: duration.fast,
          ease: ease.enter,
          overwrite: "auto",
          clearProps: "opacity,visibility,transform",
        });
      }, 900);
    },
    [activeId, order, clearRecovery],
  );

  useGSAP(
    () => {
      const body = bodyRef.current;
      const frame = frameRef.current;
      if (!body || !frame) return;

      clearRecovery();

      const previous = previousId.current;
      previousId.current = activeId;

      const firstPaint = previous === null;
      const folderChanged = !firstPaint && previous !== activeId;
      const variant = resolveMotionVariant();

      const reveals = gsap.utils.toArray<HTMLElement>(
        body.querySelectorAll(".reveal"),
      );
      const listItems = gsap.utils.toArray<HTMLElement>(
        body.querySelectorAll("[data-motion-list] > *"),
      );

      if (firstPaint) {
        shellIntroTimeline({ frame, variant });
      }

      folderEnterTimeline({
        body,
        reveals,
        listItems,
        variant,
        direction: folderChanged
          ? directionBetween(order, previous, activeId)
          : 0,
        folderChanged,
      });
    },
    { dependencies: [activeId, motionKey], scope: frameRef },
  );

  /* Blocos que chegam depois da pasta — skeleton virando conteúdo. */
  useLateReveals(bodyRef, true);

  /* A saída nasce em um handler de evento, fora do contexto do useGSAP.
     Este cleanup é quem garante que ela não sobreviva à desmontagem. */
  useEffect(() => {
    const body = bodyRef.current;
    return () => {
      clearRecovery();
      if (body) gsap.killTweensOf(body);
    };
  }, [clearRecovery]);

  const value = useMemo<FolderMotionValue>(
    () => ({ activeId, requestFolder }),
    [activeId, requestFolder],
  );

  const refs = useMemo<FolderMotionRefs>(
    () => ({ frameRef, bodyRef }),
    [],
  );

  return (
    <FolderMotionContext.Provider value={value}>
      <FolderMotionRefsContext.Provider value={refs}>
        {children}
      </FolderMotionRefsContext.Provider>
    </FolderMotionContext.Provider>
  );
}
