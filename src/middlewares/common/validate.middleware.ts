import { Request,Response,NextFunction } from "express";
import { z, ZodError, ZodObject, ZodTypeAny } from "zod";

type ValidationSchema = ZodObject<{
  body?   : ZodTypeAny;
  query?  : ZodTypeAny;
  params? : ZodTypeAny;
}>;

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

        (req as any).validated = {
                ...(req as any).validated,
                query: result.data.query,
                body : result.data.body,
                params : result.data.params
        };

        next();
}

