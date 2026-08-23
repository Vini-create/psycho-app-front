"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Icon,
  MetaStrip,
  describeDevice,
  Button,
  Masthead,
  Modal,
  SectionIndex,
  Skeleton,
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
    <div className="flex flex-col gap-12 sm:gap-14">
      <Masthead
        className="reveal pt-2"
        eyebrow="Conta"
        tone="editorial"
        meta={<MetaStrip className="md:justify-end" items={[account?.email]} />}
      >
        {account?.display_name}
      </Masthead>

      {actionError && <Alert tone="danger">{actionError}</Alert>}

      <section className="flex flex-col gap-4">
        <SectionIndex index="01" meta="você pode desconectar qualquer um">
          Aparelhos conectados
        </SectionIndex>

        {sessions.isPending && (
          <Skeleton className="h-32" aria-label="Carregando sessões" />
        )}

        {sessions.error && (
          <Alert tone="danger">{describeError(sessions.error).message}</Alert>
        )}

        {/* §20 — a identificação principal é legível; o user-agent cru vive
            em expansão secundária, para quem precisar auditar de verdade. */}
        <ul className="flex flex-col divide-y divide-hairline border-y border-hairline">
          {sessions.data?.sessions.map((session) => {
            const device = describeDevice(session.user_agent);
            return (
              <li key={session.id} className="flex flex-col gap-2 py-5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <span className="font-editorial text-h3 text-primary">
                    {device.label}
                  </span>
                  {session.current_session && (
                    <span className="type-meta flex items-center gap-1.5 text-positive">
                      <Icon name="confirm" size={16} />
                      este aparelho
                    </span>
                  )}
                </div>

                <MetaStrip
                  items={[
                    `último acesso ${formatDateTime(session.last_used_at)}`,
                    session.last_used_ip,
                  ]}
                />

                <details className="group">
                  <summary className="type-meta inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-tertiary transition-colors hover:text-secondary">
                    <Icon name="expand" size={16} className="transition-transform group-open:rotate-180" />
                    Detalhes técnicos
                  </summary>
                  <p className="type-meta pt-1 break-all text-tertiary">
                    {session.user_agent || "sem identificação enviada"}
                  </p>
                </details>

                {!session.current_session && (
                  <div className="pt-1">
                    <Button size="sm" variant="secondary" onClick={() => revoke(session.id)}>
                      Desconectar
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <SectionIndex index="02">Sair</SectionIndex>
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
            <Button variant="text" onClick={() => setConfirmingLogoutAll(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger-solid"
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
