"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Alert, Button, Metadata, TextField } from "@sinapsa/ui";
import { describeError } from "@sinapsa/api-client";
import { auth } from "@/lib/api";
import { AuthCard } from "@/components/AuthCard";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await auth.requestPasswordReset(email);
      setSent(true);
      if (response.development_token) setDevToken(response.development_token);
    } catch (caught) {
      setError(describeError(caught).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      overline="Recuperar acesso"
      title="Vamos recuperar seu acesso."
      description="Informe seu e-mail e enviaremos um código para criar uma senha nova."
      footer={
        <Link href="/entrar" className="font-utility font-bold text-brand underline">
          Voltar para entrar
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        {error && <Alert tone="danger">{error}</Alert>}

        {sent ? (
          <>
            {/* Resposta deliberadamente genérica: não confirmamos se a conta existe. */}
            <Alert tone="success" title="Enviado">
              Se essa conta existir, as instruções chegarão no e-mail informado.
            </Alert>
            {devToken && (
              <Alert tone="warning" title="Ambiente de desenvolvimento">
                <Metadata className="break-all text-warning">{devToken}</Metadata>
              </Alert>
            )}
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onClick={() => (window.location.href = "/redefinir-senha")}
            >
              Já tenho o código
            </Button>
          </>
        ) : (
          <>
            <TextField
              label="E-mail"
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Button type="submit" size="lg" fullWidth loading={submitting}>
              Enviar instruções
            </Button>
          </>
        )}
      </form>
    </AuthCard>
  );
}
