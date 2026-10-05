import { create } from "zustand";
import { STORAGE_KEYS } from "@/core/config/constants";

interface ActiveNodeState {
  /**
   * The Node the counter screens are currently scoped to, or `null`
   * for "not chosen yet — fall back to the first active one." Never
   * trust this to name a Node the account still has: it's read back
   * from localStorage, so it can point at a Node that was suspended,
   * or that belongs to an account that has since logged out.
   * `useMyNodes` resolves it against the live list on every read.
   */
  activeNodeId: string | null;
  setActiveNodeId: (nodeId: string | null) => void;
  /** Pulls the last selection out of localStorage. Called once from `useMyNodes`; a no-op after the first time, and on the server. */
  hydrate: () => void;
  hasHydrated: boolean;
}

/**
 * Which of a multi-Node operator's Nodes the Home/Activity/Scan
 * screens are showing (docs/API.md, 2026-09-02 — one account now runs
 * many Nodes). An operator is physically standing at exactly one
 * counter, so every Node-scoped screen reads this one selection rather
 * than aggregating; `NodeSwitcher` is what changes it.
 *
 * Client-only state, so Zustand rather than TanStack Query — nothing
 * here is fetched, and the server has no concept of a "current" Node.
 * Persistence is the manual localStorage read/write below rather than
 * Zustand's `persist` middleware, matching how `authService` handles
 * the session (see ARCHITECTURE.md's state-management section — no
 * store in this app uses `persist`).
 *
 * The stored value is read in `hydrate()` rather than in the store
 * initializer, so the first client render matches the server-rendered
 * HTML (an initializer reading `localStorage` would differ from SSR's
 * `null` and trip a hydration mismatch). Both reads and writes are
 * wrapped: `localStorage` throws outright in some privacy modes, and
 * this is a convenience, never something worth failing a render over.
 * A miss just means "no preference yet," which `useMyNodes` handles as
 * "use the first active Node."
 */
export const useActiveNodeStore = create<ActiveNodeState>((set, get) => ({
  activeNodeId: null,
  hasHydrated: false,

  setActiveNodeId: (nodeId) => {
    if (typeof window !== "undefined") {
      try {
        if (nodeId) window.localStorage.setItem(STORAGE_KEYS.activeNodeId, nodeId);
        else window.localStorage.removeItem(STORAGE_KEYS.activeNodeId);
      } catch {
        // Non-fatal — the selection just won't survive a reload.
      }
    }
    set({ activeNodeId: nodeId });
  },

  hydrate: () => {
    if (get().hasHydrated || typeof window === "undefined") return;
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEYS.activeNodeId);
    } catch {
      stored = null;
    }
    set({ activeNodeId: stored, hasHydrated: true });
  },
}));
