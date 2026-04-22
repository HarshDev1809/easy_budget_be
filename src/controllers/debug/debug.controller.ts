import { Request,Response } from 'express';
import {env} from '../../config/index.js'
import { getStatusCode } from '../../utils/error/getStatusCode.js';
import { getMessage } from '../../utils/error/getMessage.js';
import { getStack } from '../../utils/error/getStack.js';

export const debug = (req : Request,res : Response)=>{
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
                return res.status(getStatusCode(error)).json({
                        error : getMessage(error),
                        stack : env.nodeEnv === 'dev' ? getStack(error) : undefined
                })
        }
}
