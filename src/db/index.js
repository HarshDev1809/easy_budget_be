import config from '../config/index.js';
import {drizzle} from 'drizzle-orm/postgres-js';

const db = drizzle(config.database_url);

export default db;
