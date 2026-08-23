import type { ReactNode } from "react";
import { buttonStyles } from "../Button";
import { AppFrame, type AppFrameProps } from "./AppFrame";
import type { NavLinkComponent } from "./FolderNav";

const DefaultLink: NavLinkComponent = ({ href, children, ...props }) => (
  <a href={href} {...props}>
    {children}
  </a>
);

export interface MissingPageProps {
  brand: ReactNode;
  contextLabel: string;
  homeHref?: string;
  homeLabel: string;
  tone?: NonNullable<AppFrameProps["tone"]>;
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
  linkComponent: Link = DefaultLink,
}: MissingPageProps) {
  return (
    <AppFrame
      tone={tone}
      motionKey="not-found"
      rail={
        <header className="flex min-h-13 items-center justify-between gap-4 bg-rail px-5 text-primary sm:rounded-t-xl sm:px-8">
          <Link
            href={homeHref}
            className="touch-target inline-flex items-center rounded-xs"
          >
            {brand}
          </Link>
          <span className="type-meta text-tertiary">ERRO / 404</span>
        </header>
      }
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
    </AppFrame>
  );
}
