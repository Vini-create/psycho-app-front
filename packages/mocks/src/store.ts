import type {
  Account,
  CheckinAssignment,
  CheckinCollection,
  CheckinCollectionCheckin,
  CheckinCollectionRequest,
  CheckinEntry,
  CheckinTemplate,
  CheckinTemplateInput,
  Connection,
  Consent,
  ConsentScope,
  ConsentType,
  ContextReport,
  ContextReportRequest,
  Conversation,
  Invitation,
  Message,
  Passkey,
  ProfessionalProfile,
} from "@sinapsa/api-client";
import * as app from "./fixtures/app";
import * as checkins from "./fixtures/checkins";
import * as professional from "./fixtures/professional";
import { ago, patientAccount, professionalAccount } from "./fixtures/shared";

const clone = <T>(value: T): T => structuredClone(value);

type State = {
  appAccount: Account;
  professionalAccount: Account;
  consents: Consent[];
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  connections: Connection[];
  profile: ProfessionalProfile | null;
  patients: Connection[];
  patientContexts: Record<string, ContextReport[]>;
  contextReportRequests: ContextReportRequest[];
  invitations: Invitation[];
  passkeys: Passkey[];
  checkinTemplates: CheckinTemplate[];
  checkinAssignments: CheckinAssignment[];
  checkinEntries: Record<string, CheckinEntry[]>;
  checkinCollectionRequests: CheckinCollectionRequest[];
  checkinCollections: CheckinCollection[];
};

function initialState(): State {
  return {
    appAccount: clone(patientAccount),
    professionalAccount: clone(professionalAccount),
    consents: clone(app.consents),
    conversations: clone(app.conversations),
    messages: clone(app.messages),
    connections: clone(app.connections),
    profile: clone(professional.profile),
    patients: clone(professional.patients),
    patientContexts: clone(professional.patientContexts),
    contextReportRequests: clone(app.contextReportRequests),
    invitations: clone(professional.invitations),
    passkeys: clone(professional.passkeys),
    checkinTemplates: clone(checkins.templates),
    checkinAssignments: clone(checkins.assignments),
    checkinEntries: clone(checkins.entries),
    checkinCollectionRequests: clone(checkins.collectionRequests),
    // O retrato histórico é calculado com a mesma conta do envio real, para o
    // painel abrir com números coerentes com a série das respostas.
    checkinCollections: [
      buildCollection(
        "checkin-collection-anterior",
        checkins.collectionRequests[1]!,
        ["assign-rui-humor"],
        clone(checkins.assignments),
        clone(checkins.entries),
      ),
    ],
  };
}

export const state: State = initialState();

export function resetState(): void {
  Object.assign(state, initialState());
}

let sequence = 1_000;
const nextId = (prefix: string) => `${prefix}-${(sequence += 1)}`;

/* ------------------------------------------------------------- conversas */

