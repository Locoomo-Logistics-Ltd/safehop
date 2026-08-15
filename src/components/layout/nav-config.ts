import {
  ArchiveIcon,
  HomeIcon,
  TrackIcon,
  UserIcon,
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

/** Shared between BottomNav (mobile) and Sidebar (desktop) so the two never drift. */
export const USER_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: ROUTES.dashboard, icon: HomeIcon },
  { label: "Track", href: "/track", icon: TrackIcon },
  { label: "Profile", href: "/profile", icon: UserIcon },
];

/**
 * Vendor (Shop Owner) nav — Home / Scan / Activity / Profile per Figma,
 * plus "Handoff" (2026-08-14), which has no home in the original design:
 * `POST /handoffs/orders/:id/confirm-handoff` is operator-initiated from
 * a code the rider states, so it can't hang off the QR scanner the way
 * consumer drop-off does. Placed next to "Scan" as its closest
 * thematic neighbour — both are counter actions on a parcel in hand.
 *
 * "Collect" joined them 2026-08-15 for the same reason. Scan / Handoff /
 * Collect are now the three custody moments at a counter — consumer in,
 * rider through, receiver out — so they sit together, ahead of the two
 * secondary screens. Six items is the ceiling for `BottomNav`'s
 * equal-width tabs; a seventh would need the nav restructured rather
 * than extended.
 */
export const VENDOR_NAV_ITEMS: NavItem[] = [
  { label: "Home", href: ROUTES.vendorHome, icon: HomeIcon },
  { label: "Scan", href: ROUTES.vendorScan, icon: QrCodeIcon },
  { label: "Handoff", href: ROUTES.vendorRiderHandoff, icon: TruckIcon },
  { label: "Collect", href: ROUTES.vendorAwaitingCollection, icon: ArchiveIcon },
  { label: "Activity", href: ROUTES.vendorActivity, icon: ActivityIcon },
  { label: "Profile", href: ROUTES.vendorProfile, icon: UserIcon },
];

/**
 * Rider nav — Home / Jobs / Earnings / Profile per Figma, plus "Active"
 * (2026-08-14). "Jobs" now points at the real, documented board
 * (`GET /handoffs/available-orders`) rather than the undocumented
 * `riderOps.jobBoard`; "Active" is the accepted-deliveries list that
 * board feeds into, which the old single-offer model had no equivalent
 * of — a rider can hold up to 3 at once now, so they need somewhere to
 * see them.
 */
export const RIDER_NAV_ITEMS: NavItem[] = [
  { label: "Home", href: ROUTES.riderHome, icon: HomeIcon },
  { label: "Jobs", href: ROUTES.riderAvailableJobs, icon: BriefcaseIcon },
  { label: "Active", href: ROUTES.riderActiveDeliveries, icon: TruckIcon },
  { label: "Earnings", href: ROUTES.riderDeliveries, icon: WalletIcon },
  { label: "Profile", href: ROUTES.riderProfile, icon: UserIcon },
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
 * section. "Settings" (Super Admin) is rendered separately, pinned to
 * the bottom of the sidebar, same as the account footer pattern
 * already used there.
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
];

export const ADMIN_SETTINGS_NAV_ITEM: NavItem = {
  label: "Settings",
  href: ROUTES.adminSettings,
  icon: SettingsIcon,
};
