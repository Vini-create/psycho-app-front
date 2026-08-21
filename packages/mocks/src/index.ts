import { resolve } from "./router";

export { resetState, state } from "./store";

/** Latência artificial: sem ela, skeletons e spinners nunca aparecem. */
const LATENCY: Record<string, number> = {
  default: 220,
  messages: 900,
  contexts: 500,
};

function latencyFor(pathname: string): number {
  if (pathname.endsWith("/messages") || pathname.includes("/retry")) {
    return LATENCY.messages!;
  }
  if (pathname.includes("context")) return LATENCY.contexts!;
  return LATENCY.default!;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Transporte falso para o modo de desenho.
 *
 * Entra no lugar do `fetch` do api-client, e só ali. Tudo acima dele — o
 * single-flight do refresh, o mapa de `error.code`, o TanStack Query, os
 * gates, cada componente e cada página — roda exatamente como em produção.
 * É isso que garante que a tela vista aqui é a tela real; o que muda é
 * apenas o que viria pela rota.
 */
export function createMockFetch(): typeof fetch {
  return async (input, init) => {
    const url = new URL(
      typeof input === "string" ? input : input instanceof URL ? input.href : input.url,
    );
    const method = (init?.method ?? "GET").toUpperCase();

    let body: Record<string, unknown> = {};
    if (typeof init?.body === "string") {
      try {
        body = JSON.parse(init.body) as Record<string, unknown>;
      } catch {
        body = {};
      }
    }

    await wait(latencyFor(url.pathname));

    const result = resolve(method, url, body);

    if (result.status === 204 || result.body === undefined) {
      return new Response(null, { status: result.status });
    }

    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: { "Content-Type": "application/json" },
    });
  };
}
