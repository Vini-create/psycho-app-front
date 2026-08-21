import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApiClient } from "./client";
import { ApiError } from "./errors";

const BASE = "http://api.test";

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

function errorResponse(
  code: string,
  status: number,
  headers: Record<string, string> = {},
) {
  return new Response(
    JSON.stringify({ error: { code, message: "mensagem do backend" } }),
    { status, headers: { "Content-Type": "application/json", ...headers } },
  );
}

function issuedToken(token = "novo-token") {
  return {
    access_token: token,
    token_type: "Bearer" as const,
    expires_at: new Date(Date.now() + 600_000).toISOString(),
  };
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function makeClient(onUnauthenticated?: () => void) {
  return createApiClient({
    baseUrl: BASE,
    audience: "app",
    onUnauthenticated,
  });
}

describe("createApiClient", () => {
  it("envia Authorization e credentials em toda requisição autenticada", async () => {
    const client = makeClient();
    client.setSession(issuedToken("token-a"));
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

    await client.request("/v1/app/me");

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(`${BASE}/v1/app/me`);
    expect(init.credentials).toBe("include");
    expect((init.headers as Headers).get("Authorization")).toBe(
      "Bearer token-a",
    );
  });

  it("não envia Authorization quando skipAuth", async () => {
    const client = makeClient();
    client.setSession(issuedToken());
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

    await client.request("/v1/app/auth/login", {
      method: "POST",
      body: {},
      skipAuth: true,
    });

    const [, init] = fetchMock.mock.calls[0]!;
    expect((init.headers as Headers).get("Authorization")).toBeNull();
  });

  it("manda Idempotency-Key quando a ação informa uma", async () => {
    const client = makeClient();
    client.setSession(issuedToken());
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

    await client.request("/v1/app/conversations/1/messages", {
      method: "POST",
      body: { content: "oi" },
      idempotencyKey: "chave-fixa",
    });

    const [, init] = fetchMock.mock.calls[0]!;
    expect((init.headers as Headers).get("Idempotency-Key")).toBe("chave-fixa");
  });

  it("converte o envelope de erro em ApiError com code e Retry-After", async () => {
    const client = makeClient();
    fetchMock.mockResolvedValue(
      errorResponse("rate_limited", 429, { "Retry-After": "30" }),
    );

    const error = await client
      .request("/v1/app/conversations")
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe("rate_limited");
    expect((error as ApiError).status).toBe(429);
    expect((error as ApiError).retryAfter).toBe(30);
  });

  it("devolve undefined em 204 sem tentar parsear corpo", async () => {
    const client = makeClient();
    client.setSession(issuedToken());
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(client.request("/v1/app/consents/terms")).resolves.toBeUndefined();
  });

  it("vira ApiError network_error quando o fetch rejeita", async () => {
    const client = makeClient();
    fetchMock.mockRejectedValue(new TypeError("failed to fetch"));

    const error = await client.request("/v1/app/me").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe("network_error");
  });
});

describe("refresh single-flight", () => {
  it("dispara UMA chamada a /refresh mesmo com vários 401 simultâneos", async () => {
    const client = makeClient();
    client.setSession(issuedToken("token-velho"));

    let refreshCalls = 0;
    fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
      if (url.endsWith("/auth/refresh")) {
        refreshCalls += 1;
        // Latência real: dá tempo das três chamadas colidirem no refresh.
        await new Promise((resolve) => setTimeout(resolve, 10));
        return jsonResponse(issuedToken("token-novo"));
      }
      const auth = (init.headers as Headers).get("Authorization");
      if (auth === "Bearer token-velho") {
        return errorResponse("invalid_access_token", 401);
      }
      return jsonResponse({ path: url });
    });

    const results = await Promise.all([
      client.request<{ path: string }>("/v1/app/conversations"),
      client.request<{ path: string }>("/v1/app/consents"),
      client.request<{ path: string }>("/v1/app/connections"),
    ]);

    expect(refreshCalls).toBe(1);
    expect(results).toHaveLength(3);
    expect(client.getAccessToken()).toBe("token-novo");
  });

  it("limpa a sessão e avisa quando o refresh falha", async () => {
    const onUnauthenticated = vi.fn();
    const client = makeClient(onUnauthenticated);
    client.setSession(issuedToken("token-velho"));

    fetchMock.mockImplementation(async (url: string) => {
      if (url.endsWith("/auth/refresh")) {
        return errorResponse("invalid_token", 401);
      }
      return errorResponse("invalid_access_token", 401);
    });

    const error = await client.request("/v1/app/me").catch((e: unknown) => e);

    expect((error as ApiError).code).toBe("invalid_access_token");
    expect(onUnauthenticated).toHaveBeenCalledTimes(1);
    expect(client.isAuthenticated()).toBe(false);
  });

  it("não avisa o app quando o refresh silencioso falha", async () => {
    // Restaurar sessão no load e não achar nenhuma é o estado normal de quem
    // abre uma página pública — não pode disparar redirecionamento.
    const onUnauthenticated = vi.fn();
    const client = makeClient(onUnauthenticated);
    fetchMock.mockResolvedValue(errorResponse("invalid_token", 401));

    const token = await client.refresh({ notifyOnFailure: false });

    expect(token).toBeNull();
    expect(onUnauthenticated).not.toHaveBeenCalled();
    expect(client.isAuthenticated()).toBe(false);
  });

  it("avisa o app quando o refresh normal falha", async () => {
    const onUnauthenticated = vi.fn();
    const client = makeClient(onUnauthenticated);
    fetchMock.mockResolvedValue(errorResponse("invalid_token", 401));

    await client.refresh();

    expect(onUnauthenticated).toHaveBeenCalledTimes(1);
  });

  it("não tenta refresh em 401 que não seja invalid_access_token", async () => {
    const client = makeClient();
    let refreshCalls = 0;

    fetchMock.mockImplementation(async (url: string) => {
      if (url.endsWith("/auth/refresh")) {
        refreshCalls += 1;
        return jsonResponse(issuedToken());
      }
      return errorResponse("invalid_credentials", 401);
    });

    const error = await client
      .request("/v1/app/auth/login", { method: "POST", body: {} })
      .catch((e: unknown) => e);

    expect(refreshCalls).toBe(0);
    expect((error as ApiError).code).toBe("invalid_credentials");
  });

  it("renova proativamente quando o token já expirou", async () => {
    const client = makeClient();
    client.setSession({
      access_token: "token-vencido",
      token_type: "Bearer",
      expires_at: new Date(Date.now() - 1000).toISOString(),
    });

    const seen: (string | null)[] = [];
    fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
      if (url.endsWith("/auth/refresh")) {
        return jsonResponse(issuedToken("token-fresco"));
      }
      seen.push((init.headers as Headers).get("Authorization"));
      return jsonResponse({ ok: true });
    });

    await client.request("/v1/app/me");

    // Nenhuma requisição saiu com o token vencido.
    expect(seen).toEqual(["Bearer token-fresco"]);
  });
});
