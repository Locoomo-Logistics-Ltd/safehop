"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout";
import { ROUTES } from "@/core/config/constants";
import { useMyNodes } from "@/modules/node/hooks/use-my-nodes";
import { useNodeSetup } from "@/modules/node/hooks/use-node-setup";
import { NodeOnboardingForm } from "./NodeOnboardingForm";

/**
 * "Add Another Station" (`/node/nodes/new`) — `POST
 * /node-operators/nodes`, the route that exists precisely so an
 * operator can add a 2nd/3rd location without a second registration or
 * login (docs/API.md, 2026-09-02).
 *
 * Same form as first-time onboarding; the endpoint is chosen in
 * `useNodeSetup` from the fetched list, so this screen never has to
 * know which of the two it's hitting. On success it selects the new
 * station and drops the operator on its detail page — that's where its
 * approval status and (once approved) its payout account and staff
 * invites live, and it's the only screen that can answer "what
 * happens next."
 */
export function AddNodeScreen() {
  const router = useRouter();
  const { setActiveNodeId } = useMyNodes();
  const { createNode, isCreatingNode, createNodeError, createdNode, isNodeCreated } =
    useNodeSetup();

  useEffect(() => {
    if (!isNodeCreated || !createdNode) return;
    setActiveNodeId(createdNode.node.id);
    router.replace(ROUTES.nodeDetail(createdNode.node.id));
  }, [isNodeCreated, createdNode, setActiveNodeId, router]);

  return (
    <div className="min-h-screen bg-bg-canvas">
      <TopBar title="Add Station" showBack />
      <NodeOnboardingForm
        variant="additional"
        onSubmit={createNode}
        isSubmitting={isCreatingNode}
        error={createNodeError}
      />
    </div>
  );
}
