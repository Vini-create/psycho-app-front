import {
  AIProvenance,
  MetaStrip,
  ProvenanceLabel,
  SectionIndex,
  StoryBlock,
  Tag,
  TimelineEvent,
  TimelineRail,
  formatDate,
  formatDayMark,
  formatPeriod,
  pluralize,
  type TagFamily,
} from "@sinapsa/ui";
import type { ContextReport } from "@sinapsa/api-client";
import {
  emotionalValenceLabel,
  evidenceLabel,
  itemKindLabel,
} from "@/lib/report-labels";
import { ReportSignals } from "./ReportSignals";

/* Leitura completa de um contexto gerado exclusivamente para o profissional.

   O vínculo, o escopo `summaries` e a confirmação de uma solicitação
   autorizam a geração. O paciente não recebe nem revisa este conteúdo; a
   superfície existe apenas no produto profissional.

   Brand Book V2 §34 — "Timeline: linha + histórias + fontes. Não: lista de
   cards desconectados." O V1 embrulhava cada entrada de linha do tempo e
   cada ponto observado no próprio Card, produzindo justamente a parede de
   caixas que o §13 manda evitar. Agora a linha ancora os acontecimentos e
   os pontos são histórias separadas por divisor.

   §28 continua valendo aqui com força total: tudo nesta tela foi organizado
   por modelo a partir de relatos, e a interface diz isso em cada bloco. */

const KIND_FAMILY: Record<string, TagFamily> = {
  priority: "ochre",
  event: "clay",
  challenge: "dustrose",
  emotion: "lavender",
  thought: "lavender",
  behavior: "fogblue",
  strategy: "sage",
  support: "sage",
  change: "clay",
  open_topic: "fogblue",
  safety_context: "dustrose",
};

export function ReportView({
  report,
  previousReport = null,
  showHeader = true,
}: {
  report: ContextReport;
  previousReport?: ContextReport | null;
  showHeader?: boolean;
}) {
  const included = report.items.filter((item) => item.included);
  const items = included.length > 0 ? included : report.items;

  return (
    <article className="flex flex-col gap-12">
      {showHeader && (
        <header className="flex flex-col gap-3">
          <p className="type-eyebrow text-tertiary">
            {formatPeriod(report.period_start, report.period_end)}
          </p>
          <h2 className="font-editorial text-h2 text-balance text-primary">
            {report.title}
          </h2>
        </header>
      )}

      <ReportSignals report={report} previousReport={previousReport} />

      <section className="flex flex-col gap-4">
        <SectionIndex index="01" as="h3">
          Panorama
        </SectionIndex>
        <ProvenanceLabel kind="organized" />
        <p className="measure font-editorial text-body-l whitespace-pre-wrap text-primary">
          {report.summary}
        </p>
      </section>

      {report.timeline.length > 0 && (
        <section className="flex flex-col gap-6">
          <SectionIndex
            index="02"
            as="h3"
            meta={pluralize(
              report.timeline.length,
              "acontecimento",
              "acontecimentos",
            )}
          >
            Linha do tempo
          </SectionIndex>

          <TimelineRail>
            {report.timeline.map((entry, index) => (
              <TimelineEvent
                key={entry.id}
                date={
                  entry.occurred_at
                    ? formatDayMark(entry.occurred_at)
                    : "no período"
                }
                last={index === report.timeline.length - 1}
              >
                {entry.description}
              </TimelineEvent>
            ))}
          </TimelineRail>
        </section>
      )}

      {items.length > 0 && (
        <section className="flex flex-col gap-2">
          <SectionIndex
            index="03"
            as="h3"
            meta={pluralize(items.length, "ponto", "pontos")}
          >
            Pontos observados
          </SectionIndex>

          <div className="flex flex-col">
            {items.map((item, index) => (
              <StoryBlock
                key={item.id}
                headline={item.title}
                flush={index === items.length - 1}
                provenance={<ProvenanceLabel kind="organized" />}
                meta={
                  <div className="flex flex-wrap items-center gap-2">
                    <Tag family={KIND_FAMILY[item.kind] ?? "fogblue"}>
                      {itemKindLabel(item.kind)}
                    </Tag>
                    <MetaStrip
                      items={[
                        evidenceLabel(item.evidence_strength),
                        item.emotional_valence
                          ? emotionalValenceLabel(item.emotional_valence)
                          : null,
                        item.occurred_at ? formatDate(item.occurred_at) : null,
                      ]}
                    />
                  </div>
                }
              >
                {item.description}
                {item.impact && (
                  <span className="mt-2 block text-tertiary">{item.impact}</span>
                )}

                {/* Limitações preservadas — parte do §28: o que o modelo NÃO
                    pôde afirmar é informação clínica tanto quanto o resto. */}
                {item.limitations.length > 0 && (
                  <span className="mt-3 block border-l-2 border-accent-fogblue pl-4">
                    <span className="type-eyebrow block text-ink-fogblue">
                      Limitações registradas
                    </span>
                    <ul className="mt-1.5 flex flex-col gap-1">
                      {item.limitations.map((limitation) => (
                        <li key={limitation} className="type-meta text-tertiary">
                          {limitation}
                        </li>
                      ))}
                    </ul>
                  </span>
                )}
              </StoryBlock>
            ))}
          </div>
        </section>
      )}

      <AIProvenance
        periodStart={report.period_start}
        periodEnd={report.period_end}
        coverage={report.coverage}
        limitations={report.limitations}
      />

      <MetaStrip
        items={[
          "organizado automaticamente",
          report.schema_version,
          formatDate(report.created_at),
        ]}
      />
    </article>
  );
}
