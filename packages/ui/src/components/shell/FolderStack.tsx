"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cx } from "../../lib/cx";
import type { IconName } from "../../icons";
import { gsap, useGSAP } from "../../motion/gsap";
import { resolveMotionVariant } from "../../motion/media";
import { duration, ease } from "../../motion/tokens";
import {
  contentRevealTimeline,
  settleStack,
  stackSwapTimeline,
} from "../../motion/stack-motion";
import { useLateReveals } from "../../motion/useLateReveals";
import {
  FolderSheet,
  useFolderWidth,
  type FolderSheetGeometry,
  type FolderTone,
} from "./FolderSheet";
import { folderShape, layoutTabs, packedTabsWidth } from "./folder-shape";
import { DefaultNavLink, type NavLinkComponent } from "./nav-link";

/* A pilha. Quatro pastas, quatro rotas, nenhuma folha decorativa.

   O invariante que governa este arquivo: a URL manda. `activeId` chega
   pronto da app hospedeira, derivado do pathname, e tudo aqui — quem está
   na frente, quem tem conteúdo, qual z-index cada folha recebe — é função
   dele. Não existe estado paralelo de "pasta aberta", e por isso deep link,
   refresh, back e forward do navegador acertam por construção: são apenas
   outro valor de `activeId` chegando.

   O GSAP nunca decide quem está na frente. Ele só encena a mudança que o
   React já cometeu. */

export interface FolderDefinition {
  /** Identidade estável da pasta. Normalmente igual ao href. */
  id: string;
  href: string;
  label: string;
  icon?: IconName;
  tone: FolderTone;
  count?: number;
  /** Posição da aba no topo, como fração da largura. Opcional. */
  tabAnchor?: number;
}

/* Irregularidade proposital: arquivos reais não são tabulados por planilha.
   Amplitudes pequenas, sempre determinísticas — nada aqui é aleatório, senão
   a pilha mudaria de forma a cada render. */
const ANCHOR_JITTER = [0, 0.014, -0.01, 0.006];

function defaultAnchors(count: number): number[] {
  if (count <= 1) return [0.035];
  const span = 0.7;
  return Array.from({ length: count }, (_, index) => {
    const base = 0.035 + (span * index) / (count - 1);
    return base + (ANCHOR_JITTER[index % ANCHOR_JITTER.length] ?? 0);
  });
}

/** Largura estimada do rótulo antes de ele ser medido. Evita salto. */
function estimateLabelWidth(folder: FolderDefinition): number {
  const glyphs = folder.label.length * 8.2;
  const icon = folder.icon ? 24 : 0;
  const badge = folder.count && folder.count > 0 ? 30 : 0;
  return Math.round(glyphs + icon + badge);
}

/**
 * Folga interna da aba, derivada do espaço que sobra na folha.
 *
 * A aba não tem um padding fixo porque não deveria mesmo: numa pasta de
 * arquivo a aba é generosa quando há papel, e aperta quando não há. Aqui o
 * espaço livre — largura da folha menos os rótulos e os vãos — é dividido
 * entre as abas e usado como respiro, com teto para não virar faixa e piso
 * para o rótulo nunca encostar no recorte.
 */
function tabPaddingFor(width: number, labels: readonly number[]): number {
  const count = labels.length;
  if (count === 0) return folderShape.tabPadding;
  const labelTotal = labels.reduce((total, label) => total + label, 0);
  const gaps = folderShape.tabGap * (count - 1);
  const free = width - labelTotal - gaps;
  const share = (free / (count * 2)) * 0.8;
  return Math.round(
    Math.min(folderShape.tabPaddingMax, Math.max(folderShape.tabPadding, share)),
  );
}

/** A pasta ativa é sempre a última — a folha fisicamente mais à frente. */
function physicalOrder(
  folders: readonly FolderDefinition[],
  activeId: string,
): FolderDefinition[] {
  return [
    ...folders.filter((folder) => folder.id !== activeId),
    ...folders.filter((folder) => folder.id === activeId),
  ];
}

