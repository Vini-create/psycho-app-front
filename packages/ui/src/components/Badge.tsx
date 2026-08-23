import type { ReactNode } from "react";
import { cx } from "../lib/cx";

/* Brand Book V2 §16 — tags, status e metadata.

   Duas regras que este componente carrega:

   - "Tags descrevem natureza do conteúdo (trabalho, sono, família, marcado
     para sessão), não rotulam estado clínico." Nenhum tom aqui significa
     "melhor" ou "pior" — `positive` é para estado OPERACIONAL (aceito,
     autorizado), nunca para o que a pessoa relatou.
   - "Status operacionais podem ter cor, mas sempre acompanhada de texto."
     O ponto de 6px existe para que a distinção sobreviva em grayscale
     (§34) e para quem não separa matiz (§29).

   Altura 24–28px, radius 4–8, sem sombra — §16. */

export type Tone =
  | "neutral"
  /** Marca/contexto. O tom padrão para natureza de conteúdo. */
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "info";

const TONES: Record<Tone, string> = {
  neutral: "bg-sunken text-secondary",
  brand: "bg-panel-lavender text-on-panel",
  success: "bg-positive-surface text-positive",
  warning: "bg-notice-surface text-notice",
  danger: "bg-destructive-surface text-destructive",
  info: "bg-info-surface text-info",
};

/** Famílias pastel para classificar NATUREZA de conteúdo — §16, §04. */
export type TagFamily =
  | "lavender"
  | "sage"
  | "clay"
  | "apricot"
  | "ochre"
  | "fogblue"
  | "dustrose";

const FAMILIES: Record<TagFamily, string> = {
  lavender: "bg-panel-lavender text-on-panel",
  sage: "bg-panel-sage text-on-panel",
  clay: "bg-panel-clay text-on-panel",
  apricot: "bg-panel-apricot text-on-panel",
  ochre: "bg-panel-ochre text-on-panel",
  fogblue: "bg-panel-fogblue text-on-panel",
  dustrose: "bg-panel-dustrose text-on-panel",
};

/**
 * Estado operacional: aceito, pendente, autorizado, expirado.
 *
 * `dot` é ligado por padrão de propósito — o rótulo textual já está lá, e o
 * ponto acrescenta a forma. Desligue só quando o contexto já dá a forma.
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
        // radius.xs — tag técnica, não pill glossy (§12, §16).
        "inline-flex min-h-6 items-center gap-1.5 rounded-xs px-2 py-1",
        "type-meta uppercase",
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

/**
 * Tag de conteúdo: "trabalho", "sono", "família".
 *
 * Distinta do Badge por função, não por desenho: Badge diz em que estado
 * uma coisa está; Tag diz de que tipo ela é. Por isso Tag não tem ponto de
 * status e escolhe família pastel em vez de tom semântico.
 */
export function Tag({
  family = "fogblue",
  children,
  className,
}: {
  family?: TagFamily;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex min-h-6 items-center rounded-xs px-2 py-1",
        "type-meta uppercase",
        FAMILIES[family],
        className,
      )}
    >
      {children}
    </span>
  );
}
