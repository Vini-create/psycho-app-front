import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "../lib/cx";
import { Spinner } from "./Spinner";
import { Icon, type IconName } from "../icons";

/* Brand Book V2 §15 — "Controles devem parecer ferramentas editoriais, não
   componentes de template."

   Primary é fill Ink, não roxo. Isso é deliberado: no V2 a cor pertence ao
   conteúdo (pastéis classificam natureza de informação), e a ação se
   distingue por contraste tipográfico e peso. Um botão colorido em cada
   bloco devolveria o produto ao "dashboard genérico com CTA roxo".

   Uma ação principal por zona (§15). */

export type ButtonVariant =
  | "primary"
  | "secondary"
  /** TextAction: sem container. "abrir", "editar", "ver fontes". */
  | "text"
  /** Destrutivo contido: Wine em texto e borda. O padrão para risco. */
  | "danger"
  /** Destrutivo sólido: só na confirmação final, dentro do diálogo. */
  | "danger-solid";

export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "border border-transparent bg-action text-on-action hover:bg-action-hover active:bg-action-pressed",
  secondary:
    "border border-border-strong bg-transparent text-primary hover:border-primary hover:bg-sunken/60",
  text:
    "border border-transparent bg-transparent px-0 text-accent hover:text-primary",
  danger:
    "border border-destructive/45 bg-transparent text-destructive hover:bg-destructive-surface",
  "danger-solid":
    "border border-transparent bg-destructive text-on-action hover:brightness-110",
};

const SIZES: Record<ButtonSize, string> = {
  // control.sm / control.md / control.lg — §32.
  // `touch-target` resolve a tensão entre os dois números do brandbook: o
  // §32 pede controle pequeno de 36px, o §29 exige alvo de 44. O pseudo
  // elemento estende só a área clicável, sem inflar o desenho.
  sm: "h-9 gap-2 px-3 text-ui-sm touch-target",
  md: "h-11 gap-2 px-4 text-ui",
  lg: "h-13 gap-2.5 px-6 text-body",
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
    // radius.sm — 8px. Botão não é pill: §12, "arredondamento não é identidade".
    "inline-flex items-center justify-center rounded-sm font-ui font-semibold",
    "transition-[background-color,color,border-color,filter] duration-140 ease-sinapsa",
    "disabled:cursor-not-allowed disabled:opacity-50",
    SIZES[size],
    VARIANTS[variant],
    // TextAction dispensa altura de caixa, mas mantém alvo de toque de 44px.
    variant === "text" && "h-auto min-h-11 px-0",
    fullWidth && "w-full",
    className,
  );
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  /** Mantém a largura do botão enquanto carrega. */
  loading?: boolean;
  loadingLabel?: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
};

/**
 * Regra de conteúdo: o label começa com verbo — "Enviar", "Guardar para a
 * sessão", "Convidar". `disabled` não substitui explicação: quem desabilita
 * precisa dizer por quê em texto próximo, não só apagar o botão.
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

/**
 * IconButton — §15. Quadrado de 44px, borda discreta.
 *
 * `label` é obrigatório e não decorativo: o ícone sozinho nunca carrega o
 * significado (§29). Vira `aria-label` e `title`.
 */
export function IconButton({
  icon,
  label,
  size = "md",
  variant = "quiet",
  className,
  type = "button",
  ...rest
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  icon: IconName;
  label: string;
  size?: "sm" | "md";
  variant?: "quiet" | "bordered";
}) {
  return (
    <button
      {...rest}
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        "inline-grid shrink-0 place-items-center rounded-sm transition-colors duration-140 ease-sinapsa",
        "text-secondary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50",
        size === "md" ? "size-11" : "size-9 touch-target",
        variant === "bordered"
          ? "border border-hairline bg-raised hover:border-border-strong"
          : "hover:bg-sunken",
        className,
      )}
    >
      <Icon name={icon} size={size === "md" ? 20 : 16} />
    </button>
  );
}
