import { env } from "../../config/index.js"

export const signup = async(req,res) => {
        try{

                return res.status(200).json({
                        message : "Payload validate successfully",
                        success : true,
                        status : "success"
                })

        }catch(error){
                return res.status(error.statusCode ?? 500).json({
                        message : "Something went wrong while signup",
                        success : false,
                        status : "error",
                        error : error.message,
                        stack : env.nodeEnv === 'dev' ? error.stack : undefined
                })
        }
}
