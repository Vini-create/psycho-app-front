"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Alert,
  Badge,
  Button,
  buttonStyles,
  Card,
  CardActions,
  CardMeta,
  CardTitle,
  EmptyState,
  Modal,
  Overline,
  PageTitle,
  Prose,
  Skeleton,
  formatDate,
} from "@sinapsa/ui";
import { describeError, type Connection, type ConsentScope } from "@sinapsa/api-client";
import { AppShell } from "@/components/AppShell";
import { AuthGate } from "@/components/AuthGate";
import { SCOPES, ScopePicker } from "@/components/ScopePicker";
import {
  useConnections,
  useEndConnection,
  useUpdateConnectionConsents,
} from "@/lib/queries";

function scopeLabel(scope: ConsentScope): string {
  return SCOPES.find((item) => item.scope === scope)?.label ?? scope;
}

function ConnectionCard({ connection }: { connection: Connection }) {
  const update = useUpdateConnectionConsents();
  const end = useEndConnection();

  const [editing, setEditing] = useState(false);
  const [scopes, setScopes] = useState<ConsentScope[]>(connection.consent_scopes);
  const [confirmingEnd, setConfirmingEnd] = useState(false);

  const active = connection.status === "active";
  const connectionId = connection.connection_id ?? connection.id;

  return (
    <Card as="li" variant="standard" className="gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <CardTitle>
          <Link href={`/vinculos/${connectionId}`} className="hover:italic">
            {connection.professional_display_name ?? "Profissional"}
          </Link>
        </CardTitle>
        <Badge tone={active ? "success" : "neutral"}>
          {active ? "Ativo" : "Encerrado"}
        </Badge>
      </div>

      {connection.organization_name && (
        <p className="text-body-md text-secondary">
          {connection.organization_name}
        </p>
      )}

      {editing ? (
        <div className="flex flex-col gap-4 border-t border-border-subtle pt-4">
          {update.error && (
            <Alert tone="danger">{describeError(update.error).message}</Alert>
          )}
          {/* PUT substitui TODOS os escopos — não é um merge parcial. */}
          <ScopePicker
            selected={scopes}
            onChange={setScopes}
            disabled={update.isPending}
          />
          <div className="flex flex-wrap gap-3">
            <Button
              loading={update.isPending}
              onClick={async () => {
                await update.mutateAsync({ connectionId, scopes });
                setEditing(false);
              }}
            >
              Salvar permissões
            </Button>
            <Button
              variant="tertiary"
              onClick={() => {
                setScopes(connection.consent_scopes);
                setEditing(false);
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {connection.consent_scopes.length === 0 ? (
              <Badge tone="warning">Nada compartilhado</Badge>
            ) : (
              connection.consent_scopes.map((scope) => (
                <Badge key={scope} tone="brand">
                  {scopeLabel(scope)}
                </Badge>
              ))
            )}
          </div>

          <CardMeta>
            {connection.activated_at
              ? `Acompanhamento desde ${formatDate(connection.activated_at)}`
              : `Criado em ${formatDate(connection.created_at)}`}
            {connection.ended_at && ` · encerrado em ${formatDate(connection.ended_at)}`}
          </CardMeta>

          {active && (
            <CardActions>
              <Link href={`/vinculos/${connectionId}`} className={buttonStyles()}>
                Abrir profissional
              </Link>
              <Button variant="secondary" onClick={() => setEditing(true)}>
                Editar permissões
              </Button>
              <Button variant="danger" onClick={() => setConfirmingEnd(true)}>
                Encerrar vínculo
              </Button>
            </CardActions>
          )}
        </>
      )}

      <Modal
        open={confirmingEnd}
        onClose={() => setConfirmingEnd(false)}
        title="Encerrar este vínculo?"
        description="O profissional deixa de enviar novas solicitações. Relatórios já enviados continuam no workspace dele. Suas conversas não são apagadas."
        footer={
          <>
            <Button variant="tertiary" onClick={() => setConfirmingEnd(false)}>
              Manter vínculo
            </Button>
            <Button
              variant="danger"
              loading={end.isPending}
              onClick={async () => {
                await end.mutateAsync(connectionId);
                setConfirmingEnd(false);
              }}
            >
              Encerrar vínculo
            </Button>
          </>
        }
      >
        {end.error && (
          <Alert tone="danger">{describeError(end.error).message}</Alert>
        )}
      </Modal>
    </Card>
  );
}

function MinhaRede() {
  const { data, isPending, error } = useConnections();
  const connections = data?.connections ?? [];

  return (
    <div className="flex flex-col gap-10 sm:gap-16">
      <header className="flex flex-col gap-3">
        <Overline>Minha rede</Overline>
        <PageTitle>Quem acompanha você.</PageTitle>
        <Prose>
          <p>
            Solicitações de relatório aparecem dentro do perfil de quem pediu.
            Você decide quando enviar; a conversa bruta nunca é compartilhada.
          </p>
        </Prose>
      </header>

      {error && <Alert tone="danger">{describeError(error).message}</Alert>}

      {isPending && <Skeleton className="h-40" aria-label="Carregando vínculos" />}

      {!isPending && connections.length === 0 && (
        <EmptyState
          title="Nenhum vínculo ainda."
          description="Quando um profissional te convidar, o vínculo aparece aqui depois que você aceitar."
        />
      )}

      {connections.length > 0 && (
        <ul className="flex flex-col gap-4">
          {connections.map((connection) => (
            <ConnectionCard key={connection.id} connection={connection} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default function VinculosPage() {
  return (
    <AuthGate>
      <AppShell>
        <MinhaRede />
      </AppShell>
    </AuthGate>
  );
}
