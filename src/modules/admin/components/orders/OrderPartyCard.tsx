import { Card } from "@/components/ui";
import { MailIcon, PhoneIcon } from "@/components/icons";

interface OrderPartyCardProps {
  role: "Sender" | "Receiver";
  name: string;
  phone: string;
  email?: string;
}

export function OrderPartyCard({ role, name, phone, email }: OrderPartyCardProps) {
  return (
    <Card padding="md">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-2">{role} Details</p>
      <p className="text-[14px] font-semibold text-text-primary mb-1.5">{name}</p>
      <div className="flex flex-col gap-1">
        <p className="flex items-center gap-1.5 text-[12px] text-text-secondary">
          <PhoneIcon size={12} className="shrink-0" />
          {phone}
        </p>
        {email && (
          <p className="flex items-center gap-1.5 text-[12px] text-text-secondary">
            <MailIcon size={12} className="shrink-0" />
            {email}
          </p>
        )}
      </div>
    </Card>
  );
}
