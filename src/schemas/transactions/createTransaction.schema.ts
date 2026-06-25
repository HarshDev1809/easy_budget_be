import * as z from 'zod';

export const createTransactionSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Transaction name is required"),
    amount: z.number().finite().positive("Amount must be a positive number"),
    type: z.enum(["credit", "debit"], {
      errorMap: () => ({ message: "Type must be 'credit' or 'debit'" }),
    }),
    bookId: z.string().uuid("Book ID must be a valid UUID"),
    categoryId: z
      .union([z.number().int(), z.string(), z.null()])
      .optional()
      .transform((val) => {
        if (val === undefined || val === null || val === "") return null;
        if (typeof val === "string") {
          const num = parseInt(val, 10);
          return isNaN(num) ? null : num;
        }
        return val;
      }),
    createdAt: z.string().datetime("Invalid date format").optional(),
  }),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>["body"];
