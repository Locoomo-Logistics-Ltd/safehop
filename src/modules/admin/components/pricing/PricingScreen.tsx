"use client";

import { useState } from "react";
import { RootTopBar } from "@/components/layout";
import { ROUTES } from "@/core/config/constants";
import { Card, Button, EmptyState } from "@/components/ui";
import { CreditCardIcon, PlusIcon } from "@/components/icons";
import { formatCurrency } from "@/lib/format";
import { usePricingRules } from "@/modules/admin/hooks/use-admin-pricing";
import { AddPricingRuleForm } from "./AddPricingRuleForm";

/**
 * "Pricing" — new 2026-08-12, no home in the original 8-frame
 * `admin_UI.png` design. Modeled on Node Network's "Add Node" +
 * list pattern: an inline append-only form above a history table.
 */
export function PricingScreen() {
  const [showForm, setShowForm] = useState(false);
  const { rules, isLoading } = usePricingRules();

  return (
    <div className="min-h-screen">
      <RootTopBar profileHref={ROUTES.adminProfile} hideOnDesktop />

      <div className="px-4 md:px-6 pt-2 md:pt-8 pb-10">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <h1 className="font-display text-[22px] font-bold text-text-primary">Pricing</h1>
            <p className="text-[13px] text-text-muted mt-0.5">
              Rate history for delivery fee calculation. Rules are append-only — adding one doesn&apos;t change past orders.
            </p>
          </div>
          <Button
            size="sm"
            leftIcon={<PlusIcon size={14} />}
            className="bg-admin-accent hover:bg-admin-accent-dark text-white"
            onClick={() => setShowForm((v) => !v)}
          >
            Add Rule
          </Button>
        </div>

        {showForm && <AddPricingRuleForm onClose={() => setShowForm(false)} />}

        {isLoading ? (
          <p className="text-[13px] text-text-muted text-center py-10">Loading pricing history…</p>
        ) : rules.length === 0 ? (
          <Card padding="none">
            <EmptyState
              icon={<CreditCardIcon size={22} />}
              title="No pricing rule configured"
              description="Consumer checkout can't calculate a delivery fee until a pricing rule exists — add one to get started."
            />
          </Card>
        ) : (
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-text-muted bg-bg-subtle">
                    <th className="font-medium px-5 py-2.5">Base Fee</th>
                    <th className="font-medium px-5 py-2.5">Per-Km Rate</th>
                    <th className="font-medium px-5 py-2.5">Effective From</th>
                    <th className="px-5 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule, index) => (
                    <tr key={rule.id} className="border-t border-border-default hover:bg-bg-subtle transition-colors">
                      <td className="px-5 py-3 text-[13px] font-semibold text-text-primary whitespace-nowrap">
                        {formatCurrency(rule.baseFeeNaira)}
                      </td>
                      <td className="px-5 py-3 text-[13px] text-text-secondary whitespace-nowrap">
                        {formatCurrency(rule.perKmRateNaira)} / km
                      </td>
                      <td className="px-5 py-3 text-[12px] text-text-muted whitespace-nowrap">
                        {new Date(rule.effectiveFrom).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        {index === 0 && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-status-success-bg text-status-success">
                            Current
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
