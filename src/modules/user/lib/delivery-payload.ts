import { toOrderParcelSize } from "@/core/types";
import type {
  CreatePaymentIntentPayload,
  DeliveryQuoteRequest,
  ParcelDetails,
  ReceiverDetails,
} from "@/core/types";

interface DraftForQuote {
  originNodeId: string;
  destinationNodeId: string;
  parcel: ParcelDetails;
}

/** Only the parcel fields the sender actually filled in — the API treats absent and `undefined` alike, but an explicit key makes the quote cache key noisy. */
function parcelFields(parcel: ParcelDetails) {
  const hasDimensions = !!(parcel.lengthCm && parcel.widthCm && parcel.heightCm);
  return {
    parcelSize: toOrderParcelSize(parcel.size),
    ...(parcel.weightKg ? { weightKg: parcel.weightKg } : {}),
    ...(hasDimensions
      ? { lengthCm: parcel.lengthCm, widthCm: parcel.widthCm, heightCm: parcel.heightCm }
      : {}),
    ...(parcel.handling?.length ? { handling: parcel.handling } : {}),
  };
}

/** `POST /delivery-quotes` body — the checkout body without the receiver. */
export function buildQuoteRequest(draft: DraftForQuote): DeliveryQuoteRequest {
  return {
    originNodeId: draft.originNodeId,
    destinationNodeId: draft.destinationNodeId,
    ...parcelFields(draft.parcel),
  };
}

/** `POST /payments/intents` body — must match the quote's inputs so the charge equals the quoted price. */
export function buildPaymentIntentPayload(
  draft: DraftForQuote & { receiver: ReceiverDetails }
): CreatePaymentIntentPayload {
  return {
    ...buildQuoteRequest(draft),
    receiverFullName: draft.receiver.fullName,
    receiverEmail: draft.receiver.email,
    receiverPhone: draft.receiver.phone,
    parcelDescription: draft.parcel.description,
  } as CreatePaymentIntentPayload;
}
