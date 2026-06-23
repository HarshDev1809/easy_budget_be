import db from "../../db/index.js";
import { categories, book } from "../../db/schema.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { Response, Request } from "express";
import { eq } from "drizzle-orm";
import { unscheduleCategoryRenewJob } from "../../jobs/renew.queue.js";

export const deleteCategory = catchAsync(async (req: Request, res: Response) => {
    const categoryId = Number(req.params.id);
    const { id: userId } = req.user;

    if (isNaN(categoryId)) {
        return res.status(400).json({ success: false, message: "Invalid category ID" });
    }

    const existingCategory = await db
        .select({ id: categories.id, bookUserId: book.userId })
        .from(categories)
        .innerJoin(book, eq(categories.bookId, book.id))
        .where(eq(categories.id, categoryId))
        .limit(1);

    if (!existingCategory.length) {
        return res.status(404).json({ success: false, message: "Category not found" });
    }

    const [foundCategory] = existingCategory;

    if (!foundCategory) {
        return res.status(404).json({ success: false, message: "Category not found" });
    }

    if (foundCategory.bookUserId !== userId) {
        return res.status(403).json({ success: false, message: "Unauthorized" });
    }
    const [deleted] = await db
        .delete(categories)
        .where(eq(categories.id, categoryId))
        .returning();

    if (deleted) {
        await unscheduleCategoryRenewJob(deleted.id, deleted.renewCycle, deleted.renewCron);
    }

    return res.status(200).json({
        success: true,
        message: "Category deleted successfully",
        data: { category: deleted },
    });
});