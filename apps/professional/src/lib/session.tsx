"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { Account, IssuedToken } from "@sinapsa/api-client";
import { api, auth, setUnauthenticatedHandler } from "./api";

type SessionStatus = "loading" | "authenticated" | "unauthenticated";

type SessionContextValue = {
  status: SessionStatus;
  account: Account | null;
  /**
   * Sessão provou senha mas ainda não provou passkey.
   * Com isso `false`, toda rota profissional responde 403 mfa_required.
   */
  mfaVerified: boolean;
  establish: (tokens: IssuedToken) => Promise<Account>;
  signOut: () => Promise<void>;
  reload: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [account, setAccount] = useState<Account | null>(null);

  const loadAccount = useCallback(async () => {
    const me = await auth.me();
    setAccount(me);
    setStatus("authenticated");
    return me;
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Silencioso: páginas públicas (convite, cadastro, recuperação)
      // não podem ser expulsas para o login só por não haver sessão.
      const token = await api.refresh({ notifyOnFailure: false });
      if (cancelled) return;
      if (!token) {
        setStatus("unauthenticated");
        return;
      }
      try {
        await loadAccount();
      } catch {
        if (!cancelled) setStatus("unauthenticated");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadAccount]);

  useEffect(() => {
    // Só limpamos o estado. Quem navega é o AuthGate, que existe apenas
      // nas páginas protegidas — assim uma sessão perdida não arrasta uma
      // página pública junto.
    setUnauthenticatedHandler(() => {
      setAccount(null);
      setStatus("unauthenticated");
    });
    return () => setUnauthenticatedHandler(null);
  }, []);

  const establish = useCallback(
    async (tokens: IssuedToken) => {
      api.setSession(tokens);
      return loadAccount();
    },
    [loadAccount],
  );

  const signOut = useCallback(async () => {
    try {
      await auth.logout();
    } catch {
      // Best-effort: a sessão local termina aqui de qualquer forma.
    }
    api.clearSession();
    setAccount(null);
    setStatus("unauthenticated");
    router.replace("/entrar");
  }, [router]);

  const reload = useCallback(async () => {
    await loadAccount();
  }, [loadAccount]);

  const value = useMemo(
    () => ({
      status,
      account,
      mfaVerified: account?.mfa_verified ?? false,
      establish,
      signOut,
      reload,
    }),
    [status, account, establish, signOut, reload],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession precisa estar dentro de <SessionProvider>.");
  }
  return context;
}
