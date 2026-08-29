import { STORAGE_KEYS } from "@/core/config/constants";
import type { AuthSession } from "@/core/types";

/**
 * The persisted-session localStorage read/write, shared by
 * `auth.service.ts` (password/Google login) and `users.service.ts`
 * (phone completion updates the cached session's user object too) —
 * split out so neither has to import the other. There is no `/auth/me`
 * endpoint (see docs/API.md); the app trusts this cached copy until a
 * call 401s, at which point `client.ts`'s refresh-and-retry (or a hard
 * sign-out) takes over.
 */
export function persistSession(session: AuthSession) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
}

export function readPersistedSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEYS.session);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function clearPersistedSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEYS.session);
}
