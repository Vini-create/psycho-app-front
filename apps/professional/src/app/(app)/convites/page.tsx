"use client";

import { useState, type FormEvent } from "react";
import {
  Alert,
  Button,
  EditorialList,
  EditorialRow,
  Icon,
  Masthead,
  MetaStrip,
  SectionIndex,
  Skeleton,
  TextField,
  formatDate,
  pluralize,
  useToast,
} from "@sinapsa/ui";
import { describeError } from "@sinapsa/api-client";
import {
  useCreateInvitation,
  useInvitations,
  useRevokeInvitation,
} from "@/lib/queries";

/* Brand Book V2 §18 e §34 — "Convites: form direto no grid + lista.
   Não: card gigante só para input."

   O V1 tinha um Card inteiro cercando um campo de e-mail e um botão. O §15
   é explícito: "o bloco 'Novo convite' não precisa de um card gigante:
   título + explicação + input + ação podem viver diretamente no grid com
   divisor abaixo."

   Estados sempre com rótulo textual (§18) — aceito, aguardando, expirado,
   cancelado nunca são só uma cor. */

const STATUS: Record<string, { label: string; tint: string }> = {
  pending: { label: "Aguardando aceite", tint: "text-notice" },
  accepted: { label: "Aceito", tint: "text-positive" },
  expired: { label: "Expirado", tint: "text-tertiary" },
  revoked: { label: "Cancelado", tint: "text-tertiary" },
};

/** O backend devolve só o token; o link é montado pelo frontend. */
function inviteLink(token: string): string {
  const patientAppUrl =
    process.env.NEXT_PUBLIC_PATIENT_APP_URL ?? "http://localhost:3000";
  return `${patientAppUrl}/convite/${token}`;
}

function Convites() {
  const { notify } = useToast();
  const { data, isPending, error } = useInvitations();
  const create = useCreateInvitation();
  const revoke = useRevokeInvitation();

  const [email, setEmail] = useState("");
  const [lastToken, setLastToken] = useState<string | null>(null);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    const invitation = await create.mutateAsync(email.trim());
    setEmail("");
    if (invitation.invitation_token) setLastToken(invitation.invitation_token);
  }

  async function copy(token: string) {
    await navigator.clipboard.writeText(inviteLink(token));
    // Confirmação leve e reversível: é exatamente o caso de um toast.
    notify("Link copiado.", "success");
  }

  const invitations = data?.invitations ?? [];
  const pending = invitations.filter((item) => item.status === "pending");

  return (
    <div className="flex flex-col gap-14 sm:gap-16">
      <Masthead
        className="reveal pt-2"
        eyebrow="Convites"
        tone="editorial"
        deck="O convite precisa ser aceito por uma conta com o mesmo e-mail. Na hora de aceitar, a pessoa escolhe o que você poderá receber e pode mudar isso depois."
        meta={
          invitations.length > 0 ? (
            <MetaStrip
              className="md:justify-end"
              items={[
                pluralize(invitations.length, "convite enviado", "convites enviados"),
                pending.length > 0 ? `${pending.length} aguardando` : null,
              ]}
            />
          ) : undefined
        }
      >
        Começar um acompanhamento
      </Masthead>

      {/* Formulário direto no grid: 6 colunas para o campo, o resto respira. */}
      <section className="reveal reveal-1 flex flex-col gap-6 border-b border-hairline pb-12">
        <SectionIndex index="01">Novo convite</SectionIndex>

        <form
          onSubmit={handleCreate}
          className="flex flex-col gap-5 lg:max-w-xl"
          noValidate
        >
          {create.error && (
            <Alert tone="danger">{describeError(create.error).message}</Alert>
          )}

          <TextField
            label="E-mail da pessoa"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <Button type="submit" className="self-start" loading={create.isPending}>
            Gerar convite
          </Button>
        </form>

        {lastToken && (
          <div className="flex flex-col gap-3 border-l-2 border-accent-sage pl-5">
            <p className="type-eyebrow text-ink-sage">Convite criado</p>
            <p className="type-meta break-all text-secondary">
              {inviteLink(lastToken)}
            </p>
            <Button
              size="sm"
              variant="secondary"
              className="self-start"
              startIcon={<Icon name="copy" size={16} />}
              onClick={() => copy(lastToken)}
            >
              Copiar link
            </Button>
          </div>
        )}
      </section>

      <section className="reveal reveal-2 flex flex-col gap-2">
        <SectionIndex index="02" meta="do mais recente ao mais antigo">
          Convites enviados
        </SectionIndex>

        {error && <Alert tone="danger">{describeError(error).message}</Alert>}
        {isPending && <Skeleton className="h-32" aria-label="Carregando convites" />}

        {!isPending && invitations.length === 0 && (
          <div className="flex flex-col items-start gap-4 py-12">
            <h3 className="max-w-[24ch] font-editorial text-h2 text-balance text-primary">
              Nenhum convite enviado ainda.
            </h3>
            <p className="measure text-body-l text-secondary">
              Convites criados aparecem aqui até serem aceitos, expirarem ou
              serem cancelados.
            </p>
          </div>
        )}

        {invitations.length > 0 && (
          <EditorialList as="ul" className="border-t-0">
            {invitations.map((invitation) => {
              const status = STATUS[invitation.status] ?? {
                label: invitation.status,
                tint: "text-tertiary",
              };

              return (
                <li key={invitation.id}>
                  <EditorialRow
                    lead={formatDate(invitation.created_at)}
                    title={
                      <span className="text-h3 break-all">{invitation.email}</span>
                    }
                    badge={
                      <span className={`type-meta ${status.tint}`}>
                        {status.label}
                      </span>
                    }
                    meta={
                      <MetaStrip
                        className="md:justify-end"
                        items={[`expira em ${formatDate(invitation.expires_at)}`]}
                      />
                    }
                    actions={
                      invitation.status === "pending" && (
                        <span className="flex flex-wrap items-center gap-1">
                          {invitation.invitation_token && (
                            <Button
                              size="sm"
                              variant="text"
                              onClick={() => copy(invitation.invitation_token!)}
                            >
                              Copiar link
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="text"
                            className="text-destructive hover:text-destructive"
                            loading={
                              revoke.isPending && revoke.variables === invitation.id
                            }
                            onClick={() => revoke.mutate(invitation.id)}
                          >
                            Cancelar
                          </Button>
                        </span>
                      )
                    }
                  />
                </li>
              );
            })}
          </EditorialList>
        )}
      </section>
    </div>
  );
}

export default function ConvitesPage() {
  return <Convites />;
}
