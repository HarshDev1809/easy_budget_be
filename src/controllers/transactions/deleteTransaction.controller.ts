import { eq, sql } from "drizzle-orm";
import db from "../../db/index.js";
import { transactions, book, categories } from "../../db/schema.js";
import redis from "../../redis/index.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { Response, Request } from "express";

export const deleteTransaction = catchAsync(async (req: Request, res: Response) => {
  const transactionId = req.transaction.id;
  const { token } = req.validated.body;

  // 1. Fetch and verify the cached token from Redis
  const storedToken = await redis.get(`delete-transaction:${transactionId}`);

  if (!storedToken) {
    return res.status(400).json({
      success: false,
      message: "Token expired or not found. Please request a new deletion token.",
    });
  }

  if (storedToken !== token) {
    return res.status(400).json({
      success: false,
      message: "Invalid verification token.",
    });
  }

  const { bookId, categoryId, amount, type } = req.transaction;
  const numericAmount = Number(amount);

  // 2. Perform DB operations in a transaction
  await db.transaction(async (tx) => {
    // Reverse the transaction balance delta (reversing is the opposite of apply)
    // Credit: subtract from balances. Debit: add back to balances.
    if (type === "credit") {
      await tx
        .update(book)
        .set({ balance: sql`COALESCE(balance, 0) - ${numericAmount.toFixed(2)}` })
        .where(eq(book.id, bookId));

      if (categoryId) {
        await tx
          .update(categories)
          .set({ balance: sql`COALESCE(balance, 0) - ${numericAmount.toFixed(2)}` })
          .where(eq(categories.id, categoryId));
      }
    } else {
      await tx
        .update(book)
        .set({ balance: sql`COALESCE(balance, 0) + ${numericAmount.toFixed(2)}` })
        .where(eq(book.id, bookId));

      if (categoryId) {
        await tx
          .update(categories)
          .set({ balance: sql`COALESCE(balance, 0) + ${numericAmount.toFixed(2)}` })
          .where(eq(categories.id, categoryId));
      }
    }

    // Delete the transaction record
    await tx.delete(transactions).where(eq(transactions.id, transactionId));
  });

  // 3. Clean up the Redis token
  await redis.del(`delete-transaction:${transactionId}`);

  return res.status(200).json({
    success: true,
    message: "Transaction deleted and balances recalculated successfully.",
  });
});
