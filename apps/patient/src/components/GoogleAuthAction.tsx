"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, GoogleSignInButton } from "@sinapsa/ui";
import {
  describeError,
  type AppLoginResponse,
  type GoogleChallenge,
} from "@sinapsa/api-client";
import { auth } from "@/lib/api";
import { useSession } from "@/lib/session";

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";

export function GoogleAuthAction({
  mode,
  disabled = false,
}: {
  mode: "signin" | "signup";
  disabled?: boolean;
}) {
  const router = useRouter();
  const { establish } = useSession();
  const [challenge, setChallenge] = useState<GoogleChallenge | null>(null);
  const [loading, setLoading] = useState(Boolean(googleClientId));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshChallenge = useCallback(async () => {
    if (!googleClientId) return;
    setLoading(true);
    setError(null);
    try {
      setChallenge(await auth.googleChallenge());
    } catch (caught) {
      setChallenge(null);
      setError(describeError(caught).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!googleClientId) return;
    let active = true;
    auth.googleChallenge().then(
      (nextChallenge) => {
        if (!active) return;
        setChallenge(nextChallenge);
        setLoading(false);
      },
      (caught: unknown) => {
        if (!active) return;
        setChallenge(null);
        setError(describeError(caught).message);
        setLoading(false);
      },
    );
    return () => {
      active = false;
    };
  }, []);

  async function handleCredential(credential: string) {
    if (!challenge) return;
    setError(null);
    setSubmitting(true);
    try {
      const response = (await auth.googleLogin({
        challenge_id: challenge.challenge_id,
        credential,
      })) as AppLoginResponse;
      await establish(response.tokens);
      router.replace("/");
    } catch (caught) {
      setError(describeError(caught).message);
      await refreshChallenge();
    } finally {
      setSubmitting(false);
    }
  }

  if (!googleClientId) return null;

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <Alert tone="warning" title="Google temporariamente indisponível">
          <span>{error} </span>
          <button
            type="button"
            className="font-semibold underline underline-offset-4"
            onClick={() => void refreshChallenge()}
          >
            Tentar novamente
          </button>
        </Alert>
      )}

      <div className="rounded-2xl border border-hairline bg-raised/50 px-4 py-4 shadow-sm">
        {challenge ? (
          <GoogleSignInButton
            clientId={googleClientId}
            nonce={challenge.nonce}
            text={mode === "signup" ? "signup_with" : "signin_with"}
            disabled={disabled || submitting}
            onCredential={(credential) => void handleCredential(credential)}
            onError={() => {
              setError("Não foi possível carregar a entrada com Google.");
              void refreshChallenge();
            }}
          />
        ) : (
          <div
            role="status"
            className="flex min-h-11 items-center justify-center rounded-full border border-hairline text-ui text-secondary"
          >
            {loading ? "Preparando Google…" : "Google indisponível"}
          </div>
        )}
        {mode === "signup" && (
          <p className="type-meta mt-3 text-center text-tertiary">
            O Google confirma seu e-mail automaticamente.
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 text-ui text-muted" aria-hidden="true">
        <span className="h-px flex-1 bg-hairline" />
        ou use seu e-mail
        <span className="h-px flex-1 bg-hairline" />
      </div>
    </div>
  );
}
