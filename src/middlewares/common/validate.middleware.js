export const validate = (schema) => (req,res,next)=>{
        const result = schema.safeParse({
                body    : req.body,
                query   : req.query,
                params  : req.pararms
        });

        if(!result.success){
                return res.status(400).json({
                        success : false,
                        message : "Validation Error",
                        error : JSON.parse(result.error.message).map(e => ({field : e.path.join(" > "),error : e.message})),
                        // errors : result.error.errors.map(e => ({
                        //          field: e.path.join('.'),
                        //         message: e.message
                        //         }))
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

