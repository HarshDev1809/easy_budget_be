import { and, eq, desc } from "drizzle-orm";
import db from "../../db/index.js";
import { transactions } from "../../db/schema.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { Response, Request } from "express";

export const getTransactions = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { bookId, categoryId } = req.query;

  const conditions = [eq(transactions.userId, userId)];

  if (bookId) {
    conditions.push(eq(transactions.bookId, bookId as string));
  }

  if (categoryId) {
    const catIdNum = Number(categoryId);
    if (!isNaN(catIdNum)) {
      conditions.push(eq(transactions.categoryId, catIdNum));
    }
  }

  const list = await db
    .select()
    .from(transactions)
    .where(and(...conditions))
    .orderBy(desc(transactions.createdAt));

  const formatted = list.map((item) => ({
    ...item,
    categoryId: item.categoryId ? String(item.categoryId) : null,
  }));

  return res.status(200).json({
    success: true,
    data: formatted,
  });
});
