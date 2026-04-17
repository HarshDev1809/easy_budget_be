import { defaultConfig } from "../../config/default.config.js";
import { refreshTokens } from "../../db/schema.js";
import { ApiError } from "../ApiError.js";

export const insertRefreshToken = async(config = defaultConfig) => {
        const {db, refreshToken,userId} = config;

        try{

                const [data] = await db.insert(refreshTokens).values({
                        userId,
                        token : refreshToken,
                        expiresAt : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) //7 days
                }).returning();

                return data;

        }catch(error){
                
                throw new ApiError(error.statusCode ?? 500, `Something went wrong while inserting refresh token : ${error.message}`);

        }
}