"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startAuthentication } from "@simplewebauthn/browser";
import { Alert, Button, GoogleSignInButton, TextField } from "@sinapsa/ui";
import {
  describeError,
  type GoogleChallenge,
  type PasskeyCeremony,
  type ProfessionalLoginResponse,
} from "@sinapsa/api-client";
import { auth, pro } from "@/lib/api";
import { useSession } from "@/lib/session";
import { AuthCard } from "@/components/AuthCard";

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";

export default function EntrarPage() {
  const router = useRouter();
  const { establish } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleChallenge, setGoogleChallenge] = useState<GoogleChallenge | null>(null);

  /** Guardado só quando o login pede passkey — é o que habilita o plano B. */
  const [ceremony, setCeremony] = useState<PasskeyCeremony | null>(null);
  const [usingRecovery, setUsingRecovery] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");

  useEffect(() => {
    if (!googleClientId) return;
    let active = true;
    auth.googleChallenge().then(
      (challenge) => active && setGoogleChallenge(challenge),
      () => active && setGoogleChallenge(null),
    );
    return () => {
      active = false;
    };
  }, []);

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
    await establish(tokens);
    router.replace("/");
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
      await runPasskeyCeremony(response.passkey_ceremony);
      return;
    }
    // Este token tem mfa=false: serve só para cadastrar a primeira passkey.
    await establish(response.tokens);
    router.replace(response.passkey_enrollment_needed ? "/passkeys/cadastrar" : "/");
  }

  async function refreshGoogleChallenge() {
    if (!googleClientId) return;
    try {
      setGoogleChallenge(await auth.googleChallenge());
    } catch {
      setGoogleChallenge(null);
    }
  }

  async function handleGoogleCredential(credential: string) {
    if (!googleChallenge) return;
    setError(null);
    setSubmitting(true);
    try {
      const response = (await auth.googleLogin({
        challenge_id: googleChallenge.challenge_id,
        credential,
      })) as ProfessionalLoginResponse;
      await completePrimaryLogin(response);
    } catch (caught) {
      setError(describeError(caught).message);
      await refreshGoogleChallenge();
    } finally {
      setSubmitting(false);
    }
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

        {googleChallenge && (
          <>
            <GoogleSignInButton
              clientId={googleClientId}
              nonce={googleChallenge.nonce}
              disabled={submitting}
              onCredential={(credential) => void handleGoogleCredential(credential)}
              onError={() => {
                setError("Não foi possível carregar a entrada com Google.");
                void refreshGoogleChallenge();
              }}
            />
            <div className="flex items-center gap-3 text-ui text-muted" aria-hidden="true">
              <span className="h-px flex-1 bg-hairline" />
              ou entre com e-mail
              <span className="h-px flex-1 bg-hairline" />
            </div>
          </>
        )}

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

        {/* Só oferecemos recuperação depois que o backend pediu passkey. */}
        {ceremony && (
          <div className="flex flex-col gap-3 border-t border-hairline pt-5">
            <Button
              type="button"
              variant="secondary"
              onClick={() => runPasskeyCeremony(ceremony).catch((caught) =>
                setError(describeError(caught).message),
              )}
            >
              Tentar a chave de acesso de novo
            </Button>
            <Button
              type="button"
              variant="text"
              onClick={() => setUsingRecovery(true)}
            >
              Não consigo usar minha chave
            </Button>
          </div>
        )}

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
