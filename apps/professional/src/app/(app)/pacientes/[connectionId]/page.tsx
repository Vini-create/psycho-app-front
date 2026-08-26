"use client";

import { use, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  EditorialList,
  EditorialRow,
  Icon,
  MetaStrip,
  Modal,
  PaperPanel,
  SectionIndex,
  Skeleton,
  TextField,
  buttonStyles,
  formatDate,
  formatDayMark,
  formatPeriod,
  pluralize,
} from "@sinapsa/ui";
import {
  describeError,
  type CheckinCollection,
  type ConsentScope,
  type ContextReport,
} from "@sinapsa/api-client";
import { CheckinCollectionView } from "@/components/checkin/CheckinCollectionView";
import { CheckinControls } from "@/components/checkin/CheckinControls";
import { ReportView } from "@/components/ReportView";
import { previousComparableReport } from "@/lib/report-analytics";
import { evidenceLabel, itemKindLabel } from "@/lib/report-labels";
import {
  keys,
  useCheckinCollections,
  useContextReportRequests,
  useCreateContextReportRequest,
  useEndPatientConnection,
  usePatient,
  usePatientContexts,
  useSubscription,
} from "@/lib/queries";

const MAX_PERIOD_DAYS = 31;
const DAY_MS = 86_400_000;

const SCOPE_LABEL: Record<ConsentScope, string> = {
  summaries: "Relatórios de período",
  events: "Acontecimentos",
  marked_topics: "Assuntos para a sessão",
};

function toIsoDay(value: string): string {
  return `${value}T00:00:00Z`;
}

function isoToInput(iso: string): string {
  return iso.slice(0, 10);
}

function requestStatus(status: string): string {
  if (status === "sent") return "Relatório recebido";
  if (status === "pending") return "Aguardando a pessoa";
  if (status === "processing") return "Em preparação";
  return "Não concluído";
}

