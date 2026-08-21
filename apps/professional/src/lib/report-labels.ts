/**
 * Rótulos em português para os enums do relatório.
 * Fallback sempre devolve o valor cru: um enum novo do backend aparece como
 * está, em vez de sumir da tela.
 */

const KIND: Record<string, string> = {
  priority: "Prioridade relatada",
  event: "Acontecimento",
  challenge: "Dificuldade relatada",
  emotion: "Emoção relatada",
  thought: "Pensamento relatado",
  behavior: "Comportamento relatado",
  strategy: "Estratégia relatada",
  support: "Apoio relatado",
  change: "Mudança relatada",
  open_topic: "Assunto em aberto",
  safety_context: "Contexto de atenção",
};

const EVIDENCE: Record<string, string> = {
  explicit_once: "Mencionado uma vez",
  explicit_repeated: "Mencionado repetidamente",
  uncertain: "Relato com incerteza preservada",
  contradictory: "Relatos contraditórios preservados",
};

const COMPLETENESS: Record<string, string> = {
  limited: "Cobertura limitada do período",
  partial: "Cobertura parcial do período",
  substantial: "Cobertura substancial do período",
};

const EMOTIONAL_VALENCE: Record<string, string> = {
  pleasant: "Agradável",
  unpleasant: "Difícil",
  mixed: "Misto",
  neutral: "Neutro",
};

export const itemKindLabel = (kind: string) => KIND[kind] ?? kind;
export const evidenceLabel = (strength: string) => EVIDENCE[strength] ?? strength;
export const completenessLabel = (value: string) => COMPLETENESS[value] ?? value;
export const emotionalValenceLabel = (value: string) =>
  EMOTIONAL_VALENCE[value] ?? value;
