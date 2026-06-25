import db from "../../db/index.js";
import { categories, book } from "../../db/schema.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { Response, Request } from "express";
import { eq, and } from "drizzle-orm";
import { scheduleCategoryRenewJob } from "../../jobs/renew.queue.js";
import { CronExpressionParser } from "cron-parser";

export function resolveRenewConfig(params: {
  renewCycle?: string;
  renewDayOfWeek?: number;
  renewDayOfMonth?: number;
  customCron?: string;
}) {
  const cycle = params.renewCycle || "monthly";
  let cron = "0 0 1 * *";

  if (cycle === "daily") {
    cron = "0 0 * * *";
  } else if (cycle === "weekly") {
    const dayOfWeek = params.renewDayOfWeek ?? 0;
    cron = `0 0 * * ${dayOfWeek}`;
  } else if (cycle === "bi-weekly") {
    const dayOfWeek = params.renewDayOfWeek ?? 0;
    cron = `0 0 * * ${dayOfWeek}`;
  } else if (cycle === "monthly") {
    const dayOfMonth = params.renewDayOfMonth ?? 1;
    cron = `0 0 ${dayOfMonth} * *`;
  } else if (cycle === "custom") {
    cron = params.customCron || "0 0 1 * *";
  }

  let nextRenewAt = new Date();
  nextRenewAt.setHours(0, 0, 0, 0);

  if (cycle === "daily") {
    nextRenewAt.setDate(nextRenewAt.getDate() + 1);
  } else if (cycle === "weekly" || cycle === "bi-weekly") {
    const dayOfWeek = params.renewDayOfWeek ?? 0;
    const currentDay = nextRenewAt.getDay();
    let daysUntilNext = (dayOfWeek - currentDay + 7) % 7;
    if (daysUntilNext === 0) {
      daysUntilNext = 7;
    }
    nextRenewAt.setDate(nextRenewAt.getDate() + daysUntilNext);
  } else if (cycle === "monthly") {
    const dayOfMonth = params.renewDayOfMonth ?? 1;
    const currentMonth = nextRenewAt.getMonth();
    const currentYear = nextRenewAt.getFullYear();
    let candidate = new Date(currentYear, currentMonth, dayOfMonth, 0, 0, 0, 0);
    if (candidate <= nextRenewAt) {
      candidate = new Date(currentYear, currentMonth + 1, dayOfMonth, 0, 0, 0, 0);
    }
    nextRenewAt = candidate;
  } else if (cycle === "custom") {
    try {
      const interval = CronExpressionParser.parse(cron);
      nextRenewAt = interval.next().toDate();
    } catch {
      nextRenewAt.setMonth(nextRenewAt.getMonth() + 1);
    }
  }

  return { renewCycle: cycle, renewCron: cron, nextRenewAt };
}

export const createCategory = catchAsync(async (req: Request, res: Response) => {
  const { name, bookId, baseAmount, carryForward, renewCycle, renewDayOfWeek, renewDayOfMonth, customCron } = req.body;
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

  const { renewCycle: resolvedCycle, renewCron, nextRenewAt } = resolveRenewConfig({
    renewCycle,
    renewDayOfWeek,
    renewDayOfMonth,
    customCron,
  });

  const [newCategory] = await db
    .insert(categories)
    .values({
      name,
      bookId,
      baseAmount,
      balance: baseAmount,
      carryForward: carryForward ?? false,
      renewCycle: resolvedCycle,
      renewCron,
      nextRenewAt,
    })
    .returning();

  if (newCategory) {
    await scheduleCategoryRenewJob(
      newCategory.id,
      newCategory.renewCycle,
      newCategory.renewCron,
      newCategory.nextRenewAt
    );
  }

  return res.status(201).json({
    success: true,
    message: "Category created successfully",
    data: { category: newCategory },
  });
});