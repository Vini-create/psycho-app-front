import type {
  CheckinAssignment,
  CheckinCollection,
  CheckinCollectionRequest,
  CheckinEntry,
  CheckinTemplate,
} from "@sinapsa/api-client";
import { ago } from "./shared";

/** Dia local no formato do contrato, a partir de um deslocamento em dias. */
export const dayKey = (offset: number) => ago(offset).slice(0, 10);

function option(id: string, position: number, label: string, score: number) {
  return { id, position, label, score };
}

/* A escala é fixa: cinco alternativas, notas de 1 a 5, sempre. E sobe sempre
   na mesma direção — nota maior é dia melhor. Um check-in com uma pergunta
   invertida faria o radar mentir sobre a forma, e a régua não tem como
   perceber isso sozinha. */
export const templates: CheckinTemplate[] = [
  {
    id: "tpl-humor",
    title: "Humor, sono e energia",
    legend: "Responda pensando no dia como um todo, não no pior momento dele.",
    status: "published",
    published_at: ago(28),
    created_at: ago(29),
    updated_at: ago(28),
    questions: [
      {
        id: "q-humor",
        position: 1,
        prompt: "Como estava seu humor hoje?",
        legend: "Sem tentar explicar o motivo. Só a impressão do dia.",
        options: [
          option("o-humor-1", 1, "Muito ruim", 1),
          option("o-humor-2", 2, "Ruim", 2),
          option("o-humor-3", 3, "Nem bom nem ruim", 3),
          option("o-humor-4", 4, "Bom", 4),
          option("o-humor-5", 5, "Muito bom", 5),
        ],
      },
      {
        id: "q-sono",
        position: 2,
        prompt: "Como foi a noite passada?",
        legend: "Vale o quanto você descansou, não quantas horas dormiu.",
        options: [
          option("o-sono-1", 1, "Dormi muito mal", 1),
          option("o-sono-2", 2, "Dormi mal", 2),
          option("o-sono-3", 3, "Dormi razoável", 3),
          option("o-sono-4", 4, "Dormi bem", 4),
          option("o-sono-5", 5, "Dormi muito bem", 5),
        ],
      },
      {
        id: "q-energia",
        position: 3,
        prompt: "Quanta energia você teve para o dia?",
        options: [
          option("o-energia-1", 1, "Quase nenhuma", 1),
          option("o-energia-2", 2, "Pouca", 2),
          option("o-energia-3", 3, "Suficiente", 3),
          option("o-energia-4", 4, "Bastante", 4),
          option("o-energia-5", 5, "De sobra", 5),
        ],
      },
      {
        id: "q-calma",
        position: 4,
        prompt: "Como estava seu corpo em relação à ansiedade?",
        legend: "A ponta de cima é o dia mais tranquilo, não o mais produtivo.",
        options: [
          option("o-calma-1", 1, "Muito agitado", 1),
          option("o-calma-2", 2, "Agitado", 2),
          option("o-calma-3", 3, "Normal", 3),
          option("o-calma-4", 4, "Tranquilo", 4),
          option("o-calma-5", 5, "Muito tranquilo", 5),
        ],
      },
    ],
  },
  {
    id: "tpl-sono-marta",
    title: "Registro de sono",
    legend: "Preencha de manhã, antes de começar o dia.",
    status: "published",
    published_at: ago(20),
    created_at: ago(21),
    updated_at: ago(20),
    questions: [
      {
        id: "q-marta-sono",
        position: 1,
        prompt: "Quanto você dormiu?",
        options: [
          option("o-marta-sono-1", 1, "Menos de 4h", 1),
          option("o-marta-sono-2", 2, "Entre 4h e 5h", 2),
          option("o-marta-sono-3", 3, "Entre 5h e 6h", 3),
          option("o-marta-sono-4", 4, "Entre 6h e 8h", 4),
          option("o-marta-sono-5", 5, "Mais de 8h", 5),
        ],
      },
      {
        id: "q-marta-despertar",
        position: 2,
        prompt: "Acordou durante a noite?",
        options: [
          option("o-marta-despertar-1", 1, "Várias vezes", 1),
          option("o-marta-despertar-2", 2, "Três ou quatro vezes", 2),
          option("o-marta-despertar-3", 3, "Duas vezes", 3),
          option("o-marta-despertar-4", 4, "Uma vez", 4),
          option("o-marta-despertar-5", 5, "Dormi direto", 5),
        ],
      },
      {
        id: "q-marta-disposicao",
        position: 3,
        prompt: "Como você acordou?",
        legend: "Pense em como estava o corpo nos primeiros minutos do dia.",
        options: [
          option("o-marta-disposicao-1", 1, "Exausta", 1),
          option("o-marta-disposicao-2", 2, "Cansada", 2),
          option("o-marta-disposicao-3", 3, "Nem bem nem mal", 3),
          option("o-marta-disposicao-4", 4, "Descansada", 4),
          option("o-marta-disposicao-5", 5, "Muito descansada", 5),
        ],
      },
    ],
  },
  {
    // Rascunho: existe para exercitar o estado editável da biblioteca.
    id: "tpl-rascunho",
    title: "Depois da alta",
    legend: "",
    status: "draft",
    created_at: ago(2),
    updated_at: ago(2),
    questions: [
      {
        id: "q-rascunho",
        position: 1,
        prompt: "Como foi manter a rotina hoje?",
        options: [
          option("o-rascunho-1", 1, "Não consegui nada", 1),
          option("o-rascunho-2", 2, "Quase nada", 2),
          option("o-rascunho-3", 3, "Em parte", 3),
          option("o-rascunho-4", 4, "Quase tudo", 4),
          option("o-rascunho-5", 5, "Consegui", 5),
        ],
      },
    ],
  },
];

