import * as z from 'zod';

export const updateTransactionSchema = z.object({
  params: z.object({
    id: z.string().uuid("Transaction ID must be a valid UUID"),
  }),
  body: z.object({
    name: z.string().min(1, "Transaction name cannot be empty").optional(),
    amount: z.number().finite().positive("Amount must be a positive number").optional(),
    type: z.enum(["credit", "debit"]).optional(),
    bookId: z.string().uuid("Book ID must be a valid UUID").optional(),
    categoryId: z
      .union([z.number().int(), z.string(), z.null()])
      .optional()
      .transform((val) => {
        if (val === undefined || val === "") return undefined;
        if (val === null) return null;
        if (typeof val === "string") {
          const num = parseInt(val, 10);
          return isNaN(num) ? null : num;
        }
        return val;
      }),
    createdAt: z.string().datetime("Invalid date format").optional(),
  }),
});

export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
