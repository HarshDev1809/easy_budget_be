import { DefaultConfig } from '../../types/common.js';
import { ApiError} from "../ApiError.js";
import {sql} from 'drizzle-orm';
import { getStatusCode } from '../error/getStatusCode.js';
import { getMessage } from '../error/getMessage.js';

interface CheckUserDataConfig extends DefaultConfig {
        email : string;
        phoneNumber: string;
}

export const checkUserData = async(config : CheckUserDataConfig) =>{
        const {db,email, phoneNumber} = config;

        try{
                
                const [data] = await db.execute(sql`SELECT EXISTS ( SELECT 1 FROM users WHERE email = ${email} OR phone_number = ${phoneNumber} )`);
                return data.exists;

        }catch(error){

                throw new ApiError(getStatusCode(error), `Error while checking user data for ${email} and ${phoneNumber} : ${getMessage(error)}`);

        }
}


