import redis from "../../redis/index.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { Response, Request } from "express";

function generateAlphanumericToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < 6; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export const deleteTransactionRequest = catchAsync(async (req: Request, res: Response) => {
  const transactionId = req.transaction.id;

  const token = generateAlphanumericToken();

  // Cache in Redis under the transaction ID prefix with a 5-minute (300s) TTL
  await redis.set(`delete-transaction:${transactionId}`, token, "EX", 300);

  return res.status(200).json({
    success: true,
    message: "Verification token generated. Please confirm deletion using this token.",
    data: {
      token,
    },
  });
});
