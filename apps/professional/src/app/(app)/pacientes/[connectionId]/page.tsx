"use client";

import { use, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  ComparisonNote,
  EditorialList,
  EditorialRow,
  Icon,
  MetaStrip,
  Modal,
  PaperPanel,
  ProvenanceLabel,
  SectionIndex,
  Skeleton,
  SourceTrace,
  StatBlock,
  StoryBlock,
  TextField,
  TimelineEvent,
  TimelineRail,
  buttonStyles,
  formatDate,
  formatDayMark,
  formatPeriod,
  pluralize,
} from "@sinapsa/ui";
import {
  describeError,
  type ConsentScope,
  type ContextReport,
} from "@sinapsa/api-client";
import { ReportView } from "@/components/ReportView";
import { previousComparableReport } from "@/lib/report-analytics";
import {
  completenessLabel,
  emotionalValenceLabel,
  evidenceLabel,
  itemKindLabel,
} from "@/lib/report-labels";
import {
  keys,
  useContextReportRequests,
  useCreateContextReportRequest,
  useEndPatientConnection,
  usePatient,
  usePatientContexts,
  useSubscription,
} from "@/lib/queries";

/* Brand Book V2 §22 — "A leitura clínica é narrativa + evidência + tempo."

   Layout 8/4. A coluna larga carrega a leitura: briefing do período,
   acontecimentos na linha do tempo, recorrências descritas. A coluna
   estreita carrega instrumento e controle: focos, permissões, solicitação
   de período, encerramento.

   O V1 era uma pilha de seções de largura única, cada uma dentro de um
   Card — o profissional rolava a tela inteira para descobrir o que
   importava. Agora o essencial cabe em 2–4 minutos de leitura, que é o
   critério declarado do §22.

   Duas regras que atravessam a tela inteira:

   - toda agregação tem "ver fontes" quando existe fonte a mostrar (§22);
   - o que a IA organizou nunca aparece sem dizer que foi organizado (§28).
     `<ProvenanceLabel />` não é enfeite: é o que separa relato de síntese. */

const MAX_PERIOD_DAYS = 31;
const DAY_MS = 86_400_000;

const SCOPE_LABEL: Record<ConsentScope, string> = {
  summaries: "Relatórios de período",
  events: "Acontecimentos",
  marked_topics: "Assuntos para a sessão",
};

/* Famílias pastel por natureza de conteúdo — §04. Isto NÃO é escala
   clínica: "dificuldade relatada" não é pior que "estratégia relatada",
   é outra coisa. A cor separa tipos, e o rótulo textual carrega o sentido
   sozinho para quem não distingue matiz. */
