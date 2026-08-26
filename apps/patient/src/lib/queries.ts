"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  newIdempotencyKey,
  type CheckinAssignmentStatus,
  type ConsentScope,
  type ConsentType,
  type Message,
} from "@sinapsa/api-client";
import { appApi } from "./api";

export const keys = {
  consents: ["consents"] as const,
  conversations: ["conversations"] as const,
  messages: (conversationId: string) => ["messages", conversationId] as const,
  connections: ["connections"] as const,
  contextRequests: (connectionId: string) =>
    ["context-report-requests", connectionId] as const,
  invitation: (token: string) => ["invitation", token] as const,
  checkins: (day: string) => ["checkins", day] as const,
  checkinAssignments: (connectionId: string) =>
    ["checkin-assignments", connectionId] as const,
  checkinCollectionRequests: (connectionId: string) =>
    ["checkin-collection-requests", connectionId] as const,
};

/**
 * O dia local de quem responde. O servidor aceita apenas um dia de distância
 * do agora em UTC — o suficiente para qualquer fuso, sem deixar o cliente
 * escolher livremente a data de um registro diário.
 */
export function localDay(date = new Date()): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

/* -------------------------------------------------------- consentimentos */

const REQUIRED_CONSENTS: ConsentType[] = ["terms", "privacy", "ai_processing"];

export function useConsents() {
  return useQuery({
    queryKey: keys.consents,
    queryFn: () => appApi.listConsents(),
    select: (data) => {
      const granted = new Set(data.consents.map((consent) => consent.type));
      return {
        consents: data.consents,
        missing: REQUIRED_CONSENTS.filter((type) => !granted.has(type)),
        complete: REQUIRED_CONSENTS.every((type) => granted.has(type)),
      };
    },
  });
}

export function useGrantConsents() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (types: ConsentType[]) => appApi.grantConsents(types),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.consents });
    },
  });
}

export function useRevokeConsent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (type: ConsentType) => appApi.revokeConsent(type),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.consents });
    },
  });
}

/* ---------------------------------------------------------------- conversas */

export function useConversations(
  options?: Partial<UseQueryOptions<Awaited<ReturnType<typeof appApi.listConversations>>>>,
) {
  return useQuery({
    queryKey: keys.conversations,
    queryFn: () => appApi.listConversations(),
    ...options,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title?: string) => appApi.createConversation(title),
    onSuccess: (conversation) => {
      // A navegação usa o ID retornado imediatamente. Atualizar a lista de
      // forma síncrona evita que ChatPageClient interprete esse ID como
      // inexistente enquanto o refetch ainda está em voo e volte à conversa
      // anterior.
      queryClient.setQueryData<
        Awaited<ReturnType<typeof appApi.listConversations>>
      >(keys.conversations, (current) => ({
        conversations: [
          conversation,
          ...(current?.conversations.filter(
            (item) => item.id !== conversation.id,
          ) ?? []),
        ],
      }));
      void queryClient.invalidateQueries({ queryKey: keys.conversations });
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) =>
      appApi.deleteConversation(conversationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.conversations });
    },
  });
}

export function useRenameConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, title }: { conversationId: string; title: string }) =>
      appApi.renameConversation(conversationId, title),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.conversations });
    },
  });
}

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: keys.messages(conversationId),
    queryFn: () => appApi.listMessages(conversationId, { limit: 100 }),
    // A conversa muda por ação da pessoa, não sozinha: sem polling.
    staleTime: 0,
  });
}

/**
 * A chave de idempotência é gerada UMA vez por envio e vive na variável da
 * mutation, então um retry de rede do TanStack reusaria a mesma chave.
 */
export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  type MessageList = Awaited<ReturnType<typeof appApi.listMessages>>;

  return useMutation({
    mutationFn: ({
      content,
      idempotencyKey,
    }: {
      content: string;
      idempotencyKey: string;
    }) =>
      appApi.sendMessageStream(
        conversationId,
        content,
        idempotencyKey,
        (delta) => {
          const queryKey = keys.messages(conversationId);
          const streamId = `stream-${idempotencyKey}`;
          queryClient.setQueryData<MessageList>(queryKey, (current) => {
            const messages = current?.messages ?? [];
            const existing = messages.find((message) => message.id === streamId);
            if (existing) {
              return {
                messages: messages.map((message) =>
                  message.id === streamId
                    ? { ...message, content: message.content + delta }
                    : message,
                ),
              };
            }
            const userSequence =
              messages.find(
                (message) => message.id === `optimistic-${idempotencyKey}`,
              )?.sequence ?? (messages.at(-1)?.sequence ?? 0);
            return {
              messages: [
                ...messages,
                {
                  id: streamId,
                  conversation_id: conversationId,
                  sequence: userSequence + 1,
                  role: "assistant",
                  content: delta,
                  generation_status: "pending",
                  created_at: new Date().toISOString(),
                },
              ],
            };
          });
        },
      ),
    onMutate: async ({ content, idempotencyKey }) => {
      const queryKey = keys.messages(conversationId);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<MessageList>(queryKey);
      const current = previous?.messages ?? [];
      const optimisticId = `optimistic-${idempotencyKey}`;
      const optimisticMessage: Message = {
        id: optimisticId,
        conversation_id: conversationId,
        sequence: (current.at(-1)?.sequence ?? 0) + 1,
        role: "user",
        content: content.trim(),
        generation_status: "pending",
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData<MessageList>(queryKey, {
        messages: [...current, optimisticMessage],
      });
      return { previous, optimisticId };
    },
    onSuccess: (response, _variables, context) => {
      queryClient.setQueryData<MessageList>(
        keys.messages(conversationId),
        (current) => {
          const serverIds = new Set([
            response.user_message.id,
            response.assistant_message?.id,
          ].filter(Boolean));
          const reconciled = (current?.messages ?? []).filter(
            (message) =>
              message.id !== context?.optimisticId &&
              message.id !== `stream-${_variables.idempotencyKey}` &&
              !serverIds.has(message.id),
          );
          reconciled.push(response.user_message);
          if (response.assistant_message) reconciled.push(response.assistant_message);
          reconciled.sort((a, b) => a.sequence - b.sequence);
          return { messages: reconciled };
        },
      );
    },
    onError: (_error, _variables, context) => {
      if (!context) return;
      queryClient.setQueryData<MessageList>(
        keys.messages(conversationId),
        context.previous ?? { messages: [] },
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: keys.messages(conversationId),
      });
      void queryClient.invalidateQueries({ queryKey: keys.conversations });
    },
  });
}

