"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, Button, GoogleSignInButton, TextField } from "@sinapsa/ui";
import {
  describeError,
  type AppLoginResponse,
  type GoogleChallenge,
} from "@sinapsa/api-client";
import { auth } from "@/lib/api";
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
      })) as AppLoginResponse;
      await establish(response.tokens);
      router.replace("/");
    } catch (caught) {
      setError(describeError(caught).message);
      await refreshGoogleChallenge();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      // O público `app` sempre devolve tokens direto — passkey é do profissional.
      const response = (await auth.login({ email, password })) as AppLoginResponse;
      await establish(response.tokens);
      router.replace("/");
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

  return (
    <AuthCard
      overline="Entrar"
      title="Que bom te ver de novo."
      description="Seu espaço continua exatamente onde você parou."
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
        {/* Erro de entrada é conteúdo crítico: vive na página, não num toast. */}
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
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <TextField
          label="Senha"
          type="password"
          name="password"
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
