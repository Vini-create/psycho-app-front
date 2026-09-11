/** Concatena classes ignorando o que for falso. Mesma função do `@sinapsa/ui`. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
