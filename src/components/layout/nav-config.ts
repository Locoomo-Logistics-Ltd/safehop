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
  { label: "Activity", href: ROUTES.nodeActivity, icon: ActivityIcon },
  { label: "Earnings", href: ROUTES.nodeEarnings, icon: WalletIcon },
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
 * docs/API.md.
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
];

export const ADMIN_SETTINGS_NAV_ITEM: NavItem = {
  label: "Settings",
  href: ROUTES.adminSettings,
  icon: SettingsIcon,
};
