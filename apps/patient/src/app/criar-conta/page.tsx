"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, Button, TextField } from "@sinapsa/ui";
import { describeError } from "@sinapsa/api-client";
import { auth } from "@/lib/api";
import { AuthCard } from "@/components/AuthCard";

const MIN_PASSWORD = 12;

export default function CriarContaPage() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Validamos antes de enviar para não gastar uma ida ao servidor com o que
  // já sabemos que o backend recusa (senha entre 12 e 128 caracteres).
  const passwordTooShort = password.length > 0 && password.length < MIN_PASSWORD;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (passwordTooShort) return;
    setError(null);
    setSubmitting(true);

    try {
      await auth.register({
        email,
        password,
        display_name: displayName,
      });
      router.push(`/verificar-email?email=${encodeURIComponent(email)}`);
    } catch (caught) {
      setError(describeError(caught).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      overline="Criar conta"
      title="Um espaço só seu."
      description="Você decide o que conversar e, mais tarde, o que compartilhar com seu profissional."
      footer={
        <p className="max-w-none">
          Já tem conta?{" "}
          <Link href="/entrar" className="font-utility font-bold text-brand underline">
            Entrar
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        {error && <Alert tone="danger">{error}</Alert>}

        <TextField
          label="Como podemos te chamar"
          name="display_name"
          autoComplete="name"
          required
          maxLength={120}
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
        />

        <TextField
          label="E-mail"
          type="email"
          name="email"
          autoComplete="email"
          required
          maxLength={254}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <TextField
          label="Senha"
          type="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD}
          maxLength={128}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          help={`Pelo menos ${MIN_PASSWORD} caracteres. Uma frase que só você saiba funciona bem.`}
          error={
            passwordTooShort
              ? `Faltam ${MIN_PASSWORD - password.length} caracteres.`
              : undefined
          }
        />

        <Button type="submit" size="lg" fullWidth loading={submitting}>
          Criar conta
        </Button>
      </form>
    </AuthCard>
  );
}