export interface FolderStackProps {
  folders: readonly FolderDefinition[];
  activeId: string;
  linkComponent?: NavLinkComponent;
  /** Rótulo acessível da navegação — as abas SÃO a navegação. */
  navLabel?: string;
  /** Conteúdo da pasta aberta. */
  children: ReactNode;
  /**
   * Assinatura do mobile, impressa no topo da folha aberta.
   *
   * Vive aqui, e não na bancada, porque abaixo de `sm` não há bancada
   * visível: a pasta ocupa a tela inteira, e qualquer faixa da cor do
   * ambiente no topo lê como um header preto por cima dela.
   */
  mobileHeader?: ReactNode;
  /** Identidade da rota dentro da pasta. Reinicia só a entrada do conteúdo. */
  motionKey?: string;
  /** Trava a pilha na altura da caixa e rola por dentro da folha. */
  fill?: boolean;
  className?: string;
}

export function FolderStack({
  folders,
  activeId,
  linkComponent = DefaultNavLink,
  navLabel = "Seções",
  motionKey,
  children,
  mobileHeader,
  fill = false,
  className,
}: FolderStackProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef(new Map<string, HTMLSpanElement>());
  /* Uma medição para as quatro folhas: elas dividem a mesma célula do grid,
     logo têm exatamente a mesma largura — e a largura é a única medida que
     o desenho da silhueta ainda consome. */
  const width = useFolderWidth(stageRef);
  const [labelWidths, setLabelWidths] = useState<Record<string, number>>({});

  /* --- medição -------------------------------------------------------- */

  const measureLabels = useCallback(() => {
    setLabelWidths((current) => {
      let changed = false;
      const next = { ...current };
      labelRefs.current.forEach((element, id) => {
        const measured = Math.ceil(element.getBoundingClientRect().width);
        if (measured > 0 && next[id] !== measured) {
          next[id] = measured;
          changed = true;
        }
      });
      return changed ? next : current;
    });
  }, []);

  useLayoutEffect(() => {
    measureLabels();
  }, [measureLabels, folders, width]);

  /* A largura da aba depende do rótulo renderizado. Se a fonte terminar de
     carregar depois do primeiro layout, as abas precisam ser remedidas —
     sem isso o texto sobra ou falta espaço no papel (§54). */
  useEffect(() => {
    if (typeof document === "undefined" || !document.fonts) return;
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) measureLabels();
    });
    return () => {
      cancelled = true;
    };
  }, [measureLabels]);

  /* --- geometria ------------------------------------------------------ */

  /* Compacto é uma decisão de viewport, não de largura da caixa: a pilha
     vive dentro de margens que variam, e comparar a largura dela com o
     breakpoint faria a doca aparecer em telas que ainda são desktop. */
  const [compact, setCompact] = useState(false);

  useLayoutEffect(() => {
    const query = window.matchMedia(folderShape.compactQuery);
    const read = () => setCompact(!query.matches);
    read();
    query.addEventListener("change", read);
    return () => query.removeEventListener("change", read);
  }, []);

  const geometry = useMemo(() => {
    const anchors = defaultAnchors(folders.length);
    const labels = folders.map(
      (folder) => labelWidths[folder.id] || estimateLabelWidth(folder),
    );
    const padding = tabPaddingFor(width, labels);
    const slots = folders.map((folder, index) => ({
      anchor: folder.tabAnchor ?? anchors[index] ?? 0.035,
      width: (labels[index] ?? 0) + padding * 2,
    }));

    if (compact || width === 0) {
      /* No mobile a folha É a tela: sem aba e sem cantos, porque não há
         mesa em volta para o papel se destacar. */
      return folders.map(() => ({
        tabX: 0,
        tabWidth: 0,
        tabHeight: 0,
        radius: 0,
      }));
    }

    /* Se as abas não couberem nem encostadas, elas encolhem por igual. O
       rótulo continua legível porque a folga interna é o que cede primeiro. */
    const needed = packedTabsWidth(slots);
    const squeeze = needed > width ? width / needed : 1;
    const scaled = slots.map((slot) => ({
      anchor: slot.anchor,
      width: Math.floor(slot.width * squeeze),
    }));

    const positions = layoutTabs(width, scaled);
    return scaled.map((slot, index) => ({
      tabX: Math.round(positions[index] ?? 0),
      tabWidth: slot.width,
      tabHeight: folderShape.tabHeight,
    }));
  }, [folders, labelWidths, width, compact]);

  /* A geometria é calculada na ordem de configuração — que é a ordem das
     abas da esquerda para a direita — e consultada na ordem física, que é
     outra. Um índice por id evita confundir as duas. */
  const geometryOf = useCallback(
    (id: string): FolderSheetGeometry => {
      const index = folders.findIndex((folder) => folder.id === id);
      return (
        geometry[index] ?? { tabX: 0, tabWidth: 0, tabHeight: 0, radius: 0 }
      );
    },
    [folders, geometry],
  );

  /* --- pilha ---------------------------------------------------------- */

  const stack = useMemo(
    () => physicalOrder(folders, activeId),
    [folders, activeId],
  );

  const depthOf = useCallback(
    (id: string) => {
      const index = stack.findIndex((folder) => folder.id === id);
      return index < 0 ? 0 : stack.length - 1 - index;
    },
    [stack],
  );

  const restY = useCallback(
    (depth: number) => (compact ? 0 : -depth * folderShape.stackStep),
    [compact],
  );

  /* --- coreografia ---------------------------------------------------- */

  const intentRecovery = useRef<number | null>(null);

  const clearIntentRecovery = useCallback(() => {
    if (intentRecovery.current !== null) {
      window.clearTimeout(intentRecovery.current);
      intentRecovery.current = null;
    }
  }, []);

  const previousActive = useRef<string | null>(null);
  /* Ponte entre as duas timelines: a da pilha sabe que houve viagem, a do
     conteúdo precisa saber para entrar depois dela em vez de junto. */
  const folderChangedRef = useRef(false);

  const sheetElement = useCallback((id: string): HTMLElement | null => {
    const stage = stageRef.current;
    if (!stage) return null;
    return stage.querySelector<HTMLElement>(
      `[data-folder-sheet=${JSON.stringify(id)}]`,
    );
  }, []);

  useGSAP(
    () => {
      const stage = stageRef.current;
      if (!stage || !activeId) return;

      const members = folders
        .map((folder) => {
          const element = sheetElement(folder.id);
          return element
            ? { element, y: restY(depthOf(folder.id)), id: folder.id }
            : null;
        })
        .filter((member): member is NonNullable<typeof member> => member !== null);

      clearIntentRecovery();

      const previous = previousActive.current;
      previousActive.current = activeId;

      /* Primeiro paint, mudança de rota dentro da mesma pasta, ou volta do
         modo compacto: a pilha só precisa estar no lugar certo. Encenar a
         abertura de uma pasta que nunca esteve fechada seria mentira (§63). */
      if (previous === null || previous === activeId || compact) {
        folderChangedRef.current = false;
        settleStack(members);
        return;
      }

      folderChangedRef.current = true;

      /* Cliques em sequência: mata o que estava correndo e recomeça da
         posição atual dos objetos. Nenhuma folha fica presa no meio. */
      members.forEach(({ element }) => gsap.killTweensOf(element));

      const incoming = sheetElement(activeId);
      const incomingContent =
        incoming?.querySelector<HTMLElement>("[data-folder-content]") ?? null;

      stackSwapTimeline({
        incoming,
        incomingContent,
        resting: members.filter((member) => member.id !== activeId),
        variant: resolveMotionVariant(),
      });
    },
    { dependencies: [activeId, compact, folders], scope: stageRef },
  );

  /* O que está impresso na folha entra depois que ela parou de se mover.
     Roda também quando só a rota interna muda — ali nenhuma pasta viaja, mas
     o conteúdo ainda precisa chegar em ordem. */
  const [contentEl, setContentEl] = useState<HTMLElement | null>(null);
  const contentRef = useMemo(() => ({ current: contentEl }), [contentEl]);

  useGSAP(
    () => {
      const content = sheetElement(activeId)?.querySelector<HTMLElement>(
        "[data-folder-content]",
      );
      if (!content) return;
      setContentEl(content);

      contentRevealTimeline({
        content,
        reveals: gsap.utils.toArray<HTMLElement>(
          content.querySelectorAll(".reveal"),
        ),
        listItems: gsap.utils.toArray<HTMLElement>(
          content.querySelectorAll("[data-motion-list] > *"),
        ),
        variant: resolveMotionVariant(),
        folderChanged: folderChangedRef.current,
      });
      folderChangedRef.current = false;
    },
    { dependencies: [activeId, motionKey], scope: stageRef },
  );

  /* Blocos que chegam depois da pasta — skeleton virando conteúdo. */
  useLateReveals(contentRef, true);

  useEffect(() => {
    const stage = stageRef.current;
    return () => {
      clearIntentRecovery();
      if (!stage) return;
      gsap.killTweensOf(
        Array.from(stage.querySelectorAll<HTMLElement>("[data-folder-sheet]")),
      );
    };
  }, [clearIntentRecovery]);

  /* Fase 1 da coreografia: a pasta reage ao toque antes de a rota trocar.

     Com rede. Se a navegação nunca vier — um portão redirecionou, o usuário
     desistiu, a rota foi cancelada —, a folha voltaria ao repouso 3px acima
     de onde deveria estar e ficaria lá. O temporizador devolve a pilha ao
     estado declarado; a troca de pasta, se acontecer, cancela-o antes. */
  const handleIntent = useCallback(
    (id: string) => {
      if (id === activeId || compact) return;
      if (resolveMotionVariant() === "reduced") return;
      const element = sheetElement(id);
      if (!element) return;

      gsap.to(element, {
        y: "-=3",
        duration: 0.1,
        ease: "power2.out",
        overwrite: "auto",
      });

      clearIntentRecovery();
      intentRecovery.current = window.setTimeout(() => {
        intentRecovery.current = null;
        const target = sheetElement(id);
        if (!target) return;
        gsap.to(target, {
          y: restY(depthOf(id)),
          duration: duration.fast,
          ease: ease.enter,
          overwrite: "auto",
        });
      }, 900);
    },
    [activeId, clearIntentRecovery, compact, depthOf, restY, sheetElement],
  );

  return (
    /* A pilha em si não é um landmark de navegação: o conteúdo da página
       — um `<main>` — vive dentro das folhas, e `<main>` não pode descender
       de `<nav>`. Quem carrega o landmark é cada aba, dentro da sua própria
       pasta, o que também é a leitura correta do objeto: a navegação está
       na pasta, não em uma barra por cima dela. */
    <div
      ref={stageRef}
      data-folder-stack=""
      className={cx(
        "relative isolate grid w-full",
        /* `min-h-0` sem `overflow-hidden`, de propósito.

           As pastas de repouso ficam 6 a 18px ACIMA da borda de cima do
           palco — é isso que faz a pilha existir. Recortar aqui decapitava
           as três abas fechadas numa linha reta, e o resultado lia como um
           header preto cortando as pastas. Quem precisa conter o scroll em
           `fill` é o conteúdo da folha, e é lá que o recorte mora. */
        fill && "min-h-0",
        className,
      )}
    >
      {/* A ordem do DOM é a ordem FÍSICA da pilha, do fundo para a frente.

          Isso resolve duas coisas de uma vez. A pintura fica correta mesmo
          antes de qualquer z-index — a folha da frente é a última a ser
          desenhada. E a ordem de tabulação passa a ser "abas fechadas, aba
          aberta, conteúdo da pasta aberta", em vez de despejar dois links de
          navegação depois da página inteira. */}
      {stack.map((folder) => {
        const active = folder.id === activeId;
        const depth = depthOf(folder.id);
        return (
          <FolderSheet
            key={folder.id}
            id={folder.id}
            href={folder.href}
            label={folder.label}
            icon={folder.icon}
            count={folder.count}
            tone={folder.tone}
            active={active}
            depth={depth}
            zIndex={(folders.length - depth) * 10}
            geometry={geometryOf(folder.id)}
            width={width}
            linkComponent={linkComponent}
            navLabel={navLabel}
            fill={fill}
            hidden={compact && !active}
            labelRef={(element) => {
              if (element) labelRefs.current.set(folder.id, element);
              else labelRefs.current.delete(folder.id);
            }}
            onIntent={handleIntent}
          >
            {active ? (
              <>
                {mobileHeader && (
                  <div className="flex shrink-0 items-center justify-between gap-4 border-b border-hairline px-5 py-4 sm:hidden">
                    {mobileHeader}
                  </div>
                )}
                {children}
              </>
            ) : null}
          </FolderSheet>
        );
      })}
    </div>
  );
}
