"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Button } from "@/components/ui";
import { env } from "@/core/config/env";
import { GoogleIcon } from "./GoogleIcon";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            ux_mode?: "popup" | "redirect";
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              shape?: "rectangular" | "pill" | "circle" | "square";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              logo_alignment?: "left" | "center";
              width?: number;
            }
          ) => void;
        };
      };
    };
  }
}

interface GoogleAuthButtonProps {
  /** Called with the raw signed ID token from Google Identity Services — hand this straight to `POST /auth/google` (docs/API.md), never modified client-side. */
  onCredential: (idToken: string) => void;
  /** Google's own button copy variant. */
  text?: "signup_with" | "continue_with" | "signin_with";
  disabled?: boolean;
}

/**
 * "Continue with Google" — wraps Google Identity Services' own
 * rendered button (not a custom-styled one) so the ID-token flow
 * `POST /auth/google` documents actually works: GIS only hands back a
 * credential through its own button/One Tap UI, and the backend
 * independently re-verifies that token against Google's keys, never
 * trusting anything this component could construct itself.
 *
 * Degrades to a disabled button when `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
 * isn't set, same pattern as this app's other optional third-party
 * integrations (Geoapify/Google Maps keys) — no crash, just an
 * explained unavailable state.
 */
export function GoogleAuthButton({ onCredential, text = "continue_with", disabled }: GoogleAuthButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!scriptReady || !env.googleSignInClientId || !containerRef.current || !window.google) return;

    window.google.accounts.id.initialize({
      client_id: env.googleSignInClientId,
      ux_mode: "popup",
      callback: (response) => onCredentialRef.current(response.credential),
    });

    window.google.accounts.id.renderButton(containerRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      shape: "pill",
      text,
      logo_alignment: "left",
      width: containerRef.current.offsetWidth || 320,
    });
    // Re-render only when the requested copy changes — role/consent
    // values the caller sends live in a ref on their side, not here.
  }, [scriptReady, text]);

  if (!env.googleSignInClientId) {
    return (
      <Button fullWidth size="lg" variant="outline" disabled leftIcon={<GoogleIcon />}>
        Continue with Google (unavailable)
      </Button>
    );
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <div
        ref={containerRef}
        className={disabled ? "pointer-events-none opacity-50" : ""}
        aria-disabled={disabled}
        style={{ minHeight: 44 }}
      />
    </>
  );
}
