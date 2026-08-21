/**
 * Stub do modo de desenho — este é o alvo PADRÃO de `@sinapsa/mocks`.
 *
 * A inversão é deliberada: só o script `dev:design` religa o pacote real
 * (ver next.config.ts). Assim, esquecer a flag produz um build sem mocks,
 * em vez de um build com dados falsos de paciente indo para produção.
 */
export function createMockFetch(): typeof fetch {
  throw new Error(
    "@sinapsa/mocks não está disponível fora do modo de desenho (dev:design).",
  );
}
