import type { ElementType, ReactNode } from "react";

/**
 * Visível para leitores de tela, invisível na tela.
 *
 * Aceita `as` porque nem todo conteúdo só-para-leitor é um span: um título
 * de página que não deve aparecer no desenho continua precisando ser um
 * `<h1>` de verdade para a árvore de acessibilidade.
 */
export function VisuallyHidden({
  children,
  as: Tag = "span",
}: {
  children: ReactNode;
  as?: ElementType;
}) {
  return <Tag className="sr-only">{children}</Tag>;
}
