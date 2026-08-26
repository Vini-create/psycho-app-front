"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Alert,
  Button,
  Icon,
  MetaStrip,
  Modal,
  Skeleton,
  TextField,
  buttonStyles,
  daysBetween,
  formatDay,
  formatDayPeriod,
  pluralize,
} from "@sinapsa/ui";
import {
  describeError,
  type CheckinAssignment,
  type CheckinTemplate,
} from "@sinapsa/api-client";
import { CheckinTemplateBuilder } from "./CheckinTemplateBuilder";
import {
  useCheckinAssignments,
  useCheckinCollectionRequests,
  useCheckinTemplates,
  useCreateCheckinAssignment,
  useCreateCheckinCollectionRequest,
  useRevokeCheckinAssignment,
  useSubscription,
} from "@/lib/queries";

const MAX_COLLECTION_DAYS = 92;

const ASSIGNMENT_LABEL: Record<CheckinAssignment["status"], string> = {
  pending: "Aguardando a pessoa",
  active: "Respondendo",
  declined: "Recusado",
  revoked: "Encerrado por você",
  ended: "Encerrado pela pessoa",
};

type TemplateEditor = {
  template?: CheckinTemplate;
  sendAfterSave: boolean;
};

function today(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function daysAgo(days: number): string {
  const now = new Date();
  now.setDate(now.getDate() - days);
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function CheckinControls({
  connectionId,
  activatedAt,
}: {
  connectionId: string;
  activatedAt: string | null;
}) {
  const assignments = useCheckinAssignments(connectionId);
  const templates = useCheckinTemplates();
  const requests = useCheckinCollectionRequests(connectionId);
  const assign = useCreateCheckinAssignment(connectionId);
  const revoke = useRevokeCheckinAssignment(connectionId);
  const request = useCreateCheckinCollectionRequest(connectionId);
  const { subscription } = useSubscription();

  const [sending, setSending] = useState(false);
  const [managing, setManaging] = useState(false);
  const [templateEditor, setTemplateEditor] = useState<TemplateEditor | null>(null);
  const [revoking, setRevoking] = useState<CheckinAssignment | null>(null);
  const [asking, setAsking] = useState(false);
  const [start, setStart] = useState(daysAgo(13));
  const [end, setEnd] = useState(today());

  const items = assignments.data?.assignments ?? [];
  const open = items.filter(
    (item) => item.status === "pending" || item.status === "active",
  );
  const closed = items.filter(
    (item) => item.status !== "pending" && item.status !== "active",
  );
  const library = (templates.data?.templates ?? []).filter(
    (template) => template.status !== "archived",
  );
  const pendingRequest = requests.data?.requests.find(
    (item) => item.status === "pending",
  );

  const periodError = ((): string | null => {
    if (!start || !end) return "Informe as duas datas.";
    if (end < start) return "A data final precisa ser depois da inicial.";
    if (daysBetween(start, end) > MAX_COLLECTION_DAYS) {
      return `O período não pode passar de ${MAX_COLLECTION_DAYS} dias.`;
    }
    if (end > today()) return "O período não pode incluir dias que ainda não aconteceram.";
    if (activatedAt && start < activatedAt.slice(0, 10)) {
      return `O período precisa começar depois de ${formatDay(activatedAt.slice(0, 10))}, quando o vínculo foi ativado.`;
    }
    return null;
  })();

  async function submitRequest(event: FormEvent) {
    event.preventDefault();
    if (periodError) return;
    await request.mutateAsync({ period_start: start, period_end: end });
    setAsking(false);
  }

  async function send(template: CheckinTemplate) {
    await assign.mutateAsync(template.id);
    setSending(false);
  }

  async function finishTemplate(templateId: string) {
    if (templateEditor?.sendAfterSave) {
      await assign.mutateAsync(templateId);
      setSending(false);
    }
    setTemplateEditor(null);
  }

  if (assignments.isPending) {
    return <Skeleton className="h-72" aria-label="Carregando check-ins" />;
  }

  return (
    <section className="flex flex-col gap-6 border-t-2 border-accent-sage bg-raised/35 p-5 sm:p-6">
      <header className="flex flex-col gap-2">
        <p className="type-eyebrow text-tertiary">02 · Check-ins</p>
        <h2 className="font-editorial text-h3 text-primary">Acompanhar o dia a dia</h2>
        <p className="text-body text-secondary">
          Crie e envie perguntas diárias ou solicite a coleta de um período já respondido.
        </p>
      </header>

      {assign.error && <Alert tone="danger">{describeError(assign.error).message}</Alert>}
      {revoke.error && <Alert tone="danger">{describeError(revoke.error).message}</Alert>}

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
          Novos check-ins só podem ser enviados com assinatura vigente. O que já foi recebido continua acessível.
        </Alert>
      ) : (
        <>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button onClick={() => setSending(true)}>Enviar novo check-in</Button>
            <Button variant="secondary" onClick={() => setTemplateEditor({ sendAfterSave: false })}>
              <Icon name="add" size={16} />
              Criar modelo
            </Button>
            <Button variant="secondary" onClick={() => setManaging(true)}>
              Editar modelos
            </Button>
            <Button
              variant="secondary"
              disabled={Boolean(pendingRequest)}
              onClick={() => setAsking(true)}
            >
              Solicitar coleta
            </Button>
          </div>

          {(open.length > 0 || pendingRequest) && (
            <div className="flex flex-col gap-3 border-t border-hairline pt-5">
              <p className="type-eyebrow text-tertiary">Em andamento</p>
              {open.map((assignment) => (
                <div key={assignment.id} className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-editorial text-body-l break-words text-primary">
                      {assignment.template.title}
                    </p>
                    <MetaStrip
                      items={[
                        ASSIGNMENT_LABEL[assignment.status],
                        pluralize(assignment.template.questions.length, "pergunta", "perguntas"),
                      ]}
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="text"
                    className="shrink-0 text-destructive hover:text-destructive"
                    onClick={() => setRevoking(assignment)}
                  >
                    Encerrar
                  </Button>
                </div>
              ))}
              {pendingRequest && (
                <div className="border-l-2 border-accent-sage pl-4">
                  <p className="type-ui text-ui text-primary">Coleta aguardando a pessoa</p>
                  <MetaStrip items={[formatDayPeriod(pendingRequest.period_start, pendingRequest.period_end)]} />
                </div>
              )}
            </div>
          )}

          {asking && !pendingRequest && (
            <form onSubmit={submitRequest} className="flex flex-col gap-4 border-t border-hairline pt-5" noValidate>
              <div>
                <p className="type-eyebrow text-tertiary">Solicitar coleta</p>
                <p className="mt-2 text-body text-secondary">
                  A pessoa recebe o período e escolhe quais check-ins envia.
                </p>
              </div>
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
                <Button type="submit" loading={request.isPending} disabled={periodError !== null}>
                  Pedir os check-ins
                </Button>
                <Button variant="text" onClick={() => setAsking(false)}>Cancelar</Button>
              </div>
            </form>
          )}
        </>
      )}

      {closed.length > 0 && (
        <p className="type-meta text-tertiary">
          {pluralize(closed.length, "check-in anterior", "check-ins anteriores")} no histórico.
        </p>
      )}

      <Modal
        open={sending}
        onClose={() => setSending(false)}
        title="Enviar novo check-in"
        description="Escolha um modelo. A pessoa recebe o convite e decide se aceita."
        className="w-[min(46rem,calc(100vw-2rem))]"
        contentClassName="max-h-[calc(100dvh-2rem)] overflow-hidden"
      >
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
          <div className="flex flex-col gap-5">
            {library.length === 0 && (
              <p className="measure text-body text-secondary">Você ainda não criou nenhum modelo.</p>
            )}
            {library.length > 0 && (
              <ul className="flex flex-col divide-y divide-hairline border-y border-hairline">
                {library.map((template) => (
                  <li key={template.id} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 py-4">
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="font-editorial text-body-l break-words text-primary">{template.title}</span>
                      <MetaStrip
                        items={[
                          pluralize(template.questions.length, "pergunta", "perguntas"),
                          template.status === "draft" ? "rascunho" : "publicado",
                        ]}
                      />
                    </div>
                    <Button
                      size="sm"
                      loading={assign.isPending && assign.variables === template.id}
                      onClick={() => send(template)}
                    >
                      Enviar este
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <Button
              variant="secondary"
              className="self-start"
              onClick={() => {
                setSending(false);
                setTemplateEditor({ sendAfterSave: true });
              }}
            >
              <Icon name="add" size={16} />
              Criar e enviar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={managing}
        onClose={() => setManaging(false)}
        title="Modelos de check-in"
        description="Rascunhos podem ser editados. Depois do primeiro envio, o modelo fica preservado como foi respondido."
        className="w-[min(46rem,calc(100vw-2rem))]"
      >
        <div className="flex flex-col gap-5">
          {library.length === 0 ? (
            <p className="text-body text-secondary">Nenhum modelo criado ainda.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-hairline border-y border-hairline">
              {library.map((template) => (
                <li key={template.id} className="flex items-center justify-between gap-5 py-4">
                  <div className="min-w-0">
                    <p className="font-editorial text-body-l break-words text-primary">{template.title}</p>
                    <MetaStrip
                      items={[
                        pluralize(template.questions.length, "pergunta", "perguntas"),
                        template.status === "draft" ? "rascunho editável" : "publicado",
                      ]}
                    />
                  </div>
                  {template.status === "draft" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setManaging(false);
                        setTemplateEditor({ template, sendAfterSave: false });
                      }}
                    >
                      Editar
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <Button
            variant="secondary"
            className="self-start"
            onClick={() => {
              setManaging(false);
              setTemplateEditor({ sendAfterSave: false });
            }}
          >
            <Icon name="add" size={16} />
            Criar modelo
          </Button>
        </div>
      </Modal>

      <Modal
        open={templateEditor !== null}
        onClose={() => setTemplateEditor(null)}
        title={templateEditor?.template ? "Editar modelo" : "Criar modelo de check-in"}
        description={
          templateEditor?.sendAfterSave
            ? "Ao salvar, este modelo será enviado para a pessoa."
            : "Monte perguntas diárias com uma escala simples de 1 a 5."
        }
        className="w-[min(46rem,calc(100vw-2rem))]"
        contentClassName="max-h-[calc(100dvh-2rem)] overflow-hidden"
      >
        {templateEditor && (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
            <CheckinTemplateBuilder
              template={templateEditor.template}
              onSaved={finishTemplate}
              onCancel={() => setTemplateEditor(null)}
            />
          </div>
        )}
      </Modal>

      <Modal
        open={revoking !== null}
        onClose={() => setRevoking(null)}
        title="Encerrar este check-in?"
        description="Ele sai do aplicativo da pessoa imediatamente. O que já foi enviado a você continua no histórico."
        footer={
          <>
            <Button variant="text" onClick={() => setRevoking(null)}>Manter</Button>
            <Button
              variant="danger-solid"
              loading={revoke.isPending}
              onClick={async () => {
                if (revoking) await revoke.mutateAsync(revoking.id);
                setRevoking(null);
              }}
            >
              Encerrar
            </Button>
          </>
        }
      >
        {revoke.error && <Alert tone="danger">{describeError(revoke.error).message}</Alert>}
      </Modal>
    </section>
  );
}
