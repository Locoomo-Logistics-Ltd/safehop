"use client";

import { TopBar } from "@/components/layout";
import { Card, Button } from "@/components/ui";
import { PhoneIcon, MailIcon, ChevronRightIcon } from "@/components/icons";
import { useCurrentUser } from "@/store/auth.store";
import { useAuth } from "@/modules/user/hooks/use-auth";

/** Profile tab — account details + logout. Minimal for the User module's first pass. */
export function ProfileScreen() {
  const user = useCurrentUser();
  const { logout, isLoggingOut } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-bg-canvas">
      <TopBar title="Profile" />

      <div className="px-4 md:px-6 pt-2 md:pt-8 pb-8 max-w-[480px] mx-auto">
        <div className="flex flex-col items-center py-6">
          <div className="w-20 h-20 rounded-full bg-status-info-bg text-brand-blue flex items-center justify-center font-display font-bold text-[26px] mb-3">
            {user.firstName[0]}
            {user.lastName[0]}
          </div>
          <p className="font-display font-bold text-[18px] text-text-primary">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-[13px] text-text-muted capitalize">{user.role} account</p>
        </div>

        <Card padding="none" className="overflow-hidden">
          <Row icon={<MailIcon size={17} />} label="Email" value={user.email} />
          <div className="h-px bg-border-default" />
          <Row icon={<PhoneIcon size={17} />} label="Phone" value={user.phone} />
        </Card>

        <Button
          fullWidth
          size="lg"
          variant="outline"
          className="mt-8"
          isLoading={isLoggingOut}
          onClick={() => logout()}
        >
          Log Out
        </Button>
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-4">
      <span className="w-9 h-9 rounded-[10px] bg-bg-subtle text-text-muted flex items-center justify-center shrink-0">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-text-muted">{label}</p>
        <p className="text-[14px] font-medium text-text-primary truncate">{value}</p>
      </div>
      <ChevronRightIcon size={16} className="text-text-muted shrink-0" />
    </div>
  );
}
