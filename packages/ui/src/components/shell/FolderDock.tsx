"use client";

import { useRef, type CSSProperties } from "react";
import { cx } from "../../lib/cx";
import { Icon, type IconName } from "../../icons";
import { folderTabPath } from "./folder-shape";
import { paperSurface, type FolderTone } from "./FolderPaper";
import { useFolderWidth } from "./FolderSheet";
import { DefaultNavLink, type NavLinkComponent } from "./nav-link";

/* Navegação do mobile — Brand Book V2 §30.

   A pilha de pastas é uma metáfora horizontal: ela precisa de largura para
   que quatro abas convivam no mesmo topo sem se atropelarem. Abaixo de
   640px essa largura não existe, e insistir na mesma forma produziria abas
   de 60px com o rótulo cortado. Então a metáfora se adapta em vez de
   encolher: a folha passa a ocupar a tela inteira e as pastas viram uma
   doca, com a mesma silhueta desenhada de cabeça para baixo.

   Cada célula é literalmente a aba do desktop de cabeça para baixo: mesma
   `folderTabPath`, mesma conicidade, mesmos cantos — só que a ponta olha
   para a borda da tela em vez de para cima. E o estado ativo é a mesma
   informação de sempre, dita por geometria e não por sublinhado: a aba
   aberta é mais alta, sobe até encostar na folha e recebe a cor cheia; as
   fechadas ficam um degrau abaixo, sob o mesmo véu das pastas de trás no
   desktop. */

export interface FolderDockItem {
  id: string;
  href: string;
  label: string;
  icon?: IconName;
  tone: FolderTone;
  count?: number;
}

const DOCK_HEIGHT = 64;

/** Degrau entre a aba aberta e as fechadas — o mesmo papel do `stackStep`. */
const DOCK_STEP = 7;

/** Vão lateral: sem ele as quatro abas leem como uma barra segmentada. */
const DOCK_GAP = 3;

/** Véu das abas fechadas aqui. Bem mais leve que o da pilha do desktop —
    ver a nota em `paperSurface`. */
const DOCK_SCRIM = 0.2;

export interface FolderDockProps {
  items: readonly FolderDockItem[];
  activeId: string;
  linkComponent?: NavLinkComponent;
  label?: string;
  className?: string;
}

export function FolderDock({
  items,
  activeId,
  linkComponent: Link = DefaultNavLink,
  label = "Seções",
  className,
}: FolderDockProps) {
  const listRef = useRef<HTMLUListElement>(null);
  /* Todas as células têm a mesma largura: uma medida serve para as quatro. */
  const railWidth = useFolderWidth(listRef);
  const cellWidth = Math.floor(railWidth / Math.max(1, Math.min(items.length, 4)));
  const shapeWidth = cellWidth - DOCK_GAP * 2;

  const dockShape = (active: boolean) =>
    `path("${folderTabPath({
      width: shapeWidth,
      height: DOCK_HEIGHT - (active ? 0 : DOCK_STEP),
      edge: "bottom",
    })}")`;

  return (
    <>
      {/* A doca é fixa para não descer ao fim do documento em páginas
          longas. Este espaçador preserva sua altura no fluxo e impede que
          o último conteúdo fique escondido atrás dela. */}
      <div
        aria-hidden="true"
        className="h-[calc(4rem+env(safe-area-inset-bottom))] shrink-0 sm:hidden"
      />
      <nav
        aria-label={label}
        className={cx(
          "fixed inset-x-0 bottom-0 z-30 bg-ambient sm:hidden",
          // Respeita a área segura do iPhone sem inflar a altura em telas sem ela.
          "pb-[env(safe-area-inset-bottom)]",
          className,
        )}
      >
        <ul ref={listRef} className="flex items-stretch">
          {items.slice(0, 4).map((item) => {
            const active = item.id === activeId;
            const dark = item.tone === "dark";
            return (
              <li key={item.id} className="min-w-0 flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  style={
                    {
                      color: dark
                        ? "var(--folder-ink-dark)"
                        : "var(--folder-ink-pastel)",
                      opacity: active ? 1 : 0.88,
                    } as CSSProperties
                  }
                  className="relative flex h-16 flex-col items-center justify-end gap-1 px-1 pb-3"
                >
                  {shapeWidth > 0 && (
                    <span
                      data-folder-surface=""
                      aria-hidden="true"
                      className="pointer-events-none absolute"
                      style={{
                        left: DOCK_GAP,
                        right: DOCK_GAP,
                        bottom: 0,
                        /* A aba aberta sobe até o topo da doca e encosta na
                           folha, que é da mesma cor: as duas se fundem, e é
                           esse encontro — não um indicador — que diz qual
                           pasta está aberta. */
                        top: active ? 0 : DOCK_STEP,
                        clipPath: dockShape(active),
                        WebkitClipPath: dockShape(active),
                        ...paperSurface(item.tone, active, 0, DOCK_SCRIM),
                      }}
                    />
                  )}
                  <span className="relative flex flex-col items-center gap-1">
                    {item.icon && (
                      <Icon
                        name={item.icon}
                        size={20}
                        className={active ? "opacity-75" : "opacity-85"}
                      />
                    )}
                    <span className="type-ui w-full truncate text-center text-meta-lg leading-none">
                      {item.label}
                    </span>
                  </span>
                  {typeof item.count === "number" && item.count > 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute top-2 right-[24%] size-1.5 rounded-full bg-accent-clay"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

/**
 * Navegação local — dentro de um paciente, de uma conversa, de um período.
 *
 * Distinta da principal por peso, não por outra metáfora: linha simples com
 * sublinhado na ativa. O brandbook §09 pede "uma navegação principal + uma
 * local" e proíbe duplicar a mesma linguagem nas duas — motivo pelo qual
 * isto não é uma pasta.
 */
export function LocalNav({
  items,
  activeHref,
  linkComponent: Link = DefaultNavLink,
  label = "Seções desta página",
  className,
}: {
  items: Array<{ href: string; label: string }>;
  activeHref: string;
  linkComponent?: NavLinkComponent;
  label?: string;
  className?: string;
}) {
  return (
    <nav aria-label={label} className={cx("border-b border-hairline", className)}>
      {/* Abas horizontais rolam em telas estreitas — §09. */}
      <ul className="-mb-px flex gap-6 overflow-x-auto">
        {items.map((item) => {
          const active = item.href === activeHref;
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "type-ui flex h-11 items-center border-b-2 text-ui whitespace-nowrap transition-colors duration-140",
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-secondary hover:border-border-strong hover:text-primary",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