export function createConversation(title?: string): Conversation {
  const conversation: Conversation = {
    id: nextId("conv"),
    title: title?.trim() || "Nova conversa",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  state.conversations.unshift(conversation);
  state.messages[conversation.id] = [];
  return conversation;
}

export function deleteConversation(id: string): void {
  state.conversations = state.conversations.filter((c) => c.id !== id);
}

export function renameConversation(id: string, title: string): Conversation | null {
  const conversation = state.conversations.find((item) => item.id === id);
  if (!conversation) return null;
  conversation.title = title.trim();
  conversation.updated_at = new Date().toISOString();
  return conversation;
}

/**
 * Respostas variadas para o design não ser validado sempre com o mesmo
 * tamanho de bolha. Nenhuma delas interpreta ou diagnostica.
 */
const REPLIES = [
  "Entendi. O que veio junto com isso?",
  "Obrigada por contar. Quer desenvolver um pouco mais essa parte?",
  "Faz sentido. Isso é algo que apareceu outras vezes, ou foi pontual desta vez?",
  "Anotei. Se quiser, podemos voltar nisso outro dia, não precisa resolver agora.",
  "Você quer que eu marque isso como algo para levar na próxima sessão?",
];

export function appendMessage(conversationId: string, content: string) {
  const list = state.messages[conversationId] ?? [];
  const base = list.length ? list[list.length - 1]!.sequence : 0;

  const userMessage: Message = {
    id: nextId("m"),
    conversation_id: conversationId,
    sequence: base + 1,
    role: "user",
    content,
    generation_status: "completed",
    created_at: new Date().toISOString(),
  };

  const assistantMessage: Message = {
    id: nextId("m"),
    conversation_id: conversationId,
    sequence: base + 2,
    role: "assistant",
    content: REPLIES[Math.floor(Math.random() * REPLIES.length)]!,
    in_reply_to_message_id: userMessage.id,
    generation_status: "completed",
    ai_provider: "mock",
    ai_model: "design-mode",
    prompt_version: "companion-v2",
    created_at: new Date().toISOString(),
  };

  state.messages[conversationId] = [...list, userMessage, assistantMessage];

  const conversation = state.conversations.find((c) => c.id === conversationId);
  if (conversation) conversation.updated_at = new Date().toISOString();

  return { userMessage, assistantMessage };
}

/** Retry resolve a geração que havia falhado, como o backend faria. */
export function retryMessage(userMessageId: string) {
  for (const [conversationId, list] of Object.entries(state.messages)) {
    const index = list.findIndex((m) => m.id === userMessageId);
    if (index === -1) continue;

    const userMessage = list[index]!;
    userMessage.generation_status = "completed";
    delete userMessage.failure_code;

    const assistantMessage: Message = {
      id: nextId("m"),
      conversation_id: conversationId,
      sequence: userMessage.sequence + 1,
      role: "assistant",
      content:
        "Desculpa a demora. Você mencionou o sono. Como têm sido as noites nesses dias?",
      in_reply_to_message_id: userMessage.id,
      generation_status: "completed",
      ai_provider: "mock",
      ai_model: "design-mode",
      prompt_version: "companion-v2",
      created_at: new Date().toISOString(),
    };
    list.splice(index + 1, 0, assistantMessage);
    return { userMessage, assistantMessage };
  }
  return null;
}

/* -------------------------------------------------------- consentimentos */

export function grantConsents(types: ConsentType[]): Consent[] {
  for (const type of types) {
    if (!state.consents.some((consent) => consent.type === type)) {
      state.consents.push({
        type,
        policy_version: "2026-08-18",
        granted_at: new Date().toISOString(),
      });
    }
  }
  return state.consents;
}

export function revokeConsent(type: ConsentType): void {
  state.consents = state.consents.filter((consent) => consent.type !== type);
}

/* ---------------------------------------------------- vínculos e permissões */

export function updateConnectionConsents(id: string, scopes: ConsentScope[]) {
  const connection = state.connections.find(
    (c) => c.id === id || c.connection_id === id,
  );
  if (connection) connection.consent_scopes = scopes;
}

export function endConnection(id: string): void {
  const connection = state.connections.find(
    (c) => c.id === id || c.connection_id === id,
  );
  if (connection) {
    connection.status = "ended";
    connection.ended_at = new Date().toISOString();
    connection.consent_scopes = [];
  }
}

/* ------------------------------------------------------------ profissional */

export function upsertProfile(input: ProfessionalProfile): ProfessionalProfile {
  state.profile = { ...state.profile, ...input };
  return state.profile;
}

export function createInvitation(email: string): Invitation {
  const token = nextId("token");
  const invitation: Invitation = {
    id: nextId("inv"),
    email,
    invitation_token: token,
    invitation_url: `http://localhost:3000/convite/${token}`,
    status: "pending",
    expires_at: ago(-7),
    created_at: new Date().toISOString(),
  };
  state.invitations.unshift(invitation);
  return invitation;
}

export function revokeInvitation(id: string): void {
  const invitation = state.invitations.find((i) => i.id === id);
  if (invitation) invitation.status = "revoked";
}

export function endPatient(connectionId: string): void {
  const patient = state.patients.find(
    (p) => p.id === connectionId || p.connection_id === connectionId,
  );
  if (patient) {
    patient.status = "ended";
    patient.ended_at = new Date().toISOString();
  }
}

export function removePasskey(id: string): void {
  state.passkeys = state.passkeys.filter((passkey) => passkey.id !== id);
}

/* --------------------------------------------- solicitações de relatório */

export function createContextReportRequest(
  connectionId: string,
  periodStart: string,
  periodEnd: string,
): ContextReportRequest {
  const patient = state.patients.find(
    (item) => item.id === connectionId || item.connection_id === connectionId,
  );
  const patientConnection = state.connections.find(
    (item) => item.id === connectionId || item.connection_id === connectionId,
  );
  const request: ContextReportRequest = {
    id: nextId("request"),
    connection_id: connectionId,
    period_start: periodStart,
    period_end: periodEnd,
    status: "pending",
    professional_display_name:
      patientConnection?.professional_display_name ?? "Rui Andrade",
    patient_display_name: patient?.patient_display_name,
    requested_at: new Date().toISOString(),
    sent_at: null,
  };
  state.contextReportRequests.unshift(request);
  return request;
}

export function sendContextReportRequest(
  requestId: string,
): ContextReportRequest | null {
  const request = state.contextReportRequests.find((item) => item.id === requestId);
  if (!request) return null;

  if (request.status === "pending") {
    request.status = "processing";
  }
  return request;
}

/* ------------------------------------------------------------- check-ins */

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * A mesma conta do backend, refeita aqui: média por pergunta, score do dia e
 * extremos. No produto real nada disso acontece no cliente — o mock só existe
 * para o modo de desenho ver números coerentes sem backend.
 */
export function buildCollection(
  id: string,
  request: CheckinCollectionRequest,
  assignmentIds: string[],
  assignments: CheckinAssignment[],
  entriesByAssignment: Record<string, CheckinEntry[]>,
): CheckinCollection {
  const periodDays =
    Math.round(
      (Date.parse(request.period_end) - Date.parse(request.period_start)) / 86_400_000,
    ) + 1;

  const checkins: CheckinCollectionCheckin[] = [];
  for (const assignmentId of assignmentIds) {
    const assignment = assignments.find((item) => item.id === assignmentId);
    if (!assignment) continue;

    const questions = assignment.template.questions;
    const bounds = new Map(
      questions.map((question) => {
        const scores = question.options.map((option) => option.score);
        return [question.id, { min: Math.min(...scores), max: Math.max(...scores) }];
      }),
    );
    const normalize = (questionId: string, score: number) => {
      const bound = bounds.get(questionId);
      if (!bound || bound.max <= bound.min) return 0;
      return (score - bound.min) / (bound.max - bound.min);
    };

    const period = (entriesByAssignment[assignmentId] ?? []).filter(
      (entry) =>
        entry.entry_date >= request.period_start &&
        entry.entry_date <= request.period_end,
    );

    const totals = new Map<string, { raw: number; normalized: number; count: number }>();
    let overallRaw = 0;
    let overallNormalized = 0;
    let overallCount = 0;

    const days = period.map((entry) => {
      let raw = 0;
      let normalized = 0;
      for (const answer of entry.answers) {
        const value = normalize(answer.question_id, answer.score);
        raw += answer.score;
        normalized += value;
        const total = totals.get(answer.question_id) ?? {
          raw: 0,
          normalized: 0,
          count: 0,
        };
        total.raw += answer.score;
        total.normalized += value;
        total.count += 1;
        totals.set(answer.question_id, total);
      }
      overallRaw += raw;
      overallNormalized += normalized;
      overallCount += entry.answers.length;
      return {
        date: entry.entry_date,
        average: round2(raw / entry.answers.length),
        normalized: round2(normalized / entry.answers.length),
        answer_count: entry.answers.length,
      };
    });

    const sorted = [...days].sort((a, b) => a.normalized - b.normalized);

    checkins.push({
      assignment_id: assignmentId,
      title: assignment.template.title,
      legend: assignment.template.legend,
      // No backend isto compara a filiação de quem autorou com a de quem lê.
      authored_by_you: assignment.connection_id === request.connection_id,
      period_day_count: periodDays,
      answered_day_count: days.length,
      average: overallCount ? round2(overallRaw / overallCount) : 0,
      normalized: overallCount ? round2(overallNormalized / overallCount) : 0,
      questions: questions.map((question) => {
        const bound = bounds.get(question.id)!;
        const total = totals.get(question.id);
        return {
          question_id: question.id,
          prompt: question.prompt,
          position: question.position,
          average: total ? round2(total.raw / total.count) : 0,
          normalized: total ? round2(total.normalized / total.count) : 0,
          score_min: bound.min,
          score_max: bound.max,
          answer_count: total?.count ?? 0,
        };
      }),
      days,
      best_day: sorted.at(-1),
      worst_day: sorted[0],
    });
  }

  return {
    id,
    connection_id: request.connection_id,
    request_id: request.id,
    period_start: request.period_start,
    period_end: request.period_end,
    shared_at: request.responded_at ?? new Date().toISOString(),
    checkins,
  };
}

function templateFromInput(
  input: CheckinTemplateInput,
  id: string,
  existing?: CheckinTemplate,
): CheckinTemplate {
  return {
    id,
    title: input.title.trim(),
    legend: input.legend.trim() || undefined,
    status: existing?.status ?? "draft",
    questions: input.questions.map((question, questionIndex) => ({
      id: `${id}-q${questionIndex + 1}`,
      position: questionIndex + 1,
      prompt: question.prompt.trim(),
      legend: question.legend.trim() || undefined,
      // A nota é a posição: o primeiro rótulo é o extremo mais baixo.
      options: question.options.map((option, optionIndex) => ({
        id: `${id}-q${questionIndex + 1}-o${optionIndex + 1}`,
        position: optionIndex + 1,
        label: option.label.trim(),
        score: optionIndex + 1,
      })),
    })),
    published_at: existing?.published_at,
    created_at: existing?.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function createCheckinTemplate(input: CheckinTemplateInput): CheckinTemplate {
  const template = templateFromInput(input, nextId("tpl"));
  state.checkinTemplates.unshift(template);
  return template;
}

export function updateCheckinTemplate(
  id: string,
  input: CheckinTemplateInput,
): CheckinTemplate | null {
  const index = state.checkinTemplates.findIndex((item) => item.id === id);
  if (index === -1) return null;
  const existing = state.checkinTemplates[index]!;
  if (existing.status !== "draft") return null;
  const updated = templateFromInput(input, id, existing);
  state.checkinTemplates[index] = updated;
  return updated;
}

export function archiveCheckinTemplate(id: string): void {
  state.checkinTemplates = state.checkinTemplates.filter((item) => item.id !== id);
}

export function createCheckinAssignment(
  connectionId: string,
  templateId: string,
): CheckinAssignment | null {
  const template = state.checkinTemplates.find((item) => item.id === templateId);
  if (!template) return null;
  // Enviar publica: a partir daqui o modelo não muda mais.
  template.status = "published";
  template.published_at = template.published_at ?? new Date().toISOString();

  const patient = state.patients.find(
    (item) => item.id === connectionId || item.connection_id === connectionId,
  );
  const assignment: CheckinAssignment = {
    id: nextId("assign"),
    connection_id: connectionId,
    status: "pending",
    professional_display_name: state.professionalAccount.display_name,
    patient_display_name: patient?.patient_display_name,
    template: clone(template),
    requested_at: new Date().toISOString(),
    answered_today: false,
    answered_days: 0,
  };
  state.checkinAssignments.unshift(assignment);
  return assignment;
}

export function respondCheckinAssignment(
  id: string,
  accepted: boolean,
): CheckinAssignment | null {
  const assignment = state.checkinAssignments.find((item) => item.id === id);
  if (!assignment || assignment.status !== "pending") return null;
  assignment.status = accepted ? "active" : "declined";
  assignment.responded_at = new Date().toISOString();
  if (!accepted) assignment.ended_at = assignment.responded_at;
  return assignment;
}

export function closeCheckinAssignment(
  id: string,
  status: "ended" | "revoked",
): CheckinAssignment | null {
  const assignment = state.checkinAssignments.find((item) => item.id === id);
  if (!assignment || !["pending", "active"].includes(assignment.status)) return null;
  assignment.status = status;
  assignment.ended_at = new Date().toISOString();
  return assignment;
}

export function submitCheckinEntry(
  assignmentId: string,
  entryDate: string,
  answers: { question_id: string; option_id: string }[],
): CheckinEntry | null {
  const assignment = state.checkinAssignments.find((item) => item.id === assignmentId);
  if (!assignment || assignment.status !== "active") return null;

  const questions = assignment.template.questions;
  if (answers.length !== questions.length) return null;

  const scored = [];
  for (const answer of answers) {
    const question = questions.find((item) => item.id === answer.question_id);
    const option = question?.options.find((item) => item.id === answer.option_id);
    // Alternativa de outra pergunta é recusada, como no backend.
    if (!question || !option) return null;
    scored.push({
      question_id: question.id,
      option_id: option.id,
      score: option.score,
    });
  }

  const list = state.checkinEntries[assignmentId] ?? [];
  const existing = list.find((item) => item.entry_date === entryDate);
  const now = new Date().toISOString();
  if (existing) {
    existing.answers = scored;
    existing.updated_at = now;
    return existing;
  }
  const entry: CheckinEntry = {
    id: nextId("entry"),
    assignment_id: assignmentId,
    entry_date: entryDate,
    answers: scored,
    submitted_at: now,
    updated_at: now,
  };
  state.checkinEntries[assignmentId] = [...list, entry];
  return entry;
}

/** Decora a atribuição com o estado do dia, como o backend faz. */
export function checkinForApp(
  assignment: CheckinAssignment,
  today: string,
): CheckinAssignment {
  const list = state.checkinEntries[assignment.id] ?? [];
  const todayEntry = list.find((entry) => entry.entry_date === today);
  const dates = list.map((entry) => entry.entry_date).sort();
  return {
    ...assignment,
    answered_today: todayEntry !== undefined,
    today_entry: todayEntry,
    last_entry_date: dates.at(-1),
    answered_days: list.length,
  };
}

export function createCheckinCollectionRequest(
  connectionId: string,
  periodStart: string,
  periodEnd: string,
): CheckinCollectionRequest {
  const patient = state.patients.find(
    (item) => item.id === connectionId || item.connection_id === connectionId,
  );
  const request: CheckinCollectionRequest = {
    id: nextId("checkin-request"),
    connection_id: connectionId,
    professional_display_name: state.professionalAccount.display_name,
    patient_display_name: patient?.patient_display_name,
    period_start: periodStart,
    period_end: periodEnd,
    status: "pending",
    requested_at: new Date().toISOString(),
  };
  state.checkinCollectionRequests.unshift(request);
  return request;
}

export function sendCheckinCollection(
  requestId: string,
  assignmentIds: string[],
): CheckinCollection | null {
  const request = state.checkinCollectionRequests.find((item) => item.id === requestId);
  if (!request || request.status !== "pending") return null;

  request.status = "sent";
  request.responded_at = new Date().toISOString();

  const collection = buildCollection(
    nextId("checkin-collection"),
    request,
    assignmentIds,
    state.checkinAssignments,
    state.checkinEntries,
  );
  state.checkinCollections.unshift(collection);
  return collection;
}

export function declineCheckinCollectionRequest(requestId: string): boolean {
  const request = state.checkinCollectionRequests.find((item) => item.id === requestId);
  if (!request || request.status !== "pending") return false;
  request.status = "declined";
  request.responded_at = new Date().toISOString();
  return true;
}
