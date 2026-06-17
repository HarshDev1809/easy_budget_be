import redis from "../../redis/index.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { Response, Request } from "express";


export const bookDeleteRequest = catchAsync(async (req: Request, res: Response) => {
    const bookId = req.params.bookId as string;

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP

    await redis.set(`delete:${bookId}`, otp, "EX", 300); // 5 min TTL

    return res.status(200).json({
        message: "OTP generated, please confirm deletion",
        success: true,
        data: { otp },
    });
})