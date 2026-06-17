import { catchAsync } from "../../utils/catchAsync.js";
import { Request, Response } from "express";

import db from "../../db/index.js";
import { book } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import redis from "../../redis/index.js";

export const deleteBook = catchAsync(async (req: Request, res: Response) => {
  const bookId = req.params.bookId as string;
  const { otp } = req.validated.body;

  const storedOtp = await redis.get(`delete:${bookId}`);

  if (!storedOtp) {
    return res.status(400).json({ message: "OTP expired or not found", success: false });
  }

  if (storedOtp !== otp) {
    return res.status(400).json({ message: "Invalid OTP", success: false });
  }

  await db.delete(book).where(eq(book.id, bookId));
  await redis.del(`delete:${bookId}`);

  return res.status(200).json({ message: "Book deleted successfully", success: true });
});