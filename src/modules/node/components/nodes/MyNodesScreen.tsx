"use client";

import Link from "next/link";
import { TopBar } from "@/components/layout";
import { Button, Card, EmptyState } from "@/components/ui";
import { ErrorAlert } from "@/components/ui/error-alert";
import {
  ChevronRightIcon,
  EyeOffIcon,
  MapPinIcon,
  PackageIcon,
  PlusIcon,
  WalletIcon,
} from "@/components/icons";
import { getFriendlyError } from "@/core/api/errors";
import { isNodePubliclyVisible } from "@/core/types";
import { ROUTES } from "@/core/config/constants";
import { useNodeSetup } from "@/modules/node/hooks/use-node-setup";
import { useMyNodes } from "@/modules/node/hooks/use-my-nodes";
import { NodeOnboardingForm } from "./NodeOnboardingForm";
import { NodeStatusBadge } from "./NodeStatusBadge";

/**
 * "My Nodes" (`/node/setup`) — every Pickup station this account has a
 * stake in. An owner's list comes from `GET /node-operators/me/nodes`
 * directly; a staff member's is reconstructed from their order history
 * — that route 403s a `node_staff` session on the live backend, see
 * `use-my-nodes.ts`'s header for the full story.
 *
 * This screen was a single Node's setup-and-status page until
 * 2026-09-02, when one operator became able to run several. The
 * first-run experience is unchanged — an empty list still drops
 * straight into the onboarding form, which is what a brand-new
 * operator arrives to from login — but once at least one station
 * exists it's a list, each row carrying that station's own approval
 * status and payout state, since both are per-Node now. Tapping a row
 * opens `NodeDetailScreen`, which is where a Node's payout account,
 * visibility and team live.
 *
 * **Staff see their stations here too** (2026-09-08) — the ones a
 * parcel has actually connected them to (see the note above; a
 * brand-new invite with zero order history has nothing to show yet,
 * which is a real, known limit, not a bug), read-only. They briefly
 * got a "managed by the station owner" dead end instead, which was
 * wrong: being invited to a station means running it, so it belongs in
 * their list like any other. What they don't get is "Add Another
 * Station" (creating one needs the `node_operator` role) or the
 * owner-only sections inside a station's page.
 *
 * The route keeps its `/node/setup` path so existing links (Profile,
 * the dashboard's empty/unapproved states, the switcher's "Manage
 * stations") don't break.
 */
export function MyNodesScreen() {
  const {
    nodes,
    isLoadingNodes,
    notOnboarded,
    hasNoStationsYet,
    nodesError,
    createNode,
    isCreatingNode,
    createNodeError,
  } = useNodeSetup();
  const { activeNode, setActiveNodeId, isStaff } = useMyNodes();

  if (isLoadingNodes) {
    return (
      <div className="min-h-screen bg-bg-canvas">
        <TopBar title="My Stations" showBack />
        <p className="text-[13px] text-text-muted text-center py-10">
          Checking your Pickup stations…
        </p>
      </div>
    );
  }

  if (nodesError) {
    const friendly = getFriendlyError(nodesError);
    return (
      <div className="min-h-screen bg-bg-canvas">
        <TopBar title="My Stations" showBack />
        <div className="px-4 md:px-6 pt-4 max-w-[480px] mx-auto">
          <ErrorAlert title={friendly.title} message={friendly.message} action={friendly.action} />
        </div>
      </div>
    );
  }

  // An owner's first station: no list to show yet, so the form *is* the
  // screen — same experience an operator had before multi-Node existed.
  if (notOnboarded) {
    return (
      <div className="min-h-screen bg-bg-canvas">
        <TopBar title="Node Setup" showBack />
        <NodeOnboardingForm
          variant="first"
          onSubmit={createNode}
          isSubmitting={isCreatingNode}
          error={createNodeError}
        />
      </div>
    );
  }

  // A staff member with no stations is waiting on an invite, not on
  // themselves — `notOnboarded` is deliberately false for them so the
  // form above never renders here (creating a Node needs the
  // `node_operator` role, so it would be a dead end).
  if (hasNoStationsYet) {
    return (
      <div className="min-h-screen bg-bg-canvas">
        <TopBar title="My Stations" showBack />
        <EmptyState
          icon={<MapPinIcon size={24} />}
          title="No station yet"
          description="Nothing to show yet — a station only appears here once it's handled at least one order. If you were invited a while ago and still see this, check with whoever added you."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-canvas">
      <TopBar title="My Stations" showBack />

      <div className="px-4 md:px-6 pt-4 pb-10 max-w-[480px] mx-auto">
        <p className="text-[13px] text-text-secondary mb-4">
          {isStaff
            ? "The stations you've been added to. Tap one to see its details, or switch to it from the dashboard."
            : "Each station is approved, paid out, and staffed on its own. Tap one to manage it."}
        </p>

        <div className="flex flex-col gap-3">
          {nodes.map((membership) => {
            const { node } = membership;
            const isSelected = node.id === activeNode?.id;

            return (
              <Link
                key={membership.profileId}
                href={ROUTES.nodeDetail(node.id)}
                onClick={() => setActiveNodeId(node.id)}
              >
                <Card
                  padding="md"
                  interactive
                  className={
                    "flex items-start gap-3 border-l-[3px] " +
                    (isSelected ? "border-l-brand-blue" : "border-l-transparent")
                  }
                >
                  <span className="w-9 h-9 rounded-[10px] bg-bg-subtle text-text-muted flex items-center justify-center shrink-0">
                    <MapPinIcon size={16} />
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-[14px] font-semibold text-text-primary truncate">
                        {node.name}
                      </p>
                      {membership.roleAtNode === "staff" && (
                        <span className="text-[10px] font-semibold text-text-muted shrink-0">
                          Staff
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-text-muted truncate">{node.address}</p>

                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <NodeStatusBadge status={node.status} />
                      {/* Only shown when public drop-offs are OFF —
                          "open to the public" is the default and needs
                          no badge; being closed is the exception worth
                          seeing at a glance across several stations. */}
                      {!isNodePubliclyVisible(node) && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-status-neutral">
                          <EyeOffIcon size={11} />
                          Not public
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-text-muted">
                        <PackageIcon size={11} />
                        {node.capacity} parcels
                      </span>
                      {/* Payout is owner-business — a staff membership
                          never carries one, so don't nag about it. */}
                      {membership.roleAtNode === "owner" && (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-semibold"
                          style={{
                            color: membership.payoutAccountConfigured
                              ? "var(--status-success)"
                              : "var(--status-warning)",
                          }}
                        >
                          <WalletIcon size={11} />
                          {membership.payoutAccountConfigured ? "Payout set" : "Payout needed"}
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRightIcon size={16} className="text-text-muted shrink-0 mt-1" />
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Creating a Node requires the `node_operator` role — a staff
            member's submit would be rejected, so don't offer it. */}
        {!isStaff && (
          <Link href={ROUTES.nodeAddNode} className="block mt-5">
            <Button fullWidth size="lg" variant="outline" leftIcon={<PlusIcon size={16} />}>
              Add Another Station
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
