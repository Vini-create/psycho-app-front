"use client";

import {
  useLayoutEffect,
  useRef,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { gsap } from "gsap";
import { cx } from "../../lib/cx";
import { Icon, type IconName } from "../../icons";

/* Brand Book V2 §09 — navegação "Folder Frame".

   A ideia central, e a razão de este arquivo não ser um <Tabs> genérico:
   cada destino é uma pasta física com cor própria. A folha de conteúdo
   permanece escura; quem abre, fecha e carrega a identidade cromática é a
   aba.

   Três peças produzem isso:

   1. O trilho é recuado e cada aba recebe a cor material de sua pasta.
      Fechada, ela continua visível com menor intensidade; aberta, usa a
      cor cheia e sobe acima das demais.
   2. A aba ativa não tem borda nenhuma. Uma borda fecharia a forma e
      devolveria a leitura de "caixa apoiada no trilho".
   3. Os ombros côncavos nos cantos de baixo completam a silhueta da aba
      aberta e evitam a leitura de um retângulo genérico.

   Consequência de acessibilidade que vem de graça: o estado ativo é forma
   + posição + aria-current, não cor. Passa no teste do grayscale (§34) e
   na regra de "cor nunca é portadora única de significado" (§29). */

/**
 * Ombro côncavo — o filete que liga a lateral da aba à superfície da folha.
 *
 * Um quadrado de 12px em que um quarto de círculo é recortado pelo gradiente
 * radial: o que sobra é a cunha que curva da vertical da aba para a
 * horizontal da página. `side` decide de qual canto o círculo é centrado.
 */
function TabShoulder({ side }: { side: "left" | "right" }) {
  return (
    <span
      data-folder-shoulder
      aria-hidden="true"
      className={cx(
        "pointer-events-none absolute bottom-0 size-3",
        side === "left" ? "-left-3" : "-right-3",
      )}
      style={{
        // 11.4 → 12 dá meio pixel de suavização na curva; sem isso a borda
        // do recorte serrilha em telas sem escala fracionária.
        background: `radial-gradient(circle at ${
          side === "left" ? "0 0" : "100% 0"
        }, transparent 11.4px, var(--folder-fill) 12px)`,
      }}
    />
  );
}

/** Versão espelhada do ombro para a doca inferior. */
function DockShoulder({ side }: { side: "left" | "right" }) {
  return (
    <span
      data-folder-shoulder
      aria-hidden="true"
      className={cx(
        "pointer-events-none absolute top-0 size-3",
        side === "left" ? "-left-3" : "-right-3",
      )}
      style={{
        background: `radial-gradient(circle at ${
          side === "left" ? "0 100%" : "100% 100%"
        }, transparent 11.4px, var(--folder-fill) 12px)`,
      }}
    />
  );
}

export interface FolderNavItem {
  href: string;
  label: string;
  icon: IconName;
  /** Cor material da pasta. A página abaixo permanece escura. */
  color?: "dark" | "sage" | "lavender" | "clay";
  /** Contagem de contexto novo. Nunca é só um ponto: vem com número. */
  count?: number;
}

const FOLDER_COLORS = {
  dark: {
    fill: "var(--folder-dark)",
    ink: "var(--folder-ink-dark)",
    muted: "var(--folder-muted-dark)",
  },
  sage: {
    fill: "var(--folder-sage)",
    ink: "var(--folder-ink-pastel)",
    muted: "var(--folder-muted-pastel)",
  },
  lavender: {
    fill: "var(--folder-lavender)",
    ink: "var(--folder-ink-pastel)",
    muted: "var(--folder-muted-pastel)",
  },
  clay: {
    fill: "var(--folder-clay)",
    ink: "var(--folder-ink-pastel)",
    muted: "var(--folder-muted-pastel)",
  },
} as const;

function folderVariables(item: FolderNavItem): CSSProperties {
  const color = FOLDER_COLORS[item.color ?? "dark"];
  return {
    "--folder-fill": color.fill,
    "--folder-ink": color.ink,
    "--folder-muted": color.muted,
  } as CSSProperties;
}

function folderStateStyle(active: boolean): CSSProperties {
  return {
    backgroundColor: active
      ? "var(--folder-fill)"
      : "color-mix(in srgb, var(--folder-fill) 38%, transparent)",
    color: active ? "var(--folder-ink)" : "var(--folder-muted)",
  } as CSSProperties;
}

function useFolderActivation(
  rootRef: RefObject<HTMLElement | null>,
  activeHref: string,
  direction: "down" | "up",
) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !activeHref) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const context = gsap.context(() => {
      const link = root.querySelector<HTMLElement>('[aria-current="page"]');
      if (!link) return;
      const shape =
        link.querySelector<HTMLElement>("[data-folder-shape]") ?? link;
      const shoulders = shape.querySelectorAll<HTMLElement>(
        "[data-folder-shoulder]",
      );
      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });

      timeline.fromTo(
        shape,
        {
          // Cresce preso à folha: base fixa no desktop, topo fixo no
          // mobile. Transladar a forma abriria uma fenda no encontro.
          scaleY: 0.92,
          transformOrigin:
            direction === "down" ? "center top" : "center bottom",
        },
        {
          scaleY: 1,
          duration: 0.26,
          clearProps: "transform,transform-origin",
        },
        0,
      );

      if (shoulders.length > 0) {
        timeline.fromTo(
          shoulders,
          { autoAlpha: 0, scaleX: 0.35 },
          {
            autoAlpha: 1,
            scaleX: 1,
            duration: 0.22,
            stagger: 0.025,
            clearProps: "opacity,visibility,transform",
          },
          0.06,
        );
      }
    }, root);

    return () => context.revert();
  }, [activeHref, direction, rootRef]);
}

