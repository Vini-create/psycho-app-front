import { beforeEach, describe, expect, it } from "vitest";
import { resolve } from "./router";
import { resetState, state } from "./store";

const period = {
  period_start: "2026-08-01T00:00:00.000Z",
  period_end: "2026-08-21T23:59:59.000Z",
};

function request(connectionId: string) {
  return resolve(
    "POST",
    new URL(`http://sinapsa.local/v1/professional/patients/${connectionId}/context-report-requests`),
    period,
  );
}

describe("solicitação profissional de relatório", () => {
  beforeEach(resetState);

  it("cria uma solicitação pendente sem gerar relatório", () => {
    const before = state.patientContexts["conn-rui"]!.length;
    expect(request("conn-rui")).toMatchObject({
      status: 201,
      body: { status: "pending", connection_id: "conn-rui" },
    });
    expect(state.patientContexts["conn-rui"]).toHaveLength(before);
  });

  it("recusa vínculo que não pertence ao profissional conectado", () => {
    expect(request("conn-inexistente")).toMatchObject({
      status: 404,
      body: { error: { code: "not_found" } },
    });
  });

  it("recusa solicitação sem assinatura profissional vigente", () => {
    state.profile!.plan = { code: "single", status: "canceled" };

    expect(request("conn-rui")).toMatchObject({
      status: 402,
      body: { error: { code: "subscription_required" } },
    });
  });

  it("recusa solicitação sem o escopo summaries", () => {
    expect(request("conn-teresa")).toMatchObject({
      status: 403,
      body: { error: { code: "context_consent_required" } },
    });
  });

  it("recusa período fora do limite definido pelo contrato", () => {
    expect(
      resolve(
        "POST",
        new URL("http://sinapsa.local/v1/professional/patients/conn-rui/context-report-requests"),
        {
          period_start: "2026-05-01T00:00:00.000Z",
          period_end: "2026-08-21T00:00:00.000Z",
        },
      ),
    ).toMatchObject({
      status: 422,
      body: { error: { code: "validation_failed" } },
    });
  });
});

describe("envio autorizado pelo paciente", () => {
  beforeEach(resetState);

  it("autoriza somente a solicitação selecionada e inicia o processamento", () => {
    const before = state.patientContexts["conn-rui"]!.length;
    const result = resolve(
      "POST",
      new URL("http://sinapsa.local/v1/app/context-report-requests/request-rui-pending/send"),
      {},
    );

    expect(result).toMatchObject({
      status: 202,
      body: { request_id: "request-rui-pending", status: "processing" },
    });
    expect(state.patientContexts["conn-rui"]).toHaveLength(before);
    expect(state.contextReportRequests[0]).toMatchObject({
      id: "request-rui-pending",
      status: "processing",
      sent_at: null,
    });
  });

  it("não oferece uma rota para geração livre pelo paciente", () => {
    expect(
      resolve(
        "POST",
        new URL("http://sinapsa.local/v1/app/context-reports"),
        period,
      ),
    ).toMatchObject({ status: 404 });
  });

  it("não permite enviar a mesma solicitação duas vezes", () => {
    const url = new URL(
      "http://sinapsa.local/v1/app/context-report-requests/request-rui-pending/send",
    );
    resolve("POST", url, {});
    expect(resolve("POST", url, {})).toMatchObject({
      status: 409,
      body: { error: { code: "context_request_resolved" } },
    });
  });

  it("revalida a assinatura antes de gerar e enviar", () => {
    state.profile!.plan = { code: "single", status: "canceled" };

    expect(
      resolve(
        "POST",
        new URL("http://sinapsa.local/v1/app/context-report-requests/request-rui-pending/send"),
        {},
      ),
    ).toMatchObject({
      status: 402,
      body: { error: { code: "subscription_required" } },
    });
  });
});
