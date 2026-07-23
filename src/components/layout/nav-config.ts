import { HomeIcon, TrackIcon, UserIcon, QrCodeIcon, ActivityIcon, BriefcaseIcon, WalletIcon } from "@/components/icons";
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
