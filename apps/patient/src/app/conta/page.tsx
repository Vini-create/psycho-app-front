"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  formatDateTime,
} from "@sinapsa/ui";
import { describeError } from "@sinapsa/api-client";
import { AppShell } from "@/components/AppShell";
import { AuthGate } from "@/components/AuthGate";
import { auth } from "@/lib/api";
import { useSession } from "@/lib/session";

function Conta() {
  const { account, signOut } = useSession();
  const queryClient = useQueryClient();
  const [confirmingLogoutAll, setConfirmingLogoutAll] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const sessions = useQuery({
    queryKey: ["sessions"],
    queryFn: () => auth.listSessions(),
  });

  async function revoke(sessionId: string) {
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
          Aparência
        </Overline>
        <ThemeToggle />
        <p className="metadata max-w-none text-secondary">
          A escolha fica guardada neste aparelho.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <Overline as="h2" className="text-secondary">
          Aparelhos conectados
        </Overline>

        {sessions.isPending && (
          <Skeleton className="h-32" aria-label="Carregando sessões" />
        )}

        {sessions.error && (
          <Alert tone="danger">{describeError(sessions.error).message}</Alert>
        )}

        <ul className="flex flex-col gap-4">
          {sessions.data?.sessions.map((session) => (
            <Card key={session.id} as="li" variant="compact" className="gap-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <CardTitle className="text-body-lg">
                  {session.user_agent || "Aparelho desconhecido"}
                </CardTitle>
                {session.current_session && <Badge tone="success">Este aparelho</Badge>}
              </div>
              <CardMeta>
                Último acesso em {formatDateTime(session.last_used_at)} ·{" "}
                {session.last_used_ip}
              </CardMeta>
              {!session.current_session && (
                <div className="pt-1">
                  <Button size="sm" variant="secondary" onClick={() => revoke(session.id)}>
                    Desconectar
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4 border-t border-border-subtle pt-8">
        <Overline as="h2" className="text-secondary">
          Sair
        </Overline>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={signOut}>
            Sair deste aparelho
          </Button>
          <Button variant="danger" onClick={() => setConfirmingLogoutAll(true)}>
            Sair de todos os aparelhos
          </Button>
        </div>
      </section>

      <Modal
        open={confirmingLogoutAll}
        onClose={() => setConfirmingLogoutAll(false)}
        title="Sair de todos os aparelhos?"
        description="Todas as sessões abertas serão encerradas, inclusive esta. Você precisará entrar de novo."
        footer={
          <>
            <Button variant="tertiary" onClick={() => setConfirmingLogoutAll(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                setActionError(null);
                try {
                  await auth.logoutAll();
                } catch (caught) {
                  setActionError(describeError(caught).message);
                }
                await signOut();
              }}
            >
              Sair de tudo
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
      <AppShell>
        <Conta />
      </AppShell>
    </AuthGate>
  );
}
