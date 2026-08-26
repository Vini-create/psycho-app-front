import type { ApiClient } from "../client";
import { ApiError } from "../errors";
import type {
  CheckinAssignment,
  CheckinAssignmentStatus,
  CheckinCollectionRequest,
  CheckinEntry,
  Connection,
  Consent,
  ConsentScope,
  ConsentType,
  ContextReportRequest,
  Conversation,
  InvitationPreview,
  Message,
  SendCheckinCollectionResult,
  SendMessageResponse,
} from "../types";

/** Rotas do paciente. */
export function appEndpoints(client: ApiClient) {
  return {
    /* ------------------------------------------------------ consentimentos */

    listConsents() {
      return client.request<{ consents: Consent[] }>("/v1/app/consents");
    },

    /** O backend escolhe a versão vigente; nunca enviamos policy_version. */
    grantConsents(consentTypes: ConsentType[]) {
      return client.request<{ consents: Consent[] }>("/v1/app/consents", {
        method: "POST",
        body: { consent_types: consentTypes },
      });
    },

    revokeConsent(consentType: ConsentType) {
      return client.request<void>(`/v1/app/consents/${consentType}`, {
        method: "DELETE",
      });
    },

    /* ----------------------------------------------------------- conversas */

    createConversation(title?: string) {
      return client.request<Conversation>("/v1/app/conversations", {
        method: "POST",
        body: title ? { title } : {},
      });
    },

    listConversations() {
      return client.request<{ conversations: Conversation[] }>(
        "/v1/app/conversations",
      );
    },

    renameConversation(conversationId: string, title: string) {
      return client.request<Conversation>(
        `/v1/app/conversations/${conversationId}`,
        { method: "PATCH", body: { title } },
      );
    },

    /** Arquivamento lógico: as mensagens continuam existindo. */
    deleteConversation(conversationId: string) {
      return client.request<void>(`/v1/app/conversations/${conversationId}`, {
        method: "DELETE",
      });
    },

    listMessages(
      conversationId: string,
      params: { limit?: number; before_sequence?: number } = {},
    ) {
      const query = new URLSearchParams();
      if (params.limit) query.set("limit", String(params.limit));
      if (params.before_sequence !== undefined) {
        query.set("before_sequence", String(params.before_sequence));
      }
      const suffix = query.size ? `?${query}` : "";
      return client.request<{ messages: Message[] }>(
        `/v1/app/conversations/${conversationId}/messages${suffix}`,
      );
    },

    /** `idempotencyKey` é obrigatório: uma por ação de envio. */
    sendMessage(
      conversationId: string,
      content: string,
      idempotencyKey: string,
    ) {
      return client.request<SendMessageResponse>(
        `/v1/app/conversations/${conversationId}/messages`,
        { method: "POST", body: { content }, idempotencyKey },
      );
    },

    /** Stream SSE autenticado; `onDelta` recebe somente texto validado. */
    async sendMessageStream(
      conversationId: string,
      content: string,
      idempotencyKey: string,
      onDelta: (delta: string) => void,
    ): Promise<SendMessageResponse> {
      const response = await client.openStream(
        `/v1/app/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: { Accept: "text/event-stream" },
          body: { content },
          idempotencyKey,
        },
      );
      if (!response.body) {
        throw streamError("A resposta incremental não possui um corpo legível.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          buffer += decoder.decode(value, { stream: !done }).replaceAll("\r\n", "\n");
          let boundary = buffer.indexOf("\n\n");
          while (boundary >= 0) {
            const block = buffer.slice(0, boundary);
            buffer = buffer.slice(boundary + 2);
            const event = parseSSEBlock(block);
            if (event?.name === "assistant.delta") {
              const payload = parseStreamJSON<{ delta?: unknown }>(event.data);
              if (typeof payload.delta !== "string" || payload.delta.length === 0) {
                throw streamError("O servidor enviou um fragmento inválido.");
              }
              onDelta(payload.delta);
            }
            if (event?.name === "assistant.error") {
              throw streamError("A geração foi interrompida antes de terminar.");
            }
            if (event?.name === "assistant.completed") {
              return parseStreamJSON<SendMessageResponse>(event.data);
            }
            boundary = buffer.indexOf("\n\n");
          }
          if (done) break;
        }
      } catch (error) {
        if (error instanceof ApiError) throw error;
        throw streamError("A conexão incremental foi interrompida.");
      } finally {
        reader.releaseLock();
      }
      throw streamError("A conexão terminou antes da resposta completa.");
    },

    /** Só com id de mensagem `role=user`, e só após 60s de `pending`. */
    retryMessage(userMessageId: string) {
      return client.request<SendMessageResponse>(
        `/v1/app/messages/${userMessageId}/retry`,
        { method: "POST" },
      );
    },

    /* ------------------------------------------------- convites e vínculos */

    /** Público: não exige autenticação. */
    previewInvitation(token: string) {
      return client.request<InvitationPreview>(
        `/v1/app/invitations/${token}`,
        { skipAuth: true },
      );
    },

    acceptInvitation(token: string, consentScopes: ConsentScope[]) {
      return client.request<{ connection_id: string; status: string }>(
        `/v1/app/invitations/${token}/accept`,
        { method: "POST", body: { consent_scopes: consentScopes } },
      );
    },

    listConnections() {
      return client.request<{ connections: Connection[] }>(
        "/v1/app/connections",
      );
    },

    /** Substitui TODOS os escopos atuais — não é um merge. */
    updateConnectionConsents(
      connectionId: string,
      consentScopes: ConsentScope[],
    ) {
      return client.request<void>(
        `/v1/app/connections/${connectionId}/consents`,
        { method: "PUT", body: { consent_scopes: consentScopes } },
      );
    },

    endConnection(connectionId: string) {
      return client.request<void>(`/v1/app/connections/${connectionId}`, {
        method: "DELETE",
      });
    },

    listContextReportRequests(connectionId: string) {
      return client.request<{ requests: ContextReportRequest[] }>(
        `/v1/app/connections/${connectionId}/context-report-requests`,
      );
    },

    /**
     * Única ação do paciente que pode iniciar um relatório. O período vem da
     * solicitação profissional e não pode ser substituído pelo frontend.
     */
    sendRequestedContextReport(requestId: string) {
      return client.request<{ request_id: string; status: string }>(
        `/v1/app/context-report-requests/${requestId}/send`,
        { method: "POST" },
      );
    },

    /* ------------------------------------------------------------ check-ins */

    /**
     * Os check-ins ativos de todos os vínculos, com o estado do dia já
     * resolvido pelo servidor. `localDate` é o dia do aparelho: sem ele o
     * backend usa o dia UTC, que pode não ser o dia de quem responde.
     */
    listCheckins(localDate: string) {
      return client.request<{ checkins: CheckinAssignment[] }>(
        `/v1/app/checkins?date=${encodeURIComponent(localDate)}`,
      );
    },

    listCheckinAssignments(
      connectionId: string,
      statuses: CheckinAssignmentStatus[],
    ) {
      const query = new URLSearchParams({ status: statuses.join(",") });
      return client.request<{ assignments: CheckinAssignment[] }>(
        `/v1/app/connections/${connectionId}/checkin-assignments?${query}`,
      );
    },

    acceptCheckinAssignment(assignmentId: string) {
      return client.request<void>(
        `/v1/app/checkin-assignments/${assignmentId}/accept`,
        { method: "POST" },
      );
    },

    declineCheckinAssignment(assignmentId: string) {
      return client.request<void>(
        `/v1/app/checkin-assignments/${assignmentId}/decline`,
        { method: "POST" },
      );
    },

    /** O paciente para de responder quando quiser. */
    endCheckinAssignment(assignmentId: string) {
      return client.request<void>(
        `/v1/app/checkin-assignments/${assignmentId}`,
        { method: "DELETE" },
      );
    },

    /**
     * Um dia inteiro de uma vez: todas as perguntas do modelo. Reenviar o
     * mesmo dia corrige a resposta, não duplica.
     */
    submitCheckinEntry(
      assignmentId: string,
      entryDate: string,
      answers: { question_id: string; option_id: string }[],
      idempotencyKey: string,
    ) {
      return client.request<CheckinEntry>(
        `/v1/app/checkins/${assignmentId}/entries`,
        {
          method: "POST",
          body: { entry_date: entryDate, answers },
          idempotencyKey,
        },
      );
    },

    listCheckinEntries(assignmentId: string, from: string, to: string) {
      const query = new URLSearchParams({ from, to });
      return client.request<{ entries: CheckinEntry[] }>(
        `/v1/app/checkins/${assignmentId}/entries?${query}`,
      );
    },

    listCheckinCollectionRequests(connectionId: string) {
      return client.request<{ requests: CheckinCollectionRequest[] }>(
        `/v1/app/connections/${connectionId}/checkin-collection-requests`,
      );
    },

    /** O paciente escolhe quais check-ins entram na colheita. */
    sendCheckinCollection(requestId: string, assignmentIds: string[]) {
      return client.request<SendCheckinCollectionResult>(
        `/v1/app/checkin-collection-requests/${requestId}/send`,
        { method: "POST", body: { assignment_ids: assignmentIds } },
      );
    },

    declineCheckinCollectionRequest(requestId: string) {
      return client.request<void>(
        `/v1/app/checkin-collection-requests/${requestId}/decline`,
        { method: "POST" },
      );
    },

  };
}

function parseSSEBlock(block: string): { name: string; data: string } | null {
  let name = "message";
  const data: string[] = [];
  for (const line of block.split("\n")) {
    if (line.startsWith(":")) continue;
    if (line.startsWith("event:")) name = line.slice(6).trim();
    if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
  }
  return data.length > 0 ? { name, data: data.join("\n") } : null;
}

function parseStreamJSON<T>(value: string): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    throw streamError("O servidor enviou um evento inválido.");
  }
}

function streamError(message: string): ApiError {
  return new ApiError({ code: "network_error", message, status: 0 });
}
