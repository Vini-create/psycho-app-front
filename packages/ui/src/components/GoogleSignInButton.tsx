"use client";

import { useEffect, useRef } from "react";

type GoogleCredentialResponse = { credential?: string };

type GoogleIdentityServices = {
  accounts: {
    id: {
      initialize(config: {
        client_id: string;
        nonce: string;
        callback: (response: GoogleCredentialResponse) => void;
      }): void;
      renderButton(
        parent: HTMLElement,
        options: {
          type: "standard";
          theme: "outline";
          size: "large";
          text: "continue_with";
          shape: "rectangular";
          width: number;
          locale: "pt-BR";
        },
      ): void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentityServices;
  }
}

const SCRIPT_ID = "google-identity-services";
const SCRIPT_URL = "https://accounts.google.com/gsi/client";

export function GoogleSignInButton({
  clientId,
  nonce,
  disabled = false,
  onCredential,
  onError,
}: {
  clientId: string;
  nonce: string;
  disabled?: boolean;
  onCredential: (credential: string) => void;
  onError: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const credentialRef = useRef(onCredential);
  const errorRef = useRef(onError);
  credentialRef.current = onCredential;
  errorRef.current = onError;

  useEffect(() => {
    if (!clientId || !nonce || disabled) return;
    let active = true;

    const render = () => {
      if (!active || !window.google || !containerRef.current) return;
      const container = containerRef.current;
      container.replaceChildren();
      window.google.accounts.id.initialize({
        client_id: clientId,
        nonce,
        callback: (response) => {
          if (response.credential) credentialRef.current(response.credential);
          else errorRef.current();
        },
      });
      window.google.accounts.id.renderButton(container, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: Math.min(Math.max(container.clientWidth, 240), 400),
        locale: "pt-BR",
      });
    };

    if (window.google) {
      render();
      return () => {
        active = false;
      };
    }

    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = SCRIPT_URL;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", render);
    script.addEventListener("error", errorRef.current);
    return () => {
      active = false;
      script?.removeEventListener("load", render);
      script?.removeEventListener("error", errorRef.current);
    };
  }, [clientId, disabled, nonce]);

  if (!clientId || !nonce) return null;
  return <div ref={containerRef} className={disabled ? "pointer-events-none opacity-60" : ""} />;
}
