import 'dotenv/config';

// Ensure NODE_ENV is set to "test" for the vitest environment
process.env.NODE_ENV = "test";

process.env.DATABASE_URL = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:6543/postgres";
process.env.DIRECT_URL = process.env.DIRECT_URL || "postgres://postgres:postgres@localhost:5432/postgres";
process.env.BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET || "secret";
process.env.BETTER_AUTH_URL = process.env.BETTER_AUTH_URL || "http://localhost:3000";
process.env.REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
process.env.REDIS_PASSWORD = process.env.REDIS_PASSWORD || "";
