"use client";

import { useEffect, useRef, useState } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import { Alert, Button, Icon } from "@sinapsa/ui";
import {
  describeError,
  type DeviceAuthorizationPreview,
} from "@sinapsa/api-client";
import { AuthCard } from "@/components/AuthCard";
import { pro } from "@/lib/api";

type State = "loading" | "ready" | "approving" | "approved" | "failed";

export default function AutorizarDispositivoPage() {
  const scanTokenRef = useRef("");
  const [preview, setPreview] = useState<DeviceAuthorizationPreview | null>(null);
  const [state, setState] = useState<State>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = window.location.hash.slice(1).trim();
    // Remove o portador de curta duração da barra e do histórico antes de
    // qualquer outra interação. Ele permanece somente neste estado React.
    window.history.replaceState(null, "", window.location.pathname);
    if (!token) {
      queueMicrotask(() => {
        setState("failed");
        setError("Este código de autorização é inválido ou já expirou.");
      });
      return;
    }
    scanTokenRef.current = token;
    let active = true;
    pro.previewDeviceAuthorization(token).then(
      (result) => {
        if (!active) return;
        setPreview(result);
        setState("ready");
      },
      (caught: unknown) => {
        if (!active) return;
        setError(describeError(caught).message);
        setState("failed");
      },
    );
    return () => {
      active = false;
    };
  }, []);

  async function approve() {
    const scanToken = scanTokenRef.current;
    if (!preview || !scanToken) return;
    setState("approving");
    setError(null);
    try {
      const credential = await startAuthentication({
        optionsJSON: preview.public_key as never,
      });
      await pro.approveDeviceAuthorization({
        scan_token: scanToken,
        credential,
      });
      scanTokenRef.current = "";
      setPreview(null);
      setState("approved");
    } catch (caught) {
      setError(describeError(caught).message);
      setState("ready");
    }
  }

  if (state === "approved") {
    return (
      <AuthCard
        overline="Dispositivo autorizado"
        title="Entrada confirmada."
        description="O outro dispositivo já pode continuar. Você pode fechar esta página."
      >
        <div className="flex items-start gap-4 border-t border-hairline pt-6">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-success-surface text-success">
            <Icon name="confirm" size={20} />
          </span>
          <p className="text-body text-secondary">
            Nenhuma senha ou chave privada foi compartilhada com o desktop.
          </p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      overline="Autorização segura"
      title="É você tentando entrar?"
      description="Use a chave de acesso deste celular para confirmar a entrada no outro dispositivo."
    >
      <div className="flex flex-col gap-6">
        {error && <Alert tone="danger">{error}</Alert>}

        <div className="flex items-start gap-4 rounded-sm border border-hairline bg-raised/50 p-5">
          <span className="grid size-11 shrink-0 place-items-center rounded-full border border-border-strong bg-sunken">
            <Icon name="lock" size={20} />
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-ui font-semibold text-primary">Confirmação protegida pela sua passkey</p>
            <p className="text-body text-secondary">
              Confira se você iniciou a entrada. Se não iniciou, feche esta página.
            </p>
          </div>
        </div>

        {preview && (
          <div className="border-y border-hairline py-5 text-center">
            <p className="type-eyebrow text-tertiary">compare com o desktop</p>
            <p className="mt-2 font-mono text-3xl tracking-[0.3em] text-primary">
              {preview.confirmation_code.slice(0, 3)} {preview.confirmation_code.slice(3)}
            </p>
            <p className="mt-3 text-body text-secondary">
              Só continue se este for exatamente o código mostrado no computador.
            </p>
          </div>
        )}

        <Button
          size="lg"
          fullWidth
          loading={state === "loading" || state === "approving"}
          disabled={state !== "ready"}
          onClick={() => void approve()}
          startIcon={<Icon name="privacy" size={20} />}
        >
          Autorizar entrada
        </Button>

        <p className="type-meta text-tertiary">
          A passkey permanece no seu aparelho. O código só aprova esta tentativa e perde a validade após o uso.
        </p>
      </div>
    </AuthCard>
  );
}
