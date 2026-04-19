import { defaultConfig } from "../../config/default.config.js";
import { refreshTokens } from "../../db/schema.js";
import { DefaultConfig } from "../../types/common.js";
import { ApiError } from "../ApiError.js";
import { getMessage } from "../error/getMessage.js";
import { getStatusCode } from "../error/getStatusCode.js";

interface InsertRefreshTokenConfig extends DefaultConfig {
        refreshToken : string;
        userId : string
}

export const insertRefreshToken = async(config : InsertRefreshTokenConfig) => {
        const {db, refreshToken,userId} = config;

        try{

                const [data] = await db.insert(refreshTokens).values({
                        userId,
                        token : refreshToken,
                        expiresAt : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) //7 days
                }).returning();

                return data;

        }catch(error){
                
                throw new ApiError(getStatusCode(error), `Something went wrong while inserting refresh token : ${getMessage(error)}`);

        }
}