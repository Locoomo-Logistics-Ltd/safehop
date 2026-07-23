"use client";

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, ProgressSteps } from "@/components/ui";
import { TopBar } from "@/components/layout";
import { newDeliverySchema, type NewDeliveryFormValues } from "@/modules/user/schemas/delivery.schema";
import { useDeliveryDraftStore } from "@/store/delivery-draft.store";
import { ROUTES } from "@/core/config/constants";
import { ParcelSizeSelector } from "./ParcelSizeSelector";

/**
 * Step 1 of the New Delivery flow: receiver details + parcel details.
 * On submit, stashes the data in useDeliveryDraftStore and advances
 * to node selection — nothing is sent to the server until Checkout.
 */
export function NewDeliveryScreen() {
  const router = useRouter();
  const setReceiverAndParcel = useDeliveryDraftStore((s) => s.setReceiverAndParcel);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<NewDeliveryFormValues>({
    resolver: zodResolver(newDeliverySchema),
    defaultValues: { parcelSize: "medium" },
  });

  const onSubmit = (values: NewDeliveryFormValues) => {
    setReceiverAndParcel(
      {
        fullName: values.receiverFullName,
        email: values.receiverEmail,
        phone: values.receiverPhone,
      },
      {
        description: values.parcelDescription,
        size: values.parcelSize,
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

        <ProgressSteps total={4} current={1} className="mb-6" />

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-7" noValidate>
          {/* Receiver details */}
          <section>
            <h2 className="font-semibold text-[15px] text-text-primary mb-3">
              Receiver details
            </h2>
            <div className="flex flex-col gap-3">
              <Input
                label="Full Name"
                placeholder="Jane Doe"
                error={errors.receiverFullName?.message}
                {...register("receiverFullName")}
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="jane.doe@gmail.com"
                error={errors.receiverEmail?.message}
                {...register("receiverEmail")}
              />
              <Input
                label="Phone Number"
                type="tel"
                placeholder="+234 801 234 5678"
                error={errors.receiverPhone?.message}
                {...register("receiverPhone")}
              />
            </div>
          </section>

          {/* Parcel details */}
          <section>
            <h2 className="font-semibold text-[15px] text-text-primary mb-3">
              Parcel details
            </h2>
            <div className="flex flex-col gap-4">
              <Input
                label="Description"
                placeholder="e.g. Documents, Electronics"
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
            </div>
          </section>

          <Button type="submit" fullWidth size="lg" className="mt-2">
            Next step →
          </Button>
        </form>
      </div>
    </div>
  );
}
