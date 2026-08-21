/**
 * O contrato manda controlar fluxo por `error.code`, nunca comparando
 * `error.message`. Este arquivo é o único lugar do frontend que traduz
 * código em comportamento e em texto para a pessoa.
 */

export type ApiErrorCode =
  | "invalid_json"
  | "invalid_credentials"
  | "invalid_access_token"
  | "invalid_token"
  | "invalid_recovery_code"
  | "email_not_verified"
  | "account_unavailable"
  | "mfa_required"
  | "consent_required"
  | "forbidden"
  | "origin_not_allowed"
  | "not_found"
  | "account_exists"
  | "passkey_exists"
  | "last_passkey"
  | "passkey_limit"
  | "state_conflict"
  | "validation_failed"
  | "rate_limited"
  | "internal_error"
  | "context_consent_required"
  | "context_processing"
  | "context_request_resolved"
  | "connection_inactive"
  | "subscription_required"
  | "network_error";

export class ApiError extends Error {
  readonly code: ApiErrorCode | string;
  readonly status: number;
  /** Segundos indicados por `Retry-After`, quando houver. */
  readonly retryAfter: number | null;

  constructor(options: {
    code: string;
    message: string;
    status: number;
    retryAfter?: number | null;
  }) {
    super(options.message);
    this.name = "ApiError";
    this.code = options.code;
    this.status = options.status;
    this.retryAfter = options.retryAfter ?? null;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function hasCode(error: unknown, ...codes: string[]): boolean {
  return isApiError(error) && codes.includes(error.code);
}

/**
 * O que a interface deve fazer diante de cada código.
 * `retry` significa que repetir a mesma ação pode dar certo;
 * `reauthenticate` leva ao login; `escalate` é falha nossa, não da pessoa.
 */
export type ErrorAction =
  | "show_message"
  | "show_field_errors"
  | "reauthenticate"
  | "verify_email"
  | "require_consent"
  | "require_mfa"
  | "restart_ceremony"
  | "refresh_data"
  | "wait_and_retry"
  | "escalate";

type ErrorDescription = {
  /** Texto seguro para exibir. Nunca usamos `error.message` cru na tela. */
  message: string;
  action: ErrorAction;
};

const DESCRIPTIONS: Record<string, ErrorDescription> = {
  invalid_json: {
    message: "Não conseguimos enviar esses dados. Tente novamente.",
    action: "escalate",
  },
  invalid_credentials: {
    message: "E-mail ou senha incorretos.",
    action: "show_message",
  },
  invalid_access_token: {
    message: "Sua sessão expirou. Entre novamente.",
    action: "reauthenticate",
  },
  invalid_token: {
    message: "Este link expirou ou já foi usado. Solicite um novo.",
    action: "restart_ceremony",
  },
  invalid_recovery_code: {
    message: "Código de recuperação inválido ou já utilizado.",
    action: "show_message",
  },
  email_not_verified: {
    message: "Confirme seu e-mail para continuar.",
    action: "verify_email",
  },
  account_unavailable: {
    message: "Esta conta não está disponível. Entre em contato com o suporte.",
    action: "show_message",
  },
  mfa_required: {
    message: "Confirme sua identidade com a chave de acesso para continuar.",
    action: "require_mfa",
  },
  consent_required: {
    message: "Aceite os termos atuais para continuar.",
    action: "require_consent",
  },
  forbidden: {
    message: "Esta operação não é permitida agora.",
    action: "show_message",
  },
  origin_not_allowed: {
    message: "Erro de configuração do aplicativo. Avise o suporte.",
    action: "escalate",
  },
  not_found: {
    message: "Não encontramos o que você procura.",
    action: "refresh_data",
  },
  account_exists: {
    message: "Já existe uma conta com este e-mail.",
    action: "show_message",
  },
  passkey_exists: {
    message: "Esta chave de acesso já está cadastrada.",
    action: "show_message",
  },
  last_passkey: {
    message: "Cadastre outra chave de acesso antes de remover esta.",
    action: "show_message",
  },
  passkey_limit: {
    message: "Você atingiu o limite de chaves. Remova uma antes de cadastrar.",
    action: "show_message",
  },
  state_conflict: {
    message: "Algo mudou enquanto você trabalhava. Recarregue e tente de novo.",
    action: "refresh_data",
  },
  validation_failed: {
    message: "Revise os campos destacados.",
    action: "show_field_errors",
  },
  rate_limited: {
    message: "Muitas tentativas. Aguarde um momento antes de tentar de novo.",
    action: "wait_and_retry",
  },
  internal_error: {
    message: "Algo deu errado do nosso lado. Tente novamente em instantes.",
    action: "escalate",
  },
  context_consent_required: {
    message:
      "O paciente não autorizou o compartilhamento necessário para este relatório.",
    action: "show_message",
  },
  context_processing: {
    message: "Já existe um relatório em processamento para este período.",
    action: "refresh_data",
  },
  context_request_resolved: {
    message: "Esta solicitação já foi respondida.",
    action: "refresh_data",
  },
  connection_inactive: {
    message: "Este vínculo não está mais ativo.",
    action: "refresh_data",
  },
  subscription_required: {
    message: "Uma assinatura profissional vigente é necessária.",
    action: "show_message",
  },
  network_error: {
    message: "Sem conexão com o servidor. Verifique sua internet.",
    action: "wait_and_retry",
  },
};

const FALLBACK: ErrorDescription = {
  message: "Algo deu errado. Tente novamente.",
  action: "escalate",
};

export function describeError(error: unknown): ErrorDescription {
  if (!isApiError(error)) return FALLBACK;
  return DESCRIPTIONS[error.code] ?? FALLBACK;
}

/** Atalho para o caso mais comum: só preciso do texto. */
export function errorMessage(error: unknown): string {
  return describeError(error).message;
}
