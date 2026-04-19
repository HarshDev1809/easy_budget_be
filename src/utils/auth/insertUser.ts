import { ApiError } from "../ApiError.js";
import { DefaultConfig } from "../../types/common.js";
import { getStatusCode } from "../error/getStatusCode.js";
import { getMessage } from "../error/getMessage.js";
import { users } from "../../db/schema.js";

interface InsertUserConfig extends DefaultConfig{
        email : string;
        phoneNumber : string;
        password : string;
        name : string
}

export const insertUser = async (config: InsertUserConfig) => {
    const { db, email, phoneNumber, password, name } = config;

    try {
        const [data] = await db
            .insert(users)
            .values({ email, name, phone_number : phoneNumber, password })
            .returning({ id: users.id });

        if (!data) {
            throw new ApiError(500, "User creation failed: No data returned");
        }

        return data; // Drizzle automatically types this as { id: string }
    } catch (error) {
        throw new ApiError(getStatusCode(error), `Error: ${getMessage(error)}`);
    }
};