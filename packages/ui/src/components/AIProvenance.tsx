import type { ReactNode } from "react";
import { cx } from "../lib/cx";
import { formatPeriod } from "../lib/format";
import { Overline } from "./Typography";

export type ProvenanceCoverage = {
  conversation_count: number;
  user_message_count: number;
  active_day_count: number;
  completeness: string;
  note?: string | null;
};

const COMPLETENESS_LABEL: Record<string, string> = {
  limited: "Cobertura limitada do período",
  partial: "Cobertura parcial do período",
  substantial: "Cobertura substancial do período",
};

/**
 * design.md §4 — conteúdo gerado por IA exibe origem, período e acesso às
 * fontes. Aqui "fontes" é a cobertura declarada: quantas conversas e dias o
 * relatório de fato observou, e o que ele reconhece não cobrir.
 *
 * O backend nunca envia IDs de mensagens de origem (nem ao paciente, nem ao
 * profissional), então a rastreabilidade visível é a cobertura + limitações.
 */
export function AIProvenance({
  periodStart,
  periodEnd,
  coverage,
  limitations,
  className,
  children,
}: {
  periodStart: string;
  periodEnd: string;
  coverage?: ProvenanceCoverage | null;
  limitations?: string[];
  className?: string;
  children?: ReactNode;
}) {
  const completeness = coverage
    ? (COMPLETENESS_LABEL[coverage.completeness] ?? coverage.completeness)
    : null;

  return (
    <aside
      className={cx(
        "flex flex-col gap-3 rounded-lg bg-subtle p-5",
        className,
      )}
    >
      <Overline>Origem deste conteúdo</Overline>

      <p className="text-body-md max-w-none text-primary">
        Organizado automaticamente a partir das conversas incluídas no período. É um registro
        do que foi relatado — não é diagnóstico nem avaliação.
      </p>

      <dl className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline gap-2">
          <dt className="type-overline max-w-none text-secondary">Período</dt>
          <dd className="metadata max-w-none text-primary">
            {formatPeriod(periodStart, periodEnd)}
          </dd>
        </div>

        {coverage && (
          <>
            <div className="flex flex-wrap items-baseline gap-2">
              <dt className="type-overline max-w-none text-secondary">Base</dt>
              <dd className="metadata max-w-none text-primary">
                {coverage.conversation_count} conversas ·{" "}
                {coverage.user_message_count} mensagens do paciente ·{" "}
                {coverage.active_day_count} dias ativos
              </dd>
            </div>
            {completeness && (
              <div className="flex flex-wrap items-baseline gap-2">
                <dt className="type-overline max-w-none text-secondary">Alcance</dt>
                <dd className="metadata max-w-none text-primary">
                  {completeness}
                </dd>
              </div>
            )}
          </>
        )}
      </dl>

      {coverage?.note && (
        <p className="text-body-md max-w-none text-secondary">{coverage.note}</p>
      )}

      {limitations && limitations.length > 0 && (
        <div className="flex flex-col gap-2 rounded-md bg-surface p-3">
          <Overline as="h3" className="text-secondary">
            O que este relatório não cobre
          </Overline>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-body-md text-secondary">
            {limitations.map((limitation) => (
              <li key={limitation}>{limitation}</li>
            ))}
          </ul>
        </div>
      )}

      {children}
    </aside>
  );
}
