import { describe, expect, it, vi } from "vitest";
import { appEndpoints } from "./app";
import type { ApiClient } from "../client";

function fakeClient() {
  const request = vi.fn().mockResolvedValue(undefined);
  return {
    client: { request, audience: "app" } as unknown as ApiClient,
    request,
  };
}

describe("superfície do paciente", () => {
  it("não expõe endpoints de relatórios profissionais", () => {
    const { client } = fakeClient();
    const app = appEndpoints(client);
    expect("listContextReports" in app).toBe(false);
    expect("reviewContextReport" in app).toBe(false);
    expect("createContextReport" in app).toBe(false);
    expect("sendRequestedContextReport" in app).toBe(true);
  });
});

describe("renameConversation", () => {
  it("altera somente o título da conversa indicada", async () => {
    const { client, request } = fakeClient();
    await appEndpoints(client).renameConversation("conv-1", "Semana difícil");

    expect(request).toHaveBeenCalledWith("/v1/app/conversations/conv-1", {
      method: "PATCH",
      body: { title: "Semana difícil" },
    });
  });
});

describe("deleteConversation", () => {
  it("arquiva somente a conversa indicada", async () => {
    const { client, request } = fakeClient();
    await appEndpoints(client).deleteConversation("conv-1");

    expect(request).toHaveBeenCalledWith("/v1/app/conversations/conv-1", {
      method: "DELETE",
    });
  });
});

describe("sendRequestedContextReport", () => {
  it("só recebe o id imutável de uma solicitação profissional", async () => {
    const { client, request } = fakeClient();
    await appEndpoints(client).sendRequestedContextReport("request-1");

    expect(request).toHaveBeenCalledWith(
      "/v1/app/context-report-requests/request-1/send",
      { method: "POST" },
    );
  });
});

describe("listMessages", () => {
  it("monta a query só com os parâmetros informados", async () => {
    const { client, request } = fakeClient();
    const app = appEndpoints(client);

    await app.listMessages("conv-1");
    expect(request.mock.calls[0]![0]).toBe(
      "/v1/app/conversations/conv-1/messages",
    );

    await app.listMessages("conv-1", { limit: 50, before_sequence: 120 });
    expect(request.mock.calls[1]![0]).toBe(
      "/v1/app/conversations/conv-1/messages?limit=50&before_sequence=120",
    );
  });

  it("aceita before_sequence igual a zero", async () => {
    const { client, request } = fakeClient();
    await appEndpoints(client).listMessages("conv-1", { before_sequence: 0 });
    expect(request.mock.calls[0]![0]).toContain("before_sequence=0");
  });
});

describe("previewInvitation", () => {
  it("é público: não envia Authorization", async () => {
    const { client, request } = fakeClient();
    await appEndpoints(client).previewInvitation("token-abc");
    expect(request.mock.calls[0]![1]).toEqual({ skipAuth: true });
  });
});
