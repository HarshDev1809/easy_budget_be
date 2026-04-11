export const validate = (schema) => (req,res,next)=>{
        const result = schema.safeParse({
                body    : req.body,
                query   : req.query,
                params  : req.pararms
        });

        if(!result.success){
                return res.status(400).json({
                        success : false,
                        status : "fail",
                        message : "Validation Error",
                        error : result.error.message,
                        // errors : result.error.errors.map(e => ({
                        //          field: e.path.join('.'),
                        //         message: e.message
                        //         }))
                })
        }

        req.body = result.data.body;
        req.query = result.data.query;
        req.params = result.data.params;

        next();
}

