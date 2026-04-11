import 'dotenv/config';
import {envSchema} from '../schemas/env.schema.js'

const _env = envSchema.safeParse(process.env);

if(!_env.success){
        console.error('Invalid ENV ',_env.error);
        process.exit(1);
}

export const env = {
        httpPort : _env.data.HTTP_PORT,
        directUrl : _env.data.DIRECT_URL,
        databaseUrl : _env.data.DATABASE_URL,
        nodeEnv : _env.data.NODE_ENV
};
