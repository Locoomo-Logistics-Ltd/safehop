"use client";

import Link from "next/link";
import { Card } from "@/components/ui";
import { WalletIcon, ChevronRightIcon } from "@/components/icons";

interface PayoutReminderBannerProps {
  href: string;
}

/**
 * Persistent nudge shown wherever a Rider/NodeOperator with
 * `payoutAccountConfigured: false` lands, until they set one up —
 * deliberately not dismissible (unlike `VerificationReminderSheet`):
 * without a payout account on file, Admin has no way to pay them, so
 * this should keep resurfacing rather than being "maybe later"'d away.
 */
export function PayoutReminderBanner({ href }: PayoutReminderBannerProps) {
  return (
    <Link href={href} className="block">
      <Card
        padding="md"
        interactive
        className="flex items-center gap-3 border-l-[3px] border-l-status-warning"
      >
        <span className="w-9 h-9 rounded-[10px] bg-status-warning-bg text-status-warning flex items-center justify-center shrink-0">
          <WalletIcon size={16} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-text-primary">Add your payout account</p>
          <p className="text-[12px] text-text-muted truncate">
            We can&apos;t pay you until we know where to send it.
          </p>
        </div>
        <ChevronRightIcon size={16} className="text-text-muted shrink-0" />
      </Card>
    </Link>
  );
}
