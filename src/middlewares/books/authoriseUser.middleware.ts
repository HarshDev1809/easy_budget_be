import { and, eq } from "drizzle-orm";
import db from "../../db/index.js";
import { book } from "../../db/schema.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { Request, Response, NextFunction } from "express";

export const authoriseUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId: string = req.user.id;
    const bookId = req.params.bookId as string;

  if (!bookId || !userId) {
    return res.status(400).json({ message: "Missing bookId or userId", success : false });
  }

  const books = await db
    .select({ id: book.id })
    .from(book)
    .where(and(eq(book.id, bookId), eq(book.userId, userId)))
    .limit(1);

  if (books.length === 0) {
    return res.status(403).json({ message: "Forbidden", success : false });
  }

  next();
});