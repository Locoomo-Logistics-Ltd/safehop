import {
  HomeIcon,
  TrackIcon,
  QrCodeIcon,
  ActivityIcon,
  BriefcaseIcon,
  TruckIcon,
  WalletIcon,
  PackageIcon,
  MapPinIcon,
  UsersIcon,
  AlertTriangleIcon,
  BarChartIcon,
  SettingsIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  RefreshCcwIcon,
} from "@/components/icons";
import { ROUTES } from "@/core/config/constants";

export interface NavItem {
  label: string;
  href: string;
  icon: typeof HomeIcon;
}

/**
 * Shared between BottomNav (mobile) and Sidebar (desktop) so the two
 * never drift. "Profile" (2026-08-21) moved off this list — and off
 * every other role's — onto the top-right of each root screen's
 * `RootTopBar` instead, so it's no longer a tab here.
 */
export const USER_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: ROUTES.dashboard, icon: HomeIcon },
  { label: "Track", href: ROUTES.trackList, icon: TrackIcon },
];

/**
 * Node Operator nav — Home / Scan / Activity / Earnings ("Profile"
 * moved to `RootTopBar`, see `USER_NAV_ITEMS`'s header comment).
 * "Earnings" (2026-08-21) moved here from a row inside Node Profile —
 * same route (`ROUTES.nodeEarnings`, unchanged), promoted to its own
 * tab so it's reachable in one tap instead of a Profile drill-down,
 * matching how the Rider module's own Earnings tab already works.
 *
 * "Inventory" (added 2026-08-17, one screen tabbed into Pickup/Incoming/
 * Collection/History) is retired the same day, not just hidden — its
 * four tabs were fully redistributed rather than deleted: Pickup and
 * Incoming became Home's "Awaiting Pickup"/"Awaiting Arrival" tabs
 * (`NodeHomeScreen`, same `GET /handoffs/my-node/orders` query,
 * same confirm-handoff flow, now reached via a dedicated details page
 * — `HandoffDetailScreen` at `ROUTES.nodeHandoffDetail`); Collection
 * became Home's "Ready for Collection" tab (`CollectParcelScreen`,
 * extended to also cover the check-in/"Send" step); History became a
 * second tab on the Activity screen (`ActivityScreen`'s "Order
 * History"). Home is now the single place a Node operator sees
 * everything happening at their counter — a "dashboard" that Inventory
 * duplicated rather than fed — so it doesn't need its own nav item
 * anymore. "Handoff" (2026-08-14) and "Collect" (2026-08-15) were the
 * two screens Inventory itself replaced; see that day's history if
 * you're tracing this further back.
 */
export const NODE_NAV_ITEMS: NavItem[] = [
  { label: "Home", href: ROUTES.nodeHome, icon: HomeIcon },
  { label: "Scan", href: ROUTES.nodeScan, icon: QrCodeIcon },
  // "Send" (2026-09-03) — the station's own outbound parcel, `POST
  // /node-operators/nodes/:nodeId/dispatch`. Earns a nav slot rather
  // than a Home button because it's the *only* way a station that has
  // switched public drop-offs off still moves parcels, and because
  // dispatching is routine daily work for that kind of operator, not a
  // one-off setup action.
  { label: "Send", href: ROUTES.nodeDispatch, icon: TruckIcon },
  { label: "Activity", href: ROUTES.nodeActivity, icon: ActivityIcon },
  { label: "Earnings", href: ROUTES.nodeEarnings, icon: WalletIcon },
  // "My Nodes" (2026-09-21) — an owner's stations list used to render
  // inline inside Node Profile *and* at `/node/setup`, in two places
  // that could disagree. It's one screen on its own route now, reached
  // in one tap from here rather than a Profile drill-down, same
  // promotion "Earnings" got on 2026-08-21.
  //
  // Owner-only, deliberately: this is where a station's payout account,
  // public visibility and team are managed, and all three are
  // owner-gated server-side. Staff still reach their own (read-only)
  // stations list from the Profile row — they just don't get a tab for
  // it, since none of the management actions behind it are theirs.
  { label: "My Nodes", href: ROUTES.nodeNodes, icon: MapPinIcon },
];

