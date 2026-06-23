import { Request,Response,NextFunction } from "express";
import { ZodObject } from "zod";

export const validate = (schema: ZodObject) => (req : Request,res : Response,next : NextFunction)=>{
        const result = schema.safeParse({
                body    : req.body,
                query   : req.query,
                params  : req.params
        });

        if(!result.success){
                return res.status(400).json({
                        success : false,
                        message : "Validation Error",
                        error   : result.error.issues.map(e => ({
          field : e.path.join(" > "),
          error : e.message,
        })),
                })
        }

        req.validated = {
                ...req.validated,
                query: result.data.query,
                body : result.data.body,
                params : result.data.params
        };

        next();
}

