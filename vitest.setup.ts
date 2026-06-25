import 'dotenv/config';

// Unconditionally set NODE_ENV to "dev" to satisfy the env.schema.ts validation
process.env.NODE_ENV = "dev";

process.env.DATABASE_URL = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:6543/postgres";
process.env.DIRECT_URL = process.env.DIRECT_URL || "postgres://postgres:postgres@localhost:5432/postgres";
process.env.BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET || "secret";
process.env.BETTER_AUTH_URL = process.env.BETTER_AUTH_URL || "http://localhost:3000";
process.env.REDIS_HOST = process.env.REDIS_HOST || "localhost";
process.env.REDIS_PASSWORD = process.env.REDIS_PASSWORD || "password";
