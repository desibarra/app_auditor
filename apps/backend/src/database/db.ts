import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// DB MANUAL - Creada sin Drizzle Kit
const DB_PATH = path.join(process.cwd(), 'data/dev_clean.db');
console.log('[db.ts] CWD:', process.cwd());
console.log(`[Database] Conectando a fuente oficial: ${DB_PATH}`);

const sqlite = new Database(DB_PATH);
export const db = drizzle(sqlite);