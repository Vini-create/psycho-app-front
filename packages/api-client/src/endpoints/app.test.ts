import { describe, expect, it, vi } from "vitest";
import { createApiClient, type ApiClient } from "../client";
import { appEndpoints } from "./app";

function fakeClient() {
  const request = vi.fn().mockResolvedValue(undefined);
  return {
    client: { request, audience: "app" } as unknown as ApiClient,
    request,
  };
}

function streamResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
        controller.close();
      },
    }),
    { status: 200, headers: { "Content-Type": "text/event-stream" } },
  );
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

describe("appEndpoints.sendMessageStream", () => {
  it("entrega deltas em ordem e conclui com a mensagem persistida", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      streamResponse([
        "event: assistant.started\ndata: {}\n\n",
        'event: assistant.delta\ndata: {"delta":"Estou "}\n',
        '\nevent: assistant.delta\ndata: {"delta":"aqui."}\n\n',
        "event: assistant.completed\ndata: " +
          JSON.stringify({
            user_message: {
              id: "user-1",
              conversation_id: "conversation-1",
              sequence: 1,
              role: "user",
              content: "Olá",
              generation_status: "completed",
              created_at: "2026-08-26T12:00:00Z",
            },
            assistant_message: {
              id: "assistant-1",
              conversation_id: "conversation-1",
              sequence: 2,
              role: "assistant",
              content: "Estou aqui.",
              generation_status: "completed",
              created_at: "2026-08-26T12:00:01Z",
            },
            assistant_status: "completed",
          }) +
          "\n\n",
      ]),
    );
    const client = createApiClient({
      baseUrl: "https://api.example.test",
      audience: "app",
      fetchImpl,
    });
    client.setSession({
      access_token: "access-token",
      token_type: "Bearer",
      expires_at: "2099-01-01T00:00:00Z",
    });
    const deltas: string[] = [];

    const result = await appEndpoints(client).sendMessageStream(
      "conversation-1",
      "Olá",
      "idempotency-key",
      (delta) => deltas.push(delta),
    );

    expect(deltas).toEqual(["Estou ", "aqui."]);
    expect(result.assistant_message?.content).toBe("Estou aqui.");
    const [, init] = fetchImpl.mock.calls[0]!;
    expect((init.headers as Headers).get("Accept")).toBe("text/event-stream");
  });
});
