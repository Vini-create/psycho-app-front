import type { ApiClient } from "../client";
import type {
  CheckinAssignment,
  CheckinCollection,
  CheckinCollectionRequest,
  CheckinTemplate,
  CheckinTemplateInput,
  Connection,
  ContextReport,
  ContextReportRequest,
  Invitation,
  Passkey,
  PasskeyCeremony,
  PasskeyRegistrationResult,
  ProfessionalProfile,
  ProfessionalProfileInput,
  IssuedToken,
  DeviceAuthorizationPollResponse,
  DeviceAuthorizationPreview,
} from "../types";

/**
 * Rotas do profissional.
 * Todas exigem access token profissional COM MFA verificado — sem isso o
 * backend responde 403 mfa_required. O token do primeiro login (antes da
 * primeira passkey) tem mfa=false e não serve aqui.
 */
export function professionalEndpoints(client: ApiClient) {
  const passkeyBase = "/v1/professional/auth/passkeys";

  return {
    /* -------------------------------------------------------- passkeys */

    registrationOptions() {
      return client.request<PasskeyCeremony>(
        `${passkeyBase}/registration/options`,
        { method: "POST" },
      );
    },

    /**
     * Devolve um access token novo com mfa=true.
     * Quem chama PRECISA trocar o token em memória imediatamente, senão toda
     * rota profissional seguinte responde 403.
     */
    verifyRegistration(input: {
      ceremony_token: string;
      label: string;
      credential: unknown;
    }) {
      return client.request<PasskeyRegistrationResult>(
        `${passkeyBase}/registration/verify`,
        { method: "POST", body: input },
      );
    },

    verifyAuthentication(input: {
      ceremony_token: string;
      credential: unknown;
    }) {
      return client.request<IssuedToken>(
        `${passkeyBase}/authentication/verify`,
        { method: "POST", body: input, skipAuth: true },
      );
    },

    /** Só depois do login com senha ter retornado passkey_required=true. */
    authenticateWithRecoveryCode(input: {
      ceremony_token: string;
      recovery_code: string;
    }) {
      return client.request<IssuedToken>(
        `${passkeyBase}/authentication/recovery`,
        { method: "POST", body: input, skipAuth: true },
      );
    },

    previewDeviceAuthorization(scanToken: string) {
      return client.request<DeviceAuthorizationPreview>(
        "/v1/professional/auth/device-authorizations/preview",
        { method: "POST", body: { scan_token: scanToken }, skipAuth: true },
      );
    },

    approveDeviceAuthorization(input: {
      scan_token: string;
      credential: unknown;
    }) {
      return client.request<void>(
        "/v1/professional/auth/device-authorizations/approve",
        { method: "POST", body: input, skipAuth: true },
      );
    },

    consumeDeviceAuthorization(pollToken: string) {
      return client.request<DeviceAuthorizationPollResponse>(
        "/v1/professional/auth/device-authorizations/consume",
        { method: "POST", body: { poll_token: pollToken }, skipAuth: true },
      );
    },

    listPasskeys() {
      return client.request<{ passkeys: Passkey[] }>(passkeyBase);
    },

    /** 409 last_passkey quando é a única — cadastre outra antes. */
    removePasskey(passkeyId: string) {
      return client.request<void>(`${passkeyBase}/${passkeyId}`, {
        method: "DELETE",
      });
    },

    regenerateRecoveryCodes() {
      return client.request<{ recovery_codes: string[] }>(
        `${passkeyBase}/recovery-codes/regenerate`,
        { method: "POST" },
      );
    },

    /* --------------------------------------------------------- perfil */

    /** 404 not_found antes do onboarding — isso é esperado, não é erro. */
    getProfile() {
      return client.request<ProfessionalProfile>("/v1/professional/profile");
    },

    /** Na primeira chamada provisiona organização, membership e trial. */
    upsertProfile(input: ProfessionalProfileInput) {
      return client.request<ProfessionalProfile>("/v1/professional/profile", {
        method: "PUT",
        body: input,
      });
    },

    /* ------------------------------------------------------- convites */

    createInvitation(email: string) {
      return client.request<Invitation>("/v1/professional/invitations", {
        method: "POST",
        body: { email },
      });
    },

    listInvitations() {
      return client.request<{ invitations: Invitation[] }>(
        "/v1/professional/invitations",
      );
    },

    revokeInvitation(invitationId: string) {
      return client.request<void>(
        `/v1/professional/invitations/${invitationId}`,
        { method: "DELETE" },
      );
    },

    /* ------------------------------------------------------ pacientes */

    listPatients() {
      return client.request<{ patients: Connection[] }>(
        "/v1/professional/patients",
      );
    },

    getPatient(connectionId: string) {
      return client.request<Connection>(
        `/v1/professional/patients/${connectionId}`,
      );
    },

    endPatientConnection(connectionId: string) {
      return client.request<void>(
        `/v1/professional/patients/${connectionId}/end`,
        { method: "POST" },
      );
    },

    /* ----------------------------------------------------- relatórios */

    /** Cria a solicitação; a IA só roda depois da confirmação do paciente. */
    createContextReportRequest(
      connectionId: string,
      period: { period_start: string; period_end: string },
    ) {
      return client.request<ContextReportRequest>(
        `/v1/professional/patients/${connectionId}/context-report-requests`,
        { method: "POST", body: period },
      );
    },

    listContextReportRequests(connectionId: string) {
      return client.request<{ requests: ContextReportRequest[] }>(
        `/v1/professional/patients/${connectionId}/context-report-requests`,
      );
    },

    /** Relatórios gerados para este profissional e vínculo autorizado. */
    listPatientContexts(connectionId: string) {
      return client.request<{ contexts: ContextReport[] }>(
        `/v1/professional/patients/${connectionId}/contexts`,
      );
    },

    /* ------------------------------------------------------------ check-ins */

    listCheckinTemplates() {
      return client.request<{ templates: CheckinTemplate[] }>(
        "/v1/professional/checkin-templates",
      );
    },

    createCheckinTemplate(input: CheckinTemplateInput) {
      return client.request<CheckinTemplate>("/v1/professional/checkin-templates", {
        method: "POST",
        body: input,
      });
    },

    /** Só rascunho aceita edição: publicado é imutável por decisão de domínio. */
    updateCheckinTemplate(templateId: string, input: CheckinTemplateInput) {
      return client.request<CheckinTemplate>(
        `/v1/professional/checkin-templates/${templateId}`,
        { method: "PUT", body: input },
      );
    },

    archiveCheckinTemplate(templateId: string) {
      return client.request<void>(
        `/v1/professional/checkin-templates/${templateId}`,
        { method: "DELETE" },
      );
    },

    listCheckinAssignments(connectionId: string) {
      return client.request<{ assignments: CheckinAssignment[] }>(
        `/v1/professional/patients/${connectionId}/checkin-assignments`,
      );
    },

    /** Enviar publica o modelo. A partir daí ele não muda mais. */
    createCheckinAssignment(connectionId: string, templateId: string) {
      return client.request<CheckinAssignment>(
        `/v1/professional/patients/${connectionId}/checkin-assignments`,
        { method: "POST", body: { template_id: templateId } },
      );
    },

    /** Revogar tira o check-in do aparelho do paciente na mesma hora. */
    revokeCheckinAssignment(connectionId: string, assignmentId: string) {
      return client.request<void>(
        `/v1/professional/patients/${connectionId}/checkin-assignments/${assignmentId}`,
        { method: "DELETE" },
      );
    },

    listCheckinCollectionRequests(connectionId: string) {
      return client.request<{ requests: CheckinCollectionRequest[] }>(
        `/v1/professional/patients/${connectionId}/checkin-collection-requests`,
      );
    },

    createCheckinCollectionRequest(
      connectionId: string,
      period: { period_start: string; period_end: string },
    ) {
      return client.request<CheckinCollectionRequest>(
        `/v1/professional/patients/${connectionId}/checkin-collection-requests`,
        { method: "POST", body: period },
      );
    },

    /** Retratos já autorizados pelo paciente, com os números prontos. */
    listCheckinCollections(connectionId: string) {
      return client.request<{ collections: CheckinCollection[] }>(
        `/v1/professional/patients/${connectionId}/checkin-collections`,
      );
    },
  };
}
