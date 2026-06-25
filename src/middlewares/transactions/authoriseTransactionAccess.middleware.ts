import { and, eq } from "drizzle-orm";
import db from "../../db/index.js";
import { transactions, book } from "../../db/schema.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { Request, Response, NextFunction } from "express";

export const authoriseTransactionAccess = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user.id;
  const transactionId = req.params.id || req.body?.transactionId || req.query?.transactionId;

  if (!transactionId) {
    return res.status(400).json({ success: false, message: "Missing transaction ID" });
  }

  const txnList = await db
    .select({
      transaction: transactions,
      bookUserId: book.userId,
    })
    .from(transactions)
    .innerJoin(book, eq(transactions.bookId, book.id))
    .where(and(eq(transactions.id, transactionId), eq(book.userId, userId)))
    .limit(1);

  if (txnList.length === 0) {
    return res.status(404).json({ success: false, message: "Transaction not found or unauthorized" });
  }

  req.transaction = txnList[0].transaction;
  next();
});
