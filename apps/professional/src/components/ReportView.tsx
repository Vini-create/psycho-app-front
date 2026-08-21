import {
  AIProvenance,
  Badge,
  Card,
  CardTitle,
  Metadata,
  Overline,
  Prose,
  formatDate,
  formatPeriod,
} from "@sinapsa/ui";
import type { ContextReport } from "@sinapsa/api-client";
import {
  emotionalValenceLabel,
  evidenceLabel,
  itemKindLabel,
} from "@/lib/report-labels";
import { ReportSignals } from "./ReportSignals";

/**
 * Leitura de um relatório gerado exclusivamente para o profissional.
 *
 * O vínculo, o escopo `summaries` e a confirmação de uma solicitação autorizam
 * a geração. O paciente não recebe nem revisa este conteúdo; a superfície
 * existe apenas no produto profissional.
 */
export function ReportView({
  report,
  previousReport = null,
  showHeader = true,
}: {
  report: ContextReport;
  previousReport?: ContextReport | null;
  showHeader?: boolean;
}) {
  return (
    <article className="flex flex-col gap-6">
      {showHeader && (
        <header className="flex flex-col gap-2">
          <CardTitle as="h2">{report.title}</CardTitle>
          <Metadata>
            {formatPeriod(report.period_start, report.period_end)}
          </Metadata>
        </header>
      )}

      <ReportSignals report={report} previousReport={previousReport} />

      <section className="flex flex-col gap-3">
        <Overline as="h3" className="text-secondary">
          Panorama
        </Overline>
        <Card variant="editorial">
          <Prose>
            <p className="whitespace-pre-wrap">{report.summary}</p>
          </Prose>
        </Card>
      </section>

      {report.timeline.length > 0 && (
        <section className="flex flex-col gap-3">
          <Overline as="h3" className="text-secondary">
            Linha do tempo
          </Overline>
          <ul className="flex flex-col gap-4">
            {report.timeline.map((entry) => (
              <Card key={entry.id} as="li" variant="compact" className="gap-2">
                <Metadata>
                  {entry.occurred_at
                    ? formatDate(entry.occurred_at)
                    : "Durante o período"}
                </Metadata>
                <p className="text-body-md">{entry.description}</p>
              </Card>
            ))}
          </ul>
        </section>
      )}

      {report.items.length > 0 && (
        <section className="flex flex-col gap-3">
          <Overline as="h3" className="text-secondary">
            Pontos observados
          </Overline>
          <ul className="flex flex-col gap-4">
            {report.items.map((item) => (
              <Card key={item.id} as="li" variant="standard" className="gap-3">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="brand">{itemKindLabel(item.kind)}</Badge>
                  {item.emotional_valence && (
                    <Badge tone="neutral">
                      {emotionalValenceLabel(item.emotional_valence)}
                    </Badge>
                  )}
                </div>
                <CardTitle>{item.title}</CardTitle>
                <p className="text-body-md">{item.description}</p>
                {item.impact && (
                  <p className="text-body-md text-secondary">{item.impact}</p>
                )}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Metadata>{evidenceLabel(item.evidence_strength)}</Metadata>
                  {item.occurred_at && (
                    <Metadata>{formatDate(item.occurred_at)}</Metadata>
                  )}
                </div>
                {item.limitations.length > 0 && (
                  <ul className="flex list-disc flex-col gap-1 pl-5">
                    {item.limitations.map((limitation) => (
                      <li key={limitation} className="metadata text-secondary">
                        {limitation}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            ))}
          </ul>
        </section>
      )}

      <AIProvenance
        periodStart={report.period_start}
        periodEnd={report.period_end}
        coverage={report.coverage}
        limitations={report.limitations}
      />

      <Metadata>
        Relatório gerado automaticamente · {report.schema_version} ·{" "}
        {formatDate(report.created_at)}
      </Metadata>
    </article>
  );
}
