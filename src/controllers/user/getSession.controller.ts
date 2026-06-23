import { Request,Response } from "express"
import { catchAsync } from "../../utils/catchAsync.js"

export const getSession = catchAsync(async (req : Request,res : Response)=>{
    return res.status(200).json({
        message : "User Session fetched successfully",
        success : true,
        data : req.session
    })
})