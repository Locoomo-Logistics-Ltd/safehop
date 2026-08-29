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
 */
export async function resolvePostAuthRoute(user: User): Promise<string> {
  if (user.role === "node_operator") {
    try {
      const { node } = await nodeService.getMyNodeOperatorProfile();
      return node.status === "active" ? ROUTES.nodeHome : ROUTES.nodeSetup;
    } catch {
      return ROUTES.nodeSetup;
    }
  }

  // `admin` can't actually reach this function (loginConsumer/
  // loginWithGoogle both reject an Admin account outright), `Partial`
  // reflects that honestly instead of listing a redirect that would
  // never fire.
  const roleRedirect: Partial<Record<UserRole, string>> = {
    consumer: ROUTES.dashboard,
    rider: ROUTES.riderHome,
  };
  return roleRedirect[user.role] ?? ROUTES.dashboard;
}
