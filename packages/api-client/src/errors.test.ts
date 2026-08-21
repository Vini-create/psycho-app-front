import { describe, expect, it } from "vitest";
import { ApiError, describeError, errorMessage, hasCode } from "./errors";

function apiError(code: string, status = 400) {
  return new ApiError({ code, message: "mensagem crua do backend", status });
}

describe("describeError", () => {
  it("mapeia cada código para uma ação de interface", () => {
    expect(describeError(apiError("invalid_access_token")).action).toBe(
      "reauthenticate",
    );
    expect(describeError(apiError("email_not_verified")).action).toBe(
      "verify_email",
    );
    expect(describeError(apiError("consent_required")).action).toBe(
      "require_consent",
    );
    expect(describeError(apiError("mfa_required")).action).toBe("require_mfa");
    expect(describeError(apiError("validation_failed")).action).toBe(
      "show_field_errors",
    );
    expect(describeError(apiError("rate_limited")).action).toBe(
      "wait_and_retry",
    );
  });

  it("nunca vaza a mensagem crua do backend para a tela", () => {
    expect(errorMessage(apiError("invalid_credentials"))).not.toContain(
      "mensagem crua",
    );
  });

  it("cai num fallback seguro para código desconhecido", () => {
    const described = describeError(apiError("codigo_que_nao_existe_ainda"));
    expect(described.action).toBe("escalate");
    expect(described.message).toBeTruthy();
  });

  it("cai no fallback para o que não é ApiError", () => {
    expect(describeError(new Error("boom")).action).toBe("escalate");
    expect(describeError(null).action).toBe("escalate");
  });
});

describe("hasCode", () => {
  it("reconhece o código sem comparar mensagem", () => {
    expect(hasCode(apiError("not_found", 404), "not_found")).toBe(true);
    expect(hasCode(apiError("not_found", 404), "forbidden", "not_found")).toBe(
      true,
    );
    expect(hasCode(apiError("not_found", 404), "forbidden")).toBe(false);
    expect(hasCode(new Error("not_found"), "not_found")).toBe(false);
  });
});
