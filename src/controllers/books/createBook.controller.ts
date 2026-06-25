import db from "../../db/index.js";
import { book } from "../../db/schema.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { Response, Request } from "express";

export const createBook = catchAsync(async (req : Request,res : Response)=>{

    const {body} = req;
    const {name, baseAmount} = body;
    const {id : userId} = req.user;

    await db.insert(book).values({
        name,
        userId,
        baseAmount,
        balance: baseAmount,
        });

    return res.status(200).json({
        message : "Book created successfully",
        success : true,
        data : {
            
        }
    })
})