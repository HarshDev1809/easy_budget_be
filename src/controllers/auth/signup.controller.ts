import { Request,Response } from 'express';
import { defaultConfig } from "../../config/default.config.js";
import { env } from "../../config/index.js"
import bcrypt from 'bcrypt';
import { generateRefreshToken } from "../../utils/auth/generateRefreshToken.js";
import { insertUser } from "../../utils/auth/insertUser.js";
import { generateAccessToken } from "../../utils/auth/generateAccessToken.js";
import { insertRefreshToken } from "../../utils/auth/insertRefreshToken.js";
import { checkUserData } from "../../utils/auth/checkUserData.js";
import { getStatusCode } from '../../utils/error/getStatusCode.js';
import { getMessage } from '../../utils/error/getMessage.js';
import { getStack } from '../../utils/error/getStack.js';

export const signup = async(req: Request,res : Response) => {
        try{
                const {email,password,name,phone_number} = req.validated.body ?? {};

                const {db} = defaultConfig;
                
                let data = null;
                let accessToken = null;
                let refreshToken = null;
                await db.transaction(async (tx) =>{
                
                        if(await checkUserData({...defaultConfig,db : tx, email, phoneNumber : phone_number})){
                                return res.status(409).json({
                                        message : "User already exist with this Email or Phone Number",
                                        success : false,
                                        error : `email or phone number already taken`
                                })
                        }

                        const hashedPassword = await bcrypt.hash(password,env.saltRounds);

                        const {id : userId} = await insertUser({...defaultConfig, db : tx,email, password : hashedPassword, name, phoneNumber : phone_number });

                        accessToken = await generateAccessToken({userId});

                        refreshToken = generateRefreshToken();

                        data = await insertRefreshToken({...defaultConfig, db : tx,userId,refreshToken});

                })

                res.cookie('access_token',accessToken,{
                        httpOnly : true,
                        secure : env.nodeEnv === 'dev'? false :true,
                        sameSite : 'lax',
                        maxAge : 15 * 60 * 1000,
                        path : '/'
                });

                res.cookie('refresh_token',refreshToken,{
                        httpOnly : true,
                        secure : env.nodeEnv === 'dev'? false :true,
                        maxAge : 7 * 24 * 60 * 60 * 1000,
                        path : '/auth/refresh',
                        sameSite : 'strict'
                })

                return res.status(200).json({
                        message : "User Signed up Successfully",
                        success : true
                })

        }catch(error){
                return res.status(getStatusCode(error)).json({
                        message : "Something went wrong while signup",
                        success : false,
                        status : "error",
                        error : getMessage(error),
                        stack : env.nodeEnv === 'dev' ? getStack(error) : undefined
                })
        }
}


