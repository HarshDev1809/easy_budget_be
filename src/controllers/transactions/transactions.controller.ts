import { Request, Response, NextFunction } from "express";
import { transactionSchema, verifyDeleteTransactionSchema } from "../../schemas/transactions.schemas.js";
import db from "../../db/index.js";
import { transactions, book, categories } from "../../db/schema.js";
import { eq, and, sql, inArray } from "drizzle-orm";
import redis from "../../redis/index.js";
import crypto from "crypto";

export const createTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validatedData = transactionSchema.parse(req.body);
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const bookRecord = await db.query.book.findFirst({
      where: and(eq(book.id, validatedData.bookId), eq(book.userId, userId)),
    });

    if (!bookRecord) {
      res.status(404).json({ error: "Book not found or unauthorized" });
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
        res.status(404).json({ error: "Category not found in the given book" });
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

    res.status(201).json({ message: "Transaction created successfully" });
  } catch (error) {
    next(error);
  }
};

export const updateTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const validatedData = transactionSchema.parse(req.body);
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const newBookRecord = await db.query.book.findFirst({
      where: and(eq(book.id, validatedData.bookId), eq(book.userId, userId)),
    });

    if (!newBookRecord) {
      res.status(404).json({ error: "Target book not found or unauthorized" });
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
          res.status(404).json({ error: "Category not found in the given book" });
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

    res.status(200).json({ message: "Transaction updated successfully" });
  } catch (error) {
    next(error);
  }
};

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
