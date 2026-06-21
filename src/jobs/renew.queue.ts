import { Queue } from "bullmq";
import { env } from "../config/index.js";

const connection = {
  host: env.nodeEnv === "dev" ? "127.0.0.1" : env.redisHost,
  port: env.redisPort,
  password: env.redisPassword,
};

export const renewQueue = new Queue("renew-budget-queue", {
  connection,
});

/**
 * Schedules a repeatable budget cycle renewal job for a category.
 */
export async function scheduleCategoryRenewJob(
  categoryId: number,
  cycle: string,
  cronExpr: string,
  startDate?: Date
) {
  const jobId = `renew-category-${categoryId}`;

  if (cycle === "bi-weekly") {
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
    await renewQueue.add(
      "renew-category-cycle",
      { categoryId },
      {
        repeat: {
          every: fourteenDaysMs,
          startDate: startDate || new Date(),
        },
        jobId,
      }
    );
  } else {
    await renewQueue.add(
      "renew-category-cycle",
      { categoryId },
      {
        repeat: {
          pattern: cronExpr,
          startDate: startDate || new Date(),
        },
        jobId,
      }
    );
  }
  console.log(`[Queue] Scheduled repeatable renew job for category: ${categoryId} (${cycle})`);
}

/**
 * Removes a repeatable job for a category.
 */
export async function unscheduleCategoryRenewJob(
  categoryId: number,
  oldCycle: string,
  oldCronExpr: string
) {
  const jobId = `renew-category-${categoryId}`;

  if (oldCycle === "bi-weekly") {
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
    await renewQueue.removeRepeatable("renew-category-cycle", {
      every: fourteenDaysMs,
      jobId,
    });
  } else {
    await renewQueue.removeRepeatable("renew-category-cycle", {
      pattern: oldCronExpr,
      jobId,
    });
  }
  console.log(`[Queue] Unscheduled repeatable renew job for category: ${categoryId}`);
}
