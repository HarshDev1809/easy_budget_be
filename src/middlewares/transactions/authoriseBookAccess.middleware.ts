import { and, eq } from "drizzle-orm";
import db from "../../db/index.js";
import { book } from "../../db/schema.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { Request, Response, NextFunction } from "express";

export const authoriseBookAccess = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user.id;
  const bookId =
    req.validated?.body?.bookId ||
    req.validated?.params?.bookId ||
    req.validated?.query?.bookId ||
    req.body?.bookId ||
    req.params?.bookId ||
    req.query?.bookId;

  if (!bookId) {
    return next();
  }

  const existingBook = await db
    .select({ id: book.id })
    .from(book)
    .where(and(eq(book.id, bookId), eq(book.userId, userId)))
    .limit(1);

  if (existingBook.length === 0) {
    return res.status(403).json({ success: false, message: "Forbidden: Book not found or unauthorized" });
  }

  next();
});
