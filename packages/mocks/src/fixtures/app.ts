import type {
  Connection,
  Consent,
  ContextReport,
  ContextReportRequest,
  Conversation,
  Message,
} from "@sinapsa/api-client";
import { ago } from "./shared";

export const consents: Consent[] = [
  { type: "terms", policy_version: "2026-08-18", granted_at: ago(120) },
  { type: "privacy", policy_version: "2026-08-18", granted_at: ago(120) },
  { type: "ai_processing", policy_version: "2026-08-18", granted_at: ago(120) },
];

export const conversations: Conversation[] = [
  {
    id: "conv-semana",
    title: "Essa semana",
    status: "active",
    created_at: ago(6),
    updated_at: ago(0, 3),
  },
  {
    id: "conv-trabalho",
    title: "Coisas do trabalho",
    status: "active",
    created_at: ago(12),
    updated_at: ago(4),
  },
  {
    id: "conv-primeira",
    title: "Nova conversa",
    status: "active",
    created_at: ago(21),
    updated_at: ago(20),
  },
];

/**
 * A conversa principal existe para exercitar o design em vários estados:
 * dias diferentes (separador), uma resposta longa (medida de leitura), uma
 * mensagem bloqueada pelo safety e uma geração que falhou (afordância de
 * retry). Nada aqui é diagnóstico — são relatos, como o produto exige.
 */
export const messages: Record<string, Message[]> = {
  "conv-semana": [
    {
      id: "m1",
      conversation_id: "conv-semana",
      sequence: 1,
      role: "user",
      content:
        "Semana estranha. Comecei animada e fui perdendo o fôlego no meio.",
      generation_status: "completed",
      created_at: ago(2, 9),
    },
    {
      id: "m2",
      conversation_id: "conv-semana",
      sequence: 2,
      role: "assistant",
      content:
        "Obrigada por começar por aí. O que aconteceu no meio da semana que mudou o ritmo?",
      in_reply_to_message_id: "m1",
      generation_status: "completed",
      ai_provider: "mock",
      ai_model: "design-mode",
      prompt_version: "companion-v1",
      created_at: ago(2, 9),
    },
    {
      id: "m3",
      conversation_id: "conv-semana",
      sequence: 3,
      role: "user",
      content:
        "Quarta teve uma reunião que me deixou mal. Apresentei uma proposta e ninguém comentou nada. Fiquei o resto do dia remoendo, achando que tinha falado besteira.",
      generation_status: "completed",
      created_at: ago(2, 8),
    },
    {
      id: "m4",
      conversation_id: "conv-semana",
      sequence: 4,
      role: "assistant",
      content:
        "Silêncio depois de expor uma ideia é difícil de ler — sobra espaço para a gente preencher com o pior. Você chegou a saber depois o que acharam, ou ficou só com o silêncio daquele momento?",
      in_reply_to_message_id: "m3",
      generation_status: "completed",
      ai_provider: "mock",
      ai_model: "design-mode",
      prompt_version: "companion-v1",
      created_at: ago(2, 8),
    },
    {
      id: "m5",
      conversation_id: "conv-semana",
      sequence: 5,
      role: "user",
      content:
        "Na sexta o Bruno me chamou e disse que ia levar a proposta adiante. Fiquei aliviada e meio brava comigo por ter passado dois dias assim.",
      generation_status: "completed",
      created_at: ago(0, 5),
    },
    {
      id: "m6",
      conversation_id: "conv-semana",
      sequence: 6,
      role: "assistant",
      content:
        "Dois dias de espera com pouca informação, e a informação quando veio era boa. Você comentou que quer levar isso para a próxima sessão — quer que eu marque?",
      in_reply_to_message_id: "m5",
      generation_status: "completed",
      ai_provider: "mock",
      ai_model: "design-mode",
      prompt_version: "companion-v1",
      created_at: ago(0, 5),
    },
    {
      // Geração que falhou: mostra o aviso e o botão "Tentar novamente".
      id: "m7",
      conversation_id: "conv-semana",
      sequence: 7,
      role: "user",
      content: "Quero sim. E também queria falar do meu sono, está ruim.",
      generation_status: "failed",
      failure_code: "companion_unavailable",
      created_at: ago(0, 3),
    },
  ],
  "conv-trabalho": [
    {
      id: "t1",
      conversation_id: "conv-trabalho",
      sequence: 1,
      role: "user",
      content: "Mudaram meu time de novo. Terceiro gestor em um ano.",
      generation_status: "completed",
      created_at: ago(4),
    },
    {
      id: "t2",
      conversation_id: "conv-trabalho",
      sequence: 2,
      role: "assistant",
      content:
        "Três trocas em um ano é bastante recomeço. Como tem sido reconstruir a relação a cada vez?",
      in_reply_to_message_id: "t1",
      generation_status: "completed",
      ai_provider: "mock",
      ai_model: "design-mode",
      prompt_version: "companion-v1",
      created_at: ago(4),
    },
  ],
  "conv-primeira": [],
};

