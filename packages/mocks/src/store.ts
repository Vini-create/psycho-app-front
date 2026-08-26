import type {
  Account,
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
