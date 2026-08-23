"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Button,
  Icon,
  MetaStrip,
  PaperPanel,
  SectionIndex,
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

/* Brand Book V2 §19 e §31.

   Esta é a tela onde o paciente decide se envia um período. É o momento de
   maior consequência do produto do lado dele, e por isso a composição
   trabalha para uma coisa só: deixar claro o que sai daqui e que a decisão
   é dele.

   O pedido pendente ganha um PaperPanel ochre — a mesma família que marca
   "para a sessão" no lado profissional. Os demais viram linhas silenciosas:
   histórico não compete com decisão. */

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
    return (
      <div className="flex flex-col gap-6 pt-4">
        <Skeleton className="h-16 w-2/3" aria-label="Carregando profissional" />
        <Skeleton className="h-64" />
      </div>
    );
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
  const pendingItems = items.filter((item) => item.status === "pending");
  const history = items.filter((item) => item.status !== "pending");

  return (
    <div className="flex flex-col gap-12 sm:gap-16">
      <header className="reveal flex flex-col gap-6 pt-2">
        <Link
          href="/vinculos"
          className="type-ui inline-flex min-h-11 items-center gap-2 self-start text-ui text-secondary transition-colors hover:text-primary"
        >
          <Icon name="back" size={16} />
          Minha rede
        </Link>

        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-10">
          <div className="flex flex-col gap-3">
            <p className="type-eyebrow text-tertiary">
              {active ? "Acompanhamento ativo" : "Acompanhamento encerrado"}
            </p>
            <h1 className="font-editorial text-h1-editorial text-balance text-primary">
              {connection.professional_display_name ?? "Profissional"}
            </h1>
            {connection.organization_name && (
              <p className="text-body-l text-secondary">
                {connection.organization_name}
              </p>
            )}
          </div>

          <MetaStrip
            className="md:justify-end"
            items={[
              connection.activated_at
                ? `na sua rede desde ${formatDate(connection.activated_at)}`
                : null,
            ]}
          />
        </div>
      </header>

      {requests.error && (
        <Alert tone="danger">{describeError(requests.error).message}</Alert>
      )}
      {send.error && <Alert tone="danger">{describeError(send.error).message}</Alert>}
      {sentId && (
        <Alert tone="success" title="Envio autorizado">
          A Sinapsa está preparando o período solicitado. Quando terminar, o
          contexto será entregue somente a este profissional.
        </Alert>
      )}

      {/* Decisão pendente — o único bloco com peso na tela. */}
      {pendingItems.length > 0 && active && (
        <section className="reveal reveal-1 flex flex-col gap-6">
          <SectionIndex index="01" meta="depende de você">
            Períodos solicitados
          </SectionIndex>

          <div className="flex flex-col gap-5">
            {pendingItems.map((request) => (
              <PaperPanel
                key={request.id}
                family="ochre"
                eyebrow="Período solicitado"
                title={formatPeriod(request.period_start, request.period_end)}
                footer={
                  <div className="flex flex-col gap-4">
                    <p className="measure text-body">
                      Se você enviar, a Sinapsa prepara um contexto desse
                      período e entrega apenas a{" "}
                      {request.professional_display_name ??
                        connection.professional_display_name ??
                        "este profissional"}
                      . O histórico bruto da conversa não vai junto, nunca.
                    </p>
                    <Button
                      size="lg"
                      className="self-start"
                      loading={send.isPending && send.variables === request.id}
                      onClick={async () => {
                        await send.mutateAsync(request.id);
                        setSentId(request.id);
                      }}
                    >
                      Enviar contexto deste período
                    </Button>
                  </div>
                }
              >
                <MetaStrip
                  className="text-on-panel-muted"
                  items={[
                    `pedido em ${formatDate(request.requested_at)}`,
                    "sua decisão",
                  ]}
                />
              </PaperPanel>
            ))}
          </div>
        </section>
      )}

      <section className="reveal reveal-2 flex flex-col gap-4">
        <SectionIndex
          index={pendingItems.length > 0 && active ? "02" : "01"}
          meta="do mais recente ao mais antigo"
        >
          Histórico de solicitações
        </SectionIndex>

        {requests.isPending && (
          <Skeleton className="h-44" aria-label="Carregando solicitações" />
        )}

        {!requests.isPending && items.length === 0 && (
          <div className="flex flex-col items-start gap-4 py-10">
            <h3 className="max-w-[24ch] font-editorial text-h2 text-balance text-primary">
              Nenhuma solicitação por aqui.
            </h3>
            <p className="measure text-body-l text-secondary">
              Quando este profissional pedir um período, ele aparece nesta tela
              e nada é enviado antes de você confirmar.
            </p>
          </div>
        )}

        {history.length > 0 && (
          <ul className="flex flex-col divide-y divide-hairline border-y border-hairline">
            {history.map((request) => (
              <li
                key={request.id}
                className="flex flex-col gap-1.5 py-5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
              >
                <span className="font-editorial text-body-l text-primary">
                  {formatPeriod(request.period_start, request.period_end)}
                </span>
                <span className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="type-ui text-ui-sm text-secondary">
                    {STATUS_LABEL[request.status]}
                  </span>
                  <MetaStrip
                    items={[
                      request.sent_at
                        ? `enviado em ${formatDate(request.sent_at)}`
                        : `pedido em ${formatDate(request.requested_at)}`,
                    ]}
                  />
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="type-meta measure text-tertiary">
        O profissional define o período; você decide se envia. O que sai daqui
        é contexto organizado sobre o que você relatou, nunca a conversa
        original.
      </p>
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
