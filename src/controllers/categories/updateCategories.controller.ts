import db from "../../db/index.js";
import { categories, book } from "../../db/schema.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { NextFunction, Response, Request } from "express";
import { eq } from "drizzle-orm";
import { scheduleCategoryRenewJob, unscheduleCategoryRenewJob } from "../../jobs/renew.queue.js";
import { resolveRenewConfig } from "./createCategories.controller.js";

export const updateCategory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const categoryId = Number(req.params.id);
  const { id: userId } = req.user;
  const { name, baseAmount, carryForward, renewCycle, renewDayOfWeek, renewDayOfMonth, customCron } = req.body;

  if (isNaN(categoryId)) {
    return res.status(400).json({ success: false, message: "Invalid category ID" });
  }

  // 1. Fetch the category and check ownership via its book
  const existingCategory = await db
    .select({
      category: categories,
      bookUserId: book.userId,
    })
    .from(categories)
    .innerJoin(book, eq(categories.bookId, book.id))
    .where(eq(categories.id, categoryId))
    .limit(1);

  if (!existingCategory.length) {
    return res.status(404).json({ success: false, message: "Category not found" });
  }

  const [found] = existingCategory;
  if (!found || found.bookUserId !== userId) {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  const currentCategory = found.category;

  // 2. Detect if renewal settings have changed
  const hasRenewalChanged =
    renewCycle !== undefined ||
    renewDayOfWeek !== undefined ||
    renewDayOfMonth !== undefined ||
    customCron !== undefined;

  let updateValues: Partial<typeof categories.$inferInsert> = {};

  if (name !== undefined) updateValues.name = name;
  if (baseAmount !== undefined) updateValues.baseAmount = baseAmount;
  if (carryForward !== undefined) updateValues.carryForward = carryForward;

  if (hasRenewalChanged) {
    // Unschedule the old repeatable job
    await unscheduleCategoryRenewJob(currentCategory.id, currentCategory.renewCycle, currentCategory.renewCron);

    // Extract default values from existing cron if not provided
    let dayOfWeek = renewDayOfWeek;
    let dayOfMonth = renewDayOfMonth;

    if (dayOfWeek === undefined && currentCategory.renewCron) {
      const parts = currentCategory.renewCron.split(" ");
      if (parts.length === 5 && parts[4] !== undefined && parts[4] !== "*") {
        const parsed = parseInt(parts[4], 10);
        if (!isNaN(parsed)) dayOfWeek = parsed;
      }
    }

    if (dayOfMonth === undefined && currentCategory.renewCron) {
      const parts = currentCategory.renewCron.split(" ");
      if (parts.length === 5 && parts[2] !== undefined && parts[2] !== "*") {
        const parsed = parseInt(parts[2], 10);
        if (!isNaN(parsed)) dayOfMonth = parsed;
      }
    }

    // Compute new renewal config
    const { renewCycle: resolvedCycle, renewCron, nextRenewAt } = resolveRenewConfig({
      renewCycle: renewCycle !== undefined ? renewCycle : currentCategory.renewCycle,
      renewDayOfWeek: dayOfWeek,
      renewDayOfMonth: dayOfMonth,
      customCron: customCron !== undefined ? customCron : currentCategory.renewCron,
    });

    updateValues.renewCycle = resolvedCycle;
    updateValues.renewCron = renewCron;
    updateValues.nextRenewAt = nextRenewAt;

    // Schedule the new repeatable job
    await scheduleCategoryRenewJob(currentCategory.id, resolvedCycle, renewCron, nextRenewAt);
  }

  // 3. Perform database update
  const [updatedCategory] = await db
    .update(categories)
    .set(updateValues)
    .where(eq(categories.id, categoryId))
    .returning();

  return res.status(200).json({
    success: true,
    message: "Category updated successfully",
    data: {
      category: updatedCategory,
    },
  });
});
