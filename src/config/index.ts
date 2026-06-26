import 'dotenv/config';
import {envSchema} from '../schemas/env.schema.js'

const _env = envSchema.safeParse(process.env);

if(!_env.success){
        console.error('Invalid ENV ',_env.error);
        if (process.env.NODE_ENV !== 'test') {
                process.exit(1);
        }
}

interface Env {
        httpPort : number;
        directUrl : string,
        databaseUrl : string;
        nodeEnv : string;
        betterAuthSecret : string;
        saltRounds : number;
        betterAuthUrl : string;
        redisHost : string,
        redisPort : number,
        redisPassword : string
}

export const env : Env = {
        httpPort : _env.data?.HTTP_PORT || 3000,
        directUrl : _env.data?.DIRECT_URL || "",
        databaseUrl : _env.data?.DATABASE_URL || "",
        nodeEnv : _env.data?.NODE_ENV || "dev",
        betterAuthSecret : _env.data?.BETTER_AUTH_SECRET || "",
        saltRounds : _env.data?.SALT_ROUNDS || 12,
        betterAuthUrl : _env.data?.BETTER_AUTH_URL || "",
        redisHost : _env.data?.REDIS_HOST || "",
        redisPort : _env.data?.REDIS_PORT || 6379,
        redisPassword : _env.data?.REDIS_PASSWORD || "",
} as const;

