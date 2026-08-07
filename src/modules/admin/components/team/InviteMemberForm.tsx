"use client";

import { useState } from "react";
import { Card, Input, Button } from "@/components/ui";
import { AdminSelect } from "@/modules/admin/components/shared/AdminSelect";
import { useInviteStaff } from "@/modules/admin/hooks/use-invite-staff";
import type { InvitableRole } from "@/core/types";

interface InviteMemberFormProps {
  onClose: () => void;
}

const ROLE_OPTIONS: Array<{ value: InvitableRole; label: string }> = [
  { value: "admin", label: "Admin" },
  { value: "node_operator", label: "Node Operator" },
  { value: "rider", label: "Rider" },
];

/**
 * Inline "Invite Member" form — POST /users/invite, a real, confirmed
 * route per docs/API.md (Admin-only; sends an email invite link, the
 * account has no password until the invitee confirms it). `role` here
 * is the backend's real enum (node_operator/rider/admin) — deliberately
 * not the fictional `AdminTeamRole` (ops_manager/etc.) the rest of this
 * screen still uses, since there's no backend concept of those yet.
 * Same inline-card pattern as `OnboardNodeForm` — no modal primitive
 * exists in `components/ui`.
 */
export function InviteMemberForm({ onClose }: InviteMemberFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<InvitableRole>("node_operator");
  const { inviteStaff, isSubmitting } = useInviteStaff();

  const isValid = firstName.trim() && lastName.trim() && email.trim() && phone.trim();

  return (
    <Card padding="md" className="mb-4 border-l-[3px] border-l-admin-accent">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[13px] font-semibold text-text-primary">Invite Member</p>
        <button type="button" onClick={onClose} className="text-[12px] text-text-muted hover:text-text-primary">
          Cancel
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        <Input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        <Input placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input placeholder="Phone (+234...)" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <AdminSelect value={role} onChange={(e) => setRole(e.target.value as InvitableRole)}>
          {ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </AdminSelect>
      </div>
      <Button
        size="sm"
        disabled={!isValid}
        isLoading={isSubmitting}
        onClick={() => inviteStaff({ firstName, lastName, email, phone, role })}
        className="bg-admin-accent hover:bg-admin-accent-dark text-white"
      >
        Send Invite
      </Button>
    </Card>
  );
}