/**
 * Node **staff** nav (2026-09-02) — the same counter work, minus
 * Earnings. Not a styling choice: `GET /earnings/my-node` is documented
 * NodeOperator-only and answers `403 FORBIDDEN` for a `node_staff`
 * session, so the tab would lead to an error screen every time. The
 * owner-only surfaces staff also can't reach (a Node's payout account,
 * its visibility toggle, its team, adding a Node, My Nodes itself)
 * were never nav items — they hang off Profile and the per-Node detail
 * screen, which hide them by `roleAtNode` instead. See
 * `(node)/layout.tsx` for which list a session gets.
 *
 * "Send" **is** here (2026-09-03): `POST
 * /node-operators/nodes/:nodeId/dispatch` is gated on membership, not
 * ownership — dispatching is counter work like every handoff step, and
 * the API says so explicitly.
 */
export const NODE_STAFF_NAV_ITEMS: NavItem[] = [
  { label: "Home", href: ROUTES.nodeHome, icon: HomeIcon },
  { label: "Scan", href: ROUTES.nodeScan, icon: QrCodeIcon },
  { label: "Send", href: ROUTES.nodeDispatch, icon: TruckIcon },
  { label: "Activity", href: ROUTES.nodeActivity, icon: ActivityIcon },
];

/**
 * Rider nav — Home / Jobs / Earnings per Figma, plus "Activity"
 * (2026-08-14 as "Active"; renamed and widened 2026-08-21 — "Profile"
 * moved to `RootTopBar` the same day). "Jobs" now points at the real,
 * documented board (`GET /handoffs/available-orders`) rather than the
 * undocumented `riderOps.jobBoard`; "Activity" is the same route
 * (`ROUTES.riderActiveDeliveries`, unchanged) the accepted-deliveries
 * list always lived at — only the label and the screen's own content
 * changed, from "just what's currently in transit" to every order this
 * rider has ever taken (tabbed: All / In Transit / Awaiting Collection
 * / Completed), so the name needed to widen with it.
 */
export const RIDER_NAV_ITEMS: NavItem[] = [
  { label: "Home", href: ROUTES.riderHome, icon: HomeIcon },
  { label: "Jobs", href: ROUTES.riderAvailableJobs, icon: BriefcaseIcon },
  { label: "Activity", href: ROUTES.riderActiveDeliveries, icon: TruckIcon },
  { label: "Earnings", href: ROUTES.riderDeliveries, icon: WalletIcon },
];

/**
 * Admin nav — Dashboard / Orders / Nodes / Team / Approvals / Pricing /
 * Disputes / Analytics. The first six + Disputes/Analytics match the
 * `admin_UI.png` design reference sidebar; "Approvals" and "Pricing"
 * were added 2026-08-12 — real, confirmed endpoints
 * (`node-operators/pending`+`approve`, `riders/pending`+`approve`,
 * `admin/pricing`) with no home in the original 8-frame design, so
 * they're placed after "Team" (their closest thematic neighbor —
 * account/role administration) rather than invented a new design
 * section. "Revenue Split" (`/admin/revenue-split`) joined them
 * 2026-08-20, placed next to "Analytics" — its closest thematic
 * neighbour — rather than a new section, same reasoning as above; it
 * replaces an earlier "Rider Earnings" screen built against
 * `/admin/rider-earnings`, an endpoint that doesn't exist in
 * docs/API.md. "Capacity Audit" (`/admin/capacity-audit`) joined the
 * same way, placed last — a read-only diagnostics report with no home
 * in the original design either, closest in spirit to "Revenue Split"
 * (an operational reconciliation view, not a config screen).
 * "Settings" (Super Admin) is rendered separately, pinned to the bottom
 * of the sidebar, same as the account footer pattern already used
 * there.
 */
export const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: ROUTES.adminDashboard, icon: HomeIcon },
  { label: "Orders", href: ROUTES.adminOrders, icon: PackageIcon },
  { label: "Nodes", href: ROUTES.adminNodes, icon: MapPinIcon },
  { label: "Team", href: ROUTES.adminTeam, icon: UsersIcon },
  { label: "Approvals", href: ROUTES.adminApprovals, icon: ShieldCheckIcon },
  { label: "Pricing", href: ROUTES.adminPricing, icon: CreditCardIcon },
  { label: "Disputes", href: ROUTES.adminDisputes, icon: AlertTriangleIcon },
  { label: "Analytics", href: ROUTES.adminAnalytics, icon: BarChartIcon },
  { label: "Revenue Split", href: ROUTES.adminRevenueSplit, icon: WalletIcon },
  { label: "Capacity Audit", href: ROUTES.adminCapacityAudit, icon: RefreshCcwIcon },
];

export const ADMIN_SETTINGS_NAV_ITEM: NavItem = {
  label: "Settings",
  href: ROUTES.adminSettings,
  icon: SettingsIcon,
};
