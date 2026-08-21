import type { ReactNode } from "react";
import { cx } from "../lib/cx";

export type Tone =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "info";

const TONES: Record<Tone, string> = {
  neutral: "bg-subtle text-strong",
  brand: "bg-brand-surface text-brand",
  success: "bg-success-surface text-success",
  warning: "bg-warning-surface text-warning",
  danger: "bg-danger-surface text-danger",
  info: "bg-info-surface text-info",
};

/**
 * design.md §1 — estado nunca pode depender apenas de cor.
 * Por isso todo badge carrega cor + rótulo textual + forma (o ponto).
 */
export function Badge({
  tone = "neutral",
  children,
  className,
  dot = true,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-sm px-2 py-1",
        "font-utility text-caption font-bold uppercase tracking-[0.08em]",
        TONES[tone],
        className,
      )}
    >
      {dot && (
        <span
          aria-hidden="true"
          className="size-1.5 shrink-0 rounded-full bg-current"
        />
      )}
      {children}
    </span>
  );
}

/** Pílula de status com texto obrigatório — mesma regra do Badge. */
export function StatusPill({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Badge tone={tone} className={cx("rounded-full px-3", className)}>
      {children}
    </Badge>
  );
}
