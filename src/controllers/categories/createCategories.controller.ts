import db from "../../db/index.js";
import { categories, book } from "../../db/schema.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { NextFunction, Response, Request } from "express";
import { eq, and } from "drizzle-orm";

export const createCategory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { name, bookId, baseAmount, carryForward } = req.body;
  const { id: userId } = req.user;

  if (!bookId || !name || !baseAmount) {
    return res.status(400).json({ success: false, message: "Name, Book ID and base amount are required" });
  }

  const existingBook = await db
    .select()
    .from(book)
    .where(and(eq(book.id, bookId), eq(book.userId, userId)))
    .limit(1);

  if (!existingBook.length) {
    return res.status(404).json({ success: false, message: "Book not found or unauthorized" });
  }

  const [newCategory] = await db
    .insert(categories)
    .values({ name, bookId, baseAmount, carryForward: carryForward ?? false })
    .returning();

  return res.status(201).json({
    success: true,
    message: "Category created successfully",
    data: { category: newCategory },
  });
});