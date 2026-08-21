import { AdminSidebar } from "./AdminSidebar";
import { AdminTopBar } from "./AdminTopBar";
import { BottomNav } from "./BottomNav";
import { ADMIN_NAV_ITEMS, ADMIN_SETTINGS_NAV_ITEM } from "./nav-config";

interface AdminShellProps {
  children: React.ReactNode;
}

/**
 * Top-level shell for every Admin screen — parallels `AppShell` but
 * swaps in the dark, orange-accented `AdminSidebar`/`AdminTopBar`
 * pairing the design reference uses instead of the light
 * `Sidebar`/blue accents the User/Node Operator/Rider roles share.
 * Mobile still falls back to the shared `BottomNav` for basic nav
 * parity with the rest of the app. `AdminTopBar`'s refresh button
 * invalidates every `["admin", ...]`-keyed query itself, so no
 * per-screen wiring is needed here.
 *
 * `ADMIN_NAV_ITEMS` has nine entries — too many for a mobile tab bar —
 * so `BottomNav` shows the first three plus a "More" tab covering the
 * rest; `ADMIN_SETTINGS_NAV_ITEM` rides along in that same sheet since
 * it otherwise has no mobile nav entry at all (it's pinned separately
 * in `AdminSidebar`, desktop-only).
 */
export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="flex min-h-screen bg-bg-canvas">
      <AdminSidebar />
      <div className="flex-1 min-w-0 pb-[var(--bottom-nav-height)] md:pb-0">
        <AdminTopBar />
        <div className="mx-auto w-full max-w-(--app-max-width)">{children}</div>
      </div>
      <BottomNav items={ADMIN_NAV_ITEMS} moreItems={[ADMIN_SETTINGS_NAV_ITEM]} />
    </div>
  );
}