const EMPTY_DAY_STATE = {
  answered_today: false,
  answered_days: 0,
} as const;

export const assignments: CheckinAssignment[] = [
  {
    id: "assign-rui-humor",
    connection_id: "conn-rui",
    status: "active",
    professional_display_name: "Rui Andrade",
    patient_display_name: "Helena Marques",
    template: templates[0]!,
    requested_at: ago(28),
    responded_at: ago(28),
    ...EMPTY_DAY_STATE,
  },
  {
    // Segundo profissional: é por isso que o rótulo com o nome é obrigatório
    // na tela do paciente, e por isso a colheita tem seletor.
    id: "assign-marta-sono",
    connection_id: "conn-marta",
    status: "active",
    professional_display_name: "Marta Nogueira",
    patient_display_name: "Helena Marques",
    template: templates[1]!,
    requested_at: ago(20),
    responded_at: ago(20),
    ...EMPTY_DAY_STATE,
  },
  {
    // Pendente: o aceite do paciente é o primeiro dos dois consentimentos.
    id: "assign-rui-pendente",
    connection_id: "conn-rui",
    status: "pending",
    professional_display_name: "Rui Andrade",
    patient_display_name: "Helena Marques",
    template: templates[2]!,
    requested_at: ago(0, 5),
    ...EMPTY_DAY_STATE,
  },
];

/* Série determinística: uma queda no meio do período e uma recuperação
   parcial no fim. Serve para o desenho ter forma real — melhor dia, pior dia
   e dias sem resposta — sem depender de aleatório, que muda a cada reload. */
const HUMOR_SERIES: Record<string, number[]> = {
  "q-humor": [4, 4, 3, 2, 2, 1, 2, 3, 3, 4, 4, 3, 2, 3, 4, 5, 4, 3, 4, 4, 5],
  "q-sono": [3, 4, 3, 2, 2, 1, 2, 2, 3, 3, 4, 3, 2, 3, 3, 4, 4, 3, 3, 4, 4],
  "q-energia": [4, 3, 3, 2, 1, 1, 2, 2, 3, 4, 4, 3, 2, 3, 4, 5, 4, 3, 3, 4, 4],
  "q-calma": [3, 3, 2, 2, 1, 1, 2, 3, 3, 3, 4, 3, 2, 2, 3, 4, 3, 3, 3, 4, 4],
};

const SONO_SERIES: Record<string, number[]> = {
  "q-marta-sono": [3, 2, 2, 3, 4, 3, 2, 1, 2, 3, 3, 4, 3, 2, 3],
  "q-marta-despertar": [2, 1, 2, 2, 3, 2, 1, 1, 2, 2, 3, 3, 2, 2, 3],
  "q-marta-disposicao": [3, 2, 2, 3, 4, 3, 2, 1, 2, 3, 4, 4, 3, 2, 3],
};

/** Dias sem resposta: adesão real nunca é de 100%, e a UI precisa mostrar isso. */
const SKIPPED_DAYS = new Set([5, 12, 17]);

function buildEntries(
  assignmentId: string,
  template: CheckinTemplate,
  series: Record<string, number[]>,
  days: number,
): CheckinEntry[] {
  const entries: CheckinEntry[] = [];
  for (let index = 0; index < days; index += 1) {
    // O dia de hoje fica sempre em aberto: é o estado que a tela inicial
    // precisa mostrar ao abrir, e o único que exercita o ato de responder.
    if (index === days - 1 || SKIPPED_DAYS.has(index)) continue;
    const offset = days - 1 - index;
    entries.push({
      id: `entry-${assignmentId}-${index}`,
      assignment_id: assignmentId,
      entry_date: dayKey(offset),
      submitted_at: ago(offset, 11),
      updated_at: ago(offset, 11),
      answers: template.questions.map((question) => {
        const score = series[question.id]?.[index] ?? 0;
        const chosen =
          question.options.find((item) => item.score === score) ??
          question.options[0]!;
        return {
          question_id: question.id,
          option_id: chosen.id,
          score: chosen.score,
        };
      }),
    });
  }
  return entries;
}

export const entries: Record<string, CheckinEntry[]> = {
  "assign-rui-humor": buildEntries(
    "assign-rui-humor",
    templates[0]!,
    HUMOR_SERIES,
    21,
  ),
  "assign-marta-sono": buildEntries(
    "assign-marta-sono",
    templates[1]!,
    SONO_SERIES,
    15,
  ),
};

export const collectionRequests: CheckinCollectionRequest[] = [
  {
    id: "checkin-request-pendente",
    connection_id: "conn-rui",
    professional_display_name: "Rui Andrade",
    patient_display_name: "Helena Marques",
    period_start: dayKey(13),
    period_end: dayKey(0),
    status: "pending",
    requested_at: ago(0, 6),
  },
  {
    id: "checkin-request-enviado",
    connection_id: "conn-rui",
    professional_display_name: "Rui Andrade",
    patient_display_name: "Helena Marques",
    period_start: dayKey(27),
    period_end: dayKey(14),
    status: "sent",
    requested_at: ago(14, 9),
    responded_at: ago(14, 2),
  },
];

/** Retrato já entregue, para o painel profissional abrir com conteúdo. */
export const collections: CheckinCollection[] = [];
