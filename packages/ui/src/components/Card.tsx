import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cx } from "../lib/cx";

export type CardVariant =
  | "compact"
  | "standard"
  | "editorial"
  | "interactive"
  | "inverse";

/* Brand Book V2 §13 — cada variação existe porque muda a intenção, não a aparência. */
const VARIANTS: Record<CardVariant, string> = {
  compact: "min-h-24 gap-2 rounded-lg p-4 bg-raised",
  standard: "min-h-36 gap-3 rounded-lg p-6 bg-raised",
  editorial:
    "gap-4 rounded-[2rem_2rem_2rem_0.5rem] p-8 bg-panel-lavender",
  interactive:
    "min-h-32 gap-3 rounded-lg bg-raised px-5 py-6 " +
    "transition-[background-color,transform] duration-140 ease-sinapsa " +
    "hover:bg-panel-lavender focus-within:bg-panel-lavender",
  // Uso restrito: um bloco de contraste, nunca uma grade inteira.
  // Redefinir os tokens localmente faz todo descendente acompanhar a
  // inversão — sem isso, `text-primary` de um CardBody sumiria no fundo.
  inverse:
    "min-h-36 gap-3 rounded-[2rem_2rem_0.5rem_2rem] p-6 bg-inverse text-on-inverse " +
    "[--text-primary:var(--text-on-inverse)] " +
    "[--text-secondary:var(--text-on-inverse-muted)] " +
    "[--text-brand:var(--text-on-inverse)] " +
    "[--border-subtle:var(--text-on-inverse-muted)] " +
    "[--chart-1:var(--purple-soft)] [--chart-2:var(--purple-primary)] " +
    "[--chart-3:var(--purple-strong)] [--chart-4:var(--purple-dark)] " +
    "[--chart-track:var(--paper-200)]",
};

export type CardProps = HTMLAttributes<HTMLElement> & {
  variant?: CardVariant;
  /** `li` quando o card estiver dentro de uma lista — semântica importa. */
  as?: ElementType;
};

/**
 * Ordem de conteúdo esperada: overline → título → corpo → metadado → ação.
 * Sombra não é padrão aqui; ela pertence só a superfície flutuante
 * (Modal, Drawer, Menu).
 */
export function Card({
  variant = "standard",
  as: Tag = "div",
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <Tag
      {...rest}
      className={cx(
        "flex flex-col",
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function CardOverline({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cx("type-eyebrow max-w-none text-accent", className)}>{children}</p>
  );
}

export function CardTitle({
  children,
  className,
  as: Tag = "h3",
}: {
  children: ReactNode;
  className?: string;
  as?: "h2" | "h3" | "h4";
}) {
  // STIX 24–28px, peso 500–600.
  return (
    <Tag
      className={cx(
        "font-editorial text-h3 font-semibold text-balance",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function CardBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("text-body", className)}>{children}</div>
  );
}

export function CardMeta({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cx("metadata max-w-none text-secondary", className)}>
      {children}
    </p>
  );
}

export function CardActions({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("mt-auto flex flex-wrap items-center gap-3 pt-2", className)}>
      {children}
    </div>
  );
}
