import { z } from "zod";

export const newDeliverySchema = z.object({
  receiverFullName: z.string().min(2, "Enter the receiver's full name"),
  receiverEmail: z.string().email("Enter a valid email address"),
  receiverPhone: z.string().min(7, "Enter a valid phone number"),
  parcelDescription: z.string().min(2, "Describe what you're sending"),
  parcelSize: z.enum(["small", "medium", "large", "xl"]),
});

export type NewDeliveryFormValues = z.infer<typeof newDeliverySchema>;
