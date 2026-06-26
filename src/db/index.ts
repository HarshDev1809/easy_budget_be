import { env } from '../config/index.js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const queryClient = postgres(env.databaseUrl, { prepare: false });
const db = drizzle(queryClient);

// Verify connection
try {
    await queryClient`SELECT 1`;
    console.log('Successfully connected to the database.');
} catch (error) {
    console.error('Failed to connect to the database:', error);
    process.exit(1);
}

export default db;
