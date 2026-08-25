import * as app from "./fixtures/app";
import * as professional from "./fixtures/professional";
import {
  issuedToken,
  sessions,
} from "./fixtures/shared";
import * as store from "./store";

type Ctx = {
  params: Record<string, string>;
  body: Record<string, unknown>;
  url: URL;
};

type Result = { status: number; body?: unknown };

type Route = [method: string, pattern: string, handler: (ctx: Ctx) => Result];

const MAX_REPORT_PERIOD_MS = 31 * 86_400_000;

const ok = (body?: unknown): Result => ({ status: body ? 200 : 204, body });
const created = (body: unknown): Result => ({ status: 201, body });
const noContent = (): Result => ({ status: 204 });
const accepted = (body: unknown): Result => ({ status: 202, body });
const fail = (status: number, code: string, message: string): Result => ({
  status,
  body: { error: { code, message } },
});

/**
 * Rotas do contrato v1. `:nome` casa um segmento.
 * A ordem importa: a primeira que casar vence.
 */
const routes: Route[] = [
  /* ------------------------------------------------------------- auth */
  // Sem parte de auth no modo de desenho: tudo entra direto.
  ["POST", "/v1/app/auth/login", () => ok({ tokens: issuedToken(), passkey_required: false })],
  [
    "POST",
    "/v1/professional/auth/login",
    () => ok({ tokens: issuedToken(), passkey_required: false, passkey_enrollment_needed: false }),
  ],
  ["POST", "/v1/:audience/auth/google/challenge", () =>
    ok({
      challenge_id: "google-challenge-design-mode",
      nonce: "google-nonce-design-mode",
      expires_at: new Date(Date.now() + 300_000).toISOString(),
    }),
  ],
  ["POST", "/v1/app/auth/google", () =>
    ok({ tokens: issuedToken(), passkey_required: false }),
  ],
  ["POST", "/v1/professional/auth/google", () =>
    ok({ tokens: issuedToken(), passkey_required: false, passkey_enrollment_needed: false }),
  ],
  ["POST", "/v1/:audience/auth/refresh", () => ok(issuedToken())],
  ["POST", "/v1/:audience/auth/register", ({ body }) =>
    created({
      account_id: "acc-novo",
      email: String(body.email ?? "novo@exemplo.com"),
      verification_required: true,
      development_token: "codigo-de-desenvolvimento-123",
    }),
  ],
  ["POST", "/v1/:audience/auth/email-verification/request", () =>
    accepted({
      message: "if the account exists, instructions will be sent",
      development_token: "codigo-de-desenvolvimento-123",
    }),
  ],
  ["POST", "/v1/:audience/auth/email-verification/confirm", () => noContent()],
  ["POST", "/v1/:audience/auth/password-reset/request", () =>
    accepted({
      message: "if the account exists, instructions will be sent",
      development_token: "codigo-de-desenvolvimento-123",
    }),
  ],
  ["POST", "/v1/:audience/auth/password-reset/confirm", () => noContent()],
  ["PUT", "/v1/:audience/auth/password", () => noContent()],
  ["POST", "/v1/:audience/auth/logout", () => noContent()],
  ["POST", "/v1/:audience/auth/logout-all", () => noContent()],
  ["GET", "/v1/app/me", () => ok(store.state.appAccount)],
  ["GET", "/v1/professional/me", () => ok(store.state.professionalAccount)],
  ["PATCH", "/v1/:audience/me", ({ params, body }) => {
    const account = params.audience === "app"
      ? store.state.appAccount
      : store.state.professionalAccount;
    account.display_name = String(body.display_name ?? account.display_name).trim();
    account.updated_at = new Date().toISOString();
    return ok(account);
  }],
  ["GET", "/v1/:audience/auth/sessions", ({ params }) =>
    ok({
      sessions: sessions(
        params.audience === "app"
          ? "Mozilla/5.0 (Android 15; Mobile)"
          : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      ),
    }),
  ],
  ["DELETE", "/v1/:audience/auth/sessions/:id", () => noContent()],

  /* --------------------------------------------------- app: consentimentos */
  ["GET", "/v1/app/consents", () => ok({ consents: store.state.consents })],
  ["POST", "/v1/app/consents", ({ body }) =>
    ok({ consents: store.grantConsents((body.consent_types ?? []) as never) }),
  ],
  ["DELETE", "/v1/app/consents/:type", ({ params }) => {
    store.revokeConsent(params.type as never);
    return noContent();
  }],

  /* -------------------------------------------------------- app: conversas */
  ["GET", "/v1/app/conversations", () => ok({ conversations: store.state.conversations })],
  ["POST", "/v1/app/conversations", ({ body }) =>
    created(store.createConversation(body.title as string | undefined)),
  ],
  ["PATCH", "/v1/app/conversations/:id", ({ params, body }) => {
    const title = String(body.title ?? "").trim();
    if (!title || title.length > 120) {
      return fail(422, "validation_failed", "título deve ter entre 1 e 120 caracteres");
    }
    const conversation = store.renameConversation(params.id!, title);
    return conversation
      ? ok(conversation)
      : fail(404, "not_found", "conversa não encontrada");
  }],
  ["DELETE", "/v1/app/conversations/:id", ({ params }) => {
    store.deleteConversation(params.id!);
    return noContent();
  }],
  ["GET", "/v1/app/conversations/:id/messages", ({ params }) =>
    ok({ messages: store.state.messages[params.id!] ?? [] }),
  ],
  ["POST", "/v1/app/conversations/:id/messages", ({ params, body }) => {
    const result = store.appendMessage(params.id!, String(body.content ?? ""));
    return created({
      user_message: result.userMessage,
      assistant_message: result.assistantMessage,
      assistant_status: "completed",
    });
  }],
  ["POST", "/v1/app/messages/:id/retry", ({ params }) => {
    const result = store.retryMessage(params.id!);
    if (!result) return fail(409, "state_conflict", "não é possível repetir");
    return ok({
      user_message: result.userMessage,
      assistant_message: result.assistantMessage,
      assistant_status: "completed",
    });
  }],

  /* ------------------------------------------------- app: convites e vínculos */
  ["GET", "/v1/app/invitations/:token", () => ok(app.invitationPreview)],
  ["POST", "/v1/app/invitations/:token/accept", () =>
    created({ connection_id: "conn-novo", status: "active" }),
  ],
  ["GET", "/v1/app/connections", () => ok({ connections: store.state.connections })],
  ["PUT", "/v1/app/connections/:id/consents", ({ params, body }) => {
    store.updateConnectionConsents(params.id!, (body.consent_scopes ?? []) as never);
    return noContent();
  }],
  ["DELETE", "/v1/app/connections/:id", ({ params }) => {
    store.endConnection(params.id!);
    return noContent();
  }],
  ["GET", "/v1/app/connections/:id/context-report-requests", ({ params }) => {
    const connection = store.state.connections.find(
      (item) => item.id === params.id || item.connection_id === params.id,
    );
    if (!connection) return fail(404, "not_found", "vínculo não encontrado");
    return ok({
      requests: store.state.contextReportRequests.filter(
        (request) => request.connection_id === (connection.connection_id ?? connection.id),
      ),
    });
  }],
  ["POST", "/v1/app/context-report-requests/:id/send", ({ params }) => {
    const request = store.state.contextReportRequests.find(
      (item) => item.id === params.id,
    );
    const connection = request
      ? store.state.connections.find(
          (item) =>
            item.id === request.connection_id ||
            item.connection_id === request.connection_id,
        )
      : undefined;
    if (!request || !connection) {
      return fail(404, "not_found", "solicitação não encontrada");
    }
    if (connection.status !== "active") {
      return fail(409, "connection_inactive", "vínculo não está ativo");
    }
    if (!connection.consent_scopes.includes("summaries")) {
      return fail(403, "context_consent_required", "sem consentimento vigente");
    }
    if (request.status !== "pending") {
      return fail(409, "context_request_resolved", "solicitação já respondida");
    }
    const planStatus = store.state.profile?.plan?.status;
    if (planStatus !== "active" && planStatus !== "trialing") {
      return fail(402, "subscription_required", "assinatura profissional necessária");
    }
    const sent = store.sendContextReportRequest(request.id)!;
    return accepted({ request_id: sent.id, status: sent.status });
  }],

  /* ------------------------------------------------------------ profissional */
  ["GET", "/v1/professional/profile", () => {
    if (!store.state.profile) return fail(404, "not_found", "perfil ainda não criado");
    // Afordância só do modo de desenho: `?plano=inativo` (ou `trial`,
    // `pendente`) força o estado de assinatura, para revisar as telas
    // bloqueadas sem precisar de backend nem de cobrança real.
    const PLAN: Record<string, string> = {
      ativo: "active",
      trial: "trialing",
      pendente: "past_due",
      inativo: "canceled",
      nenhum: "none",
    };
    const forced =
      typeof window !== "undefined"
        ? PLAN[new URLSearchParams(window.location.search).get("plano") ?? ""]
        : undefined;
    if (!forced) return ok(store.state.profile);
    return ok({
      ...store.state.profile,
      plan: { code: "single", status: forced },
    });
  }],
  ["PUT", "/v1/professional/profile", ({ body }) =>
    ok(store.upsertProfile(body as never)),
  ],
  ["GET", "/v1/professional/auth/passkeys", () => ok({ passkeys: store.state.passkeys })],
  ["DELETE", "/v1/professional/auth/passkeys/:id", ({ params }) => {
    if (store.state.passkeys.length <= 1) {
      return fail(409, "last_passkey", "cadastre outra chave antes de remover");
    }
    store.removePasskey(params.id!);
    return noContent();
  }],
  ["POST", "/v1/professional/auth/passkeys/recovery-codes/regenerate", () =>
    ok({ recovery_codes: professional.recoveryCodes }),
  ],
  ["GET", "/v1/professional/invitations", () => ok({ invitations: store.state.invitations })],
  ["POST", "/v1/professional/invitations", ({ body }) =>
    created(store.createInvitation(String(body.email ?? "novo@exemplo.com"))),
  ],
  ["DELETE", "/v1/professional/invitations/:id", ({ params }) => {
    store.revokeInvitation(params.id!);
    return noContent();
  }],
  ["GET", "/v1/professional/patients", () => ok({ patients: store.state.patients })],
  ["GET", "/v1/professional/patients/:id/contexts", ({ params }) => {
    const patient = store.state.patients.find(
      (candidate) =>
        candidate.id === params.id || candidate.connection_id === params.id,
    );
    if (!patient) return fail(404, "not_found", "vínculo não encontrado");
    const connectionId = patient.connection_id ?? patient.id;
    return ok({ contexts: store.state.patientContexts[connectionId] ?? [] });
  }],
  ["GET", "/v1/professional/patients/:id/context-report-requests", ({ params }) => {
    const patient = store.state.patients.find(
      (item) => item.id === params.id || item.connection_id === params.id,
    );
    if (!patient) return fail(404, "not_found", "vínculo não encontrado");
    const connectionId = patient.connection_id ?? patient.id;
    return ok({
      requests: store.state.contextReportRequests.filter(
        (request) => request.connection_id === connectionId,
      ),
    });
  }],
  ["POST", "/v1/professional/patients/:id/context-report-requests", ({ params, body }) => {
    const patient = store.state.patients.find(
      (p) => p.id === params.id || p.connection_id === params.id,
    );
    if (!patient || patient.status !== "active") {
      return fail(404, "not_found", "vínculo ativo não encontrado");
    }
    const planStatus = store.state.profile?.plan?.status;
    if (planStatus !== "active" && planStatus !== "trialing") {
      return fail(402, "subscription_required", "assinatura profissional necessária");
    }
    // Mesma recusa do backend quando falta o consentimento `summaries`.
    if (!patient.consent_scopes.includes("summaries")) {
      return fail(403, "context_consent_required", "sem consentimento vigente");
    }
    const periodStart = Date.parse(String(body.period_start));
    const periodEnd = Date.parse(String(body.period_end));
    const activatedAt = patient.activated_at
      ? Date.parse(patient.activated_at)
      : Number.NaN;
    if (
      Number.isNaN(periodStart) ||
      Number.isNaN(periodEnd) ||
      periodEnd <= periodStart ||
      periodEnd - periodStart > MAX_REPORT_PERIOD_MS ||
      (!Number.isNaN(activatedAt) && periodStart < activatedAt)
    ) {
      return fail(422, "validation_failed", "período de relatório inválido");
    }
    const connectionId = patient.connection_id ?? patient.id;
    const reportRequest = store.createContextReportRequest(
      connectionId,
      String(body.period_start),
      String(body.period_end),
    );
    return created(reportRequest);
  }],
  ["POST", "/v1/professional/patients/:id/end", ({ params }) => {
    store.endPatient(params.id!);
    return noContent();
  }],
  ["GET", "/v1/professional/patients/:id", ({ params }) => {
    const patient = store.state.patients.find(
      (p) => p.id === params.id || p.connection_id === params.id,
    );
    return patient ? ok(patient) : fail(404, "not_found", "paciente não encontrado");
  }],
];

function match(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split("/");
  const pathParts = path.split("/");
  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i += 1) {
    const expected = patternParts[i]!;
    const actual = pathParts[i]!;
    if (expected.startsWith(":")) params[expected.slice(1)] = actual;
    else if (expected !== actual) return null;
  }
  return params;
}

export function resolve(
  method: string,
  url: URL,
  body: Record<string, unknown>,
): Result {
  for (const [routeMethod, pattern, handler] of routes) {
    if (routeMethod !== method) continue;
    const params = match(pattern, url.pathname);
    if (!params) continue;
    return handler({ params, body, url });
  }
  return fail(404, "not_found", `sem mock para ${method} ${url.pathname}`);
}
