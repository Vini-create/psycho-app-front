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

describe("gestão da conta", () => {
  beforeEach(resetState);

  it("atualiza o nome exibido da conta do paciente", () => {
    expect(
      resolve(
        "PATCH",
        new URL("http://sinapsa.local/v1/app/me"),
        { display_name: "Helena Atualizada" },
      ),
    ).toMatchObject({
      status: 200,
      body: { display_name: "Helena Atualizada", audience: "app" },
    });
  });

  it("aceita a troca autenticada de senha", () => {
    expect(
      resolve(
        "PUT",
        new URL("http://sinapsa.local/v1/app/auth/password"),
        { current_password: "senha-atual", new_password: "nova-senha-longa" },
      ),
    ).toMatchObject({ status: 204 });
  });
});

describe("check-in diário", () => {
  beforeEach(resetState);

  const url = (path: string) => new URL(`http://sinapsa.local${path}`);

  it("entrega ao paciente só os check-ins ativos, com o estado do dia", () => {
    const today = new Date().toISOString().slice(0, 10);
    const result = resolve("GET", url(`/v1/app/checkins?date=${today}`), {});
    const checkins = (result.body as { checkins: { id: string; answered_days: number }[] })
      .checkins;

    expect(result.status).toBe(200);
    // O pendente não aparece: aceitar é o primeiro dos dois consentimentos.
    expect(checkins.map((item) => item.id)).toEqual([
      "assign-rui-humor",
      "assign-marta-sono",
    ]);
    expect(checkins[0]!.answered_days).toBeGreaterThan(0);
  });

  it("recusa resposta com alternativa de outra pergunta", () => {
    const result = resolve(
      "POST",
      url("/v1/app/checkins/assign-rui-humor/entries"),
      {
        entry_date: new Date().toISOString().slice(0, 10),
        answers: [
          { question_id: "q-humor", option_id: "o-sono-3" },
          { question_id: "q-sono", option_id: "o-sono-3" },
          { question_id: "q-energia", option_id: "o-energia-3" },
          { question_id: "q-calma", option_id: "o-calma-3" },
        ],
      },
    );

    expect(result).toMatchObject({
      status: 422,
      body: { error: { code: "validation_failed" } },
    });
  });

  it("responder o mesmo dia corrige em vez de duplicar", () => {
    const today = new Date().toISOString().slice(0, 10);
    const answers = [
      { question_id: "q-humor", option_id: "o-humor-5" },
      { question_id: "q-sono", option_id: "o-sono-4" },
      { question_id: "q-energia", option_id: "o-energia-5" },
      { question_id: "q-calma", option_id: "o-calma-4" },
    ];
    const before = state.checkinEntries["assign-rui-humor"]!.length;

    resolve("POST", url("/v1/app/checkins/assign-rui-humor/entries"), {
      entry_date: today,
      answers,
    });
    resolve("POST", url("/v1/app/checkins/assign-rui-humor/entries"), {
      entry_date: today,
      answers,
    });

    const entries = state.checkinEntries["assign-rui-humor"]!;
    expect(entries.filter((entry) => entry.entry_date === today)).toHaveLength(1);
    expect(entries).toHaveLength(before + 1);
  });

  it("só entrega ao profissional os check-ins que o paciente escolheu", () => {
    const result = resolve(
      "POST",
      url("/v1/app/checkin-collection-requests/checkin-request-pendente/send"),
      { assignment_ids: ["assign-rui-humor"] },
    );

    expect(result).toMatchObject({ status: 200, body: { checkin_count: 1 } });

    const collections = (
      resolve("GET", url("/v1/professional/patients/conn-rui/checkin-collections"), {})
        .body as { collections: { checkins: { assignment_id: string }[] }[] }
    ).collections;
    const shared = collections[0]!.checkins;

    expect(shared).toHaveLength(1);
    expect(shared[0]!.assignment_id).toBe("assign-rui-humor");
  });

  it("recusa um segundo envio do mesmo pedido", () => {
    const send = () =>
      resolve(
        "POST",
        url("/v1/app/checkin-collection-requests/checkin-request-pendente/send"),
        { assignment_ids: ["assign-rui-humor"] },
      );
    send();

    expect(send()).toMatchObject({
      status: 409,
      body: { error: { code: "checkin_request_resolved" } },
    });
  });

  it("recusa um segundo pedido de colheita aberto no mesmo vínculo", () => {
    expect(
      resolve(
        "POST",
        url("/v1/professional/patients/conn-rui/checkin-collection-requests"),
        { period_start: "2026-08-01", period_end: "2026-08-14" },
      ),
    ).toMatchObject({
      status: 409,
      body: { error: { code: "checkin_conflict" } },
    });
  });

  it("recusa edição de modelo publicado", () => {
    expect(
      resolve("PUT", url("/v1/professional/checkin-templates/tpl-humor"), {
        title: "Outro título",
        legend: "",
        questions: [
          {
            prompt: "Pergunta nova",
            legend: "",
            options: [
              { label: "Nunca" },
              { label: "Raramente" },
              { label: "Às vezes" },
              { label: "Quase sempre" },
              { label: "Sempre" },
            ],
          },
        ],
      }),
    ).toMatchObject({
      status: 409,
      body: { error: { code: "checkin_template_published" } },
    });
  });

  it("revogar tira o check-in do aparelho do paciente", () => {
    resolve(
      "DELETE",
      url("/v1/professional/patients/conn-rui/checkin-assignments/assign-rui-humor"),
      {},
    );

    const checkins = (
      resolve("GET", url("/v1/app/checkins"), {}).body as {
        checkins: { id: string }[];
      }
    ).checkins;

    expect(checkins.map((item) => item.id)).not.toContain("assign-rui-humor");
  });
});
