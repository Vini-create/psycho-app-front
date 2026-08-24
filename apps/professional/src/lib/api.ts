import {
  authEndpoints,
  createApiClient,
  professionalEndpoints,
  resolveApiBaseUrl,
} from "@sinapsa/api-client";
import { createMockFetch } from "@sinapsa/mocks";

const baseUrl = resolveApiBaseUrl(
  process.env.NEXT_PUBLIC_API_URL,
  process.env.NODE_ENV,
);

/**
 * MODO DE DESENHO — temporário, sai junto com o backend real.
 *
 * Troca APENAS o transporte do client. Nenhuma página, componente ou gate
 * sabe que isto existe: a tela renderizada aqui é a tela de produção, com os
 * dados que viriam da rota substituídos por fixtures.
 *
 * Em build de produção a flag vira `false` na compilação e o pacote de mocks
 * é removido do bundle. Ver DESIGN_MODE.md.
 */
const designMock = process.env.NEXT_PUBLIC_DESIGN_MOCK === "true";

if (designMock && typeof window !== "undefined") {
  console.info(
    "%cSinapsa · modo de desenho",
    "font-weight:bold",
    "dados mocados, sem backend. Nenhuma alteração visual em relação ao original.",
  );
}

let unauthenticatedHandler: (() => void) | null = null;

export function setUnauthenticatedHandler(handler: (() => void) | null): void {
  unauthenticatedHandler = handler;
}

export const api = createApiClient({
  baseUrl,
  audience: "professional",
  onUnauthenticated: () => unauthenticatedHandler?.(),
  fetchImpl: designMock ? createMockFetch() : undefined,
});

export const auth = authEndpoints(api);
export const pro = professionalEndpoints(api);
