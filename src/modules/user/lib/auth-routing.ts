import { nodeService } from "@/core/api/services";
import { ROUTES } from "@/core/config/constants";
import type { User, UserRole } from "@/core/types";

/**
 * Shared post-auth landing-route resolver — used by password login,
 * Google login/signup, and `CompleteProfileScreen` alike, so all three
 * stay in sync with the one role-redirect map instead of drifting.
 * NodeOperator's destination depends on a second fetch (an approved
 * Node skips Setup and lands on its real dashboard) per explicit
 * product direction — see `use-auth.ts`'s prior header comment for the
 * full reasoning.
 *
 * Multi-Node (2026-09-02): that second fetch is now `GET
 * /node-operators/me/nodes`, which returns an array. The rule carries
 * over per-Node — land on the dashboard as soon as **any** Node is
 * approved, since that's a counter the operator can actually work at;
 * send them to My Nodes only when every Node is still pending (or
 * there are none yet, which is the same empty array the removed
 * singular route used to signal with a 404).
 */
export async function resolvePostAuthRoute(user: User): Promise<string> {
  if (user.role === "node_operator") {
    try {
      const memberships = await nodeService.getMyNodes();
      const hasActiveNode = memberships.some(
        (membership) => membership.node.status === "active"
      );
      return hasActiveNode ? ROUTES.nodeHome : ROUTES.nodeSetup;
    } catch {
      return ROUTES.nodeSetup;
    }
  }

  // `admin` can't actually reach this function (loginConsumer/
  // loginWithGoogle both reject an Admin account outright), `Partial`
  // reflects that honestly instead of listing a redirect that would
  // never fire.
  //
  // `node_staff` goes straight to the Node dashboard with no lookup:
  // they're invited to an already-`active` Node by definition (the
  // invite route refuses a pending one, `403 NODE_NOT_ACTIVE`), so
  // there's no approval state to branch on the way an owner's has.
  // The Nodes list loads on that screen for them exactly as it does
  // for an owner — skipping it here is a redirect shortcut, not an
  // access limit. See `use-my-nodes.ts`.
  const roleRedirect: Partial<Record<UserRole, string>> = {
    consumer: ROUTES.dashboard,
    rider: ROUTES.riderHome,
    node_staff: ROUTES.nodeHome,
  };
  return roleRedirect[user.role] ?? ROUTES.dashboard;
}
