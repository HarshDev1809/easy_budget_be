import 'dotenv/config';
import {envSchema} from '../schemas/env.schema.js'

const _env = envSchema.safeParse(process.env);

if(!_env.success){
        console.error('Invalid ENV ',_env.error);
        process.exit(1);
}

interface Env {
        httpPort : number;
        directUrl : string,
        databaseUrl : string;
        nodeEnv : string;
        betterAuthSecret : string;
        saltRounds : number;
        betterAuthUrl : string;
}

export const env : Env = {
        httpPort : _env.data.HTTP_PORT,
        directUrl : _env.data.DIRECT_URL,
        databaseUrl : _env.data.DATABASE_URL,
        nodeEnv : _env.data.NODE_ENV,
        betterAuthSecret : _env.data.BETTER_AUTH_SECRET,
        saltRounds : _env.data.SALT_ROUNDS,
        betterAuthUrl : _env.data.BETTER_AUTH_URL
} as const;
