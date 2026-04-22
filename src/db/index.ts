import {env} from '../config/index.js';
import {drizzle} from 'drizzle-orm/postgres-js';

const db = drizzle(env.databaseUrl);

export default db;
