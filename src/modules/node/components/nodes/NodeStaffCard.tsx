"use client";

import { useState } from "react";
import { Button, Card, Input } from "@/components/ui";
import { ErrorAlert } from "@/components/ui/error-alert";
import { CheckCircleIcon, MailIcon, PhoneIcon, UsersIcon, XIcon } from "@/components/icons";
import { getFriendlyError } from "@/core/api/errors";
import { formatDate } from "@/lib/format";
import { useNodeStaff } from "@/modules/node/hooks/use-node-staff";
import type { NodeOperatorNodeStatus, NodeStaffMember } from "@/core/types";

interface NodeStaffCardProps {
  nodeId: string;
  nodeName: string;
  nodeStatus: NodeOperatorNodeStatus;
}

/**
 * This station's team — the roster
 * (`GET /node-operators/nodes/:nodeId/staff`), the invite form
 * (`POST .../staff/invite`), and per-member removal
 * (`DELETE .../staff/:userId`). All owner-only, all real and confirmed
 * per docs/API.md (roster and removal new 2026-09-03).
 *
 * Superseded `NodeStaffInviteCard`, which was invite-only because the
 * roster endpoint didn't exist yet — an owner could add staff and then
 * never see or remove them. The roster is also the only place a staff
 * member's `userId` exists after the one-time invite response, so
 * removal is necessarily driven off these rows rather than an id held
 * anywhere else.
 *
 * Gated on the Node being `active`: the invite route answers
 * `403 NODE_NOT_ACTIVE`, and there's no counter for staff to work at
 * before approval anyway. Removal is confirmed inline (a second tap on
 * the same row) rather than through a dialog — `components/ui` has no
 * modal primitive, and revoking someone's access shouldn't be a
 * single-tap accident.
 */
export function NodeStaffCard({ nodeId, nodeName, nodeStatus }: NodeStaffCardProps) {
  const {
    staff,
    isLoadingStaff,
    staffError,
    inviteStaff,
    isInviting,
    inviteError,
    isInvited,
    resetInvite,
    removeStaff,
    isRemoving,
    removingUserId,
  } = useNodeStaff(nodeId);

  const isNodeActive = nodeStatus === "active";

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-2">
        Station Team
      </p>

      <Card padding="md" className="flex flex-col gap-4">
        <div className="flex items-start gap-2.5">
          <span className="w-9 h-9 rounded-[10px] bg-status-info-bg text-brand-blue flex items-center justify-center shrink-0">
            <UsersIcon size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-text-primary">
              Who can work this counter
            </p>
            <p className="text-[12px] text-text-secondary leading-[1.5]">
              Team members can scan, receive, hand off, and release parcels at {nodeName}.
              They can&apos;t change your payout account, manage the team, or see your
              earnings.
            </p>
          </div>
        </div>

        {!isNodeActive ? (
          <p className="text-[12px] text-status-warning font-medium">
            You can add your team once this station is approved.
          </p>
        ) : (
          <>
            <StaffRoster
              staff={staff}
              isLoading={isLoadingStaff}
              error={staffError}
              onRemove={removeStaff}
              isRemoving={isRemoving}
              removingUserId={removingUserId}
            />

            <div className="h-px bg-border-default" />

            {isInvited ? (
              <div className="flex flex-col gap-3">
                <p className="text-[12px] text-status-success font-medium flex items-center gap-1.5">
                  <CheckCircleIcon size={13} />
                  Invite sent. They&apos;ll appear above once they accept it and set a
                  password.
                </p>
                <Button size="sm" variant="ghost" onClick={resetInvite}>
                  Invite someone else
                </Button>
              </div>
            ) : (
              <InviteForm onSubmit={inviteStaff} isSubmitting={isInviting} error={inviteError} />
            )}
          </>
        )}
      </Card>
    </div>
  );
}

function StaffRoster({
  staff,
  isLoading,
  error,
  onRemove,
  isRemoving,
  removingUserId,
}: {
  staff: NodeStaffMember[];
  isLoading: boolean;
  error: unknown;
  onRemove: (userId: string) => void;
  isRemoving: boolean;
  removingUserId: string | undefined;
}) {
  // Which row is asking "are you sure?" — inline rather than a dialog,
  // and reset whenever a different row is tapped, so only one row can
  // ever be in the confirming state.
  const [confirmingUserId, setConfirmingUserId] = useState<string | null>(null);

  if (isLoading) {
    return <p className="text-[12px] text-text-muted">Loading your team…</p>;
  }

  if (error) {
    const friendly = getFriendlyError(error);
    return <ErrorAlert title={friendly.title} message={friendly.message} action={friendly.action} />;
  }

  if (staff.length === 0) {
    return (
      <p className="text-[12px] text-text-muted">
        No one else works this station yet. Invite someone below.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {staff.map((member) => {
        const isThisRowRemoving = isRemoving && removingUserId === member.userId;
        const isConfirming = confirmingUserId === member.userId;

        return (
          <div
            key={member.userId}
            className="flex items-center gap-2.5 py-2 border-b border-border-default last:border-b-0"
          >
            <span className="w-8 h-8 rounded-full bg-bg-subtle text-text-secondary flex items-center justify-center shrink-0 text-[11px] font-semibold">
              {member.firstName[0]}
              {member.lastName[0]}
            </span>

            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-text-primary truncate">
                {member.firstName} {member.lastName}
              </p>
              <p className="text-[11px] text-text-muted truncate">
                {member.email} · joined {formatDate(member.joinedAt)}
              </p>
            </div>

            {isConfirming ? (
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="danger"
                  isLoading={isThisRowRemoving}
                  onClick={() => {
                    onRemove(member.userId);
                    setConfirmingUserId(null);
                  }}
                >
                  Remove
                </Button>
                <button
                  type="button"
                  aria-label="Cancel"
                  onClick={() => setConfirmingUserId(null)}
                  className="w-8 h-8 rounded-full text-text-muted hover:text-text-primary flex items-center justify-center"
                >
                  <XIcon size={15} />
                </button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                disabled={isRemoving}
                isLoading={isThisRowRemoving}
                onClick={() => setConfirmingUserId(member.userId)}
                className="shrink-0"
              >
                Remove
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function InviteForm({
  onSubmit,
  isSubmitting,
  error,
}: {
  onSubmit: (payload: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  }) => void;
  isSubmitting: boolean;
  error: unknown;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const isValid = firstName.trim() && lastName.trim() && email.trim() && phone.trim();

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12px] font-semibold text-text-primary">Invite a team member</p>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="First name"
          placeholder="Chidi"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <Input
          label="Last name"
          placeholder="Okafor"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
      </div>
      <Input
        label="Email"
        type="email"
        placeholder="chidi@example.com"
        leftElement={<MailIcon size={16} />}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        label="Phone"
        placeholder="+2348012345678"
        inputMode="tel"
        leftElement={<PhoneIcon size={16} />}
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      {error != null &&
        (() => {
          const friendly = getFriendlyError(error);
          return (
            <ErrorAlert title={friendly.title} message={friendly.message} action={friendly.action} />
          );
        })()}

      <Button
        fullWidth
        leftIcon={<MailIcon size={16} />}
        disabled={!isValid}
        isLoading={isSubmitting}
        onClick={() =>
          onSubmit({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            phone: phone.trim(),
          })
        }
      >
        Send Invite
      </Button>
    </div>
  );
}
