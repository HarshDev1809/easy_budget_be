import { z } from "zod";

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    bookId: z.string().uuid("Invalid book ID"),
    baseAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount"),
    carryForward: z.boolean().default(false),
  }),
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;