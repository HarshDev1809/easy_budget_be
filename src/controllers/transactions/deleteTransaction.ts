import { Request, Response, NextFunction } from "express";
import { verifyDeleteTransactionSchema } from "../../schemas/transactions.schemas.js";
import db from "../../db/index.js";
import { transactions, book, categories } from "../../db/schema.js";
import { eq, and, sql } from "drizzle-orm";
import redis from "../../redis/index.js";
import crypto from "crypto";

export const requestDeleteTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const existingTx = await db.query.transactions.findFirst({
      where: eq(transactions.id, String(id)),
      with: { book: true },
    });

    if (!existingTx || existingTx.book.userId !== userId) {
      res.status(404).json({ error: "Transaction not found or unauthorized" });
      return;
    }

    const token = Array.from(crypto.getRandomValues(new Uint8Array(6)))
      .map((b) => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[b % 36])
      .join("");

    const redisKey = `delete_tx_token:${id}`;
    await redis.set(redisKey, token, "EX", 300);

    res.status(200).json({ token });
  } catch (error) {
    next(error);
  }
};

export const confirmDeleteTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const parsed = verifyDeleteTransactionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid token format" });
      return;
    }
    const { token } = parsed.data;

    const redisKey = `delete_tx_token:${id}`;
    const storedToken = await redis.getdel(redisKey);

    if (!storedToken || storedToken !== token) {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    const existingTx = await db.query.transactions.findFirst({
      where: eq(transactions.id, String(id)),
      with: { book: true },
    });

    if (!existingTx || existingTx.book.userId !== userId) {
      res.status(404).json({ error: "Transaction not found or unauthorized" });
      return;
    }

    await db.transaction(async (tx) => {
      // Atomic delete
      const [txExistingTx] = await tx.delete(transactions)
        .where(
            and(
                eq(transactions.id, String(id)),
            )
        ).returning();

      if(!txExistingTx) return;

      const amountDelta = txExistingTx.type === "credit" ? parseFloat(txExistingTx.amount) : -parseFloat(txExistingTx.amount);

      // Atomic delete adjust
      await tx.update(book)
        .set({ baseAmount: sql`${book.baseAmount} - ${amountDelta}` })
        .where(eq(book.id, txExistingTx.bookId));

      if (txExistingTx.categoryId) {
        await tx.update(categories)
          .set({ baseAmount: sql`${categories.baseAmount} - ${amountDelta}` })
          .where(eq(categories.id, txExistingTx.categoryId));
      }
    });

    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    next(error);
  }
};
