import { Worker } from "bullmq";
import { env } from "../config/index.js";
import db from "../db/index.js";
import { categories } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { CronExpressionParser } from "cron-parser";

const connection = {
  host: env.nodeEnv === "dev" ? "127.0.0.1" : env.redisHost,
  port: env.redisPort,
  password: env.redisPassword,
};

export const renewWorker = new Worker(
  "renew-budget-queue",
  async (job) => {
    if (job.name === "renew-category-cycle") {
      const { categoryId } = job.data;
      console.log(`[Worker] Processing budget renew cycle for category: ${categoryId}`);

      // 1. Fetch the category
      const [existingCategory] = await db
        .select()
        .from(categories)
        .where(eq(categories.id, categoryId))
        .limit(1);

      if (!existingCategory) {
        console.error(`[Worker] Category with ID ${categoryId} not found.`);
        return;
      }

      // 2. Calculate the next renewal date
      let nextRenewAt = new Date();
      const cycle = existingCategory.renewCycle;

      if (cycle === "daily") {
        nextRenewAt.setDate(nextRenewAt.getDate() + 1);
      } else if (cycle === "weekly") {
        nextRenewAt.setDate(nextRenewAt.getDate() + 7);
      } else if (cycle === "bi-weekly") {
        nextRenewAt.setDate(nextRenewAt.getDate() + 14);
      } else if (cycle === "monthly") {
        nextRenewAt.setMonth(nextRenewAt.getMonth() + 1);
      } else if (cycle === "custom") {
        try {
          const interval = CronExpressionParser.parse(existingCategory.renewCron);
          nextRenewAt = interval.next().toDate();
        } catch (err) {
          console.error(`[Worker] Failed to parse custom cron expression for category ${categoryId}:`, err);
          nextRenewAt.setMonth(nextRenewAt.getMonth() + 1); // fallback to 1 month
        }
      }

      // Normalize time to start of day (midnight)
      nextRenewAt.setHours(0, 0, 0, 0);

      // 3. Update the category in database
      await db
        .update(categories)
        .set({ nextRenewAt })
        .where(eq(categories.id, categoryId));

      console.log(
        `[Worker] Category ${categoryId} budget cycle renewed. Next renewal scheduled at: ${nextRenewAt}`
      );

      // 4. TODO Placeholder: Rollover and Reset logic
      // In the future:
      // - Fetch transactions and spent amount for this category in the ending period.
      // - If carryForward = true, roll over unused budget.
      // - Reset spent balances.
    }
  },
  { connection }
);

renewWorker.on("completed", (job) => {
  console.log(`[Worker] Job ${job?.id} completed successfully`);
});

renewWorker.on("failed", (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed with error:`, err);
});
