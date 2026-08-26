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

/**
 * Dia local ("2026-08-26"), não instante.
 *
 * `new Date("2026-08-26")` é meia-noite UTC, e formatar isso em qualquer fuso
 * a oeste devolve o dia anterior. O dia de um check-in é o dia de quem
 * respondeu; ele não pode andar para trás por causa do fuso de quem lê — daí
 * a construção pelas partes, que fixa a data no calendário local.
 */
function localDate(day: string): Date {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, date ?? 1);
}

export function formatDay(day: string): string {
  return DATE.format(localDate(day));
}

export function formatDayShort(day: string): string {
  return DATE_SHORT.format(localDate(day));
}

export function formatDayPeriod(startDay: string, endDay: string): string {
  return `${formatDayShort(startDay)} ${formatDay(endDay)}`;
}

/** Quantidade de dias entre dois dias locais, inclusive as duas pontas. */
export function daysBetween(startDay: string, endDay: string): number {
  const start = localDate(startDay).getTime();
  const end = localDate(endDay).getTime();
  return Math.round((end - start) / 86_400_000) + 1;
}

/** A sequência de dias de um período, para desenhar o calendário com buracos. */
export function eachDay(startDay: string, endDay: string): string[] {
  const days: string[] = [];
  const cursor = localDate(startDay);
  const end = localDate(endDay);
  while (cursor <= end) {
    days.push(
      `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(
        cursor.getDate(),
      ).padStart(2, "0")}`,
    );
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
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
