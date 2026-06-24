import { z } from "zod";

export const transactionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.number().positive("Amount must be positive"),
  type: z.enum(["credit", "debit"]),
  bookId: z.string().uuid("Invalid book ID"),
  categoryId: z.number().optional().nullable(),
});

export const verifyDeleteTransactionSchema = z.object({
  token: z.string().length(6, "Token must be exactly 6 characters"),
});
