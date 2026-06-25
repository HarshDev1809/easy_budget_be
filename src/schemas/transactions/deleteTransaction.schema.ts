import * as z from 'zod';

export const deleteTransactionRequestSchema = z.object({
  params: z.object({
    id: z.string().uuid("Transaction ID must be a valid UUID"),
  }),
});

export const deleteTransactionSchema = z.object({
  params: z.object({
    id: z.string().uuid("Transaction ID must be a valid UUID"),
  }),
  body: z.object({
    token: z
      .string()
      .length(6, "Verification token must be exactly 6 characters")
      .regex(/^[a-zA-Z0-9]+$/, "Verification token must be alphanumeric"),
  }),
});

export type DeleteTransactionRequestInput = z.infer<typeof deleteTransactionRequestSchema>;
export type DeleteTransactionInput = z.infer<typeof deleteTransactionSchema>;