export const connections: Connection[] = [
  {
    id: "conn-rui",
    connection_id: "conn-rui",
    status: "active",
    organization_name: "Consultório Rui Andrade",
    professional_display_name: "Rui Andrade",
    profession_type: "psychologist",
    consent_scopes: ["summaries", "events", "marked_topics"],
    activated_at: ago(90),
    ended_at: null,
    created_at: ago(92),
  },
];

export const contextReportRequests: ContextReportRequest[] = [
  {
    id: "request-rui-pending",
    connection_id: "conn-rui",
    professional_display_name: "Rui Andrade",
    patient_display_name: "Helena Marques",
    period_start: ago(14),
    period_end: ago(1),
    status: "pending",
    requested_at: ago(0, 8),
    sent_at: null,
  },
];

/** Fixtures de relatórios usadas exclusivamente pelo workspace profissional. */
export const contextReports: ContextReport[] = [
  {
    id: "report-pendente",
    connection_id: "conn-rui",
    schema_version: "journey-report-v2",
    title: "Relatório de Contexto e Jornada",
    period_start: ago(7),
    period_end: ago(0),
    coverage: {
      conversation_count: 3,
      user_message_count: 24,
      active_day_count: 5,
      completeness: "partial",
      note: "Cobre apenas os assuntos que você mencionou nas conversas deste período.",
    },
    summary:
      "Ao longo da semana você relatou uma sequência de acontecimentos ligados ao trabalho, com destaque para uma apresentação na quarta-feira e o retorno recebido na sexta.\n\nTambém mencionou dificuldade para dormir em três dias diferentes, e uma conversa com sua irmã que descreveu como boa.",
    timeline: [
      {
        id: "tl-1",
        description:
          "Relatou apresentar uma proposta em reunião e não receber retorno na hora.",
        occurred_at: ago(2, 8),
      },
      {
        id: "tl-2",
        description: "Mencionou ter dormido mal duas noites seguidas.",
        occurred_at: ago(2),
      },
      {
        id: "tl-3",
        description:
          "Relatou uma conversa longa com a irmã e descreveu o encontro como bom.",
        occurred_at: ago(1),
      },
      {
        id: "tl-4",
        description:
          "Recebeu retorno positivo sobre a proposta apresentada na quarta.",
        occurred_at: ago(0, 5),
      },
    ],
    items: [
      {
        id: "item-1",
        kind: "challenge",
        title: "Espera por retorno no trabalho",
        description:
          "Relatou ter passado dois dias remoendo uma apresentação depois de não receber comentários imediatos.",
        impact:
          "Descreveu ter ficado 'o resto do dia remoendo' e ter suposto que havia falado algo errado.",
        evidence_strength: "explicit_repeated",
        occurred_at: ago(4),
        limitations: [],
        included: true,
      },
      {
        id: "item-2",
        kind: "challenge",
        title: "Sono",
        description:
          "Mencionou dificuldade para dormir em três dias distintos do período.",
        evidence_strength: "explicit_repeated",
        occurred_at: ago(2),
        limitations: [
          "Não foram relatados detalhes sobre horários ou rotina de sono.",
        ],
        included: true,
      },
      {
        id: "item-emotion-1",
        kind: "emotion",
        title: "Frustração durante a espera",
        description:
          "Relatou ter ficado frustrada enquanto aguardava um retorno sobre a apresentação.",
        evidence_strength: "explicit_repeated",
        emotional_valence: "unpleasant",
        occurred_at: ago(4),
        limitations: [],
        included: true,
      },
      {
        id: "item-emotion-2",
        kind: "emotion",
        title: "Alívio após o retorno",
        description:
          "Descreveu alívio quando recebeu a confirmação de que a proposta seguiria adiante.",
        evidence_strength: "explicit_once",
        emotional_valence: "pleasant",
        occurred_at: ago(0, 5),
        limitations: [],
        included: true,
      },
      {
        id: "item-3",
        kind: "change",
        title: "Retorno positivo recebido",
        description:
          "Relatou que a proposta apresentada foi aceita e seguiria adiante.",
        impact: "Descreveu alívio, junto de incômodo com a própria espera.",
        evidence_strength: "explicit_once",
        occurred_at: ago(0, 5),
        limitations: [],
        included: true,
      },
      {
        id: "item-4",
        kind: "support",
        title: "Conversa com a irmã",
        description:
          "Descreveu um encontro com a irmã como um acontecimento positivo da semana.",
        evidence_strength: "explicit_once",
        occurred_at: ago(1),
        limitations: [],
        included: true,
      },
      {
        id: "item-5",
        kind: "open_topic",
        title: "Levar para a próxima sessão",
        description:
          "Sinalizou querer conversar sobre a reunião de quarta e sobre o sono.",
        evidence_strength: "explicit_once",
        limitations: [],
        included: true,
      },
    ],
    limitations: [
      "Não há registros nos dias em que não houve conversa.",
      "O relatório descreve relatos, não avaliações.",
    ],
    provider: "mock",
    model: "design-mode",
    prompt_version: "journey-report-v2",
    graph_version: "journey-report-graph-v2",
    review_status: "approved",
    reviewed_at: ago(0, 1),
    created_at: ago(0, 1),
  },
  {
    id: "report-historico",
    connection_id: "conn-rui",
    schema_version: "journey-report-v2",
    title: "Relatório de Contexto e Jornada",
    period_start: ago(21),
    period_end: ago(14),
    coverage: {
      conversation_count: 2,
      user_message_count: 11,
      active_day_count: 3,
      completeness: "limited",
      note: "Poucas conversas neste período.",
    },
    summary:
      "Período com menos registros. Você mencionou principalmente a troca de gestor no trabalho e o esforço de recomeçar a relação com um time novo.",
    timeline: [
      {
        id: "tl-a1",
        description: "Relatou mudança de gestor pela terceira vez no ano.",
        occurred_at: ago(18),
      },
    ],
    items: [
      {
        id: "item-a1",
        kind: "change",
        title: "Troca de gestor",
        description:
          "Relatou a terceira mudança de gestor em doze meses e o esforço de reconstruir a relação a cada troca.",
        evidence_strength: "explicit_once",
        occurred_at: ago(18),
        limitations: [],
        included: true,
      },
    ],
    limitations: ["Período com poucos registros."],
    provider: "mock",
    model: "design-mode",
    prompt_version: "journey-report-v2",
    graph_version: "journey-report-graph-v2",
    review_status: "approved",
    reviewed_at: ago(14),
    created_at: ago(14),
  },
];

export const invitationPreview = {
  professional_display_name: "Rui Andrade",
  profession_type: "psychologist",
  organization_name: "Consultório Rui Andrade",
  masked_email: "he****@exemplo.com",
  expires_at: ago(-5),
};
