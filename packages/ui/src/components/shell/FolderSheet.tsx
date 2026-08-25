"use client";

import {
  type CSSProperties,
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { cx } from "../../lib/cx";
import { Icon, type IconName } from "../../icons";
import { folderPath, folderShape } from "./folder-shape";
import { paperSurface, type FolderTone } from "./FolderPaper";
import type { NavLinkComponent } from "./nav-link";

/* Uma pasta. Uma superfície. Um objeto rígido.

   Tudo o que o usuário percebe como "a pasta" — a aba, o corpo, a textura,
   a borda, a sombra e o conteúdo impresso nela — está dentro de um único
   elemento. Quem move a pasta move esse elemento, e por isso não existe
   coreografia capaz de descolar a aba do corpo: elas não são duas coisas.

   A PINTURA, essa sim, são duas — e por um motivo de custo, não de forma:

   - a FAIXA de topo tem altura fixa (~77px) e concentra tudo o que a
     silhueta tem de complicado: a aba, os ombros côncavos, os cantos de
     cima. Recortada por `clip-path`.
   - o CORPO, daí para baixo, é um retângulo de cantos arredondados. Um
     `border-radius` resolve, e o CSS o pinta praticamente de graça.

   A versão anterior desenhava a folha inteira como um SVG do tamanho da
   página. Funcionava e era bonita, mas toda mudança de altura do conteúdo
   mandava rasterizar quatro silhuetas do tamanho do documento — justamente
   no frame em que a troca de pasta começava. Medido: quatro frames acima de
   24ms por navegação, o pior em 121ms.

   As duas partes compartilham `paperSurface()`: mesma cor, mesmo recurso de
   ladrilho, mesmo blend, e a fase vertical do granulado deslocada pela
   altura da aba. É isso que mantém a promessa central do sistema — a
   textura atravessa a junção sem ruptura, e a emenda continua não existindo. */

export type { FolderTone };

export interface FolderSheetGeometry {
  tabX: number;
  tabWidth: number;
  tabHeight: number;
  radius?: number;
}

export interface FolderSheetProps {
  id: string;
  href: string;
  label: string;
  icon?: IconName;
  count?: number;
  tone: FolderTone;
  active: boolean;
  /** 0 é a folha da frente. Cresce para o fundo da pilha. */
  depth: number;
  zIndex: number;
  geometry: FolderSheetGeometry;
  /** Largura da folha, medida uma vez pela pilha — todas dividem a célula. */
  width: number;
  linkComponent: NavLinkComponent;
  /** Rótulo do landmark de navegação desta aba. */
  navLabel?: string;
  /** Recebe o elemento do rótulo para a pilha medir a largura da aba. */
  labelRef?: (element: HTMLSpanElement | null) => void;
  onIntent?: (id: string) => void;
  /** Trava a folha na altura da caixa e rola por dentro. */
  fill?: boolean;
  /** Fora da pilha — no modo compacto só a pasta aberta existe. */
  hidden?: boolean;
  children?: ReactNode;
}

export function FolderSheet({
  id,
  href,
  label,
  icon,
  count,
  tone,
  active,
  depth,
  zIndex,
  geometry,
  width,
  linkComponent: Link,
  navLabel = "Seções",
  labelRef,
  onIntent,
  fill = false,
  hidden = false,
  children,
}: FolderSheetProps) {
  const { tabX, tabWidth, tabHeight, radius = folderShape.bodyRadius } =
    geometry;

  const bandHeight = folderShape.bandHeight;
  const drawable = width > 0 && tabHeight > 0;

  /* O `clip-path` da faixa: a silhueta de cima cortada em `bandHeight`, sem
     arredondar o pé — ela termina DENTRO da folha, e quem continua dali para
     baixo é o corpo. */
  const bandClip = drawable
    ? `path("${folderPath({
        width,
        height: bandHeight,
        tabX,
        tabWidth,
        tabHeight,
        radius,
        bottom: "flat",
      })}")`
    : undefined;

  const dark = tone === "dark";

  /* Hover das pastas de trás: o corpo inteiro sobe, nunca só o rótulo.
     Vive em um elemento interno para não disputar `transform` com o GSAP,
     que escreve na raiz da folha. */
  const [lifted, setLifted] = useState(false);
  const lift = useCallback(
    (next: boolean) => {
      if (!active) setLifted(next);
    },
    [active],
  );

  useEffect(() => {
    if (active) setLifted(false);
  }, [active]);

  /* Fase 1 da coreografia — a intenção. A pasta reage ao toque antes de a
     rota mudar. Ignora tudo que não vai virar navegação nesta aba: botão do
     meio, ctrl/cmd, "abrir em nova guia". */
  const handlePointerDown = (event: PointerEvent<HTMLAnchorElement>) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    onIntent?.(id);
  };

  return (
    <div
      data-folder-sheet={id}
      data-folder-tone={tone}
      data-folder-depth={depth}
      data-folder-resting={active ? undefined : ""}
      style={{ gridArea: "1 / 1", zIndex }}
      className={cx(
        // Sem eventos na raiz: só a aba e o conteúdo recebem ponteiro, o
        // resto da caixa é área transparente da encenação.
        "pointer-events-none relative flex flex-col",
        // Mesma razão do palco: recortar aqui comeria a sombra da folha.
        fill && "min-h-0",
        // Abaixo de `sm` só a pasta aberta existe, e ela é a tela inteira.
        "max-sm:data-[folder-resting]:hidden",
        hidden && "hidden",
      )}
    >
      <div
        data-folder-rigid=""
        className={cx(
          "relative flex flex-1 flex-col",
          fill && "min-h-0",
          "transition-transform duration-140 ease-[var(--ease-sinapsa)]",
          lifted && "-translate-y-[3px]",
        )}
      >
        {/* O corpo. Retângulo de cantos arredondados: a pintura desta parte
            não sabe quanto a página cresceu, e por isso não custa nada
            quando ela cresce. A sombra é deslocada e comprimida para o alto
            dela nunca alcançar a aba — uma sombra atravessando a base da aba
            seria a emenda de volta, por outro caminho. */}
        <div
          data-folder-surface=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0"
          style={{
            top: "var(--folder-tab-height)",
            borderRadius: radius,
            ...paperSurface(tone, active, tabHeight),
            boxShadow: active
              ? "0 20px 26px -10px rgb(0 0 0 / 0.5), inset 1px 0 0 rgb(255 255 255 / 0.05), inset -1px 0 0 rgb(255 255 255 / 0.05), inset 0 -1px 0 rgb(0 0 0 / 0.14)"
              : "0 8px 12px -6px rgb(0 0 0 / 0.5)",
          }}
        />

        {/* A faixa de topo: aba, ombros e cantos de cima, em um recorte só.
            Fica atrás do corpo — assim a sombra dela morre sob a folha em
            vez de riscar uma linha no meio dela. */}
        {drawable && (
          <div
            data-folder-surface=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-10"
            style={{
              height: bandHeight,
              clipPath: bandClip,
              WebkitClipPath: bandClip,
              ...paperSurface(tone, active, 0),
              filter: active
                ? "drop-shadow(0 1px 1px rgb(0 0 0 / 0.5)) drop-shadow(0 10px 14px rgb(0 0 0 / 0.4))"
                : "drop-shadow(0 2px 4px rgb(0 0 0 / 0.5))",
            }}
          />
        )}

        {/* Filete de luz na aresta de cima da aba: espessura de papel, não
            borda de UI. Recortado pela mesma silhueta, então acompanha a
            curva dos ombros em vez de desenhar um retângulo. */}
        {drawable && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-10"
            style={{
              height: bandHeight,
              clipPath: bandClip,
              WebkitClipPath: bandClip,
              background:
                "linear-gradient(rgb(255 255 255 / 0.12), rgb(255 255 255 / 0) 5px)",
            }}
          />
        )}

        {/* A aba. É apenas o rótulo pousado sobre a região da silhueta que
            já foi desenhada como aba — não tem fundo, borda nem sombra
            próprios, porque não é um objeto separado. */}
        {tabHeight > 0 && (
          <nav aria-label={`${navLabel}: ${label}`} className="contents">
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              onPointerDown={handlePointerDown}
              onMouseEnter={() => lift(true)}
              onMouseLeave={() => lift(false)}
              onFocus={() => lift(true)}
              onBlur={() => lift(false)}
              className="pointer-events-auto absolute hidden items-center justify-center rounded-t-md sm:flex"
              style={
                {
                  left: tabX,
                  top: 0,
                  width: tabWidth,
                  height: tabHeight,
                  color: dark
                    ? "var(--folder-ink-dark)"
                    : "var(--folder-ink-pastel)",
                  opacity: active ? 1 : 0.88,
                  /* O anel de foco não pode herdar `--border-focus` da
                     folha: a pasta fechada está sob um véu escuro, e a tinta
                     que serve à folha aberta desaparece nele. A única
                     superfície clara é a de uma pasta pastel ABERTA. */
                  "--border-focus":
                    active && !dark
                      ? "var(--folder-ink-pastel)"
                      : "var(--folder-ink-dark)",
                } as CSSProperties
              }
            >
              <span
                ref={labelRef}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                {icon && (
                  <Icon name={icon} size={16} className="shrink-0 opacity-70" />
                )}
                <span className="type-ui text-ui-sm">{label}</span>
                {typeof count === "number" && count > 0 && (
                  <span className="type-meta rounded-xs bg-black/12 px-1.5 py-0.5 tabular-nums">
                    {count}
                  </span>
                )}
              </span>
            </Link>
          </nav>
        )}

        <div
          data-folder-content=""
          aria-hidden={active ? undefined : true}
          inert={active ? undefined : true}
          className={cx(
            "pointer-events-auto relative flex flex-1 flex-col text-primary",
            fill && "min-h-0 overflow-hidden",
          )}
          style={{ marginTop: "var(--folder-tab-height)" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export { folderShape };

/**
 * Largura de uma folha, em pixels.
 *
 * A silhueta é desenhada em coordenadas reais para os cantos não se
 * deformarem em nenhuma viewport, e isso exige medir. Só a largura: desde
 * que a pintura foi separada em faixa e corpo, a altura da página deixou de
 * participar do desenho — que é exatamente o que a tornou barata.
 */
export function useFolderWidth(ref: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const read = () => {
      const next = Math.round(element.getBoundingClientRect().width);
      setWidth((current) => (current === next ? current : next));
    };

    read();
    const observer = new ResizeObserver(read);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return width;
}
