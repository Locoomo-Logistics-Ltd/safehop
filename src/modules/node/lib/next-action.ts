import type { NextAction } from "@/core/types";

/**
 * Plain-language copy for each `nextAction` (docs/LOGISTICS_API.md §5.1).
 * The counter UI is built off this, not off `status`: the same status can
 * mean different things at the origin and the destination, and with a
 * courier versus a Locoomo rider.
 */
export const NEXT_ACTION_COPY: Record<NextAction, { title: string; hint: string }> = {
  confirm_drop_off: {
    title: "Receive the parcel",
    hint: "The sender is handing this in. Check the hand-written label matches, then confirm.",
  },
  await_courier: {
    title: "Waiting for a courier",
    hint: "A courier is being booked. Keep the parcel on its shelf — nothing to do yet.",
  },
  hand_to_rider: {
    title: "Hand to the Locoomo rider",
    hint: "Ask the rider for the 6-digit code from their app, then type it here.",
  },
  hand_to_courier: {
    title: "Hand to the courier",
    hint: "Read the handover code to the courier. They enter it in their own app.",
  },
  await_arrival: {
    title: "On its way here",
    hint: "Nothing to do until the parcel arrives.",
  },
  receive_from_rider: {
    title: "Receive from the Locoomo rider",
    hint: "Ask the rider for the 6-digit code from their app, then type it here.",
  },
  receive_from_courier: {
    title: "Receive from the courier",
    hint: "Read the handover code to the courier. They enter it in their own app.",
  },
  intake: {
    title: "Check the parcel in",
    hint: "Confirm it's on your counter. The receiver is emailed a collection code.",
  },
  hand_to_receiver: {
    title: "Hand to the receiver",
    hint: "The receiver shows the code from their email. Check their name and ID.",
  },
  return_intake: {
    title: "Check the returned parcel in",
    hint: "The delivery failed and the parcel is back. Check it in — the sender is emailed a collection code.",
  },
  hand_to_sender: {
    title: "Hand back to the sender",
    hint: "The sender shows the code from their email. Check their name and ID.",
  },
  none: {
    title: "Nothing to do here",
    hint: "This parcel is finished, or it isn't this station's turn.",
  },
};

/** States where the screen should re-check the order on its own — someone else (a courier, a rider) moves it next. */
export const WAITING_ACTIONS: readonly NextAction[] = ["await_courier", "await_arrival"];

/** The two actions where staff read a code to an external courier. */
export const COURIER_ACTIONS: readonly NextAction[] = ["hand_to_courier", "receive_from_courier"];

/** `481920` → `481 920`, easier to read aloud. */
export function groupCode(code: string): string {
  return code.replace(/(\d{3})(?=\d)/g, "$1 ");
}
