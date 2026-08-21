"use client";

import { use, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Badge,
  Button,
  buttonStyles,
  Card,
  EmptyState,
  Metadata,
  Modal,
  Overline,
  PageTitle,
  Prose,
  Skeleton,
  TextField,
  formatDate,
  formatPeriod,
} from "@sinapsa/ui";
import {
  describeError,
  type ConsentScope,
  type ContextReport,
} from "@sinapsa/api-client";
import { AppShell } from "@/components/AppShell";
import { AuthGate, MfaGate, OnboardingGate } from "@/components/Gates";
import { ReportView } from "@/components/ReportView";
import { ObservationMap } from "@/components/ReportSignals";
import { previousComparableReport } from "@/lib/report-analytics";
import {
  keys,
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
   * Errar aqui custaria um 422 e uma ida ao servidor à toa.
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
  }

  if (patient.isPending) {
    return <Skeleton className="h-96" aria-label="Carregando paciente" />;
  }

  if (patient.error || !connection) {
    return (
      <Alert tone="danger" title="Paciente indisponível">
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
  const latestReport = sortedReports[0] ?? null;

  return (
    <div className="flex flex-col gap-10 sm:gap-16">
      <header className="flex flex-col gap-3">
        <div>
          <Link
            href="/pacientes"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-surface px-3 font-utility text-label-md font-bold text-primary transition-[background-color,transform] duration-140 hover:bg-subtle active:scale-[0.98]"
            aria-label="Voltar para todos os pacientes"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
              aria-hidden="true"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Voltar
          </Link>
        </div>
        <Overline>Acompanhamento</Overline>
        <div className="flex flex-wrap items-center gap-3">
          <PageTitle>{connection.patient_display_name ?? "Paciente"}</PageTitle>
          <Badge tone={active ? "success" : "neutral"}>
            {active ? "Ativo" : "Encerrado"}
          </Badge>
        </div>
        {connection.activated_at && (
          <Metadata>Desde {formatDate(connection.activated_at)}</Metadata>
        )}
      </header>

      <section className="flex flex-col gap-3">
        <Overline as="h2" className="text-secondary">
          O que este paciente compartilha
        </Overline>
        <div className="flex flex-wrap gap-2">
          {connection.consent_scopes.length === 0 ? (
            <Badge tone="warning">Nada autorizado</Badge>
          ) : (
            connection.consent_scopes.map((scope) => (
              <Badge key={scope} tone="brand">
                {SCOPE_LABEL[scope] ?? scope}
              </Badge>
            ))
          )}
        </div>
        <Prose>
          <p className="text-secondary">
            O histórico de conversas não é acessível — por decisão de produto,
            não por limitação técnica.
          </p>
        </Prose>
      </section>

      {latestReport && (
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <Overline as="h2" className="text-secondary">
                Leitura mais recente
              </Overline>
              <p className="mt-1 font-editorial text-heading-lg text-primary">
                {formatPeriod(latestReport.period_start, latestReport.period_end)}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedReport(latestReport)}
            >
              Abrir relatório
            </Button>
          </div>
          <ObservationMap report={latestReport} compact />
        </section>
      )}

      {active && (
        <section className="flex flex-col gap-4">
          <Overline as="h2" className="text-secondary">
            Solicitar relatório
          </Overline>

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
              Novos relatórios de contexto só podem ser solicitados com uma
              assinatura vigente. O vínculo continua ativo e os relatórios já
              gerados seguem acessíveis abaixo.
            </Alert>
          ) : !hasConsent ? (
            <Alert tone="warning" title="Sem autorização para relatórios">
              Este paciente não autorizou o compartilhamento de relatórios de
              período. Converse com ele — a permissão é revogável e ele pode
              reativá-la a qualquer momento.
            </Alert>
          ) : (
            <Card variant="standard" className="gap-4">
              <form onSubmit={handleRequest} className="flex flex-col gap-4" noValidate>
                {request.error && (
                  <Alert tone="danger">{describeError(request.error).message}</Alert>
                )}

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

                <Button
                  type="submit"
                  loading={request.isPending}
                  disabled={periodError !== null || !canRequest}
                >
                  Enviar solicitação ao paciente
                </Button>
              </form>

              {createdRequestId && (
                <div className="flex flex-col gap-3 border-t border-border-subtle pt-4">
                  <Alert tone="success" title="Solicitação enviada">
                    O período foi enviado para o paciente. A IA só prepara o
                    relatório depois que ele confirmar em Minha rede.
                  </Alert>
                  <div>
                    <Button size="sm" variant="tertiary" onClick={() => setCreatedRequestId(null)}>
                      Fechar aviso
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}

          {reportRequests.data && reportRequests.data.requests.length > 0 && (
            <ul className="flex flex-col gap-2">
              {reportRequests.data.requests.map((item) => (
                <Card key={item.id} as="li" variant="compact" className="gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Metadata>{formatPeriod(item.period_start, item.period_end)}</Metadata>
                    <Badge tone={item.status === "sent" ? "success" : item.status === "pending" ? "warning" : "neutral"}>
                      {item.status === "sent"
                        ? "Relatório recebido"
                        : item.status === "pending"
                          ? "Aguardando paciente"
                          : item.status === "processing"
                            ? "Em preparação"
                            : "Não concluído"}
                    </Badge>
                  </div>
                  <Metadata>Solicitado em {formatDate(item.requested_at)}</Metadata>
                </Card>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="flex flex-col gap-4">
        <Overline as="h2" className="text-secondary">
          Relatórios gerados
        </Overline>

        {contexts.error && (
          <Alert tone="danger">{describeError(contexts.error).message}</Alert>
        )}
        {contexts.isPending && (
          <Skeleton className="h-40" aria-label="Carregando relatórios" />
        )}

        {!contexts.isPending && reports.length === 0 && (
          <EmptyState
            title="Nenhum relatório gerado ainda."
            description="Envie uma solicitação acima. O relatório aparecerá depois que o paciente confirmar o envio em Minha rede."
          />
        )}

        {sortedReports.length > 0 && (
          <ul className="grid gap-3 sm:grid-cols-2">
            {sortedReports.map((report) => (
              <li key={report.id}>
                <button
                  type="button"
                  onClick={() => setSelectedReport(report)}
                  className="group flex min-h-24 w-full items-center justify-between gap-4 rounded-lg bg-card px-4 py-3.5 text-left transition-[background-color,transform] duration-200 ease-sinapsa hover:-translate-y-0.5 hover:bg-brand-surface active:translate-y-0"
                  aria-label={`Abrir relatório do período ${formatPeriod(report.period_start, report.period_end)}`}
                >
                  <div className="min-w-0">
                    <Overline as="span" className="text-brand">
                      Período analisado
                    </Overline>
                    <span className="mt-1 block font-editorial text-heading-md font-semibold leading-tight text-primary">
                      {formatPeriod(report.period_start, report.period_end)}
                    </span>
                    <Metadata className="mt-2 block">
                      Recebido em {formatDate(report.created_at)}
                    </Metadata>
                  </div>
                  <span
                    aria-hidden="true"
                    className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-surface font-utility text-lg text-brand transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {active && (
        <section className="flex flex-col gap-4 border-t border-border-subtle pt-8">
          <Overline as="h2" className="text-secondary">
            Encerrar acompanhamento
          </Overline>
          <div>
            <Button variant="danger" onClick={() => setConfirmingEnd(true)}>
              Encerrar acompanhamento
            </Button>
          </div>
        </section>
      )}

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
        open={confirmingEnd}
        onClose={() => setConfirmingEnd(false)}
        title="Encerrar este acompanhamento?"
        description="O vínculo termina e os consentimentos são revogados. Você deixa de poder solicitar novos relatórios."
        footer={
          <>
            <Button variant="tertiary" onClick={() => setConfirmingEnd(false)}>
              Manter
            </Button>
            <Button
              variant="danger"
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
  return (
    <AuthGate>
      <MfaGate>
        <OnboardingGate>
          <AppShell>
            <Paciente connectionId={connectionId} />
          </AppShell>
        </OnboardingGate>
      </MfaGate>
    </AuthGate>
  );
}
