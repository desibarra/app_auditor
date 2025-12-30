import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// FUENTE DE VERDAD ÚNICA Y ABSOLUTA (NUEVA)
// Usamos _clean para evitar conflictos con archivos corruptos bloqueados
const DB_PATH = path.resolve(__dirname, '../../data/dev_clean.db');
console.log(`[Database] Conectando a fuente oficial: ${DB_PATH}`);

const sqlite = new Database(DB_PATH);
export const db = drizzle(sqlite, { schema });