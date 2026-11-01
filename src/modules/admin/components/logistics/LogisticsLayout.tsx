"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RootTopBar } from "@/components/layout";
import { ROUTES } from "@/core/config/constants";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Couriers", href: ROUTES.adminLogistics },
  { label: "Vehicles", href: `${ROUTES.adminLogistics}/vehicles` },
  { label: "Routes", href: `${ROUTES.adminLogistics}/routes` },
  { label: "Deliveries", href: ROUTES.adminLogisticsDeliveries },
  { label: "Economics", href: ROUTES.adminLogisticsEconomics },
] as const;

interface LogisticsLayoutProps {
  title: string;
  description: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

/** Shared frame for the Admin Logistics screens: page heading plus a tab bar across the five areas (docs/LOGISTICS_API.md §8). */
export function LogisticsLayout({ title, description, actions, children }: LogisticsLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <RootTopBar profileHref={ROUTES.adminProfile} hideOnDesktop />

      <div className="px-4 md:px-6 pt-2 md:pt-8 pb-10">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
          <div>
            <h1 className="font-display text-[22px] font-bold text-text-primary">{title}</h1>
            <p className="text-[13px] text-text-muted mt-0.5 max-w-[620px]">{description}</p>
          </div>
          {actions}
        </div>

        <nav className="flex gap-2 overflow-x-auto scrollbar-none mb-6" aria-label="Logistics sections">
          {TABS.map((tab) => {
            const active = tab.href === ROUTES.adminLogistics ? pathname === tab.href : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "shrink-0 px-4 h-9 rounded-full text-[13px] font-semibold inline-flex items-center border transition-colors",
                  active
                    ? "bg-admin-accent border-admin-accent text-white"
                    : "bg-bg-card border-border-default text-text-secondary hover:bg-bg-subtle"
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {children}
      </div>
    </div>
  );
}
