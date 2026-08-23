import type { ElementType, ReactNode } from "react";
import { cx } from "../../lib/cx";
import { Icon } from "../../icons";

/* Brand Book V2 §18 — listas com densidade editorial, sem virar planilha.

   Anatomia: índice ou data à esquerda; conteúdo no centro; meta/ação à
   direita. Altura 64–96px. Divisórias finas. Hover altera o fundo em 2–4%
   e move a seta no máximo 2px — nada de card que levita.

   Esta é a resposta ao §17 ("lista de pacientes deve ser row-first") e ao
   §34 ("Pacientes: rows editoriais; não grid de cards idênticos"). */

export interface EditorialRowProps {
  /** Índice, data ou período. Coluna fixa à esquerda no desktop. */
  lead?: ReactNode;
  /** Nome, título — o que a linha É. */
  title: ReactNode;
  /** Uma linha de contexto abaixo do título. */
  children?: ReactNode;
  /** Metadata alinhada à direita: período, contagem, última atividade. */
  meta?: ReactNode;
  /** Estado ou marca à direita do título. */
  badge?: ReactNode;
  /** Ações. Silenciosas até hover/focus quando a linha inteira é clicável. */
  actions?: ReactNode;
  href?: string;
  linkComponent?: ElementType;
  onClick?: () => void;
  /** Remove o divisor inferior. */
  flush?: boolean;
  className?: string;
}

export function EditorialRow({
  lead,
  title,
  children,
  meta,
  badge,
  actions,
  href,
  linkComponent: Link = "a",
  onClick,
  flush = false,
  className,
}: EditorialRowProps) {
  const interactive = Boolean(href || onClick);

  const content = (
    <>
      {lead && (
        <span className="type-eyebrow min-w-0 break-words text-tertiary tabular-nums md:w-28 md:shrink-0 md:pt-1">
          {lead}
        </span>
      )}

      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span
            className={cx(
              // Conteúdo do usuário: nome longo ou e-mail sem espaço não
              // pode empurrar a linha para fora da folha.
              "min-w-0 font-editorial text-h3 break-words text-primary",
              interactive && "transition-colors duration-140 group-hover:text-accent",
            )}
          >
            {title}
          </span>
          {badge}
        </span>

        {children && (
          <span className="measure block text-body break-words text-secondary">{children}</span>
        )}
      </span>

      {meta && (
        <span className="shrink-0 md:pt-1 md:text-right">{meta}</span>
      )}

      {actions && <span className="flex shrink-0 items-center gap-1">{actions}</span>}

      {href && (
        <span
          aria-hidden="true"
          className="hidden shrink-0 self-center text-tertiary transition-transform duration-140 group-hover:translate-x-0.5 group-hover:text-primary md:block"
        >
          <Icon name="next" size={20} />
        </span>
      )}
    </>
  );

  const layout = cx(
    // min-h-16 = 64px, o piso do §18. Cresce com o conteúdo até ~96.
    "flex min-h-16 flex-col gap-3 py-5 md:flex-row md:items-start md:gap-6",
    !flush && "border-b border-hairline",
    className,
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cx("group -mx-4 px-4 transition-colors duration-140 hover:bg-sunken/60", layout)}
      >
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cx(
          "group -mx-4 w-[calc(100%+2rem)] px-4 text-left transition-colors duration-140 hover:bg-sunken/60",
          layout,
        )}
      >
        {content}
      </button>
    );
  }

  return <div className={layout}>{content}</div>;
}

/** Lista de rows. Existe só para dar o divisor de topo e o ritmo correto. */
export function EditorialList({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "ul" | "ol";
}) {
  return (
    <Tag
      data-motion-list
      className={cx("flex flex-col border-t border-hairline", className)}
    >
      {children}
    </Tag>
  );
}
