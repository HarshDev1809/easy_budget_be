import { eq } from "drizzle-orm";
import db from "../../db/index.js";
import { categories } from "../../db/schema.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { Request, Response, NextFunction } from "express";

export const authoriseCategoryAccess = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const bookId =
    req.validated?.body?.bookId ||
    req.validated?.params?.bookId ||
    req.validated?.query?.bookId ||
    req.body?.bookId ||
    req.params?.bookId ||
    req.query?.bookId ||
    req.transaction?.bookId;

  const categoryId =
    req.validated?.body?.categoryId ||
    req.body?.categoryId;

  if (categoryId !== undefined && categoryId !== null) {
    const catIdNum = Number(categoryId);
    if (isNaN(catIdNum)) {
      return res.status(400).json({ success: false, message: "Invalid category ID format" });
    }

    const catList = await db
      .select({ bookId: categories.bookId })
      .from(categories)
      .where(eq(categories.id, catIdNum))
      .limit(1);

    const firstCat = catList[0];
    if (!firstCat) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    if (firstCat.bookId !== bookId) {
      return res.status(400).json({ success: false, message: "Category does not belong to the specified book" });
    }
  }

  next();
});
