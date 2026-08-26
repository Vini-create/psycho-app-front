"use client";

import { useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  MetaStrip,
  Modal,
  PaperPanel,
  SectionIndex,
  Skeleton,
  formatDate,
  formatDay,
  formatDayPeriod,
  pluralize,
} from "@sinapsa/ui";
import { describeError, type CheckinAssignment } from "@sinapsa/api-client";
import {
  localDay,
  useCheckinAssignments,
  useCheckinCollectionRequests,
  useCheckins,
  useDeclineCheckinCollectionRequest,
  useEndCheckinAssignment,
  useRespondToCheckinAssignment,
  useSendCheckinCollection,
} from "@/lib/queries";

/* As duas decisões que chegam aqui são de naturezas diferentes, e a tela
   precisa manter isso claro:

   - aceitar um check-in é combinar de responder algo todo dia;
   - aceitar uma colheita é entregar o que já foi respondido.

   Aceitar o primeiro não implica o segundo, e é por isso que eles são dois
   painéis, dois botões e dois textos — nunca um passo só. */

function questionSummary(assignment: CheckinAssignment): string {
  const count = assignment.template.questions.length;
  return `${pluralize(count, "pergunta", "perguntas")} · resposta em alternativas`;
}

export function PendingCheckinInvites({
  connectionId,
  index,
}: {
  connectionId: string;
  index: string;
}) {
  const assignments = useCheckinAssignments(connectionId, ["pending"]);
  const respond = useRespondToCheckinAssignment(connectionId);
  const [preview, setPreview] = useState<CheckinAssignment | null>(null);

  const pending = assignments.data?.assignments ?? [];
  if (assignments.isPending || pending.length === 0) return null;

  return (
    <section className="flex flex-col gap-6">
      <SectionIndex index={index} meta="depende de você">
        Check-in diário proposto
      </SectionIndex>

      {respond.error && (
        <Alert tone="danger">{describeError(respond.error).message}</Alert>
      )}

      <div className="flex flex-col gap-5">
        {pending.map((assignment) => (
          <PaperPanel
            key={assignment.id}
            family="sage"
            eyebrow="Novo check-in"
            title={assignment.template.title}
            footer={
              <div className="flex flex-col gap-4">
                <p className="measure text-body">
                  Se você aceitar, este check-in passa a aparecer na sua tela
                  inicial todos os dias. Responder continua sendo escolha sua, e
                  você pode parar quando quiser. As respostas ficam com você até
                  que você autorize um envio.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    size="lg"
                    loading={respond.isPending && respond.variables?.accepted === true}
                    onClick={() =>
                      respond.mutate({ assignmentId: assignment.id, accepted: true })
                    }
                  >
                    Aceitar check-in
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setPreview(assignment)}
                  >
                    Ver as perguntas
                  </Button>
                  <Button
                    variant="text"
                    loading={respond.isPending && respond.variables?.accepted === false}
                    onClick={() =>
                      respond.mutate({ assignmentId: assignment.id, accepted: false })
                    }
                  >
                    Recusar
                  </Button>
                </div>
              </div>
            }
          >
            <MetaStrip
              className="text-on-panel-muted"
              items={[
                `proposto por ${assignment.professional_display_name ?? "seu profissional"}`,
                questionSummary(assignment),
                `em ${formatDate(assignment.requested_at)}`,
              ]}
            />
          </PaperPanel>
        ))}
      </div>

      {/* Aceitar sem ler o que será perguntado não é consentimento. */}
      <Modal
        open={preview !== null}
        onClose={() => setPreview(null)}
        title={preview?.template.title ?? "Check-in"}
        description={preview?.template.legend}
        className="w-[min(40rem,calc(100vw-2rem))]"
      >
        {preview && (
          <ol className="flex flex-col gap-6">
            {preview.template.questions.map((question, position) => (
              <li key={question.id} className="flex flex-col gap-2">
                <span className="type-eyebrow text-tertiary tabular-nums">
                  {String(position + 1).padStart(2, "0")}
                </span>
                <p className="font-editorial text-body-l text-primary">
                  {question.prompt}
                </p>
                {question.legend && (
                  <p className="type-meta measure text-tertiary">{question.legend}</p>
                )}
                <ul className="flex flex-wrap gap-2 pt-1">
                  {question.options.map((option) => (
                    <li
                      key={option.id}
                      className="type-ui rounded-xs bg-inset px-3 py-1.5 text-ui-sm text-secondary"
                    >
                      {option.label}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </Modal>
    </section>
  );
}

export function ActiveCheckins({
  connectionId,
  index,
}: {
  connectionId: string;
  index: string;
}) {
  const assignments = useCheckinAssignments(connectionId, ["active"]);
  const end = useEndCheckinAssignment();
  const [stopping, setStopping] = useState<CheckinAssignment | null>(null);

  const active = assignments.data?.assignments ?? [];
  if (assignments.isPending || active.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <SectionIndex index={index} meta="respondido por você">
        Check-in que você responde
      </SectionIndex>

      <ul className="flex flex-col divide-y divide-hairline border-y border-hairline">
        {active.map((assignment) => (
          <li
            key={assignment.id}
            className="flex flex-col gap-2 py-5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
          >
            <span className="font-editorial text-body-l text-primary">
              {assignment.template.title}
            </span>
            <span className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <MetaStrip
                items={[
                  pluralize(
                    assignment.answered_days,
                    "dia registrado",
                    "dias registrados",
                  ),
                  assignment.last_entry_date
                    ? `último em ${formatDay(assignment.last_entry_date)}`
                    : "nenhum dia ainda",
                ]}
              />
              <Button
                size="sm"
                variant="text"
                className="text-destructive hover:text-destructive"
                onClick={() => setStopping(assignment)}
              >
                Parar de responder
              </Button>
            </span>
          </li>
        ))}
      </ul>

      <Modal
        open={stopping !== null}
        onClose={() => setStopping(null)}
        title="Parar de responder este check-in?"
        description="Ele sai da sua tela inicial. Os dias que você já respondeu continuam com você, e o que já foi enviado continua com quem recebeu."
        footer={
          <>
            <Button variant="text" onClick={() => setStopping(null)}>
              Continuar respondendo
            </Button>
            <Button
              variant="danger-solid"
              loading={end.isPending}
              onClick={async () => {
                if (stopping) await end.mutateAsync(stopping.id);
                setStopping(null);
              }}
            >
              Parar
            </Button>
          </>
        }
      >
        {end.error && <Alert tone="danger">{describeError(end.error).message}</Alert>}
      </Modal>
    </section>
  );
}

export function CheckinCollectionRequests({
  connectionId,
  index,
}: {
  connectionId: string;
  index: string;
}) {
  const requests = useCheckinCollectionRequests(connectionId);
  const checkins = useCheckins(localDay());
  const send = useSendCheckinCollection(connectionId);
  const decline = useDeclineCheckinCollectionRequest(connectionId);

  const [choosing, setChoosing] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [sentId, setSentId] = useState<string | null>(null);

  const items = requests.data?.requests ?? [];
  const pending = items.filter((item) => item.status === "pending");
  const available = checkins.data?.checkins ?? [];

  if (requests.isPending) {
    return <Skeleton className="h-32" aria-label="Carregando pedidos de check-in" />;
  }
  if (pending.length === 0 && !sentId) return null;

  // Depois do envio a decisão deixa de existir, mas a confirmação precisa
  // continuar visível. Sem seção, para não abrir um índice vazio.
  if (pending.length === 0) {
    return (
      <Alert tone="success" title="Check-ins enviados">
        Este profissional recebeu as médias do período e os dias respondidos dos
        check-ins que você marcou. Nada além disso foi enviado.
      </Alert>
    );
  }

  function openChooser(requestId: string) {
    // Pré-seleção: os check-ins de quem está pedindo. É o palpite óbvio, e
    // continua sendo uma escolha — dá para desmarcar e para incluir outros.
    setSelected(
      available
        .filter((item) => item.connection_id === connectionId)
        .map((item) => item.id),
    );
    setChoosing(requestId);
  }

  return (
    <section className="flex flex-col gap-6">
      <SectionIndex index={index} meta="depende de você">
        Envio dos check-ins
      </SectionIndex>

      {send.error && <Alert tone="danger">{describeError(send.error).message}</Alert>}
      {sentId && (
        <Alert tone="success" title="Check-ins enviados">
          Este profissional recebeu as médias do período e os dias respondidos
          dos check-ins que você marcou. Nada além disso foi enviado.
        </Alert>
      )}

      {pending.map((request) => (
        <PaperPanel
          key={request.id}
          family="ochre"
          eyebrow="Período solicitado"
          title={formatDayPeriod(request.period_start, request.period_end)}
          footer={
            <div className="flex flex-col gap-4">
              <p className="measure text-body">
                {request.professional_display_name ?? "Este profissional"} pediu
                para ver seus check-ins deste período. Você escolhe quais envia,
                inclusive os de outros profissionais — e quem recebe vê médias e
                dias respondidos, não o que você escreveu em conversa.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="lg" onClick={() => openChooser(request.id)}>
                  Escolher o que enviar
                </Button>
                <Button
                  variant="text"
                  loading={decline.isPending}
                  onClick={() => decline.mutate(request.id)}
                >
                  Não enviar
                </Button>
              </div>
            </div>
          }
        >
          <MetaStrip
            className="text-on-panel-muted"
            items={[`pedido em ${formatDate(request.requested_at)}`, "sua decisão"]}
          />
        </PaperPanel>
      ))}

      <Modal
        open={choosing !== null}
        onClose={() => setChoosing(null)}
        title="Quais check-ins você quer enviar?"
        description="Marque o que este profissional pode receber deste período. O que ficar desmarcado continua só com você."
        className="w-[min(38rem,calc(100vw-2rem))]"
        footer={
          <>
            <Button variant="text" onClick={() => setChoosing(null)}>
              Cancelar
            </Button>
            <Button
              loading={send.isPending}
              disabled={selected.length === 0}
              onClick={async () => {
                if (!choosing) return;
                await send.mutateAsync({
                  requestId: choosing,
                  assignmentIds: selected,
                });
                setSentId(choosing);
                setChoosing(null);
              }}
            >
              Enviar {pluralize(selected.length, "check-in", "check-ins")}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-2">
          {available.length === 0 && (
            <p className="measure text-body text-secondary">
              Você não tem check-ins ativos para enviar.
            </p>
          )}
          {available.map((assignment) => (
            <Checkbox
              key={assignment.id}
              checked={selected.includes(assignment.id)}
              onChange={(event) =>
                setSelected((current) =>
                  event.target.checked
                    ? [...current, assignment.id]
                    : current.filter((id) => id !== assignment.id),
                )
              }
              label={assignment.template.title}
              /* O nome de quem propôs cada check-in é o que torna a escolha
                 informada quando há mais de um profissional envolvido. */
              help={`${assignment.professional_display_name ?? "Profissional"} · ${pluralize(
                assignment.answered_days,
                "dia registrado",
                "dias registrados",
              )}`}
            />
          ))}
        </div>
      </Modal>
    </section>
  );
}
