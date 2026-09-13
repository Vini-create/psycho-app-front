"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { startAuthentication } from "@simplewebauthn/browser";
import { Alert, GoogleSignInButton } from "@sinapsa/ui";
import {
  describeError,
  type GoogleChallenge,
  type PasskeyCeremony,
  type ProfessionalLoginResponse,
} from "@sinapsa/api-client";
import { auth, pro } from "@/lib/api";
import { useSession } from "@/lib/session";

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";

export function GoogleAuthAction({
  mode,
  disabled = false,
  onPasskeyRequired,
}: {
  mode: "signin" | "signup";
  disabled?: boolean;
  onPasskeyRequired?: (ceremony: PasskeyCeremony) => void;
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

  async function completePrimaryLogin(response: ProfessionalLoginResponse) {
    if (response.passkey_required) {
      if (onPasskeyRequired) {
        onPasskeyRequired(response.passkey_ceremony);
        return;
      }
      const credential = await startAuthentication({
        optionsJSON: response.passkey_ceremony.public_key as never,
      });
      const tokens = await pro.verifyAuthentication({
        ceremony_token: response.passkey_ceremony.ceremony_token,
        credential,
      });
      await establish(tokens);
      router.replace("/");
      return;
    }

    await establish(response.tokens);
    router.replace(
      response.passkey_enrollment_needed ? "/passkeys/cadastrar" : "/",
    );
  }

  async function handleCredential(credential: string) {
    if (!challenge) return;
    setError(null);
    setSubmitting(true);
    try {
      const response = (await auth.googleLogin({
        challenge_id: challenge.challenge_id,
        credential,
      })) as ProfessionalLoginResponse;
      await completePrimaryLogin(response);
    } catch (caught) {
      setError(describeError(caught).message);
      await refreshChallenge();
    } finally {
      setSubmitting(false);
    }
  }

  if (!googleClientId) return null;

  const panelTitle = mode === "signup" ? "Cadastro com Google" : "Acesso com Google";

  return (
    <div className="flex flex-col gap-5">
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

      <section className="rounded-sm border border-hairline bg-raised p-4 sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="type-ui text-ui font-semibold text-primary">
              {panelTitle}
            </h2>
            <p className="text-ui-sm text-secondary">
              Use uma conta conectada neste aparelho.
            </p>
          </div>

          <span className="type-meta hidden shrink-0 text-tertiary sm:block">
            acesso rápido
          </span>
        </div>

        <div className="flex min-h-11 w-full justify-center">
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
              className="flex min-h-11 w-full max-w-[400px] items-center justify-center rounded-sm border border-hairline bg-page text-ui text-secondary"
            >
              {loading ? "Preparando Google…" : "Google indisponível"}
            </div>
          )}
        </div>
      </section>

      {mode === "signup" && (
        <p className="type-meta -mt-1 text-center text-tertiary">
          O Google confirma seu e-mail automaticamente.
        </p>
      )}

      <div className="flex items-center gap-3 type-meta text-tertiary" aria-hidden="true">
        <span className="h-px flex-1 bg-hairline" />
        ou continue com seu e-mail
        <span className="h-px flex-1 bg-hairline" />
      </div>
    </div>
  );
}
