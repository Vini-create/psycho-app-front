import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "../lib/cx";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-action text-on-action hover:bg-action-hover active:bg-action-pressed",
  secondary:
    "bg-subtle text-primary hover:bg-brand-surface active:bg-brand-surface",
  tertiary:
    "bg-transparent text-brand hover:bg-brand-surface active:bg-brand-surface",
  // Vermelho é exclusivo de risco explícito e ação destrutiva (design.md §1).
  // Par fg/bg semântico funciona nos dois temas; texto claro sobre sólido não.
  danger:
    "bg-danger-surface text-danger hover:brightness-95 active:brightness-90 dark:hover:brightness-110",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-label-md gap-2",
  md: "h-11 px-4 text-label-md gap-2",
  lg: "h-13 px-5 text-base gap-2.5",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
} = {}): string {
  return cx(
    "inline-flex items-center justify-center rounded-md font-utility font-bold",
    "transition-[background-color,color,filter] duration-140 ease-sinapsa",
    "disabled:cursor-not-allowed disabled:opacity-55",
    VARIANTS[variant],
    SIZES[size],
    fullWidth && "w-full",
    className,
  );
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  /** Mantém a largura do botão enquanto carrega (design.md §8). */
  loading?: boolean;
  loadingLabel?: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
};

/**
 * Regra de conteúdo: o label começa com verbo — "Enviar", "Aprovar", "Convidar".
 * `disabled` não substitui explicação: quem desabilita precisa dizer por quê
 * em texto próximo, não só apagar o botão.
 */
export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  loading = false,
  loadingLabel = "Carregando",
  startIcon,
  endIcon,
  disabled,
  children,
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonStyles({ variant, size, fullWidth, className })}
    >
      {/* Grid de célula única: o label continua ocupando espaço enquanto
          carrega, então a largura do botão não pula. */}
      <span className="grid grid-cols-1 grid-rows-1 place-items-center">
        <span
          className={cx(
            "col-start-1 row-start-1 inline-flex items-center gap-2",
            loading && "invisible",
          )}
        >
          {startIcon}
          {children}
          {endIcon}
        </span>
        {loading && (
          <Spinner className="col-start-1 row-start-1" label={loadingLabel} />
        )}
      </span>
    </button>
  );
}
