"use client";

import { useRef, type ReactNode } from "react";
import { cx } from "../../lib/cx";
import { useGSAP } from "../../motion/gsap";
import { resolveMotionVariant } from "../../motion/media";
import { workspaceIntroTimeline } from "../../motion/stack-motion";
import { FolderStack, type FolderDefinition } from "./FolderStack";
import { DefaultNavLink, type NavLinkComponent } from "./nav-link";
import type { FolderTone } from "./FolderSheet";

/* A mesa de trabalho — Brand Book V2 §09 e §14.

   O produto não é uma página com uma navbar em cima. É uma bancada escura
   com uma pilha de pastas apoiada nela: a assinatura da marca fica na
   margem superior, e o resto da tela pertence ao objeto. A área negativa ao
   redor não é sobra de layout — é o que faz a pilha ler como coisa pousada
   em algum lugar, e não como janela ocupando tudo.

   O workspace monta uma vez, no layout persistente de cada app, e não
   desmonta em nenhuma troca de rota. É isso que permite a pasta mudar de
   posição enquanto o conteúdo troca por dentro, em vez de uma página inteira
   sumir e outra aparecer. */

export type { FolderTone };
export type { FolderDefinition };

export interface AppFrameProps {
  children: ReactNode;
  /** As pastas físicas da aplicação. Uma por rota, e nada além disso. */
  folders: readonly FolderDefinition[];
  /** Pasta aberta, derivada do pathname pela app. A URL é a fonte da verdade. */
  activeId: string;
  linkComponent?: NavLinkComponent;
  /** Assinatura no canto superior esquerdo da bancada. */
  brand?: ReactNode;
  /** Conta / preferências, no canto superior direito. */
  account?: ReactNode;
  /** Doca inferior do mobile, onde a pilha não cabe. */
  dock?: ReactNode;
  navLabel?: string;
  /** Identidade da rota dentro da pasta. Reinicia só a entrada do conteúdo. */
  motionKey?: string;
  /**
   * Trava a bancada na altura da viewport e faz o conteúdo rolar por dentro
   * da folha. Necessário para telas com rodapé fixo — o chat — em que a
   * folha não pode crescer para além da tela (§14).
   */
  fill?: boolean;
  className?: string;
  contentClassName?: string;
}

export function AppFrame({
  children,
  folders,
  activeId,
  linkComponent = DefaultNavLink,
  brand,
  account,
  dock,
  navLabel,
  motionKey,
  fill = false,
  className,
  contentClassName,
}: AppFrameProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  /* Entrada única do workspace. Não se repete a cada rota — quem repete é a
     coreografia da pilha. */
  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      workspaceIntroTimeline({ root, variant: resolveMotionVariant() });
    },
    { scope: rootRef },
  );

  return (
    <div
      className={cx(
        // A bancada. Quase preta no dark, papel no light — em ambos, o
        // degrau de tom que separa a pilha do fundo.
        "bg-ambient",
        fill ? "h-dvh overflow-hidden" : "min-h-dvh",
        "flex flex-col",
        className,
      )}
    >
      <div
        ref={rootRef}
        className={cx(
          "flex w-full flex-1 flex-col",
          fill && "min-h-0 overflow-hidden",
          // Área negativa ao redor da pilha: a folha nunca encosta na
          // lateral do monitor. No mobile a folha é a tela inteira.
          "px-0 sm:px-[max(1.25rem,6vw)]",
        )}
      >
        {(brand || account) && (
          /* A assinatura mora no canto da bancada, não alinhada à pilha.
             Alinhada à folha ela virava só mais um item da composição; no
             canto ela é o que assina a mesa inteira — e as margens negativas
             que a pilha precisa não têm por que empurrá-la para dentro.

             Só no desktop, porém. Ver `mobileHeader` abaixo. */
          <header
            className={cx(
              "hidden w-full shrink-0 items-center justify-between gap-4",
              "sm:-mx-[max(1.25rem,6vw)] sm:flex sm:w-auto sm:px-6 sm:pt-4 sm:pb-5",
            )}
          >
            <div className="flex min-w-0 items-center gap-3">{brand}</div>
            <div className="flex min-w-0 items-center gap-2">{account}</div>
          </header>
        )}

        <FolderStack
          folders={folders}
          activeId={activeId}
          linkComponent={linkComponent}
          navLabel={navLabel}
          motionKey={motionKey}
          fill={fill}
          /* No mobile não existe bancada visível: a folha é a tela inteira,
             e uma faixa da cor do ambiente no topo lê como um header preto
             cortado por cima da pasta, não como a mesa em volta dela. Então
             a assinatura entra DENTRO da folha, onde herda a cor e a tinta
             daquela pasta — é papel impresso, não barra.

             Em `fill` ela não entra: são telas travadas na altura da
             viewport, com barra local própria (a lista de conversas do
             chat), e duas faixas empilhadas comeriam o pouco espaço que
             sobra. */
          mobileHeader={
            fill || !(brand || account) ? undefined : (
              <>
                <div className="flex min-w-0 items-center gap-3">{brand}</div>
                <div className="flex min-w-0 items-center gap-2">{account}</div>
              </>
            )
          }
          className={cx(
            "mx-auto max-w-(--container-workspace) flex-1",
            !fill && "pb-0 sm:pb-[max(1.25rem,2.5vh)]",
            contentClassName,
          )}
        >
          {children}
        </FolderStack>
      </div>

      {dock}
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
