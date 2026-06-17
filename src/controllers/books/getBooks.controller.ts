import { Response, Request } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import db from "../../db/index.js";
import { book } from "../../db/schema.js";
import { eq } from "drizzle-orm";

export const getBooks = catchAsync(async (req : Request,res : Response)=>{
    const {id : userId} = req.user;

    const books = await db.select().from(book).where(eq(book.userId, userId));

    return res.status(200).json({
        success : true,
        message : "Books Fetched successfully.",
        data : books
    })
})