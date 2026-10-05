import { z } from "zod";

/**
 * `POST /node-operators/nodes/:nodeId/dispatch` form validation.
 *
 * Deliberately a mirror of `newDeliverySchema` (the Consumer's
 * equivalent step) — docs/API.md says dispatch "reuses the exact same
 * checkout flow" underneath, so the same body reaching it by a
 * different screen shouldn't be held to a different standard.
 *
 * `receiverEmail` is the field that matters most here. Dispatch has no
 * Consumer account on the sending side, so the receiver's address is
 * the only real email in the request, and it ends up in front of
 * Paystack's `transaction/initialize` — which rejects a malformed one
 * outright. That rejection surfaces as `502 PAYMENT_PROVIDER_ERROR`,
 * an error whose wording ("our payment provider didn't respond")
 * sends the operator looking in entirely the wrong place. Catching it
 * here costs one round trip and names the real problem.
 *
 * `originNodeId` is absent on purpose: the origin is the path param,
 * never part of the body (see `DispatchParcelPayload`).
 */
/**
 * Every free-text field is `.trim()`ed *before* its rule runs, not
 * after. This matters most for the email: `z.string().email()` does no
 * trimming of its own, so a pasted " chinedu@example.com " would fail
 * a rule it actually satisfies. Trimming here also means the parsed
 * values are already wire-ready — the screen submits them as-is.
 */
export const dispatchParcelSchema = z.object({
  destinationNodeId: z.string().min(1, "Choose a destination station"),
  receiverFullName: z.string().trim().min(2, "Enter the receiver's full name"),
  receiverEmail: z.string().trim().email("Enter a valid email address"),
  receiverPhone: z.string().trim().min(7, "Enter a valid phone number"),
  parcelDescription: z.string().trim().min(2, "Describe what you're sending"),
  parcelSize: z.enum(["small", "medium", "large", "xl"], {
    required_error: "Pick a parcel size",
  }),
});

export type DispatchParcelFormValues = z.infer<typeof dispatchParcelSchema>;
