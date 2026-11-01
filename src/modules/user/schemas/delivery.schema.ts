import { z } from "zod";
import { isValidPhone } from "@/lib/phone";

/** A blank optional number input arrives as "" — treat it as "not given". */
const optionalNumberString = z.string().trim().optional();

export const newDeliverySchema = z
  .object({
    receiverFullName: z
      .string()
      .trim()
      .min(1, "Enter the receiver's full name")
      .max(100, "Keep the name under 100 characters"),
    receiverEmail: z.string().trim().email("Enter a valid email address"),
    receiverPhone: z
      .string()
      .trim()
      .refine((v) => isValidPhone(v.replace(/[\s-]/g, "")), "Enter a valid phone number, e.g. 0801 234 5678"),
    parcelDescription: z
      .string()
      .trim()
      .min(1, "Describe what you're sending")
      .max(500, "Keep the description under 500 characters"),
    parcelSize: z.enum(["small", "medium", "large", "xl"]),
    weightKg: optionalNumberString,
    lengthCm: optionalNumberString,
    widthCm: optionalNumberString,
    heightCm: optionalNumberString,
    handling: z.array(z.enum(["fragile", "keep_upright", "perishable", "liquid"])),
  })
  .superRefine((v, ctx) => {
    // Weight and dimensions are optional, but when given they decide the
    // vehicle (and the price), so the API bounds are enforced here too.
    if (v.weightKg) {
      const n = Number(v.weightKg);
      if (!Number.isFinite(n) || n < 0.1 || n > 1000) {
        ctx.addIssue({ code: "custom", path: ["weightKg"], message: "Weight must be between 0.1 and 1000 kg" });
      } else if (Math.round(n * 10) / 10 !== n) {
        ctx.addIssue({ code: "custom", path: ["weightKg"], message: "Use at most 1 decimal place" });
      }
    }

    const dims = [v.lengthCm, v.widthCm, v.heightCm] as const;
    const given = dims.filter(Boolean).length;
    if (given === 0) return;

    const names = ["lengthCm", "widthCm", "heightCm"] as const;
    dims.forEach((raw, i) => {
      if (!raw) {
        ctx.addIssue({ code: "custom", path: [names[i]], message: "Enter all three sizes, or none" });
        return;
      }
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 1 || n > 500) {
        ctx.addIssue({ code: "custom", path: [names[i]], message: "Whole number, 1–500 cm" });
      }
    });
  });

export type NewDeliveryFormValues = z.infer<typeof newDeliverySchema>;
