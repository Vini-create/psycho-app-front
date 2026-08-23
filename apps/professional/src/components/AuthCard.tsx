import type { ReactNode } from "react";
import { MetaStrip, TextureLayer } from "@sinapsa/ui";
import { Logo } from "./Logo";

/* Brand Book V2 §08 e §15.

   Onboarding é uma das poucas telas onde o §08 autoriza composição
   centrada. Mesmo assim, "centrado" aqui não quer dizer "um card de 480px
   boiando no meio de uma tela de 1600" — que é o exemplo negativo literal
   do brandbook.

   A solução: a coluna do formulário fica ancorada à esquerda de uma grade
   de 12, e a tese do produto ocupa as colunas restantes no desktop. Em
   telas menores a tese sai e sobra o fluxo linear, que é o que importa
   para quem está entrando.

   O formulário não passa de 720px (§07) e a textura nunca fica sob os
   campos — ela é fundo da folha inteira. */

export function AuthCard({
  overline,
  title,
  description,
  children,
  footer,
}: {
  overline?: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative min-h-dvh bg-page px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
      <TextureLayer />

      <div className="relative mx-auto flex w-full max-w-(--container-frame) flex-col gap-12 lg:gap-16">
        <Logo className="text-[1.6rem]" />

        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Coluna do fluxo — 7 de 12. Assimetria em vez de centro. */}
          <div className="flex w-full max-w-(--container-form) flex-col gap-8 lg:col-span-7">
            <div className="flex flex-col gap-3">
              {overline && (
                <p className="type-eyebrow text-tertiary">{overline}</p>
              )}
              <h1 className="font-editorial text-h1-editorial text-balance text-primary">
                {title}
              </h1>
              {description && (
                <div className="measure text-body-l text-secondary">
                  {description}
                </div>
              )}
            </div>

            {children}

            {footer && (
              <div className="border-t border-hairline pt-6 text-body text-secondary">
                {footer}
              </div>
            )}
          </div>

          {/* A tese do produto. Silenciosa, e só onde há espaço para ela. */}
          <aside className="hidden lg:col-span-4 lg:col-start-9 lg:flex lg:flex-col lg:gap-6 lg:border-l lg:border-hairline lg:pl-8">
            <p className="type-eyebrow text-tertiary">O que é a Sinapsa</p>
            <p className="measure-narrow font-editorial text-body-l text-primary">
              Contexto contínuo entre uma sessão e outra, organizado a partir
              do que a própria pessoa relatou. O sistema descreve; a leitura
              clínica continua sendo sua.
            </p>
            <MetaStrip
              className="flex-col items-start gap-1"
              items={[
                "sem acesso ao histórico bruto",
                "só com consentimento vigente",
                "sem diagnóstico",
              ]}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
