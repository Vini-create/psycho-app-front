"use client";

import { useRef, type ReactNode } from "react";
import { buttonStyles } from "../Button";
import { FolderSheet, useFolderWidth, type FolderTone } from "./FolderSheet";
import { DefaultNavLink, type NavLinkComponent } from "./nav-link";

export interface MissingPageProps {
  brand: ReactNode;
  contextLabel: string;
  homeHref?: string;
  homeLabel: string;
  tone?: FolderTone;
  linkComponent?: NavLinkComponent;
}

/**
 * 404 editorial — uma folha fora do índice, não uma tela de erro genérica.
 *
 * É deliberadamente independente de sessão: links quebrados continuam
 * legíveis antes de qualquer gate de autenticação decidir para onde seguir.
 */
export function MissingPage({
  brand,
  contextLabel,
  homeHref = "/",
  homeLabel,
  tone = "lavender",
  linkComponent: Link = DefaultNavLink,
}: MissingPageProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const width = useFolderWidth(sheetRef);

  return (
    /* Uma folha solta sobre a bancada, fora da pilha — que é exatamente o
       que um 404 é neste produto: uma página que não pertence a pasta
       nenhuma. Por isso aqui não há abas nem navegação principal. */
    <div className="flex min-h-dvh flex-col bg-ambient">
      <header className="mx-auto flex w-full max-w-(--container-workspace) shrink-0 items-center justify-between gap-4 px-5 py-4 text-primary sm:px-[max(1.25rem,6vw)] sm:pt-5 sm:pb-4">
        <Link
          href={homeHref}
          className="touch-target inline-flex items-center rounded-xs"
        >
          {brand}
        </Link>
        <span className="type-meta text-tertiary">ERRO / 404</span>
      </header>

      <div className="flex flex-1 flex-col px-0 pb-0 sm:px-[max(1.25rem,6vw)] sm:pb-[max(1.25rem,2.5vh)]">
        <div
          ref={sheetRef}
          className="mx-auto grid w-full max-w-(--container-workspace) flex-1"
        >
          <FolderSheet
            id="not-found"
            href={homeHref}
            label={homeLabel}
            tone={tone}
            active
            depth={0}
            zIndex={10}
            geometry={{ tabX: 0, tabWidth: 0, tabHeight: 0 }}
            width={width}
            linkComponent={Link}
          >
      <main
        aria-labelledby="missing-page-title"
        className="relative isolate flex min-h-[calc(100dvh-3.25rem)] flex-1 overflow-hidden px-5 py-12 sm:min-h-[calc(100dvh-8rem)] sm:px-8 sm:py-16 lg:px-12 lg:py-20 xl:px-16"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-[0.08em] -bottom-[0.12em] -z-10 font-display text-[clamp(13rem,35vw,34rem)] leading-[0.72] font-black tracking-[-0.08em] text-primary opacity-[0.07]"
        >
          404
        </span>

        <div className="grid w-full flex-1 grid-cols-4 gap-x-4 gap-y-14 sm:grid-cols-8 sm:gap-x-5 lg:grid-cols-12 lg:gap-x-6">
          <section className="reveal col-span-4 flex max-w-[42rem] flex-col items-start justify-center gap-7 sm:col-span-7 lg:col-span-7">
            <div className="flex flex-col gap-4">
              <p className="type-eyebrow text-tertiary">
                {contextLabel} / PÁGINA NÃO ENCONTRADA
              </p>
              <h1
                id="missing-page-title"
                className="max-w-[13ch] font-editorial text-h1-editorial text-balance text-primary"
              >
                Esta página não está nesta pasta.
              </h1>
              <p className="measure max-w-[48ch] font-editorial text-body-l text-secondary">
                O endereço pode ter mudado, ou esta folha nunca chegou a
                fazer parte do caderno.
              </p>
            </div>

            <Link
              href={homeHref}
              className={buttonStyles({ size: "lg" })}
            >
              {homeLabel}
            </Link>
          </section>

          <aside className="reveal reveal-1 col-span-4 flex items-end sm:col-span-6 lg:col-span-4 lg:col-start-9">
            <div className="flex max-w-[24rem] flex-col gap-3 border-l-2 border-primary/35 pl-5">
              <span className="type-meta text-tertiary">NOTA DE MARGEM</span>
              <p className="font-editorial text-body-l italic text-secondary">
                Voltar ao índice costuma ser o melhor lugar para retomar.
              </p>
            </div>
          </aside>
        </div>
            </main>
          </FolderSheet>
        </div>
      </div>
    </div>
  );
}
