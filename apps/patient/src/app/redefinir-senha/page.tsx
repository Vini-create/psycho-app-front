"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Button, TextField } from "@sinapsa/ui";
import { describeError } from "@sinapsa/api-client";
import { auth } from "@/lib/api";
import { AuthCard } from "@/components/AuthCard";

const MIN_PASSWORD = 12;

function RedefinirSenha() {
  const router = useRouter();
  const params = useSearchParams();

  const [token, setToken] = useState(params.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const tooShort = password.length > 0 && password.length < MIN_PASSWORD;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (tooShort) return;
    setError(null);
    setSubmitting(true);
    try {
      await auth.confirmPasswordReset({ token, new_password: password });
      router.replace("/entrar");
    } catch (caught) {
      setError(describeError(caught).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      overline="Nova senha"
      title="Escolha uma senha nova."
      description="Ao confirmar, todas as sessões abertas em outros aparelhos serão encerradas."
      footer={
        <Link href="/entrar" className="touch-target type-ui font-semibold text-accent underline underline-offset-4">
          Voltar para entrar
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        {error && <Alert tone="danger">{error}</Alert>}

        <TextField
          label="Código recebido"
          name="token"
          required
          value={token}
          onChange={(event) => setToken(event.target.value)}
        />

        <TextField
          label="Nova senha"
          type="password"
          name="new_password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD}
          maxLength={128}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          help={`Pelo menos ${MIN_PASSWORD} caracteres.`}
          error={
            tooShort ? `Faltam ${MIN_PASSWORD - password.length} caracteres.` : undefined
          }
        />

        <Button type="submit" size="lg" fullWidth loading={submitting}>
          Salvar nova senha
        </Button>
      </form>
    </AuthCard>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={null}>
      <RedefinirSenha />
    </Suspense>
  );
}
