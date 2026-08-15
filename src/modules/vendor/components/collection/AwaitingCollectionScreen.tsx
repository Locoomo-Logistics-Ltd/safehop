"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Button, Card, EmptyState } from "@/components/ui";
import { ErrorAlert } from "@/components/ui/error-alert";
import { TopBar } from "@/components/layout";
import { PackageIcon, ArchiveIcon, MailIcon } from "@/components/icons";
import { getFriendlyError } from "@/core/api/errors";
import { ROUTES } from "@/core/config/constants";
import { needsIntake } from "@/store/node-parcels.store";
import { useAwaitingCollection } from "@/modules/vendor/hooks/use-awaiting-collection";
import { useParcelIntake } from "@/modules/vendor/hooks/use-parcel-intake";
import { HandoffStatusPill } from "@/modules/vendor/components/handoff/HandoffStatusPill";

/**
 * The parcels physically on this Node's shelves, between a rider
 * dropping them and a receiver collecting them.
 *
 * This list is device-local, not fetched — see
 * `store/node-parcels.store.ts` for why, and note the disclosure at the
 * bottom of this screen. That disclosure isn't decoration: an operator
 * who clears site data has no way to recover these parcels from the
 * frontend, so they need to understand the list is state, not a view.
 *
 * Two rows types, because two different things are owed:
 *   - **Needs intake** — the parcel is here but the receiver hasn't been
 *     told. The operator owes them an email, one tap away.
 *   - **Ready for collection** — the receiver has their code and may
 *     walk in at any time.
 */
export function AwaitingCollectionScreen() {
  const { parcels, isHydrated } = useAwaitingCollection();
  const { confirmIntake, isConfirmingIntake, intakeError } = useParcelIntake();

  const pendingIntake = parcels.filter(needsIntake);
  const readyForCollection = parcels.filter((p) => !needsIntake(p));

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-canvas">
        <div className="w-8 h-8 rounded-full border-2 border-border-default border-t-brand-blue animate-spin" />
      </div>
    );
  }

  const failure = intakeError ? getFriendlyError(intakeError) : null;

  return (
    <div className="min-h-screen bg-bg-canvas">
      <TopBar title="At Your Counter" />

      <div className="px-4 md:px-6 pt-2 md:pt-6 pb-8 max-w-[480px] mx-auto">
        {failure && (
          <div className="mb-4">
            <ErrorAlert
              title={failure.title}
              message={failure.message}
              action={failure.action}
            />
          </div>
        )}

        {parcels.length === 0 ? (
          <EmptyState
            icon={<ArchiveIcon size={24} />}
            title="Nothing waiting"
            description="Parcels a rider hands you will show up here until the receiver collects them."
          />
        ) : (
          <>
            {pendingIntake.length > 0 && (
              <section className="mb-7">
                <h2 className="font-semibold text-[14px] text-text-primary mb-1">
                  Needs check-in
                </h2>
                <p className="text-[12px] text-text-muted mb-3">
                  The receiver hasn&apos;t been told these have arrived yet.
                </p>

                <div className="flex flex-col gap-3">
                  {pendingIntake.map((parcel) => (
                    <Card
                      key={parcel.id}
                      padding="md"
                      className="border-l-[3px] border-l-status-warning flex flex-col gap-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[15px] font-bold text-text-primary font-mono truncate">
                            {parcel.trackingCode}
                          </p>
                          <p className="text-[12px] text-text-muted mt-0.5">
                            Arrived{" "}
                            {formatDistanceToNow(new Date(parcel.arrivedAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        <HandoffStatusPill status={parcel.status} />
                      </div>

                      <Button
                        fullWidth
                        size="md"
                        isLoading={isConfirmingIntake}
                        leftIcon={<MailIcon size={16} />}
                        onClick={() => confirmIntake(parcel.id)}
                      >
                        Check In &amp; Email Receiver
                      </Button>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {readyForCollection.length > 0 && (
              <section>
                <h2 className="font-semibold text-[14px] text-text-primary mb-1">
                  Ready for collection
                </h2>
                <p className="text-[12px] text-text-muted mb-3">
                  The receiver has been emailed a code. Tap a parcel when they arrive.
                </p>

                <div className="flex flex-col gap-3">
                  {readyForCollection.map((parcel) => (
                    <Link key={parcel.id} href={ROUTES.vendorCollect(parcel.id)}>
                      <Card
                        padding="md"
                        className="border-l-[3px] border-l-status-success flex items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <span className="w-9 h-9 rounded-[10px] bg-status-success-bg text-status-success flex items-center justify-center shrink-0">
                            <PackageIcon size={16} />
                          </span>
                          <div className="min-w-0">
                            <p className="text-[15px] font-bold text-text-primary font-mono truncate">
                              {parcel.trackingCode}
                            </p>
                            <p className="text-[12px] text-text-muted mt-0.5">
                              {parcel.intakeAt
                                ? `Checked in ${formatDistanceToNow(new Date(parcel.intakeAt), { addSuffix: true })}`
                                : "Ready"}
                            </p>
                          </div>
                        </div>
                        <HandoffStatusPill status={parcel.status} />
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/*
          Disclosed rather than buried: this list lives on this device
          only, and there is no way to rebuild it from the API. An
          operator needs to know that before they clear their browser or
          switch to the shop's other tablet mid-shift.
        */}
        <Card padding="md" className="mt-8 bg-bg-subtle">
          <p className="text-[12px] text-text-secondary leading-relaxed">
            <span className="font-semibold text-text-primary">Kept on this device.</span>{" "}
            This list is stored in this browser, not on the server — parcels confirmed on
            another device or browser won&apos;t appear here. Use the same device for a
            parcel&apos;s whole stay at your counter.
          </p>
        </Card>
      </div>
    </div>
  );
}
