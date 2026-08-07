"use client";

import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { SearchIcon, RefreshCcwIcon } from "@/components/icons";
import { useCurrentUser } from "@/store/auth.store";

function timeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * Persistent desktop top bar for every Admin screen — search field,
 * time-of-day greeting, refresh action, avatar. Matches the bar shown
 * across every frame in `admin_UI.png`. Desktop-only (`md:flex`); on
 * mobile each screen renders its own `<TopBar title=.../>`, same
 * pattern as the other roles.
 */
export function AdminTopBar() {
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  const isRefreshing = useIsFetching({ predicate: (q) => q.queryKey[0] === "admin" }) > 0;

  return (
    <header className="hidden md:flex items-center gap-4 h-[var(--top-bar-height)] px-6 border-b border-border-default bg-bg-card sticky top-0 z-20">
      <div className="relative flex-1 max-w-[360px]">
        <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="search"
          placeholder="Search orders, nodes, riders…"
          className="w-full h-10 pl-10 pr-4 rounded-[10px] bg-bg-subtle border border-transparent text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:bg-bg-card focus:border-border-strong transition-colors"
        />
      </div>

      <div className="flex-1" />

      <p className="text-[13px] text-text-secondary">
        {timeOfDayGreeting()}, <span className="font-semibold text-text-primary">{user?.firstName ?? "Admin"}</span>
      </p>

      <button
        type="button"
        aria-label="Refresh"
        onClick={() => queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === "admin" })}
        disabled={isRefreshing}
        className="w-9 h-9 rounded-full border border-border-default flex items-center justify-center text-text-secondary hover:bg-bg-subtle transition-colors disabled:opacity-50"
      >
        <RefreshCcwIcon size={16} className={isRefreshing ? "animate-spin" : undefined} />
      </button>

      <div className="w-9 h-9 rounded-full bg-admin-accent-bg text-admin-accent flex items-center justify-center font-semibold text-[13px] shrink-0">
        {user?.firstName?.[0]}
        {user?.lastName?.[0]}
      </div>
    </header>
  );
}
