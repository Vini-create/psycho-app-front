"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, Button, TextField } from "@sinapsa/ui";
import { describeError, type AppLoginResponse } from "@sinapsa/api-client";
import { auth } from "@/lib/api";
import { useSession } from "@/lib/session";
import { AuthCard } from "@/components/AuthCard";

export default function EntrarPage() {
  const router = useRouter();
  const { establish } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
