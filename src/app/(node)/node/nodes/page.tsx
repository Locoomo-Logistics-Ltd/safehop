import { MyNodesScreen } from "@/modules/node/components/nodes";

/**
 * "My Nodes" — the canonical stations list, and an owner nav tab as of
 * 2026-09-21. Sits alongside the `[nodeId]` detail and `new` routes
 * that already lived under `/node/nodes`.
 *
 * `/node/setup` used to host this screen and now redirects here, so the
 * list has exactly one URL.
 */
export default function MyNodesPage() {
  return <MyNodesScreen />;
}
