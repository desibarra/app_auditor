
const { drizzle } = require('drizzle-orm/better-sqlite3');
const Database = require('better-sqlite3');
const { sql } = require('drizzle-orm');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/dev_clean.db');
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

async function test() {
    try {
        console.log('Testing db.all...');
        if (typeof db.all === 'function') {
            const res = await db.all(sql`SELECT 1 as val`);
            console.log('db.all success:', res);
        } else {
            console.log('db.all is NOT a function');
            console.log('Keys on db:', Object.keys(db));
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

test();
