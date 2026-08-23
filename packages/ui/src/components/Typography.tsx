import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cx } from "../lib/cx";

/* Compatibilidade V1. O V2 tem lugares próprios para cada uma destas
   funções — <SectionIndex /> abre seção, <MetaStrip /> alinha metadata,
   <Masthead /> abre tela. Estes três seguem exportados porque telas ainda
   não migradas dependem deles; código novo deve usar os componentes
   editoriais. */

/** Eyebrow mono em caixa alta. Nomeia a seção. */
export function Overline({
  children,
  className,
  as: Tag = "p",
  ...rest
}: HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  return (
    <Tag {...rest} className={cx("type-eyebrow text-accent", className)}>
      {children}
    </Tag>
  );
}

/** IBM Plex Mono. Data, hora, id técnico, período — nunca leitura longa. */
export function Metadata({
  children,
  className,
  as: Tag = "p",
  ...rest
}: HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  return (
    <Tag {...rest} className={cx("type-meta text-tertiary", className)}>
      {children}
    </Tag>
  );
}

/** Título editorial em Newsreader. O tamanho vem do token. */
export function PageTitle({
  children,
  className,
  as: Tag = "h1",
  ...rest
}: HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  return (
    <Tag
      {...rest}
      className={cx(
        "font-editorial text-h1-editorial text-balance text-primary",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** Corpo de leitura. Medida de 68ch já vem do reset em <p>. */
export function Prose({
  children,
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      {...rest}
      className={cx(
        "flex flex-col gap-4 text-body text-primary",
        className,
      )}
    >
      {children}
    </div>
  );
}
