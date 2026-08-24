import type { ApiClient } from "../client";
import type {
  Account,
  AppLoginResponse,
  GenericAcceptedResponse,
  GoogleChallenge,
  ProfessionalLoginResponse,
  RegisterResponse,
  Session,
} from "../types";

/** Rotas idênticas nos dois públicos; muda só o segmento da URL. */
export function authEndpoints(client: ApiClient) {
  const base = `/v1/${client.audience}/auth`;

  return {
    register(input: {
      email: string;
      password: string;
      display_name: string;
    }) {
      return client.request<RegisterResponse>(`${base}/register`, {
        method: "POST",
        body: input,
        skipAuth: true,
      });
    },

    requestEmailVerification(email: string) {
      return client.request<GenericAcceptedResponse>(
        `${base}/email-verification/request`,
        { method: "POST", body: { email }, skipAuth: true },
      );
    },

    confirmEmailVerification(token: string) {
      return client.request<void>(`${base}/email-verification/confirm`, {
        method: "POST",
        body: { token },
        skipAuth: true,
      });
    },

    /**
     * O app devolve tokens direto. O profissional devolve uma união de
     * estados — quem chama precisa checar `passkey_required` antes de tudo.
     */
    login(input: { email: string; password: string }) {
      return client.request<AppLoginResponse | ProfessionalLoginResponse>(
        `${base}/login`,
        { method: "POST", body: input, skipAuth: true },
      );
    },

    googleChallenge() {
      return client.request<GoogleChallenge>(`${base}/google/challenge`, {
        method: "POST",
        skipAuth: true,
      });
    },

    googleLogin(input: { challenge_id: string; credential: string }) {
      return client.request<AppLoginResponse | ProfessionalLoginResponse>(
        `${base}/google`,
        { method: "POST", body: input, skipAuth: true },
      );
    },

    logout() {
      return client.request<void>(`${base}/logout`, { method: "POST" });
    },

    logoutAll() {
      return client.request<void>(`${base}/logout-all`, { method: "POST" });
    },

    requestPasswordReset(email: string) {
      return client.request<GenericAcceptedResponse>(
        `${base}/password-reset/request`,
        { method: "POST", body: { email }, skipAuth: true },
      );
    },

    confirmPasswordReset(input: { token: string; new_password: string }) {
      return client.request<void>(`${base}/password-reset/confirm`, {
        method: "POST",
        body: input,
        skipAuth: true,
      });
    },

    me() {
      return client.request<Account>(`/v1/${client.audience}/me`);
    },

    listSessions() {
      return client.request<{ sessions: Session[] }>(`${base}/sessions`);
    },

    revokeSession(sessionId: string) {
      return client.request<void>(`${base}/sessions/${sessionId}`, {
        method: "DELETE",
      });
    },
  };
}
