/* O relatório de exemplo.

   Não é conteúdo escrito para marketing: é uma cópia literal do fixture que
   `npm run dev:design` serve ao painel profissional —
   `packages/mocks/src/fixtures/app.ts`, `contextReports[0]`, o mesmo objeto
   que o `ReportView.tsx` do produto desenha em tela. Os rótulos dos enums
   vêm de `apps/professional/src/lib/report-labels.ts`, também sem reescrita.

   Copiar em vez de importar é a mesma decisão dos tokens: `landing/` está
   fora do workspace e não resolve `@sinapsa/mocks`. O preço é manter isto à
   mão quando o fixture mudar; o ganho é que a seção mostra o documento que
   o profissional realmente recebe, e não uma ilustração dele.

   As datas são relativas a agora, como no fixture — um exemplo de produto
   não pode parecer de um período morto.

   Duas liberdades, e só duas: os enums já chegam aqui como rótulo em
   português, porque na landing não há backend para traduzir; e a lista de
   pontos traz cinco dos sete do fixture, o que cabe numa seção sem virar
   rolagem infinita. O texto de cada um é o do fixture, palavra por palavra —
   inclusive o "você" do panorama, que no produto é dirigido a quem escreveu
   e chega assim à tela do profissional. */

const DAY = 86_400_000;

/** `ago` do fixture: dias e horas atrás, em ISO. */
const ago = (days: number, hours = 0) =>
  new Date(Date.now() - days * DAY - hours * 3_600_000).toISOString();

const DATE = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const DATE_SHORT = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});

export const formatDate = (iso: string) => DATE.format(new Date(iso));

export const formatPeriod = (startIso: string, endIso: string) =>
  `${DATE_SHORT.format(new Date(startIso))} — ${DATE.format(new Date(endIso))}`;

/** Carimbo do trilho: "Hoje", "Ontem" ou "20 SET" — `formatDayMark` do produto. */
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

  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" })
    .format(date)
    .replace(/\./g, "")
    .replace(/ de /g, " ");
}

/** Famílias pastel por tipo de ponto — o `KIND_FAMILY` do `ReportView`. */
export type ItemFamily = "lavender" | "sage" | "clay" | "ochre" | "fogblue" | "dustrose";

export interface TimelineEntry {
  id: string;
  description: string;
  occurredAt: string;
}

export interface ReportItem {
  id: string;
  /** Rótulo já resolvido por `itemKindLabel`. */
  kind: string;
  family: ItemFamily;
  title: string;
  description: string;
  impact?: string;
  /** Já resolvido por `evidenceLabel`. */
  evidence: string;
  /** Já resolvido por `emotionalValenceLabel`. */
  valence?: string;
  occurredAt?: string;
  limitations: string[];
}

export interface SampleReport {
  schemaVersion: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  coverage: {
    conversationCount: number;
    userMessageCount: number;
    activeDayCount: number;
    periodDays: number;
    /** Já resolvido por `completenessLabel`. */
    completeness: string;
    note: string;
  };
  summary: string;
  timeline: TimelineEntry[];
  items: ReportItem[];
  limitations: string[];
  createdAt: string;
}

export const SAMPLE_REPORT: SampleReport = {
  schemaVersion: "journey-report-v2",
  title: "Relatório de Contexto e Jornada",
  periodStart: ago(7),
  periodEnd: ago(0),
  coverage: {
    conversationCount: 3,
    userMessageCount: 24,
    activeDayCount: 5,
    periodDays: 7,
    completeness: "Cobertura parcial do período",
    note: "Cobre apenas os assuntos que você mencionou nas conversas deste período.",
  },
  summary:
    "Ao longo da semana você relatou uma sequência de acontecimentos ligados ao trabalho, com destaque para uma apresentação na quarta-feira e o retorno recebido na sexta.\n\nTambém mencionou dificuldade para dormir em três dias diferentes, e uma conversa com sua irmã que descreveu como boa.",
  timeline: [
    {
      id: "tl-1",
      description:
        "Relatou apresentar uma proposta em reunião e não receber retorno na hora.",
      occurredAt: ago(2, 8),
    },
    {
      id: "tl-2",
      description: "Mencionou ter dormido mal duas noites seguidas.",
      occurredAt: ago(2),
    },
    {
      id: "tl-3",
      description:
        "Relatou uma conversa longa com a irmã e descreveu o encontro como bom.",
      occurredAt: ago(1),
    },
    {
      id: "tl-4",
      description:
        "Recebeu retorno positivo sobre a proposta apresentada na quarta.",
      occurredAt: ago(0, 5),
    },
  ],
  items: [
    {
      id: "item-1",
      kind: "Dificuldade relatada",
      family: "dustrose",
      title: "Espera por retorno no trabalho",
      description:
        "Relatou ter passado dois dias remoendo uma apresentação depois de não receber comentários imediatos.",
      impact:
        "Descreveu ter ficado 'o resto do dia remoendo' e ter suposto que havia falado algo errado.",
      evidence: "Mencionado repetidamente",
      occurredAt: ago(4),
      limitations: [],
    },
    {
      id: "item-2",
      kind: "Dificuldade relatada",
      family: "dustrose",
      title: "Sono",
      description:
        "Mencionou dificuldade para dormir em três dias distintos do período.",
      evidence: "Mencionado repetidamente",
      occurredAt: ago(2),
      limitations: [
        "Não foram relatados detalhes sobre horários ou rotina de sono.",
      ],
    },
    {
      id: "item-emotion-1",
      kind: "Emoção relatada",
      family: "lavender",
      title: "Frustração durante a espera",
      description:
        "Relatou ter ficado frustrada enquanto aguardava um retorno sobre a apresentação.",
      evidence: "Mencionado repetidamente",
      valence: "Difícil",
      occurredAt: ago(4),
      limitations: [],
    },
    {
      id: "item-3",
      kind: "Mudança relatada",
      family: "clay",
      title: "Retorno positivo recebido",
      description:
        "Relatou que a proposta apresentada foi aceita e seguiria adiante.",
      impact: "Descreveu alívio, junto de incômodo com a própria espera.",
      evidence: "Mencionado uma vez",
      occurredAt: ago(0, 5),
      limitations: [],
    },
    {
      id: "item-5",
      kind: "Assunto em aberto",
      family: "fogblue",
      title: "Levar para a próxima sessão",
      description:
        "Sinalizou querer conversar sobre a reunião de quarta e sobre o sono.",
      evidence: "Mencionado uma vez",
      limitations: [],
    },
  ],
  limitations: [
    "Não há registros nos dias em que não houve conversa.",
    "O relatório descreve relatos, não avaliações.",
  ],
  createdAt: ago(0, 1),
};
