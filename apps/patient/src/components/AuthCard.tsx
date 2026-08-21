import type { ReactNode } from "react";
import { Overline, PageTitle, TextureLayer } from "@sinapsa/ui";
import { Logo } from "./Logo";

/**
 * Moldura das telas de entrada. Formulário no máximo 480px (design.md §6),
 * textura de papel discreta no fundo — nunca sob os campos.
 */
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
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 py-12 sm:px-8 sm:py-16">
      <TextureLayer variant="paper" />

      <div className="relative flex w-full max-w-(--container-form) flex-col gap-8 sm:gap-10">
        <Logo className="text-[1.75rem]" />

        <div className="flex flex-col gap-3">
          {overline && <Overline>{overline}</Overline>}
          <PageTitle>{title}</PageTitle>
          {description && (
            <div className="text-body-md text-secondary">{description}</div>
          )}
        </div>

        {children}

        {footer && (
          <div className="border-t border-border-subtle pt-6 text-body-md text-secondary">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
