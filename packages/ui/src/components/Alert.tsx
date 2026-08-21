import type { ReactNode } from "react";
import { cx } from "../lib/cx";
import type { Tone } from "./Badge";

const TONES: Record<Tone, string> = {
  neutral: "bg-subtle text-primary",
  brand: "bg-brand-surface text-primary",
  success: "bg-success-surface text-success",
  warning: "bg-warning-surface text-warning",
  danger: "bg-danger-surface text-danger",
  info: "bg-info-surface text-info",
};

const ROLE_BY_TONE: Partial<Record<Tone, "alert" | "status">> = {
  danger: "alert",
  warning: "status",
  success: "status",
};

/**
 * Mensagem persistente na página.
 *
 * design.md §10 — conteúdo crítico não pode existir apenas em toast.
 * Erro de formulário, falha de envio e aviso de consentimento vêm para cá.
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
        "flex flex-col gap-2 rounded-md p-4",
        TONES[tone],
        className,
      )}
    >
      {title && (
        <p className="type-overline max-w-none">{title}</p>
      )}
      <div className="text-body-md max-w-none">{children}</div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
