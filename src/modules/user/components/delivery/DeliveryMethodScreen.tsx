"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ProgressSteps } from "@/components/ui";
import { TopBar } from "@/components/layout";
import { cn } from "@/lib/utils";
import { BoltIcon, PackageIcon } from "@/components/icons";
import { useDeliveryDraftStore } from "@/store/delivery-draft.store";
import { ROUTES } from "@/core/config/constants";
import type { DeliveryMethod } from "@/core/types";

interface MethodOption {
  value: DeliveryMethod;
  title: string;
  description: string;
  recommended?: boolean;
  icon: React.ReactNode;
}

const METHOD_OPTIONS: MethodOption[] = [
  {
    value: "drop_and_pick",
    title: "Drop & Pick",
    description: "Drop at a node near you. Most affordable for flexible schedules.",
    recommended: true,
    icon: <PackageIcon size={20} />,
  },
  {
    value: "express",
    title: "Express Delivery",
    description: "Door-to-door convenience. Fastest delivery with zero effort.",
    icon: <BoltIcon size={20} />,
  },
];

/**
 * Step 3 of the New Delivery flow: choose the delivery method.
 *
 * UI-only as of 2026-08-12 — `POST /payments/intents` has no `method`
 * field per docs/API.md, and pricing is distance-only regardless of
 * this choice (confirmed by `parcelSize`'s own "does not affect the
 * fee" note). The per-option "From ₦X" pricing this screen used to
 * show was invented and has been removed rather than left inaccurate;
 * the real fee appears at Checkout once calculated server-side.
 */
export function DeliveryMethodScreen() {
  const router = useRouter();
  const setMethod = useDeliveryDraftStore((s) => s.setMethod);
  const storedMethod = useDeliveryDraftStore((s) => s.method);

  const [selected, setSelected] = useState<DeliveryMethod>(storedMethod ?? "drop_and_pick");

  const handleNext = () => {
    setMethod(selected);
    router.push(ROUTES.checkout);
  };

  return (
    <div className="min-h-screen bg-bg-canvas">
      <TopBar title="Delivery Method" showBack />

      <div className="px-4 md:px-6 pt-2 md:pt-6 pb-8 max-w-[520px] mx-auto">
        <div className="hidden md:block mb-6">
          <h1 className="font-display text-[22px] font-bold text-text-primary">
            How should we deliver?
          </h1>
        </div>

        <ProgressSteps total={4} current={3} className="mb-6" />

        <h2 className="md:hidden font-display text-[20px] font-bold text-text-primary mb-1">
          How should we deliver?
        </h2>
        <p className="text-[14px] text-text-secondary mb-6">
          Choose the method that fits your schedule &amp; budget.
        </p>

        <div className="flex flex-col gap-3" role="radiogroup" aria-label="Delivery method">
          {METHOD_OPTIONS.map((option) => {
            const isSelected = selected === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelected(option.value)}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-[16px] border-2 text-left transition-all duration-150",
                  isSelected ? "border-brand-blue bg-status-info-bg" : "border-border-default bg-bg-card"
                )}
              >
                <span
                  className={cn(
                    "w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0",
                    isSelected ? "bg-brand-blue text-white" : "bg-bg-subtle text-text-secondary"
                  )}
                >
                  {option.icon}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[15px] text-text-primary">
                      {option.title}
                    </span>
                    {option.recommended && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-status-success bg-status-success-bg px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-text-secondary leading-[1.5] mt-1">
                    {option.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <Button fullWidth size="lg" onClick={handleNext} className="mt-8">
          Next →
        </Button>
      </div>
    </div>
  );
}
