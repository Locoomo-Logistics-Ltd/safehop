import {
  HomeIcon,
  TrackIcon,
  UserIcon,
  QrCodeIcon,
  ActivityIcon,
  BriefcaseIcon,
  WalletIcon,
  PackageIcon,
  MapPinIcon,
  UsersIcon,
  AlertTriangleIcon,
  BarChartIcon,
  SettingsIcon,
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

/** Vendor (Shop Owner) nav — Home / Scan / Activity / Profile, matching Figma. */
export const VENDOR_NAV_ITEMS: NavItem[] = [
  { label: "Home", href: ROUTES.vendorHome, icon: HomeIcon },
  { label: "Scan", href: ROUTES.vendorScan, icon: QrCodeIcon },
  { label: "Activity", href: ROUTES.vendorActivity, icon: ActivityIcon },
  { label: "Profile", href: ROUTES.vendorProfile, icon: UserIcon },
];

/** Rider nav — Home / Jobs / Earnings / Profile, matching Figma. */
export const RIDER_NAV_ITEMS: NavItem[] = [
  { label: "Home", href: ROUTES.riderHome, icon: HomeIcon },
  { label: "Jobs", href: ROUTES.riderJobOffer, icon: BriefcaseIcon },
  { label: "Earnings", href: ROUTES.riderDeliveries, icon: WalletIcon },
  { label: "Profile", href: ROUTES.riderProfile, icon: UserIcon },
];

/**
 * Admin nav — Dashboard / Orders / Nodes / Team / Disputes / Analytics,
 * matching the `admin_UI.png` design reference sidebar. "Settings"
 * (Super Admin) is rendered separately, pinned to the bottom of the
 * sidebar, same as the account footer pattern already used there.
 */
export const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: ROUTES.adminDashboard, icon: HomeIcon },
  { label: "Orders", href: ROUTES.adminOrders, icon: PackageIcon },
  { label: "Nodes", href: ROUTES.adminNodes, icon: MapPinIcon },
  { label: "Team", href: ROUTES.adminTeam, icon: UsersIcon },
  { label: "Disputes", href: ROUTES.adminDisputes, icon: AlertTriangleIcon },
  { label: "Analytics", href: ROUTES.adminAnalytics, icon: BarChartIcon },
];

export const ADMIN_SETTINGS_NAV_ITEM: NavItem = {
  label: "Settings",
  href: ROUTES.adminSettings,
  icon: SettingsIcon,
};
