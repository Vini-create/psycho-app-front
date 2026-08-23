"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { cx } from "../../lib/cx";
import { TextureLayer } from "../TextureLayer";

/* Brand Book V2 §09 e §14 — a moldura da aplicação é parte da marca.

   O produto não é uma página que rola dentro do navegador: é uma folha
   dentro de uma moldura contínua, com borda fina e cantos arredondados.
   No mobile a moldura encosta nas bordas e perde o raio, porque ali a
   tela inteira já é a folha. */

export interface AppFrameProps {
  children: ReactNode;
  /** Cor da pasta aberta. Afeta somente a aba ativa e sua folha interna. */
  tone?: "dark" | "sage" | "lavender" | "clay";
  /** Identidade da página; reinicia a coreografia quando a rota muda. */
  motionKey?: string;
  /** Trilho de navegação principal, renderizado colado ao topo da moldura. */
  rail?: ReactNode;
  /** Doca inferior do mobile, integrada à borda de baixo. */
  dock?: ReactNode;
  /**
   * Barra de marca do mobile. O trilho de abas some abaixo de `sm`, e com
   * ele iria o logotipo: sem esta faixa o produto ficaria sem assinatura
   * justamente na tela onde o paciente passa mais tempo.
   */
  mobileBar?: ReactNode;
  /** Largura máxima da folha. Padrão: 1480px do brandbook §07. */
  width?: "frame" | "reading" | "full";
  /**
   * Trava a moldura na altura exata da viewport e faz o conteúdo rolar por
   * dentro dela. Necessário para telas com rodapé fixo — o chat — em que a
   * folha não pode crescer para além da tela. §14: "conteúdo interno ou
   * documento; evitar scroll duplo".
   */
  fill?: boolean;
  className?: string;
  contentClassName?: string;
}

const WIDTH: Record<NonNullable<AppFrameProps["width"]>, string> = {
  frame: "max-w-(--container-frame)",
  reading: "max-w-(--container-reading)",
  full: "max-w-none",
};

export function AppFrame({
  children,
  tone = "dark",
  motionKey,
  rail,
  dock,
  mobileBar,
  width = "frame",
  fill = false,
  className,
  contentClassName,
}: AppFrameProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    const content = contentRef.current;
    if (!sheet || !content) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      gsap.set([content, ...sheet.querySelectorAll(".reveal")], {
        clearProps: "all",
      });
      return;
    }

    const context = gsap.context(() => {
      const mobile = window.matchMedia("(max-width: 639px)").matches;
      const reveals = Array.from(
        sheet.querySelectorAll<HTMLElement>(".reveal"),
      );
      const listItems = Array.from(
        sheet.querySelectorAll<HTMLElement>("[data-motion-list] > *"),
      );
      const timeline = gsap.timeline({
        defaults: { ease: "power3.out" },
      });

      timeline.fromTo(
        content,
        {
          autoAlpha: 0.94,
          y: mobile ? -4 : 5,
        },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.28,
          clearProps: "opacity,visibility,transform",
        },
        0,
      );

      if (reveals.length > 0) {
        timeline.fromTo(
          reveals,
          { autoAlpha: 0, y: 8 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.36,
            stagger: 0.055,
            clearProps: "opacity,visibility,transform",
          },
          0.07,
        );
      }

      if (listItems.length > 0) {
        timeline.fromTo(
          listItems,
          { autoAlpha: 0, y: 5 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.28,
            stagger: {
              amount: Math.min(0.22, listItems.length * 0.025),
              from: "start",
            },
            clearProps: "opacity,visibility,transform",
          },
          0.12,
        );
      }
    }, sheet);

    return () => context.revert();
  }, [motionKey, tone]);

  return (
    <div
      className={cx(
        // A mesa sobre a qual a pasta está apoiada — fica FORA da moldura.
        "bg-ambient",
        fill ? "h-dvh overflow-hidden" : "min-h-dvh",
        // Padding externo: 0 no mobile, 20–28px no desktop (§14).
        "p-0 sm:p-5 lg:p-6",
        className,
      )}
    >
      <div
        className={cx(
          "relative mx-auto flex flex-col",
          fill
            ? "h-full overflow-hidden"
            : "min-h-dvh sm:min-h-[calc(100dvh-2.5rem)] lg:min-h-[calc(100dvh-3rem)]",
          // A moldura: hairline + raio. Sem sombra — borda antes de sombra (§12).
          "border-hairline bg-page sm:rounded-xl sm:border",
          WIDTH[width],
        )}
      >
        {rail}
        <div
          ref={sheetRef}
          data-folder-tone={tone}
          className={cx(
            // A cor pertence à pasta aberta: começa exatamente sob o trilho
            // e envolve barra mobile + conteúdo, sem tingir o nav inteiro.
            "relative isolate flex min-h-0 flex-1 flex-col bg-page text-primary sm:rounded-b-xl",
            fill && "overflow-hidden",
          )}
        >
          {/* O granulado acompanha somente a folha colorida. */}
          <TextureLayer className="sm:rounded-b-xl" />

          {mobileBar}

          <div
            ref={contentRef}
            className={cx(
              "relative isolate flex min-h-0 flex-1 flex-col",
              fill && "overflow-hidden",
              contentClassName,
            )}
          >
            {children}
          </div>
        </div>

        {dock}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Grade editorial de 12 colunas — §07.

   Não é um wrapper genérico: só existe para que as divisões preferenciais
   do brandbook (8/4, 9/3, 7/5) tenham um lugar nomeado, em vez de aparecerem
   como `lg:grid-cols-[2fr_1fr]` improvisado em cada tela.
   -------------------------------------------------------------------------- */

export function EditorialGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        // 4 colunas no mobile, 8 no tablet, 12 no desktop (§07).
        "grid grid-cols-4 gap-x-4 gap-y-8 sm:grid-cols-8 sm:gap-x-5 lg:grid-cols-12 lg:gap-x-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Margens da folha: 18–22px mobile, 28–36 tablet, 48–64 desktop (§07). */
export function FrameGutter({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "header" | "main" | "footer" | "nav";
}) {
  return (
    <Tag className={cx("px-5 sm:px-8 lg:px-12 xl:px-16", className)}>
      {children}
    </Tag>
  );
}