function Paciente({ connectionId }: { connectionId: string }) {
  const queryClient = useQueryClient();
  const patient = usePatient(connectionId);
  const contexts = usePatientContexts(connectionId);
  const reportRequests = useContextReportRequests(connectionId);
  const checkinCollections = useCheckinCollections(connectionId);
  const { subscription } = useSubscription();
  const request = useCreateContextReportRequest(connectionId);
  const endConnection = useEndPatientConnection();

  const [createdRequestId, setCreatedRequestId] = useState<string | null>(null);
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ContextReport | null>(null);
  const [selectedCheckin, setSelectedCheckin] = useState<CheckinCollection | null>(null);
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
  const hasConsent = connection?.consent_scopes.includes("summaries") ?? false;
  const canRequest = subscription.active && hasConsent;

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
  const checkins = [...(checkinCollections.data?.collections ?? [])].sort(
    (a, b) => Date.parse(b.shared_at) - Date.parse(a.shared_at),
  );
  const included = latest?.items.filter((item) => item.included) ?? [];
  const forSession = included.filter(
    (item) =>
      item.kind === "priority" ||
      item.kind === "safety_context" ||
      item.kind === "open_topic",
  );
  const name = connection.patient_display_name ?? "Paciente";

  return (
    <div className="flex flex-col gap-14 sm:gap-16">
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
              connection.activated_at ? `desde ${formatDate(connection.activated_at)}` : null,
              pluralize(reports.length, "relatório recebido", "relatórios recebidos"),
            ]}
          />
        </div>
      </header>

      {active && (
        <section className="flex flex-col gap-5">
          <SectionIndex meta="relatórios e check-ins">Ações do acompanhamento</SectionIndex>
          <div className="grid items-start gap-5 xl:grid-cols-2">
            <section className="flex flex-col gap-6 border-t-2 border-accent-lavender bg-raised/35 p-5 sm:p-6">
              <header className="flex flex-col gap-2">
                <p className="type-eyebrow text-tertiary">01 · Relatórios</p>
                <h2 className="font-editorial text-h3 text-primary">Solicitar um relatório</h2>
                <p className="text-body text-secondary">
                  Escolha o período. A pessoa recebe o pedido e decide se compartilha.
                </p>
              </header>

              {!subscription.active ? (
                <Alert
                  tone="danger"
                  title={subscription.label}
                  action={
                    <Link href="/conta" className={buttonStyles({ variant: "secondary", size: "sm" })}>
                      Ver assinatura
                    </Link>
                  }
                >
                  Novos relatórios só podem ser solicitados com assinatura vigente.
                </Alert>
              ) : !hasConsent ? (
                <Alert tone="warning" title="Sem autorização para relatórios">
                  Esta pessoa não autoriza o compartilhamento de relatórios de período no momento.
                </Alert>
              ) : requesting ? (
                <form onSubmit={handleRequest} className="flex flex-col gap-4" noValidate>
                  {request.error && <Alert tone="danger">{describeError(request.error).message}</Alert>}
                  <div className="grid gap-4 sm:grid-cols-2">
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
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="submit"
                      loading={request.isPending}
                      disabled={periodError !== null || !canRequest}
                    >
                      Enviar solicitação
                    </Button>
                    <Button variant="text" onClick={() => setRequesting(false)}>Cancelar</Button>
                  </div>
                </form>
              ) : (
                <Button className="self-start" onClick={() => setRequesting(true)}>
                  Solicitar relatório
                </Button>
              )}

              {createdRequestId && (
                <Alert tone="success" title="Solicitação enviada">
                  O relatório só será preparado depois que a pessoa confirmar o envio.
                </Alert>
              )}

              {reportRequests.data && reportRequests.data.requests.length > 0 && (
                <div className="flex flex-col gap-2 border-t border-hairline pt-5">
                  <p className="type-eyebrow text-tertiary">Solicitações recentes</p>
                  <ul className="flex flex-col divide-y divide-hairline">
                    {reportRequests.data.requests.slice(0, 3).map((item) => (
                      <li key={item.id} className="flex items-baseline justify-between gap-4 py-2">
                        <span className="type-meta text-tertiary">
                          {formatPeriod(item.period_start, item.period_end)}
                        </span>
                        <span className="type-ui shrink-0 text-ui-sm text-primary">
                          {requestStatus(item.status)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <CheckinControls
              connectionId={connectionId}
              activatedAt={connection.activated_at}
            />
          </div>
        </section>
      )}

      <div className="grid gap-x-6 gap-y-14 lg:grid-cols-12 lg:gap-y-16">
        <div className="flex flex-col gap-14 lg:col-span-8 lg:gap-16">
          <section className="flex flex-col gap-2">
            <SectionIndex meta="do mais recente ao mais antigo">Relatórios recebidos</SectionIndex>

            {contexts.error && <Alert tone="danger">{describeError(contexts.error).message}</Alert>}
            {contexts.isPending && <Skeleton className="h-48" aria-label="Carregando relatórios" />}

            {!contexts.isPending && sortedReports.length === 0 && (
              <div className="flex flex-col gap-2 py-6">
                <h2 className="font-editorial text-h3 text-primary">Nenhum relatório recebido.</h2>
                <p className="text-body text-secondary">
                  Use a ação acima para solicitar um período à pessoa.
                </p>
              </div>
            )}

            {sortedReports.length > 0 && (
              <EditorialList as="ul" className="border-t-0">
                {sortedReports.map((report, index) => (
                  <li key={report.id}>
                    <EditorialRow
                      onClick={() => setSelectedReport(report)}
                      lead={formatDayMark(report.period_end)}
                      title={formatPeriod(report.period_start, report.period_end)}
                      meta={
                        <MetaStrip
                          className="md:justify-end"
                          items={[
                            index === 0 ? "Último relatório" : null,
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
            )}
          </section>

          <section className="flex flex-col gap-2">
            <SectionIndex meta="coletas autorizadas">Check-ins recebidos</SectionIndex>

            {checkinCollections.error && (
              <Alert tone="danger">{describeError(checkinCollections.error).message}</Alert>
            )}
            {checkinCollections.isPending && (
              <Skeleton className="h-40" aria-label="Carregando check-ins recebidos" />
            )}

            {!checkinCollections.isPending &&
              !checkinCollections.error &&
              checkins.length === 0 && (
              <div className="flex flex-col gap-2 py-6">
                <h2 className="font-editorial text-h3 text-primary">Nenhuma coleta recebida.</h2>
                <p className="text-body text-secondary">
                  Solicite uma coleta no bloco de check-ins para receber as médias autorizadas.
                </p>
              </div>
              )}

            {checkins.length > 0 && (
              <EditorialList as="ul" className="border-t-0">
                {checkins.map((collection, index) => (
                  <li key={collection.id}>
                    <EditorialRow
                      onClick={() => setSelectedCheckin(collection)}
                      lead={formatDayMark(collection.shared_at)}
                      title={formatPeriod(collection.period_start, collection.period_end)}
                      meta={
                        <MetaStrip
                          className="md:justify-end"
                          items={[
                            index === 0 ? "Último check-in" : null,
                            `recebido em ${formatDate(collection.shared_at)}`,
                            pluralize(collection.checkins.length, "check-in", "check-ins"),
                          ]}
                        />
                      }
                    >
                      <span className="line-clamp-2">
                        {collection.checkins.map((checkin) => checkin.title).join(" · ")}
                      </span>
                    </EditorialRow>
                  </li>
                ))}
              </EditorialList>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-10 lg:col-span-4 lg:border-l lg:border-hairline lg:pl-8">
          {forSession.length > 0 && (
            <PaperPanel
              family="ochre"
              eyebrow="Para a sessão"
              title="O que a pessoa marcou como prioridade"
            >
              <ul className="flex flex-col gap-4">
                {forSession.map((item) => (
                  <li key={item.id} className="flex flex-col gap-1">
                    <p className="font-editorial text-body-l text-on-panel">{item.title}</p>
                    <p className="type-meta text-on-panel-muted">
                      {itemKindLabel(item.kind)} · {evidenceLabel(item.evidence_strength)}
                    </p>
                  </li>
                ))}
              </ul>
            </PaperPanel>
          )}

          <section className="flex flex-col gap-4">
            <SectionIndex>O que é compartilhado</SectionIndex>
            {connection.consent_scopes.length === 0 ? (
              <p className="text-body text-secondary">Nada autorizado no momento.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-hairline">
                {(["summaries", "events", "marked_topics"] as ConsentScope[]).map((scope) => {
                  const granted = connection.consent_scopes.includes(scope);
                  return (
                    <li key={scope} className="flex items-center justify-between gap-3 py-3">
                      <span className="type-ui min-w-0 text-ui break-words text-primary">
                        {SCOPE_LABEL[scope]}
                      </span>
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
                })}
              </ul>
            )}
            <p className="type-meta text-tertiary">
              O histórico de conversas não é acessível por decisão de produto, não por limitação técnica.
            </p>
          </section>

          {active && (
            <section className="flex flex-col gap-3 border-t border-hairline pt-6">
              <p className="type-eyebrow text-tertiary">Encerrar</p>
              <p className="text-body text-secondary">
                O vínculo termina e os consentimentos são revogados.
              </p>
              <Button variant="danger" className="self-start" onClick={() => setConfirmingEnd(true)}>
                Encerrar acompanhamento
              </Button>
            </section>
          )}
        </aside>
      </div>

      <Modal
        open={selectedReport !== null}
        onClose={() => setSelectedReport(null)}
        title={selectedReport?.title ?? "Relatório"}
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
        open={selectedCheckin !== null}
        onClose={() => setSelectedCheckin(null)}
        title="Check-ins recebidos"
        description={
          selectedCheckin
            ? formatPeriod(selectedCheckin.period_start, selectedCheckin.period_end)
            : undefined
        }
        className="w-[min(56rem,calc(100vw-2rem))]"
        contentClassName="max-h-[calc(100dvh-2rem)] overflow-hidden"
      >
        {selectedCheckin && (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
            <CheckinCollectionView collection={selectedCheckin} />
          </div>
        )}
      </Modal>

      <Modal
        open={confirmingEnd}
        onClose={() => setConfirmingEnd(false)}
        title="Encerrar este acompanhamento?"
        description="O vínculo termina e os consentimentos são revogados. Você deixa de poder solicitar novos relatórios e check-ins."
        footer={
          <>
            <Button variant="text" onClick={() => setConfirmingEnd(false)}>Manter</Button>
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
        {endConnection.error && <Alert tone="danger">{describeError(endConnection.error).message}</Alert>}
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
