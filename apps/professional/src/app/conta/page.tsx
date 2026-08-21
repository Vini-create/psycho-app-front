"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardMeta,
  CardTitle,
  Metadata,
  Modal,
  Overline,
  PageTitle,
  Skeleton,
  ThemeToggle,
  buttonStyles,
  formatDateTime,
} from "@sinapsa/ui";
import { describeError } from "@sinapsa/api-client";
import { AppShell } from "@/components/AppShell";
import { AuthGate, MfaGate, OnboardingGate } from "@/components/Gates";
import { auth } from "@/lib/api";
import {
  usePasskeys,
  useRegenerateRecoveryCodes,
  useRemovePasskey,
} from "@/lib/queries";
import { useSession } from "@/lib/session";

const MAX_PASSKEYS = 10;

function Conta() {
  const { account, signOut } = useSession();
  const queryClient = useQueryClient();

  const passkeys = usePasskeys();
  const removePasskey = useRemovePasskey();
  const regenerate = useRegenerateRecoveryCodes();

  const [newCodes, setNewCodes] = useState<string[] | null>(null);
  const [confirmingRegenerate, setConfirmingRegenerate] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const sessions = useQuery({
    queryKey: ["sessions"],
    queryFn: () => auth.listSessions(),
  });

  const passkeyList = passkeys.data?.passkeys ?? [];
  const atLimit = passkeyList.length >= MAX_PASSKEYS;

  async function revokeSession(sessionId: string) {
    setActionError(null);
    try {
      await auth.revokeSession(sessionId);
      await queryClient.invalidateQueries({ queryKey: ["sessions"] });
    } catch (caught) {
      setActionError(describeError(caught).message);
    }
  }

  return (
    <div className="flex flex-col gap-10 sm:gap-16">
      <header className="flex flex-col gap-3">
        <Overline>Conta</Overline>
        <PageTitle>{account?.display_name}</PageTitle>
        <Metadata>{account?.email}</Metadata>
      </header>

      {actionError && <Alert tone="danger">{actionError}</Alert>}

      <section className="flex flex-col gap-4">
        <Overline as="h2" className="text-secondary">
          Perfil
        </Overline>
        <div>
          <Link href="/onboarding" className={buttonStyles({ variant: "secondary" })}>
            Editar perfil profissional
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <Overline as="h2" className="text-secondary">
          Chaves de acesso
        </Overline>

        {passkeys.error && (
          <Alert tone="danger">{describeError(passkeys.error).message}</Alert>
        )}
        {passkeys.isPending && (
          <Skeleton className="h-32" aria-label="Carregando chaves" />
        )}

        <ul className="flex flex-col gap-4">
          {passkeyList.map((passkey) => (
            <Card key={passkey.id} as="li" variant="compact" className="gap-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <CardTitle className="text-body-lg">{passkey.label}</CardTitle>
                {passkeyList.length === 1 && <Badge tone="warning">Única chave</Badge>}
              </div>
              <CardMeta>
                Criada em {formatDateTime(passkey.created_at)}
                {passkey.last_used_at &&
                  ` · usada em ${formatDateTime(passkey.last_used_at)}`}
              </CardMeta>
              <div className="pt-1">
                <Button
                  size="sm"
                  variant="secondary"
                  // A última chave não pode sair: o backend responde
                  // 409 last_passkey. Explicamos em vez de só desabilitar.
                  disabled={passkeyList.length === 1}
                  loading={
                    removePasskey.isPending && removePasskey.variables === passkey.id
                  }
                  onClick={() => removePasskey.mutate(passkey.id)}
                >
                  Remover
                </Button>
              </div>
            </Card>
          ))}
        </ul>

        {passkeyList.length === 1 && (
          <p className="metadata max-w-none text-secondary">
            Cadastre uma segunda chave antes de remover esta — sem nenhuma
            chave você perde o acesso à conta.
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <Link
            href="/passkeys/cadastrar"
            className={buttonStyles({ variant: atLimit ? "secondary" : "primary" })}
            aria-disabled={atLimit}
          >
            Cadastrar outra chave
          </Link>
          <Button variant="secondary" onClick={() => setConfirmingRegenerate(true)}>
            Gerar novos códigos de recuperação
          </Button>
        </div>

        {atLimit && (
          <p className="metadata max-w-none text-secondary">
            Você atingiu o limite de {MAX_PASSKEYS} chaves. Remova uma antes de
            cadastrar outra.
          </p>
        )}

        {newCodes && (
          <Alert tone="warning" title="Novos códigos — mostrados uma única vez">
            <div className="flex flex-col gap-3">
              <ul className="grid gap-2 sm:grid-cols-2">
                {newCodes.map((code) => (
                  <li key={code}>
                    <Metadata className="text-warning">{code}</Metadata>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigator.clipboard.writeText(newCodes.join("\n"))}
                >
                  Copiar códigos
                </Button>
                <Button size="sm" variant="tertiary" onClick={() => setNewCodes(null)}>
                  Já guardei
                </Button>
              </div>
            </div>
          </Alert>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <Overline as="h2" className="text-secondary">
          Sessões ativas
        </Overline>

        {sessions.isPending && (
          <Skeleton className="h-32" aria-label="Carregando sessões" />
        )}

        <ul className="flex flex-col gap-4">
          {sessions.data?.sessions.map((session) => (
            <Card key={session.id} as="li" variant="compact" className="gap-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <CardTitle className="text-body-lg">
                  {session.user_agent || "Aparelho desconhecido"}
                </CardTitle>
                <div className="flex gap-2">
                  {session.mfa_verified && <Badge tone="success">Chave verificada</Badge>}
                  {session.current_session && <Badge tone="brand">Esta sessão</Badge>}
                </div>
              </div>
              <CardMeta>
                Último acesso em {formatDateTime(session.last_used_at)} ·{" "}
                {session.last_used_ip}
              </CardMeta>
              {!session.current_session && (
                <div className="pt-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => revokeSession(session.id)}
                  >
                    Encerrar sessão
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <Overline as="h2" className="text-secondary">
          Aparência
        </Overline>
        <ThemeToggle />
      </section>

      <section className="flex flex-col gap-4 border-t border-border-subtle pt-8">
        <Overline as="h2" className="text-secondary">
          Sair
        </Overline>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={signOut}>
            Sair desta sessão
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              try {
                await auth.logoutAll();
              } catch (caught) {
                setActionError(describeError(caught).message);
              }
              await signOut();
            }}
          >
            Sair de todas as sessões
          </Button>
        </div>
      </section>

      <Modal
        open={confirmingRegenerate}
        onClose={() => setConfirmingRegenerate(false)}
        title="Gerar novos códigos de recuperação?"
        description="Todos os códigos anteriores deixam de funcionar imediatamente. Os novos serão mostrados uma única vez."
        footer={
          <>
            <Button variant="tertiary" onClick={() => setConfirmingRegenerate(false)}>
              Cancelar
            </Button>
            <Button
              loading={regenerate.isPending}
              onClick={async () => {
                const result = await regenerate.mutateAsync();
                setNewCodes(result.recovery_codes);
                setConfirmingRegenerate(false);
              }}
            >
              Gerar novos códigos
            </Button>
          </>
        }
      />
    </div>
  );
}

export default function ContaPage() {
  return (
    <AuthGate>
      <MfaGate>
        <OnboardingGate>
          <AppShell>
            <Conta />
          </AppShell>
        </OnboardingGate>
      </MfaGate>
    </AuthGate>
  );
}
