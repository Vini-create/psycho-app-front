"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Alert,
  Button,
  Icon,
  Masthead,
  MetaStrip,
  Modal,
  Skeleton,
  buttonStyles,
  formatDate,
  pluralize,
} from "@sinapsa/ui";
import { describeError, type Connection, type ConsentScope } from "@sinapsa/api-client";
import { SCOPES, ScopePicker } from "@/components/ScopePicker";
import {
  useConnections,
  useEndConnection,
  useUpdateConnectionConsents,
} from "@/lib/queries";

/* Brand Book V2 §19 e §34 — "Minha rede: relação formal + permissões em
   índice. Não: card corporativo de vínculo."

   Esta tela representa uma relação entre duas pessoas, não uma integração
   de sistema. O V1 era um Card com badges de escopo e três botões lado a
   lado — a mesma forma que o produto usaria para listar webhooks.

   O que a composição precisa dizer, e agora diz pela estrutura:
   quem é a pessoa, desde quando, o que ela recebe, o que ela NÃO recebe, e
   que tudo isso é revogável por quem está lendo. A linguagem toda reforça
   uma coisa: o controle é do paciente. */

const ALL_SCOPES: ConsentScope[] = ["summaries", "events", "marked_topics"];

function scopeLabel(scope: ConsentScope): string {
  return SCOPES.find((item) => item.scope === scope)?.label ?? scope;
}

function ConnectionEntry({ connection }: { connection: Connection }) {
  const update = useUpdateConnectionConsents();
  const end = useEndConnection();

  const [editing, setEditing] = useState(false);
  const [scopes, setScopes] = useState<ConsentScope[]>(connection.consent_scopes);
  const [confirmingEnd, setConfirmingEnd] = useState(false);

  const active = connection.status === "active";
  const connectionId = connection.connection_id ?? connection.id;

  return (
    <li className="flex flex-col gap-8 border-b border-hairline py-10 lg:flex-row lg:gap-12">
      {/* Quem é — 8 colunas de identidade. */}
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <p className="type-eyebrow text-tertiary">
          {active ? "Acompanhamento ativo" : "Acompanhamento encerrado"}
        </p>

        <h2 className="font-editorial text-h2 text-balance text-primary">
          <Link
            href={`/vinculos/${connectionId}`}
            className="touch-target transition-colors duration-140 hover:text-accent"
          >
            {connection.professional_display_name ?? "Profissional"}
          </Link>
        </h2>

        {connection.organization_name && (
          <p className="text-body-l text-secondary">
            {connection.organization_name}
          </p>
        )}

        <MetaStrip
          items={[
            connection.activated_at
              ? `desde ${formatDate(connection.activated_at)}`
              : `criado em ${formatDate(connection.created_at)}`,
            connection.ended_at
              ? `encerrado em ${formatDate(connection.ended_at)}`
              : null,
          ]}
        />

        {active && (
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href={`/vinculos/${connectionId}`}
              className={buttonStyles({ variant: "secondary", size: "sm" })}
            >
              Abrir acompanhamento
            </Link>
            <Button
              size="sm"
              variant="text"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmingEnd(true)}
            >
              Encerrar vínculo
            </Button>
          </div>
        )}
      </div>

      {/* O que é compartilhado — índice de permissões, 4 colunas. */}
      <div className="flex flex-col gap-4 lg:w-80 lg:shrink-0">
        <p className="type-eyebrow text-tertiary">O que esta pessoa recebe</p>

        {editing ? (
          <div className="flex flex-col gap-4">
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
                size="sm"
                loading={update.isPending}
                onClick={async () => {
                  await update.mutateAsync({ connectionId, scopes });
                  setEditing(false);
                }}
              >
                Salvar
              </Button>
              <Button
                size="sm"
                variant="text"
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
            {/* O índice mostra TODOS os escopos, inclusive os negados. Uma
                lista só do que foi concedido esconde a informação mais
                importante da tela: o que a pessoa NÃO recebe. */}
            <ul className="flex flex-col divide-y divide-hairline border-y border-hairline">
              {ALL_SCOPES.map((scope) => {
                const granted = connection.consent_scopes.includes(scope);
                return (
                  <li
                    key={scope}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <span className="type-ui min-w-0 text-ui break-words text-primary">
                      {scopeLabel(scope)}
                    </span>
                    {/* Ícone + palavra: nunca só cor (§29). */}
                    <span
                      className={
                        granted
                          ? "type-meta flex shrink-0 items-center gap-1.5 text-positive"
                          : "type-meta flex shrink-0 items-center gap-1.5 text-tertiary"
                      }
                    >
                      <Icon name={granted ? "confirm" : "close"} size={16} />
                      {granted ? "compartilhado" : "não"}
                    </span>
                  </li>
                );
              })}
            </ul>

            {active && (
              <Button
                size="sm"
                variant="secondary"
                className="self-start"
                onClick={() => setEditing(true)}
              >
                Mudar permissões
              </Button>
            )}

            <p className="type-meta text-tertiary">
              Você pode mudar isso quando quiser. Nada é enviado sem a sua
              confirmação.
            </p>
          </>
        )}
      </div>

      <Modal
        open={confirmingEnd}
        onClose={() => setConfirmingEnd(false)}
        title="Encerrar este vínculo?"
        description="O profissional deixa de enviar novas solicitações. O que você já enviou continua com ele. Suas conversas não são apagadas."
        footer={
          <>
            <Button variant="text" onClick={() => setConfirmingEnd(false)}>
              Manter vínculo
            </Button>
            <Button
              variant="danger-solid"
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
        {end.error && <Alert tone="danger">{describeError(end.error).message}</Alert>}
      </Modal>
    </li>
  );
}

function MinhaRede() {
  const { data, isPending, error } = useConnections();
  const connections = data?.connections ?? [];
  const active = connections.filter((item) => item.status === "active");

  return (
    <div className="flex flex-col gap-12 sm:gap-14">
      <Masthead
        className="reveal pt-2"
        eyebrow="Minha rede"
        tone="editorial"
        deck="Solicitações de contexto aparecem dentro do acompanhamento de quem pediu. Você decide quando enviar. A conversa bruta nunca é compartilhada."
        meta={
          connections.length > 0 ? (
            <MetaStrip
              className="md:justify-end"
              items={[
                pluralize(active.length, "vínculo ativo", "vínculos ativos"),
              ]}
            />
          ) : undefined
        }
      >
        Quem acompanha você
      </Masthead>

      {error && <Alert tone="danger">{describeError(error).message}</Alert>}

      {isPending && <Skeleton className="h-40" aria-label="Carregando vínculos" />}

      {!isPending && connections.length === 0 && (
        <section className="reveal reveal-1 flex flex-col items-start gap-5 py-10">
          <h2 className="max-w-[20ch] font-editorial text-h2 text-balance text-primary">
            Nenhum vínculo ainda.
          </h2>
          <p className="measure text-body-l text-secondary">
            Quando um profissional te convidar, o vínculo aparece aqui depois
            que você aceitar, e só com o que você escolher compartilhar.
          </p>
        </section>
      )}

      {connections.length > 0 && (
        <ul className="reveal reveal-1 flex flex-col border-t border-hairline">
          {connections.map((connection) => (
            <ConnectionEntry key={connection.id} connection={connection} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default function VinculosPage() {
  return <MinhaRede />;
}
