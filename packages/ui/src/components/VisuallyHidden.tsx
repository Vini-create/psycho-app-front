import type { ReactNode } from "react";

/** Visível para leitores de tela, invisível na tela. */
export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>;
}
