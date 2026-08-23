const DATE = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const DATE_SHORT = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});

const DATE_TIME = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const TIME = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

/** Datas chegam da API em RFC 3339 UTC. */
export function formatDate(iso: string): string {
  return DATE.format(new Date(iso));
}

export function formatDateShort(iso: string): string {
  return DATE_SHORT.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return DATE_TIME.format(new Date(iso));
}

export function formatTime(iso: string): string {
  return TIME.format(new Date(iso));
}

export function formatPeriod(startIso: string, endIso: string): string {
  return `${formatDateShort(startIso)} ${formatDate(endIso)}`;
}

/** Rótulo de dia para separar mensagens numa conversa. */
export function formatDayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(date, today)) return "Hoje";

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(date, yesterday)) return "Ontem";

  return formatDate(iso);
}

export function pluralize(
  count: number,
  singular: string,
  plural: string,
): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/**
 * Marca temporal editorial — Brand Book V2 §19.
 *
 * "HOJE", "ONTEM", "20 AGO", "20 AGO 2025". A data por extenso ("20 de ago.
 * de 2026") é longa demais para microtipografia e transforma o separador de
 * dia em ruído: o que interessa ali é a passagem do tempo, não o registro
 * cartorial. O ano só aparece quando não é o corrente.
 */
export function formatDayMark(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return "Hoje";

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (sameDay(date, yesterday)) return "Ontem";

  const dayMonth = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  })
    .format(date)
    // pt-BR entrega "20 de ago."; o carimbo editorial é "20 AGO".
    .replace(/\./g, "")
    .replace(/ de /g, " ");

  return date.getFullYear() === today.getFullYear()
    ? dayMonth
    : `${dayMonth} ${date.getFullYear()}`;
}
