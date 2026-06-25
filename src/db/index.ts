import { env } from '../config/index.js';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema.js';
import postgres from 'postgres';

const queryClient = postgres(env.databaseUrl);
const db = drizzle(queryClient, { schema });

// Verify connection
try {
    await queryClient`SELECT 1`;
    console.log('Successfully connected to the database.');
} catch (error) {
    console.error('Failed to connect to the database:', error);
    throw error;
}

export default db;
