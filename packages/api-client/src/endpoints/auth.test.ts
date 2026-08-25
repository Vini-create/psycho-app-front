import { describe, expect, it, vi } from "vitest";
import type { ApiClient } from "../client";
import { authEndpoints } from "./auth";

function fakeClient(audience: "app" | "professional" = "app") {
  const request = vi.fn().mockResolvedValue(undefined);
  return {
    client: { request, audience } as unknown as ApiClient,
    request,
  };
}

describe("Google auth endpoints", () => {
  it("creates a public nonce challenge for the correct audience", async () => {
    const { client, request } = fakeClient("professional");
    await authEndpoints(client).googleChallenge();
    expect(request).toHaveBeenCalledWith(
      "/v1/professional/auth/google/challenge",
      { method: "POST", skipAuth: true },
    );
  });

  it("submits only the challenge ID and Google credential", async () => {
    const { client, request } = fakeClient();
    await authEndpoints(client).googleLogin({
      challenge_id: "challenge-1",
      credential: "signed-google-id-token",
    });
    expect(request).toHaveBeenCalledWith("/v1/app/auth/google", {
      method: "POST",
      body: {
        challenge_id: "challenge-1",
        credential: "signed-google-id-token",
      },
      skipAuth: true,
    });
  });
});

describe("account management endpoints", () => {
  it("updates only the display name on the authenticated account", async () => {
    const { client, request } = fakeClient();
    await authEndpoints(client).updateAccount({ display_name: "Helena Marques" });
    expect(request).toHaveBeenCalledWith("/v1/app/me", {
      method: "PATCH",
      body: { display_name: "Helena Marques" },
    });
  });

  it("changes the password through an authenticated request", async () => {
    const { client, request } = fakeClient();
    await authEndpoints(client).changePassword({
      current_password: "current-password",
      new_password: "new-long-password",
    });
    expect(request).toHaveBeenCalledWith("/v1/app/auth/password", {
      method: "PUT",
      body: {
        current_password: "current-password",
        new_password: "new-long-password",
      },
    });
  });
});
