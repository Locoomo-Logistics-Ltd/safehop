"use client";

import { TopBar } from "@/components/layout/TopBar";
import { LogoMark } from "@/components/icons";

interface LegalDocLayoutProps {
  title: string;
  effectiveDate: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Shared shell for /terms and /privacy — reached from outside any
 * route group (no AppShell/Sidebar), so unlike most sub-screens the
 * TopBar's back control needs to stay visible on desktop too.
 */
export function LegalDocLayout({ title, effectiveDate, children }: LegalDocLayoutProps) {
  return (
    <div className="min-h-screen bg-bg-canvas">
      <TopBar title={title} showBack hideOnDesktop={false} />

      <div className="max-w-[720px] mx-auto px-6 pb-24 pt-6 md:pt-10">
        <div className="flex items-center gap-2 mb-6 md:hidden">
          <LogoMark size={22} />
          <span className="font-display font-bold text-[13px] text-text-primary tracking-tight">
            LOCOOMO
          </span>
        </div>

        <h1 className="font-display text-[26px] md:text-[30px] font-bold text-text-primary mb-1.5">
          {title}
        </h1>
        <p className="text-[13px] text-text-muted mb-8">Effective date: {effectiveDate}</p>

        <div
          className="
            text-[14.5px] leading-[1.7] text-text-secondary
            [&_h2]:font-display [&_h2]:text-[17px] [&_h2]:font-bold [&_h2]:text-text-primary
            [&_h2]:mt-8 [&_h2]:mb-2.5 [&_h2]:pt-6 [&_h2]:border-t [&_h2]:border-border-default
            [&_h2:first-child]:mt-0 [&_h2:first-child]:pt-0 [&_h2:first-child]:border-t-0
            [&_p]:mb-3.5 [&_ul]:mb-3.5 [&_ul]:pl-5 [&_ul]:list-disc [&_li]:mb-1.5
            [&_strong]:text-text-primary [&_strong]:font-semibold
            [&_a]:text-brand-blue [&_a]:underline [&_a]:underline-offset-2
          "
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/** Visibly flags a fact this draft could not determine on its own — fill in and remove. */
export function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block bg-status-warning-bg text-status-warning font-medium px-1.5 py-0.5 rounded-[4px] text-[13px]">
      {children}
    </span>
  );
}
