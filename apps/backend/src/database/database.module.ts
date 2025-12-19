import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3'; // Updated to use better-sqlite3 directly
import * as schema from './schema';

@Global()
@Module({
  providers: [
    {
      provide: 'DRIZZLE_CLIENT',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databasePath =
          configService.get<string>('DATABASE_PATH') ?? './data/dev.db';

        const db = new Database(databasePath); // Use better-sqlite3 directly

        return drizzle(db, { schema });
      },
    },
  ],
  exports: ['DRIZZLE_CLIENT'],
})
export class DatabaseModule {}