import { user } from "../../db/schema.js";

declare global {
  namespace Express {
    interface Request {
      user?: typeof user.$inferSelect;
    }
  }
}
