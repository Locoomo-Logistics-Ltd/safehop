"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { TopBar } from "@/components/layout";
import { Button, Card, EmptyState } from "@/components/ui";
import { ErrorAlert } from "@/components/ui/error-alert";
import { ClockIcon, MapPinIcon, PackageIcon, UsersIcon } from "@/components/icons";
import { PayoutAccountCard } from "@/components/payout";
import { getFriendlyError } from "@/core/api/errors";
import { ROUTES } from "@/core/config/constants";
import { useMyNodes } from "@/modules/node/hooks/use-my-nodes";
import { useNodeSetup } from "@/modules/node/hooks/use-node-setup";
import { NodeStaffCard } from "./NodeStaffCard";
import { NodeStatusBadge } from "./NodeStatusBadge";
import { NodeVisibilityCard } from "./NodeVisibilityCard";

/**
 * One station's detail page (`/node/nodes/[nodeId]`) — new 2026-09-02,
 * the home for everything the multi-Node API made per-Node rather than
 * per-account:
 *
 *   - approval status and location/capacity, from the membership list
 *   - whether it takes public drop-offs
 *     (`PATCH /node-operators/nodes/:nodeId/visibility`, 2026-09-03)
 *   - that station's **own** payout account
 *     (`PATCH /node-operators/nodes/:nodeId/payout-account`)
 *   - that station's team — roster, invites, removal
 *     (`GET`/`POST`/`DELETE /node-operators/nodes/:nodeId/staff...`)
 *
 * Every write route here is owner-only server-side, and answers `404
 * NOT_FOUND` rather than `403` for a staff membership (whether the
 * Node exists at all isn't revealed). So the page reads `roleAtNode`
 * and simply doesn't render those sections for staff — showing a form
 * whose only possible outcome is a not-found error would be worse than
 * not showing it.
 *
 * The station is looked up in the already-fetched membership list
 * rather than re-fetched: there's no `GET
 * /node-operators/nodes/:nodeId` route, and the list carries every
 * field this page needs.
 */
export function NodeDetailScreen() {
  const params = useParams<{ nodeId: string }>();
  const nodeId = params.nodeId;
  const { nodes, isLoading, error, isStaff } = useMyNodes();
  const {
    banks,
    isLoadingBanks,
    setPayoutAccount,
    isSettingPayoutAccount,
    payoutAccountError,
    payoutAccountNodeId,
    payoutAccountSaved,
  } = useNodeSetup();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-canvas">
        <TopBar title="Station" showBack />
        <p className="text-[13px] text-text-muted text-center py-10">Loading this station…</p>
      </div>
    );
  }

  if (error) {
    const friendly = getFriendlyError(error);
    return (
      <div className="min-h-screen bg-bg-canvas">
        <TopBar title="Station" showBack />
        <div className="px-4 md:px-6 pt-4 max-w-[480px] mx-auto">
          <ErrorAlert title={friendly.title} message={friendly.message} action={friendly.action} />
        </div>
      </div>
    );
  }

  const membership = nodes.find((item) => item.node.id === nodeId);

  if (!membership) {
    return (
      <div className="min-h-screen bg-bg-canvas">
        <TopBar title="Station" showBack />
        <EmptyState
          icon={<MapPinIcon size={24} />}
          title="Station not found"
          description={
            isStaff
              ? "You're not on this station's team — your access may have been removed, or the link is out of date."
              : "This station isn't on your account — it may have been removed, or the link is out of date."
          }
          action={
            <Link href={ROUTES.nodeSetup}>
              <Button size="md" variant="outline">
                Back to My Stations
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const { node, roleAtNode } = membership;
  const isOwner = roleAtNode === "owner";

  return (
    <div className="min-h-screen bg-bg-canvas">
      <TopBar title={node.name} showBack />

      <div className="px-4 md:px-6 pt-4 pb-10 max-w-[480px] mx-auto flex flex-col gap-5">
        <Card padding="md">
          <div className="flex items-start gap-3">
            <span className="w-9 h-9 rounded-[10px] bg-bg-subtle text-text-muted flex items-center justify-center shrink-0">
              <MapPinIcon size={16} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[15px] font-semibold text-text-primary">{node.name}</p>
                <NodeStatusBadge status={node.status} />
              </div>
              <p className="text-[12px] text-text-muted mt-0.5">{node.address}</p>
              <p className="text-[12px] text-text-muted">
                {node.city}, {node.state}
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-3 text-[12px] text-text-secondary">
                <span className="inline-flex items-center gap-1.5">
                  <PackageIcon size={13} />
                  {node.capacity} parcels
                </span>
                {node.operatingHours && (
                  <span className="inline-flex items-center gap-1.5">
                    <ClockIcon size={13} />
                    {node.operatingHours}
                  </span>
                )}
              </div>
            </div>
          </div>

          {node.status === "pending" && (
            <p className="text-[12px] text-status-warning font-medium mt-3">
              {isOwner
                ? "An admin is reviewing this station. Your other stations keep running while it waits."
                : "An admin is reviewing this station. You'll be able to work the counter here once it's approved."}
            </p>
          )}
        </Card>

        {/* Without this, a staff member's version of this page is just
            the card above and nothing else, which reads as broken
            rather than as "this is all there is for you." Says plainly
            what they can do here and who owns the rest. */}
        {!isOwner && (
          <Card padding="md" className="flex items-start gap-3">
            <span className="w-9 h-9 rounded-[10px] bg-status-info-bg text-brand-blue flex items-center justify-center shrink-0">
              <UsersIcon size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-text-primary">
                You&apos;re on this station&apos;s team
              </p>
              <p className="text-[12px] text-text-secondary leading-[1.5]">
                You can take drop-offs, hand parcels to riders, check them in, and release
                them to receivers here — and send parcels from this station. Its payout
                account, listing and team are the owner&apos;s to manage.
              </p>
            </div>
          </Card>
        )}

        {/* Owner-only from here down — every route below answers 404
            for a staff membership, so there's nothing to render for
            one. */}
        {isOwner && (
          <>
            <NodeVisibilityCard node={node} />

            <PayoutAccountCard
              configured={membership.payoutAccountConfigured}
              bankName={membership.payoutBankName}
              accountNumber={membership.payoutAccountNumber}
              accountName={membership.payoutAccountName}
              banks={banks}
              isLoadingBanks={isLoadingBanks}
              onSubmit={(payload) => setPayoutAccount({ nodeId: node.id, payload })}
              // The payout mutation is shared across every station, so
              // scope its in-flight/saved/error state to this one —
              // otherwise saving station A's account would flash state
              // onto station B's card too.
              isSubmitting={isSettingPayoutAccount && payoutAccountNodeId === node.id}
              error={payoutAccountNodeId === node.id ? payoutAccountError : null}
              saved={payoutAccountSaved && payoutAccountNodeId === node.id}
            />

            <NodeStaffCard nodeId={node.id} nodeName={node.name} nodeStatus={node.status} />
          </>
        )}
      </div>
    </div>
  );
}