const KIND_FAMILY: Record<string, "lavender" | "sage" | "clay" | "ochre" | "fogblue" | "dustrose"> = {
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

const RULE: Record<string, string> = {
  lavender: "border-accent-lavender",
  sage: "border-accent-sage",
  clay: "border-accent-clay",
  ochre: "border-accent-ochre",
  fogblue: "border-accent-fogblue",
  dustrose: "border-accent-dustrose",
};

function toIsoDay(value: string): string {
  return `${value}T00:00:00Z`;
}

function isoToInput(iso: string): string {
  return iso.slice(0, 10);
}

function Paciente({ connectionId }: { connectionId: string }) {
  const queryClient = useQueryClient();
  const patient = usePatient(connectionId);
  const contexts = usePatientContexts(connectionId);
  const reportRequests = useContextReportRequests(connectionId);
  const { subscription } = useSubscription();
  const request = useCreateContextReportRequest(connectionId);
  const endConnection = useEndPatientConnection();

  const [createdRequestId, setCreatedRequestId] = useState<string | null>(null);
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ContextReport | null>(null);
  const [requesting, setRequesting] = useState(false);

  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * DAY_MS);
  const [start, setStart] = useState(isoToInput(weekAgo.toISOString()));
  const [end, setEnd] = useState(isoToInput(today.toISOString()));

  useEffect(() => {
    if (reportRequests.data?.requests.some((item) => item.status === "sent")) {
      void queryClient.invalidateQueries({ queryKey: keys.contexts(connectionId) });
    }
  }, [connectionId, queryClient, reportRequests.data?.requests]);

  const connection = patient.data;

  /**
   * Duas condições independentes, e a ordem importa na hora de explicar:
   * o relatório de contexto só existe em conexão com profissional assinante
   * (regra de negócio), e só com o consentimento vigente do paciente
   * (direito dele). Uma não substitui a outra.
   */
  const hasConsent = connection?.consent_scopes.includes("summaries") ?? false;
  const canRequest = subscription.active && hasConsent;

  /**
   * Validamos as três regras do backend ANTES de enviar: período posterior à
   * ativação do vínculo, no máximo 31 dias, e ponta final depois da inicial.
   */
  const periodError = ((): string | null => {
    const startMs = Date.parse(toIsoDay(start));
    const endMs = Date.parse(toIsoDay(end));
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) return "Informe as duas datas.";
    if (endMs <= startMs) return "A data final precisa ser depois da inicial.";
    if (endMs - startMs > MAX_PERIOD_DAYS * DAY_MS) {
      return `O período não pode passar de ${MAX_PERIOD_DAYS} dias.`;
    }
    if (connection?.activated_at && startMs < Date.parse(connection.activated_at)) {
      return `O período precisa começar depois de ${formatDate(connection.activated_at)}, quando o vínculo foi ativado.`;
    }
    return null;
  })();

  async function handleRequest(event: FormEvent) {
    event.preventDefault();
    if (periodError) return;
    const response = await request.mutateAsync({
      period_start: toIsoDay(start),
      period_end: toIsoDay(end),
    });
    setCreatedRequestId(response.id);
    setRequesting(false);
  }

  if (patient.isPending) {
    return (
      <div className="flex flex-col gap-6 pt-4">
        <Skeleton className="h-16 w-2/3" aria-label="Carregando acompanhamento" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (patient.error || !connection) {
    return (
      <Alert tone="danger" title="Acompanhamento indisponível">
        {patient.error
          ? describeError(patient.error).message
          : "Não encontramos este acompanhamento."}
      </Alert>
    );
  }

  const active = connection.status === "active";
  const reports = contexts.data?.contexts ?? [];
  const sortedReports = [...reports].sort(
    (a, b) =>
      Date.parse(b.period_end) - Date.parse(a.period_end) ||
      Date.parse(b.created_at) - Date.parse(a.created_at),
  );
  const latest = sortedReports[0] ?? null;
  const previous = latest ? previousComparableReport(latest, reports) : null;
  const name = connection.patient_display_name ?? "Paciente";

  const included = latest?.items.filter((item) => item.included) ?? [];
  // "Para a sessão": o que a pessoa relatou como prioridade, mais o que o
  // sistema marcou como contexto de atenção. É o material que o §22 pede
  // na capa interna — e o mais próximo de sinal declarado que os dados
  // atuais oferecem.
  const forSession = included.filter(
    (item) =>
      item.kind === "priority" ||
      item.kind === "safety_context" ||
      item.kind === "open_topic",
  );
  const recurring = included.filter(
    (item) => item.evidence_strength === "explicit_repeated",
  );
  const others = included.filter(
    (item) => !forSession.includes(item) && !recurring.includes(item),
  );

  return (
    <div className="flex flex-col gap-14 sm:gap-16">
      {/* ================= Masthead ================= */}
      <header className="reveal flex flex-col gap-6 pt-2">
        <Link
          href="/pacientes"
          className="type-ui inline-flex min-h-11 items-center gap-2 self-start text-ui text-secondary transition-colors hover:text-primary"
        >
          <Icon name="back" size={16} />
          Todos os acompanhamentos
        </Link>

        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-10">
          <div className="flex flex-col gap-3">
            <p className="type-eyebrow text-tertiary">Acompanhamento</p>
            <h1 className="font-editorial text-h1-editorial text-balance text-primary">
              {name}
            </h1>
          </div>

          <MetaStrip
            className="md:justify-end"
            items={[
              active ? "Vínculo ativo" : "Vínculo encerrado",
              connection.activated_at
                ? `desde ${formatDate(connection.activated_at)}`
                : null,
              pluralize(reports.length, "contexto recebido", "contextos recebidos"),
            ]}
          />
        </div>
      </header>

      {/* ================= 8 / 4 ================= */}
      <div className="grid gap-x-6 gap-y-14 lg:grid-cols-12 lg:gap-y-16">
        {/* ---------- 8 colunas: leitura ---------- */}
        <div className="flex flex-col gap-14 lg:col-span-8 lg:gap-16">
          {contexts.error && (
            <Alert tone="danger">{describeError(contexts.error).message}</Alert>
          )}

          {contexts.isPending && <Skeleton className="h-64" aria-label="Carregando contexto" />}

          {!contexts.isPending && !latest && (
            <section className="flex flex-col items-start gap-5 py-8">
              <h2 className="max-w-[22ch] font-editorial text-h2 text-balance text-primary">
                Nenhum contexto recebido ainda.
              </h2>
              <p className="measure text-body-l text-secondary">
                Solicite um período ao lado. O contexto aparece depois que a
                pessoa confirma o envio em Minha rede, nunca antes.
              </p>
            </section>
          )}

          {latest && (
            <>
              {/* --- Briefing do período: a capa interna (§22) --- */}
              <section className="reveal reveal-1 flex flex-col gap-6">
                <SectionIndex
                  index="01"
                  meta={completenessLabel(latest.coverage.completeness)}
                  action={
                    <Button
                      size="sm"
                      variant="text"
                      onClick={() => setSelectedReport(latest)}
                    >
                      Contexto completo
                    </Button>
                  }
                >
                  Resumo do período
                </SectionIndex>

                <p className="type-display text-h1-system text-primary">
                  {formatPeriod(latest.period_start, latest.period_end)}
                </p>

                <div className="flex flex-col gap-4">
                  <ProvenanceLabel kind="organized" />
                  <p className="measure font-editorial text-body-l text-primary">
                    {latest.summary}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-6 border-t border-hairline pt-6 sm:grid-cols-3">
                  <StatBlock
                    size="sm"
                    label="Dias com registro"
                    value={latest.coverage.active_day_count}
                    context="no período declarado"
                  />
                  <StatBlock
                    size="sm"
                    label="Conversas"
                    value={latest.coverage.conversation_count}
                    context="base desta leitura"
                  />
                  <StatBlock
                    size="sm"
                    label="Pontos observados"
                    value={included.length}
                    context="organizados a partir de relatos"
                  />
                </div>

                {latest.coverage.note && (
                  <p className="type-meta text-tertiary">{latest.coverage.note}</p>
                )}

                {previous && (
                  <ComparisonNote
                    basis={`${formatPeriod(latest.period_start, latest.period_end)} · período anterior: ${formatPeriod(previous.period_start, previous.period_end)}`}
                  >
                    O período anterior registrou{" "}
                    {previous.coverage.active_day_count} dias com registro e{" "}
                    {previous.items.filter((item) => item.included).length} pontos
                    observados. A comparação é de cobertura e volume de relato,
                    não de estado da pessoa.
                  </ComparisonNote>
                )}
              </section>

              {/* --- Acontecimentos na linha do tempo (§20) --- */}
              {latest.timeline.length > 0 && (
                <section className="reveal reveal-2 flex flex-col gap-6">
                  <SectionIndex
                    index="02"
                    meta={pluralize(
                      latest.timeline.length,
                      "acontecimento",
                      "acontecimentos",
                    )}
                  >
                    Acontecimentos
                  </SectionIndex>

                  <TimelineRail>
                    {latest.timeline.map((entry, index) => (
                      <TimelineEvent
                        key={entry.id}
                        date={
                          entry.occurred_at
                            ? formatDayMark(entry.occurred_at)
                            : "sem data"
                        }
                        last={index === latest.timeline.length - 1}
                        provenance={
                          index === 0 ? <ProvenanceLabel kind="organized" /> : undefined
                        }
                      >
                        {entry.description}
                      </TimelineEvent>
                    ))}
                  </TimelineRail>
                </section>
              )}

              {/* --- Recorrências: faixa, não catorze pontos (§20) --- */}
              {recurring.length > 0 && (
                <section className="reveal reveal-3 flex flex-col gap-4">
                  <SectionIndex index="03" meta="mencionado repetidamente">
                    Recorrências relatadas
                  </SectionIndex>

                  <ul className="flex flex-col gap-6">
                    {recurring.map((item) => (
                      <li
                        key={item.id}
                        className={`flex flex-col gap-2 border-l-2 pl-5 ${RULE[KIND_FAMILY[item.kind] ?? "fogblue"]}`}
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                          <h3 className="font-editorial text-body-l text-primary">
                            {item.title}
                          </h3>
                          <span className="type-meta text-tertiary">
                            {itemKindLabel(item.kind)}
                          </span>
                        </div>
                        <p className="measure text-body text-secondary">
                          {item.description}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* --- Demais pontos observados --- */}
              {others.length > 0 && (
                <section className="reveal reveal-4 flex flex-col gap-2">
                  <SectionIndex index="04" meta="organizados a partir de relatos">
                    Outros pontos
                  </SectionIndex>

                  <div className="flex flex-col">
                    {others.map((item, index) => (
                      <StoryBlock
                        key={item.id}
                        headline={item.title}
                        flush={index === others.length - 1}
                        provenance={<ProvenanceLabel kind="organized" />}
                        meta={
                          <MetaStrip
                            items={[
                              itemKindLabel(item.kind),
                              evidenceLabel(item.evidence_strength),
                              item.emotional_valence
                                ? emotionalValenceLabel(item.emotional_valence)
                                : null,
                            ]}
                          />
                        }
                        source={
                          item.limitations.length > 0 ? (
                            <SourceTrace
                              count={item.limitations.length}
                              label="Ver limitações registradas"
                              onClick={() => setSelectedReport(latest)}
                            />
                          ) : undefined
                        }
                      >
                        {item.description}
                        {item.impact && (
                          <span className="mt-2 block text-tertiary">{item.impact}</span>
                        )}
                      </StoryBlock>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {/* --- Contextos anteriores --- */}
          {sortedReports.length > 1 && (
            <section className="flex flex-col gap-2">
              <SectionIndex meta="do mais recente ao mais antigo">
                Contextos anteriores
              </SectionIndex>

              <EditorialList as="ul" className="border-t-0">
                {sortedReports.slice(1).map((report) => (
                  <li key={report.id}>
                    <EditorialRow
                      onClick={() => setSelectedReport(report)}
                      lead={formatDayMark(report.period_end)}
                      title={formatPeriod(report.period_start, report.period_end)}
                      meta={
                        <MetaStrip
                          className="md:justify-end"
                          items={[
                            `recebido em ${formatDate(report.created_at)}`,
                            pluralize(
                              report.items.filter((item) => item.included).length,
                              "ponto",
                              "pontos",
                            ),
                          ]}
                        />
                      }
                    >
                      <span className="line-clamp-2">{report.summary}</span>
                    </EditorialRow>
                  </li>
                ))}
              </EditorialList>
            </section>
          )}
        </div>

        {/* ---------- 4 colunas: instrumento e controle ---------- */}
        <aside className="flex flex-col gap-10 lg:col-span-4 lg:sticky lg:top-6 lg:self-start lg:border-l lg:border-hairline lg:pl-8">
          {/* Para a sessão — o painel pastel da coluna (§22). */}
          {forSession.length > 0 && (
            <PaperPanel
              family="ochre"
              eyebrow="Para a sessão"
              title="O que a pessoa marcou como prioridade"
            >
              <ul className="flex flex-col gap-4">
                {forSession.map((item) => (
                  <li key={item.id} className="flex flex-col gap-1">
                    <p className="font-editorial text-body-l text-on-panel">
                      {item.title}
                    </p>
                    <p className="type-meta text-on-panel-muted">
                      {itemKindLabel(item.kind)} ·{" "}
                      {evidenceLabel(item.evidence_strength)}
                    </p>
                  </li>
                ))}
              </ul>
            </PaperPanel>
          )}

          {/* Vínculo e permissões — índice, não card corporativo (§34). */}
          <section className="flex flex-col gap-4">
            <SectionIndex>O que é compartilhado</SectionIndex>

            {connection.consent_scopes.length === 0 ? (
              <p className="text-body text-secondary">
                Nada autorizado no momento.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-hairline">
                {(["summaries", "events", "marked_topics"] as ConsentScope[]).map(
                  (scope) => {
                    const granted = connection.consent_scopes.includes(scope);
                    return (
                      <li
                        key={scope}
                        className="flex items-center justify-between gap-3 py-3"
                      >
                        <span className="type-ui min-w-0 text-ui break-words text-primary">
                          {SCOPE_LABEL[scope]}
                        </span>
                        {/* Estado por ícone + palavra, nunca só por cor (§29). */}
                        <span
                          className={
                            granted
                              ? "type-meta flex shrink-0 items-center gap-1.5 text-positive"
                              : "type-meta flex shrink-0 items-center gap-1.5 text-tertiary"
                          }
                        >
                          <Icon name={granted ? "confirm" : "close"} size={16} />
                          {granted ? "autorizado" : "não autorizado"}
                        </span>
                      </li>
                    );
                  },
                )}
              </ul>
            )}

            <p className="type-meta text-tertiary">
              O histórico de conversas não é acessível por decisão de
              produto, não por limitação técnica.
            </p>
          </section>

          {/* Solicitar contexto — formulário direto no grid (§15, §18). */}
          {active && (
            <section className="flex flex-col gap-4">
              <SectionIndex>Solicitar um período</SectionIndex>

              {!subscription.active ? (
                <Alert
                  tone="danger"
                  title={subscription.label}
                  action={
                    <Link
                      href="/conta"
                      className={buttonStyles({ variant: "secondary", size: "sm" })}
                    >
                      Ver assinatura
                    </Link>
                  }
                >
                  Novos contextos só podem ser solicitados com assinatura
                  vigente. O vínculo continua ativo e o que já foi recebido
                  segue acessível.
                </Alert>
              ) : !hasConsent ? (
                <Alert tone="warning" title="Sem autorização para contextos">
                  Esta pessoa não autoriza o compartilhamento de contextos de
                  período. A permissão é dela e pode ser reativada a qualquer
                  momento.
                </Alert>
              ) : requesting ? (
                <form onSubmit={handleRequest} className="flex flex-col gap-4" noValidate>
                  {request.error && (
                    <Alert tone="danger">{describeError(request.error).message}</Alert>
                  )}

                  <TextField
                    label="Início do período"
                    type="date"
                    value={start}
                    onChange={(event) => setStart(event.target.value)}
                    required
                  />
                  <TextField
                    label="Fim do período"
                    type="date"
                    value={end}
                    onChange={(event) => setEnd(event.target.value)}
                    required
                    error={periodError ?? undefined}
                  />

                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="submit"
                      loading={request.isPending}
                      disabled={periodError !== null || !canRequest}
                    >
                      Enviar solicitação
                    </Button>
                    <Button variant="text" onClick={() => setRequesting(false)}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-body text-secondary">
                    A pessoa recebe o período e decide se envia. Nada é
                    preparado antes disso.
                  </p>
                  <Button
                    variant="secondary"
                    className="self-start"
                    onClick={() => setRequesting(true)}
                  >
                    Escolher período
                  </Button>
                </div>
              )}

              {createdRequestId && (
                <Alert tone="success" title="Solicitação enviada">
                  O período foi enviado. O contexto só é preparado depois que a
                  pessoa confirmar em Minha rede.
                </Alert>
              )}

              {reportRequests.data && reportRequests.data.requests.length > 0 && (
                <ul className="flex flex-col divide-y divide-hairline border-t border-hairline">
                  {reportRequests.data.requests.map((item) => (
                    <li key={item.id} className="flex flex-col gap-1 py-3">
                      <span className="type-meta text-tertiary">
                        {formatPeriod(item.period_start, item.period_end)}
                      </span>
                      <span className="type-ui text-ui-sm text-primary">
                        {item.status === "sent"
                          ? "Contexto recebido"
                          : item.status === "pending"
                            ? "Aguardando a pessoa"
                            : item.status === "processing"
                              ? "Em preparação"
                              : "Não concluído"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {active && (
            <section className="flex flex-col gap-3 border-t border-hairline pt-6">
              <p className="type-eyebrow text-tertiary">Encerrar</p>
              <p className="text-body text-secondary">
                O vínculo termina e os consentimentos são revogados.
              </p>
              <Button
                variant="danger"
                className="self-start"
                onClick={() => setConfirmingEnd(true)}
              >
                Encerrar acompanhamento
              </Button>
            </section>
          )}
        </aside>
      </div>

      <Modal
        open={selectedReport !== null}
        onClose={() => setSelectedReport(null)}
        title={selectedReport?.title ?? "Contexto"}
        description={
          selectedReport
            ? formatPeriod(selectedReport.period_start, selectedReport.period_end)
            : undefined
        }
        className="w-[min(56rem,calc(100vw-2rem))]"
        contentClassName="max-h-[calc(100dvh-2rem)] overflow-hidden"
      >
        {selectedReport && (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
            <ReportView
              report={selectedReport}
              previousReport={previousComparableReport(selectedReport, reports)}
              showHeader={false}
            />
          </div>
        )}
      </Modal>

      <Modal
        open={confirmingEnd}
        onClose={() => setConfirmingEnd(false)}
        title="Encerrar este acompanhamento?"
        description="O vínculo termina e os consentimentos são revogados. Você deixa de poder solicitar novos contextos."
        footer={
          <>
            <Button variant="text" onClick={() => setConfirmingEnd(false)}>
              Manter
            </Button>
            <Button
              variant="danger-solid"
              loading={endConnection.isPending}
              onClick={async () => {
                await endConnection.mutateAsync(connectionId);
                setConfirmingEnd(false);
                await patient.refetch();
              }}
            >
              Encerrar
            </Button>
          </>
        }
      >
        {endConnection.error && (
          <Alert tone="danger">{describeError(endConnection.error).message}</Alert>
        )}
      </Modal>
    </div>
  );
}

export default function PacientePage({
  params,
}: {
  params: Promise<{ connectionId: string }>;
}) {
  const { connectionId } = use(params);
  return <Paciente connectionId={connectionId} />;
}
