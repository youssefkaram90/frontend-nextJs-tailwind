import { z } from "zod";

export const lotSchema = z.object({
  stockType: z.enum(["BIO", "CVT"], {
    message: "Stock type is required",
  }),
  lotNumber: z.string().min(1, "Lot number is required"),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  productType: z.enum(["SEEDS", "PEAT"], {
    message: "Product type is required",
  }),
  productName: z.string().min(1, "Product name is required"),
  supplierName: z.string().min(1, "Supplier name is required"),
  thousandSeedsPerGram: z.coerce
    .number()
    .positive()
    .optional()
    .or(z.literal("")),
  remark: z.string().optional(),
});

export const createDeliverySchema = z.object({
  deliveryDate: z.string().min(1, "Delivery date is required"),
  deliveryCode: z.string().min(1, "Delivery Code is required"),
  remark: z.string().optional(),
  lots: z
    .array(lotSchema)
    .min(1, "At least one lot is required")
    .superRefine((lots, ctx) => {
      const seen = new Map<string, number>();
      lots.forEach((lot, i) => {
        const num = lot.lotNumber.trim();
        if (!num) return;
        const lower = num.toLowerCase();
        if (seen.has(lower)) {
          const msg = `Duplicate lot number "${num}"`;
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: msg,
            path: [i, "lotNumber"],
          });
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: msg,
            path: [seen.get(lower)!, "lotNumber"],
          });
        } else {
          seen.set(lower, i);
        }
      });
    }),
});

export const editDeliverySchema = z.object({
  deliveryCode: z.string().min(1, "Delivery code is required"),
  deliveryDate: z.string().min(1, "Delivery date is required"),
  lots: z
    .array(lotSchema)
    .min(1, "At least one lot is required")
    .superRefine((lots, ctx) => {
      const seen = new Map<string, number>();
      lots.forEach((lot, i) => {
        const num = lot.lotNumber.trim();
        if (!num) return;
        const lower = num.toLowerCase();
        if (seen.has(lower)) {
          const msg = `Duplicate lot number "${num}"`;
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: msg,
            path: [i, "lotNumber"],
          });
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: msg,
            path: [seen.get(lower)!, "lotNumber"],
          });
        } else {
          seen.set(lower, i);
        }
      });
    }),
});

export type CreateDeliveryFormData = z.input<typeof createDeliverySchema>;
export type EditDeliveryFormData = z.input<typeof editDeliverySchema>;
