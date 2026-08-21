"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Button, Metadata, TextField } from "@sinapsa/ui";
import { describeError } from "@sinapsa/api-client";
import { auth } from "@/lib/api";
import { AuthCard } from "@/components/AuthCard";

function VerificarEmail() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";

  const [token, setToken] = useState(params.get("token") ?? "");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await auth.confirmEmailVerification(token);
      router.replace("/entrar");
    } catch (caught) {
      setError(describeError(caught).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setError(null);
    setInfo(null);
    try {
      const response = await auth.requestEmailVerification(email);
      // A resposta é genérica de propósito: não revela se a conta existe.
      setInfo("Se essa conta existir, enviamos as instruções para o e-mail.");
      if (response.development_token) setDevToken(response.development_token);
    } catch (caught) {
      setError(describeError(caught).message);
    }
  }

  return (
    <AuthCard
      overline="Confirmar e-mail"
      title="Confirme seu e-mail."
      description={
        email
          ? `Enviamos um código para ${email}. Cole-o abaixo para continuar.`
          : "Cole abaixo o código que enviamos para o seu e-mail."
      }
      footer={
        <Link href="/entrar" className="font-utility font-bold text-brand underline">
          Voltar para entrar
        </Link>
      }
    >
      <form onSubmit={handleConfirm} className="flex flex-col gap-5" noValidate>
        {error && <Alert tone="danger">{error}</Alert>}
        {info && <Alert tone="info">{info}</Alert>}

        {/* Atalho de desenvolvimento: o backend só devolve isto fora de produção. */}
        {devToken && (
          <Alert tone="warning" title="Ambiente de desenvolvimento">
            <Metadata className="break-all text-warning">{devToken}</Metadata>
          </Alert>
        )}

        <TextField
          label="Código de confirmação"
          name="token"
          required
          value={token}
          onChange={(event) => setToken(event.target.value)}
        />

        <Button type="submit" size="lg" fullWidth loading={submitting}>
          Confirmar e-mail
        </Button>

        <Button type="button" variant="tertiary" onClick={handleResend}>
          Reenviar código
        </Button>
      </form>
    </AuthCard>
  );
}

export default function VerificarEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerificarEmail />
    </Suspense>
  );
}
