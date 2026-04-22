import * as z from 'zod';

export const envSchema = z.object({
        HTTP_PORT : z.string().transform(Number).default(3000),
        NODE_ENV : z.enum(['dev','prod']).default('dev'),
        DATABASE_URL : z.string(),
        DIRECT_URL : z.string(),
        BETTER_AUTH_SECRET : z.string(),
        SALT_ROUNDS : z.string().transform(Number).default(12),
        BETTER_AUTH_URL : z.string(),
});
