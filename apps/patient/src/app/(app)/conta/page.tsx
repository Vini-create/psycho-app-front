"use client";

import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardMeta,
  CardTitle,
  Icon,
  Masthead,
  MetaStrip,
  Modal,
  SectionIndex,
  Skeleton,
  TextField,
  describeDevice,
  formatDateTime,
} from "@sinapsa/ui";
import { describeError, hasCode } from "@sinapsa/api-client";
import { auth } from "@/lib/api";
import { useSession } from "@/lib/session";

const MIN_PASSWORD = 12;
const MAX_PASSWORD = 128;

function accountStatusLabel(status: string | undefined) {
  if (status === "active") return "Conta ativa";
  if (status === "pending_verification") return "Verificação pendente";
  if (status === "suspended") return "Conta suspensa";
  return "Status indisponível";
}

function planLabel(plan: string | undefined) {
  if (plan === "pro") return "Plano Pro";
  if (plan === "free") return "Plano gratuito";
  return "Plano não informado";
}

function Conta() {
  const { account, reload, signOut } = useSession();
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState(account?.display_name ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const [revokingSession, setRevokingSession] = useState<string | null>(null);
  const [confirmingLogoutAll, setConfirmingLogoutAll] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const sessions = useQuery({
    queryKey: ["sessions"],
    queryFn: () => auth.listSessions(),
  });

  const normalizedName = displayName.trim().replace(/\s+/g, " ");
  const nameInvalid = normalizedName.length < 1 || normalizedName.length > 120;
  const nameUnchanged = normalizedName === account?.display_name;
  const newPasswordInvalid =
    newPassword.length < MIN_PASSWORD || newPassword.length > MAX_PASSWORD;
  const confirmationInvalid =
    confirmPassword.length > 0 && confirmPassword !== newPassword;
  const passwordFormInvalid =
    currentPassword.length === 0 ||
    newPasswordInvalid ||
    confirmPassword !== newPassword;

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (nameInvalid || nameUnchanged) return;
    setProfileError(null);
    setProfileSaved(false);
    setSavingProfile(true);
    try {
      const updated = await auth.updateAccount({ display_name: normalizedName });
      setDisplayName(updated.display_name);
      await reload();
      setProfileSaved(true);
    } catch (caught) {
      setProfileError(describeError(caught).message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    if (passwordFormInvalid) return;
    setPasswordError(null);
    setPasswordSaved(false);
    setResetSent(false);
    setSavingPassword(true);
    try {
      await auth.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSaved(true);
      await queryClient.invalidateQueries({ queryKey: ["sessions"] });
    } catch (caught) {
      setPasswordError(
        hasCode(caught, "invalid_credentials")
          ? "A senha atual não confere. Tente novamente."
          : describeError(caught).message,
      );
    } finally {
      setSavingPassword(false);
    }
  }

  async function sendPasswordReset() {
    if (!account?.email) return;
    setPasswordError(null);
    setPasswordSaved(false);
    setResetSent(false);
    setSendingReset(true);
    try {
      await auth.requestPasswordReset(account.email);
      setResetSent(true);
    } catch (caught) {
      setPasswordError(describeError(caught).message);
    } finally {
      setSendingReset(false);
    }
  }

  async function revoke(sessionId: string) {
    setActionError(null);
    setRevokingSession(sessionId);
    try {
      await auth.revokeSession(sessionId);
      await queryClient.invalidateQueries({ queryKey: ["sessions"] });
    } catch (caught) {
      setActionError(describeError(caught).message);
    } finally {
      setRevokingSession(null);
    }
  }

  const activeSessions = sessions.data?.sessions ?? [];

  return (
    <div className="flex flex-col gap-12 sm:gap-16">
      <Masthead
        className="reveal pt-2"
        eyebrow="Sua conta"
        tone="editorial"
        deck="Cuide dos seus dados pessoais, da forma como você entra e dos aparelhos que mantêm acesso à sua conta."
        meta={
          <MetaStrip
            className="md:justify-end"
            items={[
              account?.email,
              account?.created_at
                ? `desde ${formatDateTime(account.created_at)}`
                : undefined,
            ]}
          />
        }
      >
        {account?.display_name}
      </Masthead>

      <section className="flex flex-col gap-5">
        <SectionIndex index="01" meta="o que identifica você aqui">
          Dados pessoais
        </SectionIndex>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(17rem,0.65fr)]">
          <Card variant="standard" className="gap-5">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-panel-clay text-primary">
                <Icon name="person" />
              </span>
              <div>
                <CardTitle as="h3">Informações do perfil</CardTitle>
                <CardMeta>Esses dados pertencem somente à sua conta.</CardMeta>
              </div>
            </div>

            {profileError && <Alert tone="danger">{profileError}</Alert>}
            {profileSaved && (
              <Alert tone="success" title="Perfil atualizado">
                Seu nome foi salvo.
              </Alert>
            )}

            <form className="flex flex-col gap-5" onSubmit={saveProfile} noValidate>
              <TextField
                label="Nome"
                name="display_name"
                autoComplete="name"
                value={displayName}
                maxLength={120}
                required
                onChange={(event) => {
                  setDisplayName(event.target.value);
                  setProfileSaved(false);
                }}
                error={nameInvalid ? "Informe um nome entre 1 e 120 caracteres." : undefined}
                help="É assim que vamos chamar você dentro da Sinapsa."
              />
              <TextField
                label="E-mail"
                type="email"
                value={account?.email ?? ""}
                disabled
                help="A troca de e-mail será liberada com confirmação segura do endereço atual e do novo."
              />
              <div>
                <Button
                  type="submit"
                  loading={savingProfile}
                  disabled={nameInvalid || nameUnchanged}
                >
                  Salvar alterações
                </Button>
              </div>
            </form>
          </Card>

          <Card variant="compact" className="gap-5 border border-hairline bg-sunken/45">
            <div>
              <p className="type-eyebrow text-tertiary">Resumo da conta</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone={account?.status === "active" ? "success" : "warning"}>
                  {accountStatusLabel(account?.status)}
                </Badge>
                <Badge tone={account?.email_verified_at ? "success" : "warning"}>
                  {account?.email_verified_at ? "E-mail verificado" : "E-mail pendente"}
                </Badge>
              </div>
            </div>

            <dl className="flex flex-col divide-y divide-hairline border-y border-hairline">
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="type-meta text-tertiary">Acesso</dt>
                <dd className="text-ui text-right text-primary">
                  {account?.google_connected ? "Google conectado" : "E-mail e senha"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="type-meta text-tertiary">Plano</dt>
                <dd className="text-ui text-right text-primary">{planLabel(account?.plan)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="type-meta text-tertiary">Criada em</dt>
                <dd className="text-ui text-right text-primary">
                  {account?.created_at ? formatDateTime(account.created_at) : "Não informado"}
                </dd>
              </div>
            </dl>

            <CardBody className="text-secondary">
              Seu e-mail está protegido e não é compartilhado com profissionais sem uma ação sua.
            </CardBody>
          </Card>
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <SectionIndex index="02" meta="proteção da entrada">
          Senha e acesso
        </SectionIndex>

        <Card variant="standard" className="gap-5">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-panel-lavender text-primary">
              <Icon name="lock" />
            </span>
            <div>
              <CardTitle as="h3">Alterar senha</CardTitle>
              <CardMeta>A nova senha encerra todas as outras sessões abertas.</CardMeta>
            </div>
          </div>

          {passwordError && <Alert tone="danger">{passwordError}</Alert>}
          {passwordSaved && (
            <Alert tone="success" title="Senha atualizada">
              Sua sessão atual continua aberta. Os outros aparelhos foram desconectados.
            </Alert>
          )}
          {resetSent && (
            <Alert tone="success" title="Link enviado">
              Confira a caixa de entrada de {account?.email}.
            </Alert>
          )}

          <form className="grid gap-5 md:grid-cols-2" onSubmit={changePassword} noValidate>
            <TextField
              className="md:col-span-2"
              label="Senha atual"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              required
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
            <TextField
              label="Nova senha"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              minLength={MIN_PASSWORD}
              maxLength={MAX_PASSWORD}
              required
              onChange={(event) => setNewPassword(event.target.value)}
              error={
                newPassword.length > 0 && newPasswordInvalid
                  ? `Use entre ${MIN_PASSWORD} e ${MAX_PASSWORD} caracteres.`
                  : undefined
              }
              help="Uma frase longa que só você saiba funciona bem."
            />
            <TextField
              label="Confirmar nova senha"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              required
              onChange={(event) => setConfirmPassword(event.target.value)}
              error={confirmationInvalid ? "As duas senhas não coincidem." : undefined}
            />
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 md:col-span-2">
              <Button type="submit" loading={savingPassword} disabled={passwordFormInvalid}>
                Atualizar senha
              </Button>
              <Button
                variant="text"
                loading={sendingReset}
                onClick={() => void sendPasswordReset()}
              >
                Não lembro minha senha atual
              </Button>
            </div>
          </form>

          {account?.google_connected && (
            <p className="metadata max-w-none border-t border-hairline pt-4 text-secondary">
              Sua conta também está conectada ao Google. Você pode continuar entrando por lá mesmo depois de trocar a senha.
            </p>
          )}
        </Card>
      </section>

      <section className="flex flex-col gap-5">
        <SectionIndex
          index="03"
          meta={`${activeSessions.length} ${activeSessions.length === 1 ? "acesso ativo" : "acessos ativos"}`}
        >
          Dispositivos conectados
        </SectionIndex>

        {actionError && <Alert tone="danger">{actionError}</Alert>}
        {sessions.isPending && (
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-44" aria-label="Carregando sessões" />
            <Skeleton className="h-44" aria-hidden="true" />
          </div>
        )}
        {sessions.error && (
          <Alert tone="danger">{describeError(sessions.error).message}</Alert>
        )}

        {!sessions.isPending && !sessions.error && activeSessions.length === 0 && (
          <Alert tone="info">Nenhuma sessão ativa foi encontrada.</Alert>
        )}

        <ul className="grid gap-4 md:grid-cols-2">
          {activeSessions.map((session) => {
            const device = describeDevice(session.user_agent);
            return (
              <Card
                key={session.id}
                as="li"
                variant="compact"
                className={session.current_session ? "border border-accent/30 bg-panel-lavender" : "border border-hairline"}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-body-l">{device.label}</CardTitle>
                    <CardMeta>Último acesso {formatDateTime(session.last_used_at)}</CardMeta>
                  </div>
                  {session.current_session && <Badge tone="success">Este aparelho</Badge>}
                </div>

                <details className="group">
                  <summary className="type-meta inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-tertiary transition-colors hover:text-secondary">
                    <Icon name="expand" size={16} className="transition-transform group-open:rotate-180" />
                    Ver detalhes de segurança
                  </summary>
                  <dl className="grid gap-2 border-t border-hairline pt-3 text-ui-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-tertiary">Primeiro acesso</dt>
                      <dd className="text-right text-secondary">{formatDateTime(session.created_at)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-tertiary">Endereço IP</dt>
                      <dd className="text-right text-secondary">{session.last_used_ip || "não informado"}</dd>
                    </div>
                    <div className="pt-1">
                      <dt className="text-tertiary">Identificação enviada pelo navegador</dt>
                      <dd className="type-meta mt-1 break-all text-secondary">
                        {session.user_agent || "não informada"}
                      </dd>
                    </div>
                  </dl>
                </details>

                {!session.current_session && (
                  <div className="mt-auto pt-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={revokingSession === session.id}
                      onClick={() => void revoke(session.id)}
                    >
                      Desconectar aparelho
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </ul>
      </section>

      <section className="flex flex-col gap-5">
        <SectionIndex index="04">Encerrar sessão</SectionIndex>
        <Card variant="standard" className="sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <div className="flex flex-col gap-2">
            <CardTitle as="h3">Você controla onde sua conta fica aberta.</CardTitle>
            <CardBody className="text-secondary">
              Saia somente deste navegador ou encerre todos os acessos de uma vez.
            </CardBody>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Button variant="secondary" onClick={() => void signOut()}>
              Sair deste aparelho
            </Button>
            <Button variant="danger" onClick={() => setConfirmingLogoutAll(true)}>
              Sair de todos
            </Button>
          </div>
        </Card>
      </section>

      <Modal
        open={confirmingLogoutAll}
        onClose={() => setConfirmingLogoutAll(false)}
        title="Sair de todos os aparelhos?"
        description="Todas as sessões abertas serão encerradas, inclusive esta. Você precisará entrar novamente."
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
  return <Conta />;
}
