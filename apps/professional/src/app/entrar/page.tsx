"use client";

import { useCallback, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startAuthentication } from "@simplewebauthn/browser";
import { Alert, Button, TextField } from "@sinapsa/ui";
import {
  describeError,
  type PasskeyCeremony,
  type ProfessionalLoginResponse,
} from "@sinapsa/api-client";
import { auth, pro } from "@/lib/api";
import { useSession } from "@/lib/session";
import { AuthCard } from "@/components/AuthCard";
import { GoogleAuthAction } from "@/components/GoogleAuthAction";
import { DeviceAuthorizationChallenge } from "@/components/DeviceAuthorizationChallenge";

export default function EntrarPage() {
  const router = useRouter();
  const { establish } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  /** Guardado só quando o login pede passkey — é o que habilita o plano B. */
  const [ceremony, setCeremony] = useState<PasskeyCeremony | null>(null);
  const [usingRecovery, setUsingRecovery] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");

  const finishLogin = useCallback(async (tokens: Parameters<typeof establish>[0]) => {
    await establish(tokens);
    router.replace("/");
  }, [establish, router]);

  async function runPasskeyCeremony(pending: PasskeyCeremony) {
    // O payload é opaco: entregamos ao WebAuthn como veio. Biometria, PIN,
    // chave física ou aprovação no celular são decisão do sistema operacional.
    const credential = await startAuthentication({
      optionsJSON: pending.public_key as never,
    });
    const tokens = await pro.verifyAuthentication({
      ceremony_token: pending.ceremony_token,
      credential,
    });
    await finishLogin(tokens);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = (await auth.login({
        email,
        password,
      })) as ProfessionalLoginResponse;

      await completePrimaryLogin(response);
    } catch (caught) {
      const described = describeError(caught);
      if (described.action === "verify_email") {
        router.push(`/verificar-email?email=${encodeURIComponent(email)}`);
        return;
      }
      setError(described.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function completePrimaryLogin(response: ProfessionalLoginResponse) {
    if (response.passkey_required) {
      setCeremony(response.passkey_ceremony);
      return;
    }
    // Este token tem mfa=false: serve só para cadastrar a primeira passkey.
    await establish(response.tokens);
    router.replace(response.passkey_enrollment_needed ? "/passkeys/cadastrar" : "/");
  }

  async function handleRecovery(event: FormEvent) {
    event.preventDefault();
    if (!ceremony) return;
    setError(null);
    setSubmitting(true);
    try {
      const tokens = await pro.authenticateWithRecoveryCode({
        ceremony_token: ceremony.ceremony_token,
        recovery_code: recoveryCode.trim(),
      });
      await establish(tokens);
      router.replace("/");
    } catch (caught) {
      setError(describeError(caught).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (ceremony && usingRecovery) {
    return (
      <AuthCard
        overline="Código de recuperação"
        title="Use um código de recuperação."
        description="Cada código funciona uma única vez. Depois de entrar, gere códigos novos."
      >
        <form onSubmit={handleRecovery} className="flex flex-col gap-5" noValidate>
          {error && <Alert tone="danger">{error}</Alert>}
          <TextField
            label="Código de recuperação"
            value={recoveryCode}
            onChange={(event) => setRecoveryCode(event.target.value)}
            required
            autoComplete="one-time-code"
          />
          <Button type="submit" size="lg" fullWidth loading={submitting}>
            Entrar
          </Button>
          <Button
            type="button"
            variant="text"
            onClick={() => setUsingRecovery(false)}
          >
            Voltar e tentar a chave de acesso
          </Button>
        </form>
      </AuthCard>
    );
  }

  if (ceremony) {
    return (
      <AuthCard
        overline="Verificação em duas etapas"
        title="Confirme esta entrada."
        description="Autorize pelo celular onde sua chave de acesso está salva ou use uma alternativa segura."
      >
        {error && <Alert tone="danger">{error}</Alert>}
        <DeviceAuthorizationChallenge
          ceremony={ceremony}
          busy={submitting}
          onAuthorized={finishLogin}
          onUseThisDevice={() => {
            setError(null);
            setSubmitting(true);
            void runPasskeyCeremony(ceremony)
              .catch((caught) => setError(describeError(caught).message))
              .finally(() => setSubmitting(false));
          }}
          onUseRecovery={() => setUsingRecovery(true)}
        />
      </AuthCard>
    );
  }

  return (
    <AuthCard
      overline="Área do profissional"
      title="Entrar."
      description="Contexto organizado sobre o que seus pacientes relataram entre as sessões."
      footer={
        <p className="max-w-none">
          Ainda não tem conta?{" "}
          <Link href="/criar-conta" className="touch-target type-ui font-semibold text-accent underline underline-offset-4">
            Criar conta
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        {error && <Alert tone="danger">{error}</Alert>}

        <GoogleAuthAction
          mode="signin"
          disabled={submitting}
          onPasskeyRequired={(pending) => {
            setError(null);
            setCeremony(pending);
          }}
        />

        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <TextField
          label="Senha"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <Button type="submit" size="lg" fullWidth loading={submitting}>
          Entrar
        </Button>

        <Link
          href="/recuperar-senha"
          className="touch-target self-start type-ui text-ui font-semibold text-accent underline underline-offset-4"
        >
          Esqueci minha senha
        </Link>
      </form>
    </AuthCard>
  );
}
