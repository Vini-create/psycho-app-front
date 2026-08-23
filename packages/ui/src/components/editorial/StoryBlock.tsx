import type { ElementType, ReactNode } from "react";
import { cx } from "../../lib/cx";
import { Icon } from "../../icons";

/* Brand Book V2 §17 — "A unidade principal do Sinapsa deve ser uma história,
   não um card."

   Anatomia: índice/data → título narrativo → trecho → metadata → fonte.
   Divisor inferior em vez de caixa. O StoryBlock é a resposta direta à
   regra dos cards (§13): tipografia, linha e espaço resolvem — então não
   existe container. */

export interface StoryBlockProps {
  /** "01", "19 AGO", "01 / 19 AGO". Elemento gráfico, não ornamento. */
  index?: ReactNode;
  /** Título narrativo. Uma frase humana, não um rótulo de categoria. */
  headline: ReactNode;
  children?: ReactNode;
  /** Metadata: "TRABALHO · 3 RELATOS RELACIONADOS". */
  meta?: ReactNode;
  /** Origem do conteúdo — normalmente <ProvenanceLabel />. */
  provenance?: ReactNode;
  /** Rastreabilidade — normalmente <SourceTrace />. */
  source?: ReactNode;
  /** Quando presente, o bloco inteiro vira alvo de navegação. */
  href?: string;
  linkComponent?: ElementType;
  /** Painel pastel de apoio à direita: itens guardados, focos, números. */
  aside?: ReactNode;
  /** Remove o divisor — para o último de uma lista. */
  flush?: boolean;
  className?: string;
}

export function StoryBlock({
  index,
  headline,
  children,
  meta,
  provenance,
  source,
  href,
  linkComponent: Link = "a",
  aside,
  flush = false,
  className,
}: StoryBlockProps) {
  const body = (
    <>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {(index || provenance) && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {index && (
              <span className="type-eyebrow text-tertiary tabular-nums">{index}</span>
            )}
            {provenance}
          </div>
        )}

        <h3
          className={cx(
            // Newsreader: o título de um acontecimento é voz humana (§05).
            "font-editorial text-h3 text-balance break-words text-primary",
            href && "transition-colors duration-140 group-hover:text-accent",
          )}
        >
          {headline}
        </h3>

        {children && (
          <div className="measure text-body break-words text-secondary">{children}</div>
        )}

        {(meta || source) && (
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 pt-1">
            {meta && <div className="min-w-0">{meta}</div>}
            {source}
          </div>
        )}
      </div>

      {aside && <div className="shrink-0 md:w-56">{aside}</div>}

      {href && (
        <span
          aria-hidden="true"
          className="hidden shrink-0 self-center text-tertiary transition-transform duration-140 group-hover:translate-x-1 group-hover:text-primary md:block"
        >
          <Icon name="forward" size={20} />
        </span>
      )}
    </>
  );

  const layout = cx(
    "flex flex-col gap-6 py-7 md:flex-row md:gap-10",
    !flush && "border-b border-hairline",
    className,
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cx(
          "group -mx-4 px-4 transition-colors duration-140 hover:bg-sunken/50",
          layout,
        )}
      >
        {body}
      </Link>
    );
  }

  return <article className={layout}>{body}</article>;
}

/* --------------------------------------------------------------------------
   PaperPanel — §17.
   Superfície pastel para blocos que precisam de contraste: "Para a sessão",
   consentimento, retrospectiva. Máximo de 1–2 grandes por viewport.
   -------------------------------------------------------------------------- */

export type PanelFamily =
  | "lavender"
  | "sage"
  | "clay"
  | "apricot"
  | "ochre"
  | "fogblue"
  | "dustrose"
  | "neutral";

const PANEL_BG: Record<PanelFamily, string> = {
  lavender: "bg-panel-lavender",
  sage: "bg-panel-sage",
  clay: "bg-panel-clay",
  apricot: "bg-panel-apricot",
  ochre: "bg-panel-ochre",
  fogblue: "bg-panel-fogblue",
  dustrose: "bg-panel-dustrose",
  neutral: "bg-sunken",
};

export function PaperPanel({
  family = "neutral",
  eyebrow,
  title,
  children,
  footer,
  className,
}: {
  family?: PanelFamily;
  eyebrow?: ReactNode;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const tinted = family !== "neutral";

  return (
    <section
      className={cx(
        // radius.lg — superfície editorial (§12). Sem sombra.
        "flex flex-col gap-4 rounded-lg p-6 lg:p-7",
        PANEL_BG[family],
        tinted ? "text-on-panel" : "text-primary",
        className,
      )}
    >
      {eyebrow && (
        <p className={cx("type-eyebrow", tinted ? "text-on-panel-muted" : "text-tertiary")}>
          {eyebrow}
        </p>
      )}

      {title && (
        <h2 className="font-editorial text-h3 text-balance">{title}</h2>
      )}

      <div className={cx("text-body", tinted ? "text-on-panel" : "text-primary")}>
        {children}
      </div>

      {footer && (
        <div
          className={cx(
            "mt-1 border-t pt-4",
            tinted ? "border-on-panel/15" : "border-hairline",
          )}
        >
          {footer}
        </div>
      )}
    </section>
  );
}

/* --------------------------------------------------------------------------
   PullQuote — §13.
   A palavra literal do paciente, tratada como citação editorial. Existe
   para que o relato original nunca seja confundido com síntese da IA.
   -------------------------------------------------------------------------- */

export function PullQuote({
  children,
  attribution,
  className,
}: {
  children: ReactNode;
  attribution?: ReactNode;
  className?: string;
}) {
  return (
    <figure className={cx("flex flex-col gap-3 border-l-2 border-accent-clay pl-5", className)}>
      <blockquote className="measure font-editorial text-body-l text-primary italic">
        {children}
      </blockquote>
      {attribution && (
        <figcaption className="type-meta text-tertiary">{attribution}</figcaption>
      )}
    </figure>
  );
}
