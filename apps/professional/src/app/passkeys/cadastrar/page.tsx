"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startRegistration } from "@simplewebauthn/browser";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardTitle,
  Checkbox,
  Metadata,
  Overline,
  Prose,
  TextField,
} from "@sinapsa/ui";
import { describeError } from "@sinapsa/api-client";
import { api, pro } from "@/lib/api";
import { useSession } from "@/lib/session";
import { AuthCard } from "@/components/AuthCard";
import { AuthGate } from "@/components/Gates";

function defaultLabel(): string {
  if (typeof navigator === "undefined") return "Este aparelho";
  const ua = navigator.userAgent;
  if (/Macintosh/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows";
  if (/iPhone|iPad/.test(ua)) return "iPhone";
  if (/Android/.test(ua)) return "Android";
  return "Este aparelho";
}

function CadastrarPasskey() {
  const router = useRouter();
  const { reload } = useSession();

  const [label, setLabel] = useState(defaultLabel);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [savedConfirmed, setSavedConfirmed] = useState(false);

  async function handleRegister() {
    setError(null);
    setSubmitting(true);
    try {
      const options = await pro.registrationOptions();

      // O browser decide a forma: biometria, PIN, chave física ou celular.
      const credential = await startRegistration({
        optionsJSON: options.public_key as never,
      });

      const result = await pro.verifyRegistration({
        ceremony_token: options.ceremony_token,
        label: label.trim() || defaultLabel(),
        credential,
      });

      /**
       * ESTE é o passo que não pode ser esquecido: o token retornado tem
       * mfa=true. Sem trocá-lo em memória agora, toda rota profissional
       * seguinte responderia 403 mfa_required.
       */
      api.setSession({
        access_token: result.access_token,
        token_type: result.token_type,
        expires_at: result.expires_at,
      });
      await reload();

      if (result.recovery_codes?.length) {
        // Só aparecem uma vez, no cadastro da primeira passkey.
        setRecoveryCodes(result.recovery_codes);
      } else {
        router.replace("/");
      }
    } catch (caught) {
      // O usuário cancelar o diálogo do navegador não é falha do sistema.
      if (caught instanceof Error && caught.name === "NotAllowedError") {
        setError("O cadastro foi cancelado. Tente novamente quando quiser.");
      } else {
        setError(describeError(caught).message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (recoveryCodes) {
    return (
      <AuthCard
        overline="Etapa essencial de segurança"
        title="Seus códigos de recuperação."
        description="Salve estes códigos em um gerenciador de senhas antes de continuar. Eles permitem recuperar o acesso se você perder sua chave de acesso, inclusive ao trocar de celular."
      >
        <div className="flex flex-col gap-6">
          <Alert tone="warning" title="Sem a chave e sem os códigos, você pode perder o acesso à conta">
            Guardar estes códigos é essencial. Se você perder o acesso à sua
            chave e não tiver os códigos, pode não ser possível recuperar sua
            conta. Eles são mostrados uma única vez: salve-os em um gerenciador
            de senhas ao qual consiga acessar mesmo sem este celular. Não
            compartilhe seus códigos com outras pessoas.
          </Alert>

          <p className="text-body text-secondary">
            Você não precisa decorar estes códigos nem usá-los a cada entrada.
            No dia a dia, continue usando sua chave de acesso com a digital,
            o rosto ou o bloqueio de tela do aparelho. Os códigos são uma
            alternativa de emergência.
          </p>

          <Card variant="standard">
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {recoveryCodes.map((code) => (
                <li key={code}>
                  <Metadata className="text-primary">{code}</Metadata>
                </li>
              ))}
            </ul>
          </Card>

          <Button
            variant="secondary"
            onClick={() => navigator.clipboard.writeText(recoveryCodes.join("\n"))}
          >
            Copiar códigos
          </Button>

          <Checkbox
            checked={savedConfirmed}
            onChange={(event) => setSavedConfirmed(event.target.checked)}
            label="Salvei meus códigos em um gerenciador de senhas ou outro local seguro e entendo que, sem eles e sem minha chave, posso perder o acesso à conta."
          />

          <Button
            size="lg"
            disabled={!savedConfirmed}
            onClick={() => router.replace("/onboarding")}
          >
            Continuar
          </Button>
          {!savedConfirmed && (
            <p className="metadata max-w-none text-secondary">
              Salve os códigos e confirme acima para continuar.
            </p>
          )}
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      overline="Segurança"
      title="Cadastre sua chave de acesso."
      description="Você trabalha com dados sensíveis. A chave de acesso é o segundo fator obrigatório e substitui códigos por SMS."
    >
      <div className="flex flex-col gap-6">
        {error && <Alert tone="danger">{error}</Alert>}

        <Card variant="editorial" className="gap-3">
          <Overline>Como funciona</Overline>
          <CardTitle>Seu aparelho decide a forma.</CardTitle>
          <CardBody>
            <Prose>
              <p>
                Ao continuar, o navegador vai pedir sua digital, seu rosto, o
                PIN do aparelho ou uma chave física. Nada disso é enviado para
                nós. Recebemos apenas a confirmação.
              </p>
            </Prose>
          </CardBody>
        </Card>

        <TextField
          label="Nome deste aparelho"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          help="Ajuda a reconhecer a chave depois, na lista de aparelhos."
        />

        <Button size="lg" fullWidth loading={submitting} onClick={handleRegister}>
          Cadastrar chave de acesso
        </Button>
      </div>
    </AuthCard>
  );
}

export default function CadastrarPasskeyPage() {
  return (
    <AuthGate>
      <CadastrarPasskey />
    </AuthGate>
  );
}
