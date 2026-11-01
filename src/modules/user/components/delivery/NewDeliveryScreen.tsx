"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, Input, ProgressSteps } from "@/components/ui";
import { TopBar } from "@/components/layout";
import { UserIcon, MailIcon, PhoneIcon, PackageIcon } from "@/components/icons";
import { newDeliverySchema, type NewDeliveryFormValues } from "@/modules/user/schemas/delivery.schema";
import { useDeliveryDraftStore } from "@/store/delivery-draft.store";
import { ROUTES } from "@/core/config/constants";
import { formatNigerianPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { HANDLING_LABELS, type HandlingFlag } from "@/core/types";
import { useDeliveryOptions } from "@/modules/user/hooks/use-delivery-options";
import { ParcelSizeSelector } from "./ParcelSizeSelector";

const toNumber = (raw: string | undefined) => (raw ? Number(raw) : undefined);

/**
 * Step 1 of 3 in the New Delivery flow: receiver details + parcel
 * details (size, and optionally weight, dimensions and handling —
 * docs/LOGISTICS_API.md §4.1). On submit, stashes the data in
 * useDeliveryDraftStore and advances to node selection; the price is
 * quoted at Checkout and nothing is reserved until the sender pays.
 * Prefills from the draft so "back" from the next steps keeps their input.
 */
export function NewDeliveryScreen() {
  const router = useRouter();
  const setReceiverAndParcel = useDeliveryDraftStore((s) => s.setReceiverAndParcel);
  const draftReceiver = useDeliveryDraftStore((s) => s.receiver);
  const draftParcel = useDeliveryDraftStore((s) => s.parcel);
  const { limits, handlingFlags } = useDeliveryOptions();
  const [showSizeDetails, setShowSizeDetails] = useState(
    () => !!(draftParcel?.weightKg || draftParcel?.lengthCm || draftParcel?.handling?.length)
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<NewDeliveryFormValues>({
    resolver: zodResolver(newDeliverySchema),
    defaultValues: {
      receiverFullName: draftReceiver?.fullName ?? "",
      receiverEmail: draftReceiver?.email ?? "",
      receiverPhone: draftReceiver?.phone ?? "",
      parcelDescription: draftParcel?.description ?? "",
      parcelSize: draftParcel?.size ?? "medium",
      weightKg: draftParcel?.weightKg?.toString() ?? "",
      lengthCm: draftParcel?.lengthCm?.toString() ?? "",
      widthCm: draftParcel?.widthCm?.toString() ?? "",
      heightCm: draftParcel?.heightCm?.toString() ?? "",
      handling: draftParcel?.handling ?? [],
    },
  });

  const onSubmit = (values: NewDeliveryFormValues) => {
    setReceiverAndParcel(
      {
        fullName: values.receiverFullName,
        email: values.receiverEmail,
        // The API wants `+` optional and 7–15 digits — no spaces.
        phone: formatNigerianPhone(values.receiverPhone.replace(/[\s-]/g, "")),
      },
      {
        description: values.parcelDescription,
        size: values.parcelSize,
        weightKg: toNumber(values.weightKg),
        lengthCm: toNumber(values.lengthCm),
        widthCm: toNumber(values.widthCm),
        heightCm: toNumber(values.heightCm),
        handling: values.handling,
      }
    );
    router.push(ROUTES.selectNodes);
  };

  return (
    <div className="min-h-screen bg-bg-canvas">
      <TopBar title="New Delivery" showBack />

      <div className="px-4 md:px-6 pt-2 md:pt-6 pb-8 max-w-[520px] mx-auto">
        <div className="hidden md:block mb-6">
          <h1 className="font-display text-[22px] font-bold text-text-primary">New Delivery</h1>
          <p className="text-[14px] text-text-secondary mt-1">
            Give us the details of your delivery
          </p>
        </div>

        <ProgressSteps total={3} current={1} className="mb-6" />

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
          {/* Receiver details */}
          <Card padding="lg" className="animate-locoomo-fade-up">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-9 h-9 rounded-[10px] bg-status-info-bg text-brand-blue flex items-center justify-center shrink-0">
                <UserIcon size={17} />
              </span>
              <div>
                <h2 className="font-semibold text-[15px] text-text-primary leading-tight">
                  Receiver details
                </h2>
                <p className="text-[12px] text-text-muted">Who&apos;s picking this up?</p>
              </div>
            </div>

            <div className="flex flex-col gap-3.5">
              <Input
                label="Full Name"
                placeholder="Jane Doe"
                leftElement={<UserIcon size={16} />}
                error={errors.receiverFullName?.message}
                {...register("receiverFullName")}
              />
              <div>
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="jane.doe@gmail.com"
                  leftElement={<MailIcon size={16} />}
                  error={errors.receiverEmail?.message}
                  {...register("receiverEmail")}
                />
                <div className="flex items-start gap-2 mt-2 px-1">
                  <MailIcon size={13} className="text-brand-blue shrink-0 mt-0.5" />
                  <p className="text-[11.5px] text-text-secondary leading-snug">
                    Make sure this is the <span className="font-semibold text-red-700">receiver&apos;s own email</span>, 
                    it&apos;s where we&apos;ll send their collection code once the package
                    arrives at the destination station.
                  </p>
                </div>
              </div>
              <Input
                label="Phone Number"
                type="tel"
                placeholder="0801 234 5678"
                leftElement={<PhoneIcon size={16} />}
                error={errors.receiverPhone?.message}
                {...register("receiverPhone")}
              />
            </div>
          </Card>

          {/* Parcel details */}
          <Card padding="lg" className="animate-locoomo-fade-up" style={{ animationDelay: "80ms" }}>
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-9 h-9 rounded-[10px] bg-status-info-bg text-brand-blue flex items-center justify-center shrink-0">
                <PackageIcon size={17} />
              </span>
              <div>
                <h2 className="font-semibold text-[15px] text-text-primary leading-tight">
                  Parcel details
                </h2>
                <p className="text-[12px] text-text-muted">What are you sending?</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <Input
                label="Description"
                placeholder="e.g. Documents, Electronics"
                leftElement={<PackageIcon size={16} />}
                error={errors.parcelDescription?.message}
                {...register("parcelDescription")}
              />

              <div>
                <p className="text-[13px] font-medium text-text-secondary mb-2">Select Size</p>
                <Controller
                  control={control}
                  name="parcelSize"
                  render={({ field }) => (
                    <ParcelSizeSelector value={field.value} onChange={field.onChange} />
                  )}
                />
              </div>

              <div className="border-t border-border-default pt-4">
                <button
                  type="button"
                  onClick={() => setShowSizeDetails((v) => !v)}
                  aria-expanded={showSizeDetails}
                  className="w-full flex items-center justify-between text-left"
                >
                  <span>
                    <span className="block text-[13px] font-medium text-text-primary">
                      Weight, size &amp; handling
                    </span>
                    <span className="block text-[12px] text-text-muted">
                      Optional — helps us pick the right vehicle and price
                    </span>
                  </span>
                  <span className="text-[12px] font-semibold text-brand-blue">
                    {showSizeDetails ? "Hide" : "Add"}
                  </span>
                </button>

                {showSizeDetails && (
                  <div className="flex flex-col gap-4 mt-4">
                    <Input
                      label="Weight (kg)"
                      type="number"
                      inputMode="decimal"
                      step={1 / 10 ** limits.weightKg.decimals}
                      min={limits.weightKg.min}
                      max={limits.weightKg.max}
                      placeholder="e.g. 2.5"
                      error={errors.weightKg?.message}
                      {...register("weightKg")}
                    />

                    <div>
                      <p className="text-[13px] font-medium text-text-secondary mb-2">
                        Dimensions (cm) — all three, or none
                      </p>
                      <div className="grid grid-cols-3 gap-2.5">
                        <Input
                          aria-label="Length in centimetres"
                          type="number"
                          inputMode="numeric"
                          min={limits.dimensionCm.min}
                          max={limits.dimensionCm.max}
                          placeholder="Length"
                          error={errors.lengthCm?.message}
                          {...register("lengthCm")}
                        />
                        <Input
                          aria-label="Width in centimetres"
                          type="number"
                          inputMode="numeric"
                          min={limits.dimensionCm.min}
                          max={limits.dimensionCm.max}
                          placeholder="Width"
                          error={errors.widthCm?.message}
                          {...register("widthCm")}
                        />
                        <Input
                          aria-label="Height in centimetres"
                          type="number"
                          inputMode="numeric"
                          min={limits.dimensionCm.min}
                          max={limits.dimensionCm.max}
                          placeholder="Height"
                          error={errors.heightCm?.message}
                          {...register("heightCm")}
                        />
                      </div>
                    </div>

                    <div>
                      <p className="text-[13px] font-medium text-text-secondary mb-2">Handling</p>
                      <Controller
                        control={control}
                        name="handling"
                        render={({ field }) => (
                          <div className="flex flex-wrap gap-2" role="group" aria-label="Handling">
                            {handlingFlags.map((flag: HandlingFlag) => {
                              const on = field.value.includes(flag);
                              return (
                                <button
                                  key={flag}
                                  type="button"
                                  aria-pressed={on}
                                  onClick={() =>
                                    field.onChange(
                                      on ? field.value.filter((f) => f !== flag) : [...field.value, flag]
                                    )
                                  }
                                  className={cn(
                                    "px-3 py-1.5 rounded-full border text-[12.5px] font-medium transition-colors",
                                    on
                                      ? "border-brand-blue bg-status-info-bg text-brand-blue"
                                      : "border-border-default bg-bg-card text-text-secondary"
                                  )}
                                >
                                  {HANDLING_LABELS[flag]}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Button type="submit" fullWidth size="lg" className="mt-1">
            Next step →
          </Button>
        </form>
      </div>
    </div>
  );
}
