import { ApiError } from "../ApiError.js";
import { env } from "../../config/index.js";
import { signToken } from "../signToken.js";
import { getStatusCode } from "../error/getStatusCode.js";
import { getMessage } from "../error/getMessage.js";

interface GenerateAccessTokenProps {
        userId : string
}

export const generateAccessToken = async({userId} : GenerateAccessTokenProps)=>{

        try{
                const token = await signToken({id : userId},env.secretKey, {expiresIn : '15m'});

                return token;

        }catch(error){

                throw new ApiError(getStatusCode(error),getMessage(error));

        }
}


