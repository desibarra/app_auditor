
const { drizzle } = require('drizzle-orm/better-sqlite3');
const Database = require('better-sqlite3');
const { sqliteTable, text, integer } = require('drizzle-orm/sqlite-core');

// Define Schema minimal for query
const empresas = sqliteTable('empresas', {
    id: text('id').primaryKey(),
    rfc: text('rfc').notNull().unique(),
    razonSocial: text('razon_social').notNull(),
    activa: integer('activa', { mode: 'boolean' }).notNull().default(true),
});

const dbPath = 'c:\\Users\\desib\\Documents\\app_auditor\\apps\\backend\\sqlite.db';
console.log('Checking DB at:', dbPath);

const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

async function check() {
    console.log('Querying empresas...');
    try {
        const result = await db.select().from(empresas).all();
        console.log('Total Empresas:', result.length);
        console.log(JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
}

check();
