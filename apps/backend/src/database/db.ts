import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

const sqlite = new Database(process.env.DATABASE_URL || './data/dev.db'); // Added fallback for DATABASE_URL
export const db = drizzle(sqlite, { schema });