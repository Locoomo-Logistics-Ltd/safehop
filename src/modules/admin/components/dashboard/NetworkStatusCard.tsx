import Link from "next/link";
import { Card, Button } from "@/components/ui";
import { MapPinIcon } from "@/components/icons";
import { ROUTES } from "@/core/config/constants";
import type { NetworkStatusSummary } from "@/core/types";

interface NetworkStatusCardProps {
  status: NetworkStatusSummary | undefined;
  isLoading: boolean;
}

/** "Network Status" card on the Admin Dashboard — a map placeholder + online/offline legend, matching the design's right-column card. */
export function NetworkStatusCard({ status, isLoading }: NetworkStatusCardProps) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-center justify-between px-5 h-14 border-b border-border-default">
        <h2 className="font-display font-bold text-[15px] text-text-primary">Network Status</h2>
        <Link href={ROUTES.adminNodes} className="text-[12px] font-semibold text-admin-accent hover:underline">
          View map
        </Link>
      </div>

      <div className="h-[180px] bg-bg-subtle flex flex-col items-center justify-center gap-2 text-text-muted">
        <MapPinIcon size={22} />
        <p className="text-[12px] px-6 text-center leading-[1.5]">
          Live network map coming soon.
        </p>
      </div>

      <div className="flex items-center justify-between px-5 py-3 text-[12px]">
        <span className="flex items-center gap-1.5 text-text-secondary">
          <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
          {isLoading ? "—" : (status?.nodesOnline ?? "—")} / {isLoading ? "—" : (status?.nodesTotal ?? "—")} nodes online
        </span>
        <span className="text-text-muted">{status?.lastSyncedLabel ?? "Not synced"}</span>
      </div>
    </Card>
  );
}

/** Orange CTA card below Network Status — points to the real, wired onboarding action. */
export function OnboardNodeCtaCard() {
  return (
    <Card padding="lg" className="bg-admin-accent border-none text-white">
      <p className="font-display font-bold text-[16px] mb-1">Onboard a New Node</p>
      <p className="text-[12px] text-white/85 leading-[1.5] mb-4">
        Bring a new partner pickup point into the network in a few steps.
      </p>
      <Link href={ROUTES.adminNodes}>
        <Button
          variant="secondary"
          size="sm"
          className="bg-white text-admin-accent hover:bg-white/90"
        >
          Add Node
        </Button>
      </Link>
    </Card>
  );
}
