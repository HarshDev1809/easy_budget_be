import { env } from '../config/index.js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const queryClient = postgres(env.databaseUrl);
const db = drizzle(queryClient);

// Verify connection (Skip in test environment to avoid process.exit if DB is down)
if (process.env.NODE_ENV !== 'test') {
    try {
        await queryClient`SELECT 1`;
        console.log('Successfully connected to the database.');
    } catch (error) {
        console.error('Failed to connect to the database:', error);
        process.exit(1);
    }
} else {
    try {
        await queryClient`SELECT 1`;
        console.log('Successfully connected to the database.');
    } catch (error) {
        console.error('Failed to connect to the database in test env:', error);
    }
}

export default db;
