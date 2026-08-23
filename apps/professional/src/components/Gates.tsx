"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@sinapsa/ui";
import { useSession } from "@/lib/session";
import { useProfile } from "@/lib/queries";

function Loading({ label }: { label: string }) {
  return (
    <div
      role="status"
      className="flex min-h-dvh items-center justify-center gap-3 text-secondary"
    >
      <Spinner className="text-[1.5rem]" />
      <span className="type-ui text-ui font-semibold">{label}</span>
    </div>
  );
}

export function AuthGate({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/entrar");
  }, [status, router]);

  if (status === "loading") return <Loading label="Carregando…" />;
  if (status === "unauthenticated") return null;
  return <>{children}</>;
}

/**
 * O access token do primeiro login tem mfa=false e não libera nada sensível.
 * Sem este portão, cada rota profissional responderia 403 mfa_required e a
 * pessoa veria uma tela quebrada em vez do caminho para cadastrar a passkey.
 */
export function MfaGate({ children }: { children: ReactNode }) {
  const { mfaVerified, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && !mfaVerified) {
      router.replace("/passkeys/cadastrar");
    }
  }, [status, mfaVerified, router]);

  if (status === "authenticated" && !mfaVerified) return null;
  return <>{children}</>;
}

/** Sem perfil não existe organização, plano nem paciente possível. */
export function OnboardingGate({ children }: { children: ReactNode }) {
  const { data, isPending } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && data === null) router.replace("/onboarding");
  }, [isPending, data, router]);

  if (isPending) return <Loading label="Carregando seu perfil…" />;
  if (data === null) return null;
  return <>{children}</>;
}
