import type { ApiClient } from "../client";
import type {
  Connection,
  Consent,
  ConsentScope,
  ConsentType,
  ContextReportRequest,
  Conversation,
  InvitationPreview,
  Message,
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

  };
}
