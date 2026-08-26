"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "react-qr-code";
import { Alert, Button, Icon } from "@sinapsa/ui";
import {
  describeError,
  type IssuedToken,
  type PasskeyCeremony,
} from "@sinapsa/api-client";
import { pro } from "@/lib/api";

export function DeviceAuthorizationChallenge({
  ceremony,
  onAuthorized,
  onUseThisDevice,
  onUseRecovery,
  busy = false,
}: {
  ceremony: PasskeyCeremony;
  onAuthorized: (tokens: IssuedToken) => Promise<void>;
  onUseThisDevice: () => void;
  onUseRecovery: () => void;
  busy?: boolean;
}) {
  const authorization = ceremony.device_authorization;
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(0);

  const approvalURL = useMemo(() => {
    if (!authorization || typeof window === "undefined") return "";
    // O fragmento não é enviado ao servidor que entrega a página nem entra
    // no Referer. O celular o remove da URL assim que abre a autorização.
    return `${window.location.origin}/autorizar-dispositivo#${authorization.scan_token}`;
  }, [authorization]);

  useEffect(() => {
    if (!authorization) return;
    const update = () => {
      setRemaining(
        Math.max(0, Math.ceil((Date.parse(authorization.expires_at) - Date.now()) / 1000)),
      );
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [authorization]);

  useEffect(() => {
    if (!authorization) return;
    let active = true;
    let timer: number | undefined;

    const poll = async () => {
      try {
        const result = await pro.consumeDeviceAuthorization(authorization.poll_token);
        if (!active) return;
        if ("status" in result) {
          timer = window.setTimeout(poll, 2000);
          return;
        }
        await onAuthorized(result);
      } catch (caught) {
        if (!active) return;
        setError(describeError(caught).message);
      }
    };

    timer = window.setTimeout(poll, 1200);
    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [authorization, onAuthorized]);

  if (!authorization) {
    return (
      <div className="flex flex-col gap-5">
        <Alert tone="warning">
          Este acesso foi iniciado antes da autorização por celular estar disponível.
        </Alert>
        <Button size="lg" fullWidth onClick={onUseThisDevice} loading={busy}>
          Usar chave neste dispositivo
        </Button>
        <Button variant="text" onClick={onUseRecovery}>
          Usar código de recuperação
        </Button>
      </div>
    );
  }

  const minutes = Math.floor(remaining / 60);
  const seconds = String(remaining % 60).padStart(2, "0");

  return (
    <div className="flex flex-col gap-6">
      {error && <Alert tone="danger">{error}</Alert>}

      <div className="grid gap-6 rounded-[24px] border border-border-strong bg-raised/55 p-5 shadow-[0_18px_50px_rgba(0,0,0,.18)] sm:grid-cols-[minmax(190px,240px)_1fr] sm:p-6">
        <div className="relative mx-auto aspect-square w-full max-w-[240px]">
          <div className="absolute inset-x-3 top-2 h-full rounded-[18px] border border-hairline bg-sunken" aria-hidden="true" />
          <div className="relative grid h-full place-items-center rounded-[18px] border border-border-strong bg-[#f5f1e8] p-4 shadow-[0_10px_30px_rgba(0,0,0,.22)]">
            {approvalURL && (
              <QRCode
                value={approvalURL}
                size={208}
                level="M"
                bgColor="#f5f1e8"
                fgColor="#171615"
                className="h-auto w-full"
                aria-label="QR code para autorizar este acesso pelo celular"
              />
            )}
          </div>
        </div>

        <div className="flex flex-col justify-center gap-5">
          <div className="flex size-11 items-center justify-center rounded-full border border-border-strong bg-sunken text-primary">
            <Icon name="privacy" size={20} />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="font-editorial text-h3 text-primary">Autorize pelo celular</h2>
            <p className="text-body text-secondary">
              Abra a câmera, escaneie o código e confirme com sua chave de acesso no celular.
            </p>
          </div>
          <div className="border-y border-hairline py-3">
            <p className="type-meta text-tertiary">confira no celular</p>
            <p className="mt-1 font-mono text-2xl tracking-[0.28em] text-primary">
              {authorization.confirmation_code.slice(0, 3)} {authorization.confirmation_code.slice(3)}
            </p>
          </div>
          <div className="flex items-center gap-3 text-ui text-secondary" role="status" aria-live="polite">
            <span className="flex gap-1" aria-hidden="true">
              <span className="size-1.5 animate-pulse rounded-full bg-accent" />
              <span className="size-1.5 animate-pulse rounded-full bg-accent [animation-delay:180ms]" />
              <span className="size-1.5 animate-pulse rounded-full bg-accent [animation-delay:360ms]" />
            </span>
            {remaining > 0 ? `Aguardando · ${minutes}:${seconds}` : "Código expirado"}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="secondary" onClick={onUseThisDevice} loading={busy}>
          Usar chave neste dispositivo
        </Button>
        <Button variant="text" onClick={onUseRecovery}>
          Usar código de recuperação
        </Button>
      </div>

      <p className="type-meta text-tertiary">
        O QR expira em poucos minutos e não contém sua senha, sua passkey nem seus dados de sessão.
      </p>
    </div>
  );
}
