import { z } from "zod";
import { CronExpressionParser } from "cron-parser";

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").optional(),
    baseAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount").optional(),
    carryForward: z.boolean().optional(),
    renewCycle: z.enum(["daily", "weekly", "bi-weekly", "monthly", "custom"]).optional(),
    renewDayOfWeek: z.number().min(0).max(6).optional(),
    renewDayOfMonth: z.number().min(1).max(31).optional(),
    customCron: z.string().optional(),
  }).refine((data) => {
    if (data.renewCycle === "custom") {
      if (!data.customCron) return false;
      try {
        CronExpressionParser.parse(data.customCron);
        return true;
      } catch {
        return false;
      }
    }
    return true;
  }, {
    message: "A valid custom cron expression is required when renewCycle is 'custom'",
    path: ["customCron"],
  }),
});
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
