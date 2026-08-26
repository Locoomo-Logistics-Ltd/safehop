"use client";

import Link from "next/link";
import { TopBar } from "@/components/layout";
import { Card, Button } from "@/components/ui";
import { PhoneIcon, MailIcon, MapPinIcon, ChevronRightIcon, WalletIcon } from "@/components/icons";
import { ROUTES } from "@/core/config/constants";
import { useCurrentUser } from "@/store/auth.store";
import { useNodeAuth } from "@/modules/node/hooks/use-node-auth";
import { useNodeSetup } from "@/modules/node/hooks/use-node-setup";

/** Node Profile tab — account + managed node details, plus logout. */
export function NodeProfileScreen() {
  const user = useCurrentUser();
  const { profile, isLoadingProfile } = useNodeSetup();
  const node = profile?.node;
  const { logout, isLoggingOut } = useNodeAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-bg-canvas">
      <TopBar title="Profile" />

      <div className="px-4 md:px-6 pt-2 md:pt-8 pb-8 max-w-[480px] mx-auto">
        <div className="flex flex-col items-center py-6">
          <div className="w-20 h-20 rounded-full bg-status-info-bg text-brand-blue flex items-center justify-center font-display font-bold text-[26px] mb-3">
            {user.firstName[0]}
            {user.lastName[0]}
          </div>
          <p className="font-display font-bold text-[18px] text-text-primary">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-[13px] text-text-muted">Pickup Station Operator</p>
        </div>

        {node && (
          <Card padding="md" className="flex items-center gap-3 mb-4">
            <span className="w-9 h-9 rounded-[10px] bg-bg-subtle text-text-muted flex items-center justify-center shrink-0">
              <MapPinIcon size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] text-text-muted">Managing</p>
              <p className="text-[14px] font-semibold text-text-primary truncate">{node.name}</p>
              <p className="text-[12px] text-text-muted truncate">{node.address}</p>
            </div>
          </Card>
        )}

        <Card padding="none" className="overflow-hidden">
          <Row icon={<MailIcon size={17} />} label="Email" value={user.email} />
          <div className="h-px bg-border-default" />
          <Row icon={<PhoneIcon size={17} />} label="Phone" value={user.phone} />
        </Card>

        <Link href={ROUTES.nodeSetup} className="block mt-4">
          <Card padding="none" className="overflow-hidden" interactive>
            <Row icon={<MapPinIcon size={17} />} label="Business" value="Node Setup & Approval Status" />
          </Card>
        </Link>

        {/* Payout account — set on the Node Setup screen (the real
            PATCH .../payout-account route only requires onboarding to
            be complete, not approval), surfaced here too so it's not
            missed. */}
        <Link href={ROUTES.nodeSetup} className="block mt-4">
          <Card
            padding="md"
            interactive
            className={
              "flex items-center gap-3 border-l-[3px] " +
              (profile?.payoutAccountConfigured ? "border-l-status-success" : "border-l-status-warning")
            }
          >
            <span
              className={
                "w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 " +
                (profile?.payoutAccountConfigured
                  ? "bg-status-success-bg text-status-success"
                  : "bg-status-warning-bg text-status-warning")
              }
            >
              <WalletIcon size={16} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-text-primary">
                {isLoadingProfile
                  ? "Checking…"
                  : profile?.payoutAccountConfigured
                    ? profile.payoutBankName
                    : "Add your payout account"}
              </p>
              <p className="text-[12px] text-text-muted truncate">
                {profile?.payoutAccountConfigured
                  ? `${profile.payoutAccountNumber} - ${profile.payoutAccountName}`
                  : "Required before Admin can pay you."}
              </p>
            </div>
            <ChevronRightIcon size={16} className="text-text-muted shrink-0" />
          </Card>
        </Link>

        <Button
          fullWidth
          size="lg"
          variant="danger"
          className="mt-8"
          isLoading={isLoggingOut}
          onClick={() => logout()}
        >
          Log Out
        </Button>
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-4">
      <span className="w-9 h-9 rounded-[10px] bg-bg-subtle text-text-muted flex items-center justify-center shrink-0">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-text-muted">{label}</p>
        <p className="text-[14px] font-medium text-text-primary truncate">{value}</p>
      </div>
      <ChevronRightIcon size={16} className="text-text-muted shrink-0" />
    </div>
  );
}
