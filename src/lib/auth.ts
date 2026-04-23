import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import  db  from "../db/index.js"; // Your drizzle 'db' object
import * as schema from "../db/schema.js"; // Your drizzle schema file

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: schema,
    }),
    baseURL: "http://localhost:3000", // ← just the origin
    emailAndPassword: {
        enabled: true
    }
});