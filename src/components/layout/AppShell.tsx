import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import type { NavItem } from "./nav-config";

interface AppShellProps {
  children: React.ReactNode;
  navItems?: NavItem[];
  primaryAction?: { label: string; href: string; icon: React.ReactNode };
}

/**
 * Top-level responsive shell for all authenticated screens, shared
 * across every role (User, Vendor, ...).
 * Desktop: Sidebar (left) + content.
 * Mobile: full-width content + BottomNav (bottom).
 * Each child screen supplies its own TopBar/header as needed.
 * Pass `navItems` to switch the nav set per role; defaults to the
 * User module's items if omitted.
 */
export function AppShell({ children, navItems, primaryAction }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-bg-canvas">
      <Sidebar items={navItems} primaryAction={primaryAction} />
      <div className="flex-1 min-w-0 pb-[var(--bottom-nav-height)] md:pb-0">
        <div className="mx-auto w-full `max-w-(--app-max-width)`]">{children}</div>
      </div>
      <BottomNav items={navItems} />
    </div>
  );
}
