import { eq, sql } from "drizzle-orm";
import db from "../../db/index.js";
import { transactions, book, categories } from "../../db/schema.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { Response, Request } from "express";

export const createTransaction = catchAsync(async (req: Request, res: Response) => {
  const { name, amount, type, bookId, categoryId, createdAt, paidAt } = req.validated.body;
  const userId = req.user.id;

  const result = await db.transaction(async (tx) => {
    // 1. Insert transaction
    const [newTxn] = await tx
      .insert(transactions)
      .values({
        name,
        amount: amount.toFixed(2),
        type,
        bookId,
        categoryId: categoryId || null,
        userId,
        ...(createdAt ? { createdAt: new Date(createdAt) } : {}),
        ...(paidAt ? { paidAt: new Date(paidAt) } : {}),
      })
      .returning();

    // 2. Recalculate book balance
    if (type === "credit") {
      await tx
        .update(book)
        .set({ balance: sql`COALESCE(balance, 0) + ${amount.toFixed(2)}` })
        .where(eq(book.id, bookId));
    } else {
      await tx
        .update(book)
        .set({ balance: sql`COALESCE(balance, 0) - ${amount.toFixed(2)}` })
        .where(eq(book.id, bookId));
    }

    // 3. Recalculate category balance if specified
    if (categoryId) {
      if (type === "credit") {
        await tx
          .update(categories)
          .set({ balance: sql`COALESCE(balance, 0) + ${amount.toFixed(2)}` })
          .where(eq(categories.id, categoryId));
      } else {
        await tx
          .update(categories)
          .set({ balance: sql`COALESCE(balance, 0) - ${amount.toFixed(2)}` })
          .where(eq(categories.id, categoryId));
      }
    }

    return newTxn;
  });

  return res.status(201).json({
    success: true,
    message: "Transaction created successfully",
    data: {
      transaction: {
        ...result,
        categoryId: result.categoryId ? String(result.categoryId) : null,
      },
    },
  });
});
