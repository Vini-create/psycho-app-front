import { ApiError } from "./errors";
import type { Audience, IssuedToken } from "./types";

export type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  /**
   * Chave de idempotência. Gere UMA por ação de envio e reuse nos retries
   * de rede — nunca uma por tentativa, senão o backend cria duplicatas.
   */
  idempotencyKey?: string;
  /** Rotas públicas (preview de convite, refresh, login). */
  skipAuth?: boolean;
};

export type ApiClient = ReturnType<typeof createApiClient>;

/**
 * Resolve e valida a origem pública da API antes de ela ser embutida no bundle.
 * Em produção não aceitamos o fallback local silencioso: a plataforma de
 * deploy precisa declarar NEXT_PUBLIC_API_URL explicitamente.
 */
export function resolveApiBaseUrl(
  configuredValue: string | undefined,
  environment: string | undefined,
): string {
  const value = configuredValue?.trim();
  if (!value) {
    if (environment === "production") {
      throw new Error("NEXT_PUBLIC_API_URL is required in production");
    }
    return "http://localhost:8080";
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("NEXT_PUBLIC_API_URL must be a valid absolute URL");
  }

  if (
    (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
    parsed.username !== "" ||
    parsed.password !== "" ||
    parsed.pathname !== "/" ||
    parsed.search !== "" ||
    parsed.hash !== ""
  ) {
    throw new Error("NEXT_PUBLIC_API_URL must be an HTTP(S) origin without path, query, or credentials");
  }

  return parsed.origin;
}

export function createApiClient({
  baseUrl,
  audience,
  onUnauthenticated,
  fetchImpl,
}: {
  baseUrl: string;
  audience: Audience;
  /** Chamado quando o refresh falha: limpe o estado e vá ao login. */
  onUnauthenticated?: () => void;
  /**
   * Transporte alternativo. Existe por causa do modo de desenho, que injeta
   * um fetch falso aqui para que TODO o resto — single-flight, mapa de erros,
   * gates, telas — rode exatamente como em produção.
   */
  fetchImpl?: typeof fetch;
}) {
  const doFetch: typeof fetch = fetchImpl ?? ((...args) => fetch(...args));
  /**
   * O access token vive AQUI e só aqui: uma closure de módulo.
   *
   * Nada de localStorage, sessionStorage ou cookie criado por JavaScript —
   * exigência do contrato. O refresh token é opaco e HttpOnly; o JavaScript
   * nunca o lê, só garante `credentials: "include"` para o cookie circular.
   */
  let accessToken: string | null = null;
  let expiresAt: number | null = null;

  /** Uma única chamada a /refresh, por mais 401 simultâneos que apareçam. */
  let refreshInFlight: Promise<string | null> | null = null;

  function setSession(token: IssuedToken | null): void {
    accessToken = token?.access_token ?? null;
    expiresAt = token ? Date.parse(token.expires_at) : null;
  }

  function clearSession(): void {
    accessToken = null;
    expiresAt = null;
  }

  function getAccessToken(): string | null {
    return accessToken;
  }

  function isAuthenticated(): boolean {
    return accessToken !== null;
  }

  /** Margem de 5s para não enviar um token que expira no voo. */
  function isExpired(): boolean {
    return expiresAt !== null && Date.now() >= expiresAt - 5_000;
  }

  /**
   * `notifyOnFailure: false` para a restauração de sessão no carregamento da
   * página: "não havia sessão" é um estado normal ali, não uma sessão perdida.
   * Avisar o app nesse caso empurraria até as páginas públicas para o login.
   */
  async function refresh(
    options: { notifyOnFailure?: boolean } = {},
  ): Promise<string | null> {
    const notifyOnFailure = options.notifyOnFailure ?? true;
    if (refreshInFlight) return refreshInFlight;

    const promise = (async () => {
      try {
        const response = await doFetch(
          `${baseUrl}/v1/${audience}/auth/refresh`,
          { method: "POST", credentials: "include" },
        );
        if (!response.ok) {
          clearSession();
          if (notifyOnFailure) onUnauthenticated?.();
          return null;
        }
        // A rota de refresh devolve o token direto, sem wrapper `tokens`.
        const token = (await response.json()) as IssuedToken;
        setSession(token);
        return token.access_token;
      } catch {
        clearSession();
        if (notifyOnFailure) onUnauthenticated?.();
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();

    refreshInFlight = promise;
    return promise;
  }

  async function toApiError(response: Response): Promise<ApiError> {
    const retryAfterHeader = response.headers.get("Retry-After");
    const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : null;

    let code = "internal_error";
    let message = response.statusText || "Erro inesperado";
    try {
      const payload = (await response.json()) as {
        error?: { code?: string; message?: string };
      };
      if (payload.error?.code) code = payload.error.code;
      if (payload.error?.message) message = payload.error.message;
    } catch {
      // Corpo não-JSON (proxy, 502, HTML de erro): mantemos o fallback.
    }

    return new ApiError({
      code,
      message,
      status: response.status,
      retryAfter: Number.isFinite(retryAfter) ? retryAfter : null,
    });
  }

  async function send(
    path: string,
    options: RequestOptions,
  ): Promise<Response> {
    const headers = new Headers(options.headers);
    if (options.body !== undefined) {
      headers.set("Content-Type", "application/json");
    }
    if (options.idempotencyKey) {
      headers.set("Idempotency-Key", options.idempotencyKey);
    }
    if (!options.skipAuth && accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }

    try {
      return await doFetch(`${baseUrl}${path}`, {
        ...options,
        headers,
        // Sempre: é o que faz o refresh cookie HttpOnly ir e voltar.
        credentials: "include",
        body:
          options.body === undefined ? undefined : JSON.stringify(options.body),
      });
    } catch {
      throw new ApiError({
        code: "network_error",
        message: "Falha de rede",
        status: 0,
      });
    }
  }

  async function request<T>(
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    // Token vencido conhecido: renova antes de gastar uma ida ao servidor.
    if (!options.skipAuth && accessToken && isExpired()) {
      await refresh();
    }

    let response = await send(path, options);

    if (response.status === 401 && !options.skipAuth) {
      const error = await toApiError(response.clone());
      // Só `invalid_access_token` é renovável. `invalid_credentials` num
      // login, por exemplo, não deve disparar refresh nenhum.
      if (error.code === "invalid_access_token") {
        const renewed = await refresh();
        if (!renewed) throw error;
        response = await send(path, options);
      } else {
        throw error;
      }
    }

    if (!response.ok) {
      throw await toApiError(response);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  }

  /**
   * Abre uma resposta incremental usando a mesma sessão, renovação
   * single-flight e tradução de erros das requisições JSON comuns. O corpo
   * fica sob responsabilidade do endpoint que conhece o protocolo do stream.
   */
  async function openStream(
    path: string,
    options: RequestOptions = {},
  ): Promise<Response> {
    if (!options.skipAuth && accessToken && isExpired()) {
      await refresh();
    }

    let response = await send(path, options);
    if (response.status === 401 && !options.skipAuth) {
      const error = await toApiError(response.clone());
      if (error.code !== "invalid_access_token") throw error;
      const renewed = await refresh();
      if (!renewed) throw error;
      response = await send(path, options);
    }
    if (!response.ok) throw await toApiError(response);
    return response;
  }

  return {
    request,
    openStream,
    refresh,
    setSession,
    clearSession,
    getAccessToken,
    isAuthenticated,
    audience,
    baseUrl,
  };
}

/** Uma chave por AÇÃO de envio; reusada em todos os retries daquela ação. */
export function newIdempotencyKey(): string {
  return crypto.randomUUID();
}
