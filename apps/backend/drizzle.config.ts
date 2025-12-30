import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './src/database/schema/**/*.ts',
    out: './src/database/migrations',
    driver: 'better-sqlite',
    dbCredentials: {
        url: 'data/dev_clean.db',
    },
    verbose: true,
    strict: false,
});
