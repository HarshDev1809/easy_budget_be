import { vi } from "vitest";

process.env.DATABASE_URL = "postgres://postgres:password@localhost:5432/postgres";
process.env.DIRECT_URL = "postgres://postgres:password@localhost:5432/postgres";
process.env.BETTER_AUTH_SECRET = "secret";
process.env.BETTER_AUTH_URL = "http://localhost:3000";
process.env.REDIS_HOST = "localhost";
process.env.REDIS_PASSWORD = "";
process.env.NODE_ENV = "dev";
