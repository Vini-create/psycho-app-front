import type { ReactNode } from "react";

import { cx } from "@/lib/cx";

/* As peças pequenas que o produto já tem e a landing precisa repetir para
   soar como a mesma publicação: o eyebrow numerado, a tira de metadata, o
   botão, a régua de seção. Todas são reconstruções fiéis dos componentes de
   `@sinapsa/ui` — mesma tipografia, mesmos tokens, mesmas medidas. */

/**
 * Botão. §15: o primário é fill Ink — contraste máximo, zero cor decorativa.
 * No dark isso se inverte e o fill vira papel sobre carvão.
 *
 * Como todo destino desta página é outro domínio, o componente é sempre uma
 * âncora. Não existe botão sem href na landing.
 */
export function Action({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
  ...rest
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "outline" | "quiet";
  size?: "sm" | "md" | "lg";
  className?: string;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className">) {
  return (
    <a
      href={href}
      className={cx(
        "group/action inline-flex items-center justify-center gap-2 rounded-sm font-ui font-semibold whitespace-nowrap",
        "transition-[background-color,color,border-color,transform] duration-[--duration-fast] ease-[--ease-enter]",
        "active:translate-y-px",
        size === "sm" && "h-9 px-3.5 text-ui-sm",
        size === "md" && "h-11 px-5 text-ui",
        size === "lg" && "h-13 px-7 text-ui",
        variant === "primary" &&
          "bg-action text-on-action hover:bg-action-hover",
        variant === "outline" &&
          "border border-control text-primary hover:border-primary hover:bg-primary/6",
        variant === "quiet" && "text-secondary hover:text-primary",
        className,
      )}
      {...rest}
    >
      {children}
    </a>
  );
}

/** Eyebrow em mono com o índice da seção — §06. */
export function Eyebrow({
  index,
  children,
  className,
}: {
  index?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cx("type-eyebrow flex items-center gap-3 text-tertiary", className)}>
      {index && <span className="text-accent-lavender">{index}</span>}
      <span>{children}</span>
    </p>
  );
}

/**
 * Tira de metadata. Itens separados por um ponto médio, em mono.
 *
 * O separador é um `::before` decorativo e não um caractere no texto: assim
 * um leitor de tela lê três informações, e não "privado ponto sob seu
 * controle ponto sem diagnóstico".
 */
export function MetaStrip({
  items,
  className,
}: {
  items: readonly string[];
  className?: string;
}) {
  return (
    <ul className={cx("type-meta flex flex-wrap items-center gap-x-4 gap-y-1 text-tertiary", className)}>
      {items.map((item) => (
        <li
          key={item}
          className="before:mr-4 before:text-hairline-strong before:content-['·'] first:before:hidden"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

/**
 * Cabeça de seção: índice, título e o condutor pontilhado até a metadata da
 * direita. É o padrão que as referências técnicas repetem, e o que dá à
 * página a leitura de índice de publicação.
 */
export function SectionHead({
  index,
  eyebrow,
  meta,
  children,
  className,
}: {
  index: string;
  eyebrow: string;
  meta?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col gap-6", className)}>
      <div className="hairline-t flex items-baseline gap-4 pt-4">
        <Eyebrow index={index}>{eyebrow}</Eyebrow>
        <span className="leader" aria-hidden="true" />
        {meta && <span className="type-meta shrink-0 text-tertiary">{meta}</span>}
      </div>
      {children}
    </div>
  );
}

/** A seta curta que acompanha um link editorial. */
export function Arrow({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cx("size-4 shrink-0", className)}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
