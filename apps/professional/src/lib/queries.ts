"use client";

import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  hasCode,
  type ProfessionalProfile,
  type ProfessionalProfileInput,
} from "@sinapsa/api-client";
import { pro } from "./api";
import { buildInsight, connectionIdOf, subscriptionOf } from "./insights";

export const keys = {
  profile: ["profile"] as const,
  passkeys: ["passkeys"] as const,
  invitations: ["invitations"] as const,
  patients: ["patients"] as const,
  patient: (connectionId: string) => ["patient", connectionId] as const,
  contexts: (connectionId: string) => ["contexts", connectionId] as const,
  contextRequests: (connectionId: string) =>
    ["context-report-requests", connectionId] as const,
};

export function isProfessionalProfileComplete(
  profile: ProfessionalProfile | null | undefined,
): boolean {
  if (!profile) return false;
  if (profile.onboarding_complete !== undefined) {
    return profile.onboarding_complete;
  }
  return (
    (profile.profession_type?.trim().length ?? 0) > 0 &&
    (profile.registration_country_code?.trim().length ?? 0) === 2 &&
    (profile.registration_region?.trim().length ?? 0) > 0 &&
    (profile.registration_number?.trim().length ?? 0) > 0
  );
}

/* ------------------------------------------------------------------- perfil */

/**
 * Antes do onboarding o backend responde 404 — isso é o estado normal de uma
 * conta nova, não uma falha. Traduzimos para `null` para a UI não tratar
 * como erro.
 */
export function useProfile() {
  return useQuery({
    queryKey: keys.profile,
    queryFn: async () => {
      try {
        return await pro.getProfile();
      } catch (error) {
        if (hasCode(error, "not_found")) return null;
        throw error;
      }
    },
    retry: false,
  });
}

export function useUpsertProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfessionalProfileInput) => pro.upsertProfile(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.profile });
    },
  });
}

/* ----------------------------------------------------------------- passkeys */

export function usePasskeys() {
  return useQuery({
    queryKey: keys.passkeys,
    queryFn: () => pro.listPasskeys(),
  });
}

export function useRemovePasskey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (passkeyId: string) => pro.removePasskey(passkeyId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.passkeys });
    },
  });
}

export function useRegenerateRecoveryCodes() {
  return useMutation({ mutationFn: () => pro.regenerateRecoveryCodes() });
}

/* ---------------------------------------------------------------- convites */

export function useInvitations() {
  return useQuery({
    queryKey: keys.invitations,
    queryFn: () => pro.listInvitations(),
  });
}

export function useCreateInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => pro.createInvitation(email),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.invitations });
    },
  });
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => pro.revokeInvitation(invitationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.invitations });
    },
  });
}

/* --------------------------------------------------------------- pacientes */

export function usePatients() {
  return useQuery({
    queryKey: keys.patients,
    queryFn: () => pro.listPatients(),
  });
}

export function usePatient(connectionId: string) {
  return useQuery({
    queryKey: keys.patient(connectionId),
    queryFn: () => pro.getPatient(connectionId),
  });
}

export function useEndPatientConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (connectionId: string) => pro.endPatientConnection(connectionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.patients });
    },
  });
}

/* -------------------------------------------------------------- relatórios */

export function usePatientContexts(connectionId: string) {
  return useQuery({
    queryKey: keys.contexts(connectionId),
    queryFn: () => pro.listPatientContexts(connectionId),
  });
}

export function useContextReportRequests(connectionId: string) {
  return useQuery({
    queryKey: keys.contextRequests(connectionId),
    queryFn: () => pro.listContextReportRequests(connectionId),
    refetchInterval: (query) =>
      query.state.data?.requests.some(
        (request) => request.status === "pending" || request.status === "processing",
      )
        ? 5_000
        : false,
  });
}

export function useCreateContextReportRequest(connectionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (period: { period_start: string; period_end: string }) =>
      pro.createContextReportRequest(connectionId, period),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: keys.contextRequests(connectionId),
      });
    },
  });
}

/* --------------------------------------------------- composição do painel */

/**
 * O painel precisa de contexto por paciente, e a API não expõe rota agregada:
 * a listagem de relatórios é por conexão. Então compomos com uma consulta por
 * paciente, em paralelo.
 *
 * É um N+1 assumido. Na escala deste produto (dezenas de pacientes por
 * profissional) o custo é baixo; quando deixar de ser, o conserto é uma rota
 * de resumo no backend, não um cache no frontend.
 */
export function usePatientInsights() {
  const patients = usePatients();
  const profile = useProfile();

  const connections = patients.data?.patients ?? [];

  const contexts = useQueries({
    queries: connections.map((connection) => {
      const id = connectionIdOf(connection);
      return {
        queryKey: keys.contexts(id),
        queryFn: () => pro.listPatientContexts(id),
        // Sem consentimento de relatórios não há o que buscar.
        enabled: connection.consent_scopes.includes("summaries"),
        staleTime: 60_000,
      };
    }),
  });

  const insights = connections.map((connection, index) =>
    buildInsight(connection, contexts[index]?.data?.contexts ?? []),
  );

  return {
    insights,
    subscription: subscriptionOf(profile.data),
    isPending:
      patients.isPending ||
      profile.isPending ||
      contexts.some((query) => query.isPending && query.fetchStatus !== "idle"),
    error: patients.error ?? profile.error ?? null,
  };
}

export function useSubscription() {
  const profile = useProfile();
  return {
    subscription: subscriptionOf(profile.data),
    isPending: profile.isPending,
  };
}
