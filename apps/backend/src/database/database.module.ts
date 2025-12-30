import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { DatabaseService } from './database.service';

@Global()
@Module({
  providers: [
    {
      provide: 'DRIZZLE_CLIENT',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databasePath =
          configService.get<string>('DATABASE_PATH') ?? './data/dev.db';

        const db = new Database(databasePath);

        return drizzle(db, { schema });
      },
    },
    DatabaseService, // 👈 SE REGISTRA COMO PROVIDER
  ],
  exports: [
    'DRIZZLE_CLIENT',
    DatabaseService, // 👈 CLAVE: SE EXPORTA
  ],
})
export class DatabaseModule {}
