"use client";

import Link from "next/link";
import { Button } from "@/components/ui";
import { PlusIcon } from "@/components/icons";
import { ROUTES } from "@/core/config/constants";
import { useCurrentUser } from "@/store/auth.store";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** Greeting + primary CTA card — first thing shown on the dashboard. */
export function DashboardHeader() {
  const user = useCurrentUser();

  return (
    <div className="px-4 md:px-6 pt-5 md:pt-8">
      <p className="text-[15px] text-text-secondary">
        {getGreeting()}, <span className="font-semibold text-text-primary">{user?.firstName ?? "there"}</span> 👋
      </p>
      <p className="text-[13px] text-text-muted mt-0.5 mb-5">
        We&apos;re up and ready for you!
      </p>

      <div className="rounded-[18px] bg-brand-blue p-5 flex items-center justify-between gap-4 shadow-[var(--shadow-raised)]">
        <div>
          <p className="font-display font-bold text-[17px] text-white leading-snug">
            Send a New Parcel
          </p>
          <p className="text-[13px] text-white/70 mt-0.5">
            Start a new delivery order instantly.
          </p>
        </div>
        <Link href={ROUTES.newDelivery}>
          <Button
            variant="secondary"
            className="!bg-white !text-brand-blue w-12 h-12 !p-0 rounded-full shrink-0"
            aria-label="Send a new parcel"
          >
            <PlusIcon size={22} />
          </Button>
        </Link>
      </div>
    </div>
  );
}
