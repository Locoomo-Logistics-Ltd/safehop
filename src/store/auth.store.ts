import { create } from "zustand";
import type { AuthSession, User } from "@/core/types";

interface AuthState {
  session: AuthSession | null;
  isInitializing: boolean;
  setSession: (session: AuthSession | null) => void;
  setInitializing: (value: boolean) => void;
  clear: () => void;
}

/**
 * Global auth store. Holds only the current session — never makes
 * network calls itself. Hooks in modules/*\/hooks call authService and
 * push the result in here via setSession.
 */
export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isInitializing: true,
  setSession: (session) => set({ session }),
  setInitializing: (value) => set({ isInitializing: value }),
  clear: () => set({ session: null }),
}));

export function useCurrentUser(): User | null {
  return useAuthStore((s) => s.session?.user ?? null);
}
