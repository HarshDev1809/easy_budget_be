import { Request,Response,NextFunction } from "express";
import {auth} from '../../lib/auth.js';
import { catchAsync } from "../../utils/catchAsync.js";

export const isAuthenticated = catchAsync(async (req: Request, res : Response,next : NextFunction)=>{
        
            const session = await auth.api.getSession({
                headers : req.headers
            });

            if(!session){
                return res.status(401).json({
                    message : "Unauthorized : Session not found",
                    success : false
                })
            }

            req.user = session.user;
            req.session = session.session;

            next();
})
