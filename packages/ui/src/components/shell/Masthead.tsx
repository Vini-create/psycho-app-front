import type { ElementType, ReactNode } from "react";
import { cx } from "../../lib/cx";

/* Brand Book V2 §06 e §14 — hierarquia editorial.

   "Cada tela deve ter uma manchete, um eixo e um silêncio."

   O Masthead é a abertura: eyebrow mono pequeno, título de alto contraste,
   deck de uma a três linhas. Não vive dentro de card — ele abre a folha.
   A meta vai para outra coluna, deliberadamente, para criar a tensão
   editorial que o §14 pede em vez do bloco centralizado de sempre. */

export interface MastheadProps {
  /** Rótulo mono acima do título: "PAINEL", "EDIÇÃO / 22 AGO 2026". */
  eyebrow?: ReactNode;
  children: ReactNode;
  /** Uma a três linhas explicando por que isto importa. */
  deck?: ReactNode;
  /** Metadata alinhada à direita no desktop — a tensão de colunas. */
  meta?: ReactNode;
  /** Ações da tela. Silenciosas: o masthead não é uma barra de botões. */
  actions?: ReactNode;
  /**
   * `display` usa Archivo apertado — para números e manchetes monumentais.
   * `editorial` usa Newsreader — para quando o título é uma voz humana.
   */
  tone?: "display" | "editorial";
  size?: "xl" | "lg" | "md";
  as?: ElementType;
  className?: string;
}

const TITLE_SIZE: Record<
  NonNullable<MastheadProps["tone"]>,
  Record<NonNullable<MastheadProps["size"]>, string>
> = {
  display: {
    xl: "text-display-2xl",
    lg: "text-display-xl",
    md: "text-h1-system",
  },
  editorial: {
    xl: "text-h1-editorial",
    lg: "text-h1-editorial",
    md: "text-h2",
  },
};

export function Masthead({
  eyebrow,
  children,
  deck,
  meta,
  actions,
  tone = "display",
  size = "lg",
  as: Tag = "h1",
  className,
}: MastheadProps) {
  return (
    <header className={cx("flex flex-col gap-6", className)}>
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between md:gap-10">
        <div className="flex min-w-0 flex-col gap-3">
          {eyebrow && (
            <p className="type-eyebrow text-tertiary">{eyebrow}</p>
          )}

          <Tag
            className={cx(
              "text-primary break-words",
              tone === "display" ? "type-display" : "font-editorial",
              TITLE_SIZE[tone][size],
            )}
          >
            {children}
          </Tag>

          {deck && (
            <div className="measure font-editorial text-body-l text-secondary">
              {deck}
            </div>
          )}
        </div>

        {meta && (
          // No mobile a meta lateral vira faixa acima do conteúdo — a
          // ordem de colapso do §30, passo 3.
          <div className="shrink-0 md:pt-2 md:text-right">{meta}</div>
        )}
      </div>

      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}

/* --------------------------------------------------------------------------
   SectionIndex — §14.
   Faixa editorial que diz posição, período ou conteúdo local:
   "01 / CONTEXTO", "SEMANA 34", "14–21 AGO".
   Funciona como breadcrumb sem parecer breadcrumb corporativo.
   -------------------------------------------------------------------------- */

export function SectionIndex({
  index,
  children,
  meta,
  action,
  as: Tag = "h2",
  className,
}: {
  /** Número ou período à esquerda. É elemento gráfico, não decoração. */
  index?: ReactNode;
  children: ReactNode;
  meta?: ReactNode;
  action?: ReactNode;
  as?: ElementType;
  className?: string;
}) {
  return (
    <div
      className={cx(
        // `flex-wrap`: em 390px o título, a meta e a ação não cabem na mesma
        // linha — sem isso a ação empurrava a régua para fora da viewport.
        "flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-hairline pb-3",
        className,
      )}
    >
      {index && (
        <span className="type-eyebrow min-w-0 break-words text-tertiary tabular-nums">
          {index}
        </span>
      )}

      <Tag className="type-ui min-w-0 flex-1 text-ui font-semibold tracking-wide break-words text-primary uppercase">
        {children}
      </Tag>

      {meta && (
        <span className="type-meta min-w-0 basis-full break-words text-tertiary sm:basis-auto">
          {meta}
        </span>
      )}
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* --------------------------------------------------------------------------
   MetaStrip — §16.
   Sequência de metadados separados por ponto médio. Microtipografia é uma
   das assinaturas do sistema; esta é a forma canônica dela.
   -------------------------------------------------------------------------- */

export function MetaStrip({
  items,
  className,
}: {
  items: Array<ReactNode>;
  className?: string;
}) {
  const visible = items.filter(Boolean);
  if (visible.length === 0) return null;

  return (
    <p className={cx("type-meta flex flex-wrap items-center gap-x-2 gap-y-1 text-tertiary", className)}>
      {visible.map((item, index) => (
        <span key={index} className="flex min-w-0 items-center gap-2 break-words">
          {index > 0 && (
            <span aria-hidden="true" className="text-border-strong">
              ·
            </span>
          )}
          {item}
        </span>
      ))}
    </p>
  );
}
