import { Request, Response, NextFunction } from "express";
import db from "../../db/index.js";
import { transactions, book, categories } from "../../db/schema.js";
import { eq, and, sql, inArray } from "drizzle-orm";

export const updateTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const validatedData = req.body;
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const newBookRecord = await db.query.book.findFirst({
      where: and(eq(book.id, validatedData.bookId), eq(book.userId, userId)),
    });

    if (!newBookRecord) {
      res.status(404).json({ success: false, message: "Target book not found or unauthorized" });
      return;
    }

    if (validatedData.categoryId) {
        const categoryRecord = await db.query.categories.findFirst({
          where: and(
            eq(categories.id, validatedData.categoryId),
            eq(categories.bookId, validatedData.bookId)
          ),
        });
        if (!categoryRecord) {
          res.status(404).json({ success: false, message: "Category not found in the given book" });
          return;
        }
    }

    // pre-fetch user books for inner query matching
    const userBooks = await db.query.book.findMany({
        where: eq(book.userId, userId),
        columns: { id: true }
    });
    const userBookIds = userBooks.map(b => b.id);

    await db.transaction(async (tx) => {
      // Fetch existing BEFORE updating, use for update lock to prevent concurrent updates
      const [txExistingTx] = await tx.select()
        .from(transactions)
        .where(
            and(
                eq(transactions.id, String(id)),
                inArray(transactions.bookId, userBookIds)
            )
        )
        .for('update'); // Locks the row

      if(!txExistingTx) return;

      const oldAmountDelta = txExistingTx.type === "credit" ? parseFloat(txExistingTx.amount) : -parseFloat(txExistingTx.amount);

      // Atomic reverse
      await tx.update(book)
        .set({ baseAmount: sql`${book.baseAmount} - ${oldAmountDelta}` })
        .where(eq(book.id, txExistingTx.bookId));

      if (txExistingTx.categoryId) {
        await tx.update(categories)
          .set({ baseAmount: sql`${categories.baseAmount} - ${oldAmountDelta}` })
          .where(eq(categories.id, txExistingTx.categoryId));
      }

      // Apply new transaction
      await tx.update(transactions)
        .set({
          name: validatedData.name,
          amount: validatedData.amount.toString(),
          type: validatedData.type,
          bookId: validatedData.bookId,
          categoryId: validatedData.categoryId ?? null,
          updatedAt: new Date()
        })
        .where(eq(transactions.id, String(id)));

      const newAmountDelta = validatedData.type === "credit" ? validatedData.amount : -validatedData.amount;

      // Atomic apply
      await tx.update(book)
        .set({ baseAmount: sql`${book.baseAmount} + ${newAmountDelta}` })
        .where(eq(book.id, validatedData.bookId));

      if (validatedData.categoryId) {
        await tx.update(categories)
          .set({ baseAmount: sql`${categories.baseAmount} + ${newAmountDelta}` })
          .where(eq(categories.id, validatedData.categoryId));
      }
    });

    res.status(200).json({ success: true, message: "Transaction updated successfully" });
  } catch (error) {
    next(error);
  }
};
