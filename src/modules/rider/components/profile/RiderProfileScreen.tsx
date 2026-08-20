"use client";

import Link from "next/link";
import { Card, Button } from "@/components/ui";
import { TopBar } from "@/components/layout";
import {
  MailIcon,
  PhoneIcon,
  ShieldCheckIcon,
  ClockIcon,
  CreditCardIcon,
  BellRingIcon,
  LockIcon,
  LifeBuoyIcon,
  ChevronRightIcon,
  LogOutIcon,
} from "@/components/icons";
import { useCurrentUser } from "@/store/auth.store";
import { ROUTES } from "@/core/config/constants";
import { useRiderAuth } from "@/modules/rider/hooks/use-rider-auth";
import { useRiderEarnings } from "@/modules/rider/hooks/use-rider-earnings";
import { useRiderProfile } from "@/modules/rider/hooks/use-rider-profile";
import { useRiderVerification } from "@/modules/rider/hooks/use-rider-verification";
import { formatCurrency } from "@/lib/format";

const SETTINGS_ITEMS = [
  { icon: CreditCardIcon, label: "Payment Methods" },
  { icon: BellRingIcon, label: "Notification Preferences" },
  { icon: LockIcon, label: "Security & PIN" },
  { icon: LifeBuoyIcon, label: "Contact Support" },
];

/** Rider Profile — stats, personal info, vehicle details, settings, logout. Matches Figma frame 8. */
export function RiderProfileScreen() {
  const user = useCurrentUser();
  const { logout, isLoggingOut } = useRiderAuth();
  const { earnings } = useRiderEarnings();
  const { details } = useRiderProfile();
  const { profile: verification, isLoadingProfile: isLoadingVerification } = useRiderVerification();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-bg-canvas">
      <TopBar title="Profile" />

      <div className="px-4 md:px-6 pt-2 md:pt-8 pb-10 max-w-[480px] mx-auto">
        {/* Avatar + name */}
        <div className="flex flex-col items-center py-6">
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-full bg-status-info-bg text-brand-blue flex items-center justify-center font-display font-bold text-[26px] border-2 border-brand-blue/20">
              {user.firstName[0]}
              {user.lastName[0]}
            </div>
            <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-status-success border-2 border-bg-canvas" />
          </div>
          <p className="font-display font-bold text-[18px] text-text-primary">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-[12px] font-semibold text-brand-blue uppercase tracking-wide">
            Professional Rider
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2.5 mb-6">
          <Card padding="sm" className="text-center">
            <p className="text-[10px] text-text-muted mb-1">Total Earnings</p>
            <p className="font-display font-bold text-[14px] text-status-success">
              {earnings ? formatCurrency(earnings.totalEarnings) : "₦0.00"}
            </p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-[10px] text-text-muted mb-1">Deliveries</p>
            <p className="font-display font-bold text-[14px] text-text-primary">
              {earnings?.totalDeliveries.toLocaleString() ?? "0"}
            </p>
          </Card>
        </div>

        {/* Personal information */}
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-2">
          Personal Information
        </p>
        <Card padding="none" className="overflow-hidden mb-6">
          <Row icon={<MailIcon size={15} />} label="Full Name" value={`${user.firstName} ${user.lastName}`} />
          <div className="h-px bg-border-default" />
          <Row icon={<PhoneIcon size={15} />} label="Phone Number" value={user.phone} />
          <div className="h-px bg-border-default" />
          <Row icon={<MailIcon size={15} />} label="Email Address" value={user.email} />
        </Card>

        {/* Vehicle details */}
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-2">
          Vehicle Details
        </p>
        <Card
          padding="md"
          className="flex items-center gap-3 mb-6 border-l-[3px] border-l-status-success"
        >
          <span className="w-9 h-9 rounded-[10px] bg-bg-subtle text-text-secondary flex items-center justify-center shrink-0 text-[16px]">
            🛵
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-text-primary">
              {details?.vehicle.type ?? "—"}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[12px] text-text-muted">{details?.vehicle.plateNumber}</span>
              {details?.vehicle.isVerified && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-status-success bg-status-success-bg px-1.5 py-0.5 rounded-full">
                  <ShieldCheckIcon size={10} />
                  Verified
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* KYC verification status */}
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-2">
          Verification
        </p>
        <Link href={ROUTES.riderVerification} className="block mb-6">
          <Card
            padding="md"
            interactive
            className={
              "flex items-center gap-3 border-l-[3px] " +
              (verification?.status === "active"
                ? "border-l-status-success"
                : "border-l-status-warning")
            }
          >
            <span
              className={
                "w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 " +
                (verification?.status === "active"
                  ? "bg-status-success-bg text-status-success"
                  : "bg-status-warning-bg text-status-warning")
              }
            >
              {verification?.status === "active" ? (
                <ShieldCheckIcon size={16} />
              ) : (
                <ClockIcon size={16} />
              )}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-text-primary">
                {isLoadingVerification
                  ? "Checking status…"
                  : verification?.status === "active"
                    ? "Verified"
                    : verification?.status === "pending"
                      ? "Under review"
                      : "Complete your verification"}
              </p>
              <p className="text-[12px] text-text-muted truncate">
                {verification?.status === "active"
                  ? "You're eligible for job offers."
                  : "Required before you can accept delivery jobs."}
              </p>
            </div>
            <ChevronRightIcon size={16} className="text-text-muted shrink-0" />
          </Card>
        </Link>

        {/* Account settings */}
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-2">
          Account Settings
        </p>
        <Card padding="none" className="overflow-hidden mb-6">
          {SETTINGS_ITEMS.map((item, i) => (
            <div key={item.label}>
              {i > 0 && <div className="h-px bg-border-default" />}
              <button className="w-full flex items-center gap-3 p-4 text-left">
                <span className="w-8 h-8 rounded-[9px] bg-bg-subtle text-text-secondary flex items-center justify-center shrink-0">
                  <item.icon size={15} />
                </span>
                <span className="flex-1 text-[13px] font-medium text-text-primary">{item.label}</span>
                <ChevronRightIcon size={15} className="text-text-muted shrink-0" />
              </button>
            </div>
          ))}
        </Card>

        <Button
          fullWidth
          size="lg"
          variant="danger"
          leftIcon={<LogOutIcon size={16} />}
          isLoading={isLoggingOut}
          onClick={() => logout()}
        >
          Logout Session
        </Button>
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3.5">
      <span className="w-8 h-8 rounded-[9px] bg-bg-subtle text-text-muted flex items-center justify-center shrink-0">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-text-muted">{label}</p>
        <p className="text-[13px] font-medium text-text-primary truncate">{value}</p>
      </div>
    </div>
  );
}