export function useRetryMessage(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userMessageId: string) => appApi.retryMessage(userMessageId),
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: keys.messages(conversationId),
      });
    },
  });
}

export { newIdempotencyKey };

/* ------------------------------------------------------- convites e vínculos */

export function useInvitationPreview(token: string) {
  return useQuery({
    queryKey: keys.invitation(token),
    queryFn: () => appApi.previewInvitation(token),
    retry: false,
  });
}

export function useAcceptInvitation(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scopes: ConsentScope[]) =>
      appApi.acceptInvitation(token, scopes),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.connections });
    },
  });
}

export function useConnections() {
  return useQuery({
    queryKey: keys.connections,
    queryFn: () => appApi.listConnections(),
  });
}

export function useUpdateConnectionConsents() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      connectionId,
      scopes,
    }: {
      connectionId: string;
      scopes: ConsentScope[];
    }) => appApi.updateConnectionConsents(connectionId, scopes),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.connections });
    },
  });
}

export function useEndConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (connectionId: string) => appApi.endConnection(connectionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.connections });
    },
  });
}

export function useContextReportRequests(connectionId: string) {
  return useQuery({
    queryKey: keys.contextRequests(connectionId),
    queryFn: () => appApi.listContextReportRequests(connectionId),
    refetchInterval: (query) =>
      query.state.data?.requests.some((request) => request.status === "processing")
        ? 3_000
        : false,
  });
}

export function useSendRequestedContextReport(connectionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) =>
      appApi.sendRequestedContextReport(requestId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: keys.contextRequests(connectionId),
      });
    },
  });
}

/* ---------------------------------------------------------------- check-ins */

export function useCheckins(day: string) {
  return useQuery({
    queryKey: keys.checkins(day),
    queryFn: () => appApi.listCheckins(day),
  });
}

export function useCheckinAssignments(
  connectionId: string,
  statuses: CheckinAssignmentStatus[],
) {
  return useQuery({
    queryKey: [...keys.checkinAssignments(connectionId), ...statuses],
    queryFn: () => appApi.listCheckinAssignments(connectionId, statuses),
  });
}

/**
 * Responder invalida as duas listas: a do vínculo, onde o pedido estava, e a
 * da tela inicial, onde o check-in aceito passa a aparecer.
 */
export function useRespondToCheckinAssignment(connectionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      assignmentId,
      accepted,
    }: {
      assignmentId: string;
      accepted: boolean;
    }) =>
      accepted
        ? appApi.acceptCheckinAssignment(assignmentId)
        : appApi.declineCheckinAssignment(assignmentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: keys.checkinAssignments(connectionId),
      });
      void queryClient.invalidateQueries({ queryKey: ["checkins"] });
    },
  });
}

export function useEndCheckinAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) =>
      appApi.endCheckinAssignment(assignmentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["checkins"] });
      void queryClient.invalidateQueries({ queryKey: ["checkin-assignments"] });
    },
  });
}

export function useSubmitCheckinEntry(day: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      assignmentId,
      answers,
    }: {
      assignmentId: string;
      answers: { question_id: string; option_id: string }[];
    }) =>
      appApi.submitCheckinEntry(
        assignmentId,
        day,
        answers,
        newIdempotencyKey(),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.checkins(day) });
    },
  });
}

export function useCheckinCollectionRequests(connectionId: string) {
  return useQuery({
    queryKey: keys.checkinCollectionRequests(connectionId),
    queryFn: () => appApi.listCheckinCollectionRequests(connectionId),
  });
}

export function useSendCheckinCollection(connectionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      requestId,
      assignmentIds,
    }: {
      requestId: string;
      assignmentIds: string[];
    }) => appApi.sendCheckinCollection(requestId, assignmentIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: keys.checkinCollectionRequests(connectionId),
      });
    },
  });
}

export function useDeclineCheckinCollectionRequest(connectionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) =>
      appApi.declineCheckinCollectionRequest(requestId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: keys.checkinCollectionRequests(connectionId),
      });
    },
  });
}
