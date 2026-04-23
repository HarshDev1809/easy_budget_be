import { NextFunction, Request,Response } from "express"
import { getStatusCode } from "../../utils/error/getStatusCode.js"
import { catchAsync } from "../../utils/catchAsync.js"

export const getSession = catchAsync(async (req : Request,res : Response,next : NextFunction)=>{
    return res.status(200).json({
        message : "User Session fetched successfully",
        success : true,
        data : req.session
    })
})