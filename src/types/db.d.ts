// src/types/db.ts
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { PgTransaction } from 'drizzle-orm/pg-core';

// This type represents either the main DB or a Transaction
export type DB = PostgresJsDatabase<any> | PgTransaction<any, any, any>;