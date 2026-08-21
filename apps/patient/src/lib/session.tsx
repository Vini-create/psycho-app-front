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
  /** Guarda o token em memória e carrega a conta. */
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

  /**
   * Ao recarregar a página o access token some (ele só vive em memória).
   * O refresh cookie HttpOnly é o que devolve a sessão.
   */
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

  // Refresh falhou no meio da navegação: limpa e volta ao login.
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
      // Logout é best-effort: mesmo falhando, a sessão local termina aqui.
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
    () => ({ status, account, establish, signOut, reload }),
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
