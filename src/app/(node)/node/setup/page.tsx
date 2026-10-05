import { MyNodesScreen } from "@/modules/node/components/nodes";

/**
 * Kept at `/node/setup` rather than moved to `/node/nodes`: this path
 * is linked from Profile, from the dashboard's not-onboarded and
 * pending-approval states, and from the Node switcher, and it's still
 * where a brand-new operator lands to set up their first station. The
 * screen behind it just widened from one Node to a list (2026-09-02).
 */
export default function NodeSetupPage() {
  return <MyNodesScreen />;
}
