import type { ReactNode } from "react";
import { cx } from "../lib/cx";
import type { Tone } from "./Badge";

const TONES: Record<Tone, string> = {
  neutral: "bg-sunken text-primary",
  brand: "bg-panel-lavender text-primary",
  success: "bg-success-surface text-success",
  warning: "bg-warning-surface text-warning",
  danger: "bg-destructive-surface text-destructive",
  info: "bg-info-surface text-info",
};

const ROLE_BY_TONE: Partial<Record<Tone, "alert" | "status">> = {
  danger: "alert",
  warning: "status",
  success: "status",
};

/**
 * Mensagem persistente na página — o InlineNotice do §13.
 *
 * Conteúdo crítico não pode existir apenas em toast: erro de formulário,
 * falha de envio e aviso de consentimento vêm para cá, onde permanecem.
 *
 * Microcopy segue §25: "Não conseguimos carregar este período. Tente
 * novamente." Nunca "Oops! Algo deu errado."
 */
export function Alert({
  tone = "info",
  title,
  children,
  action,
  className,
}: {
  tone?: Tone;
  title?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={ROLE_BY_TONE[tone]}
      className={cx(
        "flex flex-col gap-2 rounded-sm border-l-2 py-4 pr-5 pl-4",
        TONES[tone],
        className,
      )}
    >
      {title && (
        <p className="type-eyebrow max-w-none">{title}</p>
      )}
      <div className="text-body max-w-none">{children}</div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
