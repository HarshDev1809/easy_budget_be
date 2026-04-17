import {env} from '../../config/index.js'

export const debug = (req,res)=>{
        try{
                if(env.nodeEnv !== 'dev'){
                        return res.status(403).json({
                                message : 'Access Forbidden'
                        })
                }

                let accessToken = req.cookies.access_token;

                return res.status(200).json({
                        message : 'Hello World!',
                        accessToken
                })

        }catch(error){
                return res.status(error.statusCode ?? 500).json({
                        error : error.message,
                        stack : env.nodeEnv === 'dev' ? error.stack : undefined
                })
        }
}
