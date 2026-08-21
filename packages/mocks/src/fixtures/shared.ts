import type { Account, IssuedToken, Session } from "@sinapsa/api-client";

/** Datas relativas a agora, para o conteúdo nunca parecer velho. */
export const DAY = 86_400_000;
export const now = () => Date.now();
export const ago = (days: number, hours = 0) =>
  new Date(now() - days * DAY - hours * 3_600_000).toISOString();
export const ahead = (days: number) =>
  new Date(now() + days * DAY).toISOString();

export function issuedToken(): IssuedToken {
  return {
    access_token: "design-mode-token",
    token_type: "Bearer",
    expires_at: new Date(now() + 30 * 60_000).toISOString(),
  };
}

export const patientAccount: Account = {
  id: "acc-patient",
  email: "helena@exemplo.com",
  display_name: "Helena Marques",
  status: "active",
  email_verified_at: ago(120),
  audience: "app",
  mfa_verified: false,
};

export const professionalAccount: Account = {
  id: "acc-professional",
  email: "rui.andrade@exemplo.com",
  display_name: "Rui Andrade",
  status: "active",
  email_verified_at: ago(200),
  audience: "professional",
  // Já verificado: o modo de desenho não passa por cerimônia de passkey.
  mfa_verified: true,
};

export function sessions(userAgent: string): Session[] {
  return [
    {
      id: "session-current",
      created_ip: "127.0.0.1",
      last_used_ip: "127.0.0.1",
      user_agent: userAgent,
      mfa_verified: true,
      expires_at: ahead(30),
      last_used_at: ago(0, 0),
      created_at: ago(3),
      revoked_at: null,
      current_session: true,
    },
    {
      id: "session-phone",
      created_ip: "189.45.12.7",
      last_used_ip: "189.45.12.7",
      user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X)",
      mfa_verified: true,
      expires_at: ahead(21),
      last_used_at: ago(1, 4),
      created_at: ago(14),
      revoked_at: null,
      current_session: false,
    },
  ];
}
