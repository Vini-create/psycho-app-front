"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@sinapsa/ui";
import { useSession } from "@/lib/session";

/**
 * Todo conteúdo autenticado passa por aqui.
 *
 * O access token vive só em memória, então não existe sessão no servidor para
 * consultar: a decisão acontece no cliente, depois que o refresh cookie foi
 * trocado por um token novo.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/entrar");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div
        role="status"
        className="flex min-h-dvh items-center justify-center gap-3 text-secondary"
      >
        <Spinner className="text-[1.5rem]" />
        <span className="font-utility text-label-md font-bold">
          Abrindo seu espaço…
        </span>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return <>{children}</>;
}