/** Componente de link da app hospedeira (next/link nas duas apps). */
export type NavLinkComponent = ComponentType<{
  href: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  "aria-current"?: "page" | undefined;
  onClick?: () => void;
}>;

const DefaultLink: NavLinkComponent = ({ href, children, ...props }) => (
  <a href={href} {...props}>
    {children}
  </a>
);

export interface FolderNavProps {
  items: FolderNavItem[];
  /** Rota atual, já resolvida pela app. */
  activeHref: string;
  linkComponent?: NavLinkComponent;
  /** Conteúdo à direita do trilho: logo, tema, conta. */
  trailing?: ReactNode;
  /** Marca à esquerda do trilho. */
  leading?: ReactNode;
  label?: string;
  className?: string;
}

/**
 * Trilho superior de abas. Desktop e tablet.
 *
 * No mobile ele se esconde e quem navega é o FolderDock — o brandbook §30
 * pede comportamento diferente, não o mesmo componente encolhido.
 */
export function FolderNav({
  items,
  activeHref,
  linkComponent: Link = DefaultLink,
  leading,
  trailing,
  label = "Seções",
  className,
}: FolderNavProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  useFolderActivation(rootRef, activeHref, "up");

  return (
    <div
      ref={rootRef}
      className={cx(
        // `items-end` é o que produz o degrau: as abas têm alturas
        // diferentes e todas se alinham pela base.
        "relative z-30 hidden items-end gap-4 px-5 sm:flex lg:px-8",
        // Superfície do trilho do §09. A transição trilho → folha É a
        // divisória: não existe borda desenhada aqui, e por isso não
        // existe linha para atravessar a aba ativa.
        "bg-rail sm:rounded-t-xl",
        className,
      )}
    >
      {leading && <div className="flex shrink-0 items-center self-center pr-2">{leading}</div>}

      <nav aria-label={label} className="min-w-0 flex-1">
        {/* §09 — "Tabs horizontais devem poder scrollar em telas estreitas."
            Sem isto, um trilho com rótulos longos empurra a moldura inteira
            para fora da viewport em vez de rolar dentro de si. */}
        <ul className="flex items-end gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item) => {
            const active = item.href === activeHref;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  style={folderVariables(item)}
                  className={cx(
                    "group relative flex items-end",
                    // A área clicável tem sempre 46px de altura — o alvo
                    // mínimo do §09. O degrau de 8px vem do preenchimento
                    // interno, não de encolher a aba: encolher a caixa
                    // deixava o alvo em 38px e reprovava a regra de toque.
                    "-mb-px h-[2.875rem]",
                  )}
                >
                  <span
                    data-folder-shape
                    style={folderStateStyle(active)}
                    className={cx(
                      "relative flex items-center gap-2 rounded-t-md px-4",
                      "transition-transform duration-200 ease-[cubic-bezier(0.2,0,0,1)]",
                      active
                        ? "h-[2.875rem]"
                        : "h-[2.375rem] group-hover:-translate-y-[3px]",
                    )}
                  >
                    {active && (
                      <>
                        <TabShoulder side="left" />
                        <TabShoulder side="right" />
                      </>
                    )}
                    <Icon
                      name={item.icon}
                      size={16}
                      className={cx(
                        "shrink-0",
                        active ? "opacity-70" : "opacity-80",
                      )}
                    />
                    <span className="type-ui text-ui-sm whitespace-nowrap">
                      {item.label}
                    </span>
                    {typeof item.count === "number" && item.count > 0 && (
                      <span
                        className={cx(
                          "type-meta rounded-xs px-1.5 py-0.5 tabular-nums",
                          "bg-sunken/70 text-primary",
                        )}
                      >
                        {item.count}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {trailing && (
        <div className="flex shrink-0 items-center gap-2 self-center pb-1.5 pl-2">
          {trailing}
        </div>
      )}
    </div>
  );
}

/**
 * Doca inferior do mobile. O mesmo princípio de pasta, espelhado: a aba
 * ativa desce 8px além das demais e ganha cantos inferiores, encaixando
 * na folha que está acima do trilho.
 *
 * Máximo de 3–4 destinos (§09). Alvo de toque 44×44 garantido pela altura
 * de 56px do trilho mais o padding das abas.
 */
export function FolderDock({
  items,
  activeHref,
  linkComponent: Link = DefaultLink,
  label = "Seções",
  className,
}: Omit<FolderNavProps, "leading" | "trailing">) {
  const rootRef = useRef<HTMLElement>(null);
  useFolderActivation(rootRef, activeHref, "down");

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
        ref={rootRef}
        aria-label={label}
        className={cx(
          // No mobile a mudança de superfície já separa conteúdo e trilho;
          // uma hairline atravessando as abas quebraria a leitura de pasta.
          "fixed inset-x-0 bottom-0 z-30 bg-rail sm:hidden",
          // Respeita a área segura do iPhone sem inflar a altura em telas sem ela.
          "pb-[env(safe-area-inset-bottom)]",
          className,
        )}
      >
        <ul className="flex items-start">
          {items.slice(0, 4).map((item) => {
            const active = item.href === activeHref;

            return (
              <li key={item.href} className="min-w-0 flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  style={{
                    ...folderVariables(item),
                    ...folderStateStyle(active),
                  }}
                  className={cx(
                    "relative flex flex-col items-center justify-center gap-1 px-1",
                    "transition-transform duration-200 ease-[cubic-bezier(0.2,0,0,1)]",
                    active
                      ? // A folha vem de cima e continua dentro da aba. O
                        // pixel negativo cobre a hairline somente no trecho
                        // ativo; os ombros fazem a transição para o trilho.
                        "z-10 -mt-px h-[calc(4rem+1px)] rounded-b-xl"
                      : "h-14 rounded-b-xl hover:translate-y-[3px]",
                  )}
                >
                  {active && (
                    <>
                      <DockShoulder side="left" />
                      <DockShoulder side="right" />
                    </>
                  )}
                  <Icon
                    name={item.icon}
                    size={20}
                    className={active ? "opacity-70" : "opacity-80"}
                  />
                  <span className="type-ui w-full truncate text-center text-meta-lg leading-none">
                    {item.label}
                  </span>
                  {typeof item.count === "number" && item.count > 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute top-1.5 right-[22%] size-1.5 rounded-full bg-accent-clay"
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
 * local" e proíbe duplicar a mesma linguagem nas duas.
 */
export function LocalNav({
  items,
  activeHref,
  linkComponent: Link = DefaultLink,
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
