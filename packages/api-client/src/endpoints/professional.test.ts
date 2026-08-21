import { describe, expect, it, vi } from "vitest";
import type { ApiClient } from "../client";
import { professionalEndpoints } from "./professional";

function fakeClient() {
  const request = vi.fn().mockResolvedValue(undefined);
  return {
    client: { request, audience: "professional" } as unknown as ApiClient,
    request,
  };
}

describe("solicitações profissionais de relatório", () => {
  it("cria apenas uma solicitação com período", async () => {
    const { client, request } = fakeClient();
    const period = {
      period_start: "2026-08-01T00:00:00Z",
      period_end: "2026-08-15T00:00:00Z",
    };

    await professionalEndpoints(client).createContextReportRequest(
      "conn-1",
      period,
    );

    expect(request).toHaveBeenCalledWith(
      "/v1/professional/patients/conn-1/context-report-requests",
      { method: "POST", body: period },
    );
  });

  it("não expõe geração direta nem job iniciado pelo profissional", () => {
    const { client } = fakeClient();
    const professional = professionalEndpoints(client);

    expect("requestContextReport" in professional).toBe(false);
    expect("getContextJob" in professional).toBe(false);
  });
});
