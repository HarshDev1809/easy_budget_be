import { catchAsync } from "../../utils/catchAsync.js";
import { NextFunction,Response, Request } from "express";

export const createBook = catchAsync(async (req : Request,res : Response,next : NextFunction)=>{
    return res.status(200).json({
        message : "Book created successfully",
        success : true,
        data : {
            session : req.session,
            user : req.user
        }
    })
})