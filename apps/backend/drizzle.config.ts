import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

export default {
    schema: './src/database/schema/**/*.ts',
    out: './src/database/migrations',
    driver: 'better-sqlite',
    dbCredentials: {
        url: process.env.DATABASE_PATH || './data/dev.db', // Updated to use DATABASE_PATH
    },
    verbose: true, // Enable verbose mode to inspect generated SQL
    strict: false,
} satisfies Config;
