"use client";

import Link from "next/link";
import { TopBar } from "@/components/layout";
import { Card, Button } from "@/components/ui";
import {
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  ChevronRightIcon,
  WalletIcon,
} from "@/components/icons";
import { ROUTES } from "@/core/config/constants";
import { useCurrentUser } from "@/store/auth.store";
import { useNodeAuth } from "@/modules/node/hooks/use-node-auth";
import { useMyNodes } from "@/modules/node/hooks/use-my-nodes";

/**
 * Node Profile tab — account details, a way through to the stations
 * this account works at, and logout.
 *
 * Rewritten 2026-09-02 for multi-Node: "Managing" was one station and
 * one account-wide payout row; payout then moved onto each station's
 * own page (`NodeDetailScreen`) because the API made payout accounts
 * per-Node.
 *
 * **The stations list itself left this screen on 2026-09-21** — it now
 * has its own page at `ROUTES.nodeNodes` (`MyNodesScreen`), reachable
 * for an owner in one tap from the "My Nodes" nav tab. Profile had been
 * rendering the full list inline *and* linking to a second copy of it,
 * which is one list too many. What's left here is a row through to that
 * page, plus the payout summary, which is a genuine account-level
 * roll-up rather than a duplicate of the list.
 *
 * Serves both roles in this route group. A staff member gets full
 * access to everything here that isn't an owner-only action; their
 * "My Stations" row still points at `ROUTES.nodeSetup`, since the
 * owner-only "My Nodes" tab isn't theirs. The only thing genuinely
 * missing for them is the payout summary, because a staff membership
 * has no payout account anywhere in the API to summarise.
 */
export function NodeProfileScreen() {
  const user = useCurrentUser();
  const { ownedNodes, isLoading, isStaff } = useMyNodes();
  const { logout, isLoggingOut } = useNodeAuth();

  if (!user) return null;

  const unconfiguredPayoutCount = ownedNodes.filter(
    (membership) => !membership.payoutAccountConfigured
  ).length;

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
          <p className="text-[13px] text-text-muted">
            {isStaff ? "Pickup Station Staff" : "Pickup Station Operator"}
          </p>
        </div>

        <Card padding="none" className="overflow-hidden">
          <Row icon={<MailIcon size={17} />} label="Email" value={user.email} />
          <div className="h-px bg-border-default" />
          <Row
            icon={<PhoneIcon size={17} />}
            label="Phone"
            value={
              user.phone ?? (
                <Link href={ROUTES.completeProfile} className="text-brand-blue font-semibold">
                  Add phone number
                </Link>
              )
            }
          />
        </Card>

        {/* Open to both roles — a staff member's version of My Stations
            is real and already works (read-only: their stations,
            correct status, no "Add Another Station"), so there's no
            reason to hide the door to it. Only the label changes,
            since staff can't approve a station or manage its team from
            there. */}
        <Link href={isStaff ? ROUTES.nodeSetup : ROUTES.nodeNodes} className="block mt-4">
          <Card padding="none" className="overflow-hidden" interactive>
            <Row
              icon={<MapPinIcon size={17} />}
              label="Business"
              value={isStaff ? "My Stations" : "My Stations, approval & staff"}
            />
          </Card>
        </Link>

        {/* Payout accounts are per-station (`PATCH
            /node-operators/nodes/:nodeId/payout-account`) and
            owner-only, so this row summarises rather than showing one
            account: it counts the OWNED stations still missing one and
            sends the operator to the list to fix them. `ownedNodes` is
            already empty for a pure staff account (their memberships
            are all `roleAtNode: "staff"`), so this naturally disappears
            for them without a separate role check. */}
        {ownedNodes.length > 0 && (
          <Link href={ROUTES.nodeNodes} className="block mt-4">
            <Card
              padding="md"
              interactive
              className={
                "flex items-center gap-3 border-l-[3px] " +
                (unconfiguredPayoutCount === 0
                  ? "border-l-status-success"
                  : "border-l-status-warning")
              }
            >
              <span
                className={
                  "w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 " +
                  (unconfiguredPayoutCount === 0
                    ? "bg-status-success-bg text-status-success"
                    : "bg-status-warning-bg text-status-warning")
                }
              >
                <WalletIcon size={16} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-text-primary">
                  {isLoading
                    ? "Checking…"
                    : unconfiguredPayoutCount === 0
                      ? "Payout accounts set up"
                      : "Add your payout account"}
                </p>
                <p className="text-[12px] text-text-muted truncate">
                  {unconfiguredPayoutCount === 0
                    ? `All ${ownedNodes.length === 1 ? "your station is" : `${ownedNodes.length} stations are`} ready to be paid.`
                    : `${unconfiguredPayoutCount} of ${ownedNodes.length} ${ownedNodes.length === 1 ? "station" : "stations"} still needs one.`}
                </p>
              </div>
              <ChevronRightIcon size={16} className="text-text-muted shrink-0" />
            </Card>
          </Link>
        )}

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

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
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
