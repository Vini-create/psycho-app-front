import type { ReactNode } from "react";
import { cx } from "../lib/cx";
import { Overline, PageTitle } from "./Typography";

/**
 * Vazio não é erro. O texto explica o que existe ali e o que fazer a seguir —
 * uma ação primária por região, no máximo.
 */
export function EmptyState({
  overline,
  title,
  description,
  action,
  className,
}: {
  overline?: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "flex flex-col items-start gap-4 border-y border-hairline py-8 sm:py-10",
        className,
      )}
    >
      {overline && <Overline>{overline}</Overline>}
      <PageTitle as="h2" className="text-h2">
        {title}
      </PageTitle>
      {description && (
        <div className="text-body text-secondary">{description}</div>
      )}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
