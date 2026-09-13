"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { PageLoader } from "@sinapsa/ui";
import { useConsents } from "@/lib/queries";

/**
 * Sem os três consentimentos vigentes o backend recusa mensagens com
 * 403 consent_required. Barramos antes, para a pessoa não escrever um
 * desabafo inteiro e só então descobrir que ele não pôde ser enviado.
 */
export function ConsentGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data, isPending } = useConsents();

  useEffect(() => {
    if (data && !data.complete) router.replace("/consentimentos");
  }, [data, router]);

  if (isPending) {
    return (
      <PageLoader
        label="Verificando seus consentimentos…"
        className="min-h-64"
      />
    );
  }

  if (data && !data.complete) return null;

  return <>{children}</>;
}
