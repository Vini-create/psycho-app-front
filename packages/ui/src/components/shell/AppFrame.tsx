"use client";

import { type ReactNode } from "react";
import { cx } from "../../lib/cx";
import { TextureLayer } from "../TextureLayer";
import {
  FolderMotionProvider,
  useFolderMotionRefs,
} from "../../motion/FolderMotion";

/* Brand Book V2 §09 e §14 — a moldura da aplicação é parte da marca.

   O produto não é uma página que rola dentro do navegador: é uma folha
   dentro de uma moldura contínua, com borda fina e cantos arredondados.
   No mobile a moldura encosta nas bordas e perde o raio, porque ali a
   tela inteira já é a folha.

   A moldura é montada uma vez, no layout persistente de cada app, e não
   desmonta em nenhuma troca de rota. É o que permite que a pasta mude de
   estado enquanto o conteúdo troca por dentro — em vez de uma página inteira
   sumir e outra aparecer. */

export interface AppFrameProps {
  children: ReactNode;
  /** Cor da pasta aberta. Afeta somente a aba ativa e sua folha interna. */
  tone?: "dark" | "sage" | "lavender" | "clay";
  /** Identidade da página; reinicia a entrada de conteúdo quando a rota muda. */
  motionKey?: string;
  /** Pasta aberta, derivada da rota. Dispara a coreografia estrutural. */
  folderId?: string;
  /** Ordem das pastas no trilho — define o sentido do deslocamento. */
  folderOrder?: readonly string[];
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
  folderId,
  folderOrder,
  motionKey,
  ...props
}: AppFrameProps) {
  return (
    <FolderMotionProvider
      activeId={folderId ?? ""}
      order={folderOrder ?? EMPTY_ORDER}
      motionKey={motionKey}
    >
      <AppFrameSurface {...props} />
    </FolderMotionProvider>
  );
}

const EMPTY_ORDER: readonly string[] = [];

type AppFrameSurfaceProps = Omit<
  AppFrameProps,
  "folderId" | "folderOrder" | "motionKey"
>;

/**
 * A moldura em si. Separada do provider porque precisa consumir as refs que
 * ele cria: a moldura para a entrada única do app, o corpo da pasta para a
 * coreografia de troca.
 */
function AppFrameSurface({
  children,
  tone = "dark",
  rail,
  dock,
  mobileBar,
  width = "frame",
  fill = false,
  className,
  contentClassName,
}: AppFrameSurfaceProps) {
  const refs = useFolderMotionRefs();

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
        ref={refs?.frameRef}
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
            ref={refs?.bodyRef}
            // O corpo da pasta. Transparente sobre a folha colorida: é por
            // isso que ele pode escalar e deslocar sem abrir fresta nenhuma
            // — qualquer folga mostra a própria cor da pasta.
            data-folder-body=""
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
