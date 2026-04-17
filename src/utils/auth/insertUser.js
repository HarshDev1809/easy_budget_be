import { sql } from "drizzle-orm";
import { defaultConfig } from "../../config/default.config.js";
import { ApiError } from "../ApiError.js";

export const insertUser = async(config = defaultConfig) => {
        const {db, email,phoneNumber, password, name} = config;

        try{

                const [data] = await db.execute(sql`INSERT INTO users (email, name, phone_number,password) VALUES (${email},${name},${phoneNumber},${password}) RETURNING id;`);

                return data

        }catch(error){

                throw new ApiError(error.statusCode ?? 500,`Error while inserting User details`);

        }
}