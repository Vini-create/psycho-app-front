"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  Alert,
  Icon,
  MetaStrip,
  describeDevice,
  Badge,
  Button,
  Card,
  CardMeta,
  CardTitle,
  Modal,
  Masthead,
  PlanCatalog,
  SectionIndex,
  Skeleton,
  buttonStyles,
  formatDateTime,
  type PlanOption,
} from "@sinapsa/ui";
import { describeError } from "@sinapsa/api-client";
import { auth } from "@/lib/api";
import {
  usePasskeys,
  useProfile,
  useRegenerateRecoveryCodes,
  useRemovePasskey,
} from "@/lib/queries";
import { useSession } from "@/lib/session";

const MAX_PASSKEYS = 10;

const PROFESSIONAL_PLANS: PlanOption[] = [
  {
    code: "free",
    name: "Free",
    price: "R$ 0",
    limit: "Até 2 conexões",
    features: ["Acesso à área profissional", "Sem relatórios e check-ins"],
  },
  {
    code: "plus",
    name: "Plus",
    price: "R$ 64,90",
    cadence: "por mês",
    limit: "Até 7 pacientes",
    features: ["Relatórios de período", "Criação, envio e coleta de check-ins"],
  },
  {
    code: "pro",
    name: "Pro",
    price: "R$ 129,90",
    cadence: "por mês",
    limit: "Até 20 pacientes",
    features: ["Acesso profissional completo", "Relatórios e check-ins"],
    featured: true,
  },
  {
    code: "consultorio",
    name: "Consultório",
    price: "R$ 199,90",
    cadence: "por mês",
    limit: "Até 45 pacientes",
    features: ["Para profissional com agenda cheia", "Relatórios e check-ins"],
  },
  {
    code: "team",
    name: "Team",
    price: "R$ 679,90",
    cadence: "por mês",
    limit: "4 profissionais e até 180 pacientes",
    features: ["Acesso completo para a equipe", "Gestão compartilhada da organização"],
  },
  {
    code: "clinic",
    name: "Clinic",
    price: "Sob orçamento",
    limit: "Capacidade personalizada",
    features: ["Profissionais e pacientes sob medida", "Implantação comercial assistida"],
  },
];

function Conta() {
  const { account, signOut } = useSession();
  const queryClient = useQueryClient();

  const passkeys = usePasskeys();
  const profile = useProfile();
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
        <SectionIndex index="01">Perfil</SectionIndex>
        <div>
          <Link href="/onboarding" className={buttonStyles({ variant: "secondary" })}>
            Editar perfil profissional
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionIndex index="02" meta="catálogo da primeira versão">
          Planos
        </SectionIndex>
        <div className="flex flex-col gap-4">
          <PlanCatalog
            plans={PROFESSIONAL_PLANS}
            currentPlan={profile.data?.plan?.code ?? account?.plan}
          />
          <p className="metadata max-w-none text-secondary">
            Durante a validação inicial, todas as contas profissionais recebem o
            Pro sem cobrança. A troca e a contratação online serão liberadas com
            a integração de pagamentos.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionIndex index="03" meta="entrada sem senha">Chaves de acesso</SectionIndex>

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
                <CardTitle className="text-body-l">{passkey.label}</CardTitle>
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
            Cadastre uma segunda chave antes de remover esta, sem nenhuma
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
          <Alert tone="warning" title="Novos códigos mostrados uma única vez">
            <div className="flex flex-col gap-3">
              <ul className="grid gap-2 sm:grid-cols-2">
                {newCodes.map((code) => (
                  <li key={code}>
                    <span className="type-meta block text-notice">{code}</span>
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
                <Button size="sm" variant="text" onClick={() => setNewCodes(null)}>
                  Já guardei
                </Button>
              </div>
            </div>
          </Alert>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <SectionIndex index="04" meta="você pode encerrar qualquer uma">Sessões ativas</SectionIndex>

        {sessions.isPending && (
          <Skeleton className="h-32" aria-label="Carregando sessões" />
        )}

        {/* §20 — identificação legível primeiro; cabeçalho HTTP em expansão. */}
        <ul className="flex flex-col divide-y divide-hairline border-y border-hairline">
          {sessions.data?.sessions.map((session) => {
            const device = describeDevice(session.user_agent);
            return (
            <li key={session.id} className="flex flex-col gap-2 py-5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="font-editorial text-h3 text-primary">
                  {device.label}
                </span>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  {session.mfa_verified && (
                    <span className="type-meta flex items-center gap-1.5 text-positive">
                      <Icon name="confirm" size={16} />
                      chave verificada
                    </span>
                  )}
                  {session.current_session && (
                    <span className="type-meta text-accent">esta sessão</span>
                  )}
                </div>
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
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => revokeSession(session.id)}
                  >
                    Encerrar sessão
                  </Button>
                </div>
              )}
            </li>
            );
          })}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <SectionIndex index="05">Sair</SectionIndex>
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
            <Button variant="text" onClick={() => setConfirmingRegenerate(false)}>
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
  return <Conta />;
}
