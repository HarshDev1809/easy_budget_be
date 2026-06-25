import { Request, Response, NextFunction } from "express";
import db from "../../db/index.js";
import { transactions, book, categories } from "../../db/schema.js";
import { eq, and, sql } from "drizzle-orm";

export const createTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validatedData = req.body;
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const bookRecord = await db.query.book.findFirst({
      where: and(eq(book.id, validatedData.bookId), eq(book.userId, userId)),
    });

    if (!bookRecord) {
      res.status(404).json({ success: false, message: "Book not found or unauthorized" });
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

    await db.transaction(async (tx) => {
      await tx.insert(transactions).values({
        name: validatedData.name,
        amount: validatedData.amount.toString(),
        type: validatedData.type,
        bookId: validatedData.bookId,
        categoryId: validatedData.categoryId ?? null,
      });

      const amountDelta = validatedData.type === "credit" ? validatedData.amount : -validatedData.amount;

      // Atomic update
      await tx.update(book)
        .set({ baseAmount: sql`${book.baseAmount} + ${amountDelta}` })
        .where(eq(book.id, validatedData.bookId));

      if (validatedData.categoryId) {
        await tx.update(categories)
          .set({ baseAmount: sql`${categories.baseAmount} + ${amountDelta}` })
          .where(eq(categories.id, validatedData.categoryId));
      }
    });

    res.status(201).json({ success: true, message: "Transaction created successfully" });
  } catch (error) {
    next(error);
  }
};
