"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardActions,
  CardMeta,
  CardTitle,
  EmptyState,
  Metadata,
  Overline,
  PageTitle,
  Prose,
  Skeleton,
  formatDate,
  formatPeriod,
} from "@sinapsa/ui";
import {
  describeError,
  type ContextReportRequestStatus,
} from "@sinapsa/api-client";
import { AppShell } from "@/components/AppShell";
import { AuthGate } from "@/components/AuthGate";
import {
  useConnections,
  useContextReportRequests,
  useSendRequestedContextReport,
} from "@/lib/queries";

const STATUS_LABEL: Record<ContextReportRequestStatus, string> = {
  pending: "Aguardando você",
  processing: "Em preparação",
  sent: "Enviado",
  declined: "Não enviado",
  expired: "Expirado",
  failed: "Falha no envio",
};

function ProfessionalConnection({ connectionId }: { connectionId: string }) {
  const connections = useConnections();
  const requests = useContextReportRequests(connectionId);
  const send = useSendRequestedContextReport(connectionId);
  const [sentId, setSentId] = useState<string | null>(null);
  const connection = connections.data?.connections.find(
    (item) => item.id === connectionId || item.connection_id === connectionId,
  );

  if (connections.isPending) {
    return <Skeleton className="h-96" aria-label="Carregando profissional" />;
  }

  if (connections.error || !connection) {
    return (
      <Alert tone="danger" title="Profissional indisponível">
        {connections.error
          ? describeError(connections.error).message
          : "Este vínculo não foi encontrado na sua rede."}
      </Alert>
    );
  }

  const active = connection.status === "active";
  const items = requests.data?.requests ?? [];

  return (
    <div className="flex flex-col gap-10 sm:gap-16">
      <header className="flex flex-col gap-3">
        <div>
          <Link
            href="/vinculos"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-surface px-3 font-utility text-label-md font-bold text-primary transition-colors hover:bg-subtle"
            aria-label="Voltar para Minha rede"
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
        <Overline>Profissional conectado</Overline>
        <div className="flex flex-wrap items-center gap-3">
          <PageTitle>
            {connection.professional_display_name ?? "Profissional"}
          </PageTitle>
          <Badge tone={active ? "success" : "neutral"}>
            {active ? "Vínculo ativo" : "Vínculo encerrado"}
          </Badge>
        </div>
        {connection.organization_name && (
          <p className="text-body-lg text-secondary">
            {connection.organization_name}
          </p>
        )}
        {connection.activated_at && (
          <Metadata>Na sua rede desde {formatDate(connection.activated_at)}</Metadata>
        )}
      </header>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Overline as="h2" className="text-secondary">
            Solicitações de relatório
          </Overline>
          <Prose>
            <p>
              O profissional define o período. Ao enviar, a Sinapsa prepara um
              relatório de contexto e o entrega somente a este profissional.
              Você não envia o histórico bruto da conversa.
            </p>
          </Prose>
        </div>

        {requests.error && (
          <Alert tone="danger">{describeError(requests.error).message}</Alert>
        )}
        {send.error && (
          <Alert tone="danger">{describeError(send.error).message}</Alert>
        )}
        {sentId && (
          <Alert tone="success" title="Envio autorizado">
            A Sinapsa está preparando o período solicitado. Quando terminar, o
            relatório será entregue somente a este profissional.
          </Alert>
        )}
        {requests.isPending && (
          <Skeleton className="h-44" aria-label="Carregando solicitações" />
        )}
        {!requests.isPending && items.length === 0 && (
          <EmptyState
            title="Nenhuma solicitação por aqui."
            description="Quando este profissional solicitar um período, ele aparecerá nesta tela."
          />
        )}

        {items.length > 0 && (
          <ul className="flex flex-col gap-4">
            {items.map((request) => {
              const pending = request.status === "pending";
              return (
                <Card
                  key={request.id}
                  as="li"
                  variant={pending ? "editorial" : "standard"}
                  className="gap-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-col gap-2">
                      <Overline>Período solicitado</Overline>
                      <CardTitle>
                        {formatPeriod(request.period_start, request.period_end)}
                      </CardTitle>
                    </div>
                    <Badge tone={pending ? "warning" : request.status === "sent" ? "success" : "neutral"}>
                      {STATUS_LABEL[request.status]}
                    </Badge>
                  </div>

                  <p className="text-body-md text-secondary">
                    Solicitado por {request.professional_display_name ?? connection.professional_display_name ?? "este profissional"}.
                  </p>
                  <CardMeta>
                    Pedido em {formatDate(request.requested_at)}
                    {request.sent_at && ` · enviado em ${formatDate(request.sent_at)}`}
                  </CardMeta>

                  {pending && active && (
                    <CardActions>
                      <Button
                        size="lg"
                        loading={send.isPending && send.variables === request.id}
                        onClick={async () => {
                          await send.mutateAsync(request.id);
                          setSentId(request.id);
                        }}
                      >
                        Enviar relatório de contexto
                      </Button>
                    </CardActions>
                  )}
                </Card>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function ProfessionalConnectionPage({
  params,
}: {
  params: Promise<{ connectionId: string }>;
}) {
  const { connectionId } = use(params);
  return (
    <AuthGate>
      <AppShell>
        <ProfessionalConnection connectionId={connectionId} />
      </AppShell>
    </AuthGate>
  );
}
