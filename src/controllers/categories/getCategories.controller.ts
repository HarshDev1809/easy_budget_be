import db from "../../db/index.js";
import { categories, book } from "../../db/schema.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { Response, Request } from "express";
import { eq, and } from "drizzle-orm";

export const getCategories = catchAsync(async (req: Request, res: Response) => {
  const bookId  = req.params.bookId as string;
  const { id: userId } = req.user;

  if (!bookId) {
    return res.status(400).json({ success: false, message: "Book ID is required" });
  }

  const existingBook = await db
    .select()
    .from(book)
    .where(and(eq(book.id, bookId), eq(book.userId, userId)))
    .limit(1);

  if (!existingBook.length) {
    return res.status(404).json({ success: false, message: "Book not found or unauthorized" });
  }

  const categories_ = await db
    .select()
    .from(categories)
    .where(eq(categories.bookId, bookId))
    .orderBy(categories.createdAt);

  return res.status(200).json({
    success: true,
    message: "Categories fetched successfully",
    data: categories_,
  });
});