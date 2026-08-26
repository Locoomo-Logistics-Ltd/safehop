"use client";

import { useMemo, useState } from "react";
import { Button, Card, Input } from "@/components/ui";
import { ErrorAlert } from "@/components/ui/error-alert";
import { ChevronDownIcon, CheckCircleIcon, WalletIcon } from "@/components/icons";
import { getFriendlyError } from "@/core/api/errors";
import { cn } from "@/lib/utils";
import type { BankOption, PayoutAccountPayload } from "@/core/types";

interface PayoutAccountCardProps {
  configured: boolean;
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
  banks: BankOption[];
  isLoadingBanks: boolean;
  onSubmit: (payload: PayoutAccountPayload) => void;
  isSubmitting: boolean;
  error: unknown;
  /**
   * True right after `onSubmit` last succeeded (reset by the next
   * `onSubmit` call) — there's no separate preview/verify route per
   * docs/API.md, Paystack only resolves the account holder name as a
   * side effect of the same save that persists it, so this is what
   * flips the form over to the confirmed summary below and is what the
   * "Saved" banner is keyed on.
   */
  saved?: boolean;
}

/**
 * Shared by Rider Verification and Node Setup — sets the bank account
 * Admin disburses this rider's/Node's earned revenue-split entries to
 * (`PATCH /riders/me/payout-account` / `PATCH /node-operators/me/payout-account`,
 * both real, confirmed routes per docs/API.md). The account holder
 * name is always resolved server-side via Paystack, never typed here.
 *
 * Both real endpoints only require onboarding to be complete, not
 * Admin approval — so this renders in both the "pending review" and
 * "active" states of whichever screen embeds it, not gated on
 * approval status.
 */
export function PayoutAccountCard({
  configured,
  bankName,
  accountNumber,
  accountName,
  banks,
  isLoadingBanks,
  onSubmit,
  isSubmitting,
  error,
  saved,
}: PayoutAccountCardProps) {
  const [showForm, setShowForm] = useState(!configured);

  // The account holder name only exists once a save has actually
  // succeeded — flip back to the summary (which is what surfaces it)
  // the moment that happens, whether this was the first save or a
  // "Change" edit of an existing one. Adjusted during render (React's
  // documented pattern for "reset state when a prop changes") rather
  // than in an effect, which would fire a redundant extra render.
  const [prevSaved, setPrevSaved] = useState(saved);
  if (saved !== prevSaved) {
    setPrevSaved(saved);
    if (saved) setShowForm(false);
  }

  if (configured && !showForm) {
    return (
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-2">
          Payout Account
        </p>
        {saved && (
          <p className="text-[12px] text-status-success font-medium mb-2 flex items-center gap-1.5">
            <CheckCircleIcon size={13} />
            Saved, this is the account on file.
          </p>
        )}
        <Card padding="none" className="overflow-hidden border-l-[3px] border-l-status-success">
          <div className="flex items-center gap-3 p-4">
            <span className="w-9 h-9 rounded-[10px] bg-status-success-bg text-status-success flex items-center justify-center shrink-0">
              <CheckCircleIcon size={16} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-text-primary truncate">{bankName}</p>
              <p className="text-[12px] text-text-muted truncate">{accountNumber}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(true)}>
              Change
            </Button>
          </div>
          <div className="h-px bg-border-default" />
          <div className="px-4 py-3">
            <p className="text-[10px] text-text-muted">Account Name (verified by Paystack)</p>
            <p className="text-[13px] font-semibold text-text-primary mt-0.5">{accountName}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <PayoutAccountForm
      banks={banks}
      isLoadingBanks={isLoadingBanks}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      error={error}
      onCancel={configured ? () => setShowForm(false) : undefined}
    />
  );
}

function PayoutAccountForm({
  banks,
  isLoadingBanks,
  onSubmit,
  isSubmitting,
  error,
  onCancel,
}: {
  banks: BankOption[];
  isLoadingBanks: boolean;
  onSubmit: (payload: PayoutAccountPayload) => void;
  isSubmitting: boolean;
  error: unknown;
  onCancel?: () => void;
}) {
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  // The real GET /payments/banks response has been observed returning
  // duplicate `code` values (same bank listed twice) — dedupe before
  // rendering, since React option keys and this picker's value must
  // both be unique per code, and offering the same bank twice would
  // just be confusing anyway.
  const uniqueBanks = useMemo(() => {
    const seen = new Set<string>();
    return banks.filter((bank) => {
      if (seen.has(bank.code)) return false;
      seen.add(bank.code);
      return true;
    });
  }, [banks]);

  const selectedBank = uniqueBanks.find((b) => b.code === bankCode);
  const isValid = !!selectedBank && /^\d{10}$/.test(accountNumber);

  const handleSubmit = () => {
    if (!selectedBank) return;
    onSubmit({ bankCode: selectedBank.code, bankName: selectedBank.name, accountNumber });
  };

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-2">
        Payout Account
      </p>
      <Card padding="md" className="flex flex-col gap-3">
        <p className="text-[12px] text-text-secondary -mt-1">
          Admin pays your earnings into this account. Enter your bank and account number — we
          don&apos;t ask for the account name; it&apos;s verified and shown to you right after you
          save.
        </p>

        <div className="relative flex items-center">
          <select
            value={bankCode}
            onChange={(e) => setBankCode(e.target.value)}
            disabled={isLoadingBanks}
            className={cn(
              "w-full h-12 rounded-[12px] border border-border-default bg-bg-card text-text-primary text-[15px]",
              "pl-4 pr-10 appearance-none outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15",
              "transition-colors duration-150 disabled:opacity-60"
            )}
          >
            <option value="">{isLoadingBanks ? "Loading banks…" : "Select your bank"}</option>
            {uniqueBanks.map((bank) => (
              <option key={bank.code} value={bank.code}>
                {bank.name}
              </option>
            ))}
          </select>
          <ChevronDownIcon
            size={16}
            className="absolute right-4 text-text-muted pointer-events-none"
          />
        </div>

        <Input
          placeholder="10-digit account number"
          inputMode="numeric"
          maxLength={10}
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
        />

        {error != null &&
          (() => {
            const friendly = getFriendlyError(error);
            return <ErrorAlert title={friendly.title} message={friendly.message} action={friendly.action} />;
          })()}

        <div className="flex items-center gap-2 mt-1">
          <Button
            fullWidth
            leftIcon={<WalletIcon size={16} />}
            disabled={!isValid}
            isLoading={isSubmitting}
            onClick={handleSubmit}
          >
            Save Payout Account
          </Button>
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
