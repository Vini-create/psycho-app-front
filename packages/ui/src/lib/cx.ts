export type ClassValue =
  | string
  | number
  | false
  | null
  | undefined
  | ClassValue[];

/** Junta classes ignorando falsos. Sem dependência externa. */
export function cx(...values: ClassValue[]): string {
  const out: string[] = [];
  for (const value of values) {
    if (!value) continue;
    if (Array.isArray(value)) {
      const nested = cx(...value);
      if (nested) out.push(nested);
    } else {
      out.push(String(value));
    }
  }
  return out.join(" ");
}
