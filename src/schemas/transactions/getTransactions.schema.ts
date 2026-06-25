import * as z from 'zod';

export const getTransactionsSchema = z.object({
  query: z.object({
    limit: z
      .string()
      .optional()
      .transform((val) => {
        if (!val) return 10;
        const num = parseInt(val, 10);
        return isNaN(num) || num <= 0 ? 10 : Math.min(num, 100);
      }),
    cursor: z.string().optional(),
    sortBy: z.enum(["createdAt", "alphabet", "price", "paidAt", "updatedAt"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
    bookId: z.string().uuid("Book ID must be a valid UUID").optional(),
    categoryId: z
      .string()
      .optional()
      .transform((val) => {
        if (!val) return undefined;
        const num = parseInt(val, 10);
        return isNaN(num) ? undefined : num;
      }),
    transactionType: z.enum(["credit", "debit"]).optional(),
    search: z.string().optional(),
  }),
});

export type GetTransactionsInput = z.infer<typeof getTransactionsSchema>;
