import { promisify } from "util";
import jwt from 'jsonwebtoken';
import { ApiError } from "../ApiError.js";
import { env } from "../../config/index.js";

export const generateAccessToken = async({userId})=>{
        const signToken = promisify(jwt.sign);

        try{
                const token = await signToken({id : userId},env.secretKey, {expiresIn : '15m'});

                return token;

        }catch(error){

                throw new ApiError(error.statusCode ?? 500,error.message);

        }
}


