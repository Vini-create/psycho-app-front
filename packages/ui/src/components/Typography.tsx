import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cx } from "../lib/cx";

/** Archivo Narrow 700, caixa alta, tracking 0.10em. Nomeia a seção. */
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
    <Tag {...rest} className={cx("type-overline text-brand", className)}>
      {children}
    </Tag>
  );
}

/** Source Code Pro 500. Data, hora, id técnico, medida — nunca leitura longa. */
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
    <Tag {...rest} className={cx("metadata text-secondary", className)}>
      {children}
    </Tag>
  );
}

/** Título editorial em STIX. O tamanho vem do token, não de classe solta. */
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
        "font-editorial text-display-md font-normal tracking-[-0.025em] text-primary text-balance",
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
        "flex flex-col gap-4 font-editorial text-body-md text-primary",
        className,
      )}
    >
      {children}
    </div>
  );
}
