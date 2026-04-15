import {defaultConfig} from '../../config/default.config.js';
import { ApiError} from "../ApiError.js";
import {sql} from 'drizzle-orm';

export const checkUserData = async(config = defaultConfig) =>{
        const {db,email, phoneNumber} = config;

        try{
                
                const [data] = await db.execute(sql`SELECT EXISTS ( SELECT 1 FROM users WHERE email = ${email} OR phone_number = ${phoneNumber} )`);
                return data.exists;

        }catch(error){

                throw new ApiError(error.statusCode ?? 500, `Error while checking user data for ${email} and ${phoneNumber}`);

        }
}


