"use client";

import { useState, type FormEvent } from "react";
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
  TextField,
  formatDate,
  useToast,
  type Tone,
} from "@sinapsa/ui";
import { describeError } from "@sinapsa/api-client";
import { AppShell } from "@/components/AppShell";
import { AuthGate, MfaGate, OnboardingGate } from "@/components/Gates";
import {
  useCreateInvitation,
  useInvitations,
  useRevokeInvitation,
} from "@/lib/queries";

const STATUS: Record<string, { label: string; tone: Tone }> = {
  pending: { label: "Aguardando aceite", tone: "warning" },
  accepted: { label: "Aceito", tone: "success" },
  expired: { label: "Expirado", tone: "neutral" },
  revoked: { label: "Cancelado", tone: "neutral" },
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

  return (
    <div className="flex flex-col gap-10 sm:gap-16">
      <header className="flex flex-col gap-3">
        <Overline>Convites</Overline>
        <PageTitle>Convidar um paciente.</PageTitle>
        <Prose>
          <p>
            O convite precisa ser aceito por uma conta com o mesmo e-mail. Na
            hora de aceitar, o paciente escolhe o que você poderá receber.
          </p>
        </Prose>
      </header>

      <Card variant="standard" className="gap-4">
        <CardTitle>Novo convite</CardTitle>
        <form onSubmit={handleCreate} className="flex flex-col gap-4" noValidate>
          {create.error && (
            <Alert tone="danger">{describeError(create.error).message}</Alert>
          )}
          <TextField
            label="E-mail do paciente"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Button type="submit" loading={create.isPending}>
            Gerar convite
          </Button>
        </form>

        {lastToken && (
          <Alert tone="success" title="Convite criado">
            <div className="flex flex-col gap-3">
              <Metadata className="break-all text-success">
                {inviteLink(lastToken)}
              </Metadata>
              <div>
                <Button size="sm" variant="secondary" onClick={() => copy(lastToken)}>
                  Copiar link
                </Button>
              </div>
            </div>
          </Alert>
        )}
      </Card>

      <section className="flex flex-col gap-4">
        <Overline as="h2" className="text-secondary">
          Convites enviados
        </Overline>

        {error && <Alert tone="danger">{describeError(error).message}</Alert>}
        {isPending && <Skeleton className="h-32" aria-label="Carregando convites" />}

        {!isPending && invitations.length === 0 && (
          <EmptyState
            title="Nenhum convite enviado."
            description="Convites criados aparecem aqui até serem aceitos, expirarem ou serem cancelados."
          />
        )}

        {invitations.length > 0 && (
          <ul className="flex flex-col gap-4">
            {invitations.map((invitation) => {
              const status = STATUS[invitation.status] ?? {
                label: invitation.status,
                tone: "neutral" as Tone,
              };
              return (
                <Card key={invitation.id} as="li" variant="compact" className="gap-2">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <CardTitle className="text-body-lg">{invitation.email}</CardTitle>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </div>
                  <CardMeta>
                    Criado em {formatDate(invitation.created_at)} · expira em{" "}
                    {formatDate(invitation.expires_at)}
                  </CardMeta>
                  {invitation.status === "pending" && (
                    <CardActions>
                      {invitation.invitation_token && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => copy(invitation.invitation_token!)}
                        >
                          Copiar link
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="tertiary"
                        loading={revoke.isPending && revoke.variables === invitation.id}
                        onClick={() => revoke.mutate(invitation.id)}
                      >
                        Cancelar convite
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

export default function ConvitesPage() {
  return (
    <AuthGate>
      <MfaGate>
        <OnboardingGate>
          <AppShell>
            <Convites />
          </AppShell>
        </OnboardingGate>
      </MfaGate>
    </AuthGate>
  );
}
