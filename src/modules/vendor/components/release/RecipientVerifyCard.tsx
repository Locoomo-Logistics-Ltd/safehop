import { Card } from "@/components/ui";
import { UserIcon } from "@/components/icons";

interface RecipientVerifyCardProps {
  receiverName: string;
  trackingCode: string;
}

/** Recipient identity card shown above the OTP input, matching Figma "Confirm this matches" block. */
export function RecipientVerifyCard({ receiverName, trackingCode }: RecipientVerifyCardProps) {
  return (
    <Card padding="md" className="flex items-center gap-3">
      <span className="w-10 h-10 rounded-full bg-status-info-bg text-brand-blue flex items-center justify-center shrink-0">
        <UserIcon size={18} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] text-text-muted mb-0.5">Confirm this matches</p>
        <p className="text-[14px] font-semibold text-text-primary truncate">{receiverName}</p>
        <span className="inline-block mt-1 text-[11px] font-mono font-medium text-text-secondary bg-bg-subtle px-2 py-0.5 rounded-full">
          {trackingCode}
        </span>
      </div>
    </Card>
  );
}
