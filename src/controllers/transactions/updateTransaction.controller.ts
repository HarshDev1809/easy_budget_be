import { eq, sql } from "drizzle-orm";
import db from "../../db/index.js";
import { transactions, book, categories } from "../../db/schema.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { Response, Request } from "express";

export const updateTransaction = catchAsync(async (req: Request, res: Response) => {
  const originalTxn = req.transaction;
  const { name, amount, type, bookId, categoryId, createdAt, paidAt } = req.validated.body;

  const oldBookId = originalTxn.bookId;
  const oldCategoryId = originalTxn.categoryId;
  const oldAmount = Number(originalTxn.amount);
  const oldType = originalTxn.type;

  const newName = name !== undefined ? name : originalTxn.name;
  const newBookId = bookId !== undefined ? bookId : oldBookId;
  const newCategoryId = categoryId !== undefined ? categoryId : oldCategoryId;
  const newAmount = amount !== undefined ? amount : oldAmount;
  const newType = type !== undefined ? type : oldType;

  const result = await db.transaction(async (tx) => {
    // 1. Reverse old transaction impact from book and category
    if (oldType === "credit") {
      await tx
        .update(book)
        .set({ balance: sql`COALESCE(balance, 0) - ${oldAmount.toFixed(2)}` })
        .where(eq(book.id, oldBookId));

      if (oldCategoryId) {
        await tx
          .update(categories)
          .set({ balance: sql`COALESCE(balance, 0) - ${oldAmount.toFixed(2)}` })
          .where(eq(categories.id, oldCategoryId));
      }
    } else {
      await tx
        .update(book)
        .set({ balance: sql`COALESCE(balance, 0) + ${oldAmount.toFixed(2)}` })
        .where(eq(book.id, oldBookId));

      if (oldCategoryId) {
        await tx
          .update(categories)
          .set({ balance: sql`COALESCE(balance, 0) + ${oldAmount.toFixed(2)}` })
          .where(eq(categories.id, oldCategoryId));
      }
    }

    // 2. Apply new transaction impact to book and category
    if (newType === "credit") {
      await tx
        .update(book)
        .set({ balance: sql`COALESCE(balance, 0) + ${newAmount.toFixed(2)}` })
        .where(eq(book.id, newBookId));

      if (newCategoryId) {
        await tx
          .update(categories)
          .set({ balance: sql`COALESCE(balance, 0) + ${newAmount.toFixed(2)}` })
          .where(eq(categories.id, newCategoryId));
      }
    } else {
      await tx
        .update(book)
        .set({ balance: sql`COALESCE(balance, 0) - ${newAmount.toFixed(2)}` })
        .where(eq(book.id, newBookId));

      if (newCategoryId) {
        await tx
          .update(categories)
          .set({ balance: sql`COALESCE(balance, 0) - ${newAmount.toFixed(2)}` })
          .where(eq(categories.id, newCategoryId));
      }
    }

    // 3. Save the updated transaction record
    const [updatedTxn] = await tx
      .update(transactions)
      .set({
        name: newName,
        amount: newAmount.toFixed(2),
        type: newType,
        bookId: newBookId,
        categoryId: newCategoryId,
        updatedAt: new Date(),
        ...(createdAt !== undefined ? { createdAt: new Date(createdAt) } : {}),
        ...(paidAt !== undefined ? { paidAt: new Date(paidAt) } : {}),
      })
      .where(eq(transactions.id, originalTxn.id))
      .returning();

    return updatedTxn;
  });

  return res.status(200).json({
    success: true,
    message: "Transaction updated successfully",
    data: {
      transaction: {
        ...result,
        categoryId: result.categoryId ? String(result.categoryId) : null,
      },
    },
  });
});
