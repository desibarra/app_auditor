import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as path from 'path';
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
          configService.get<string>('DATABASE_URL') ??
          path.join(process.cwd(), 'data/dev.db');

        console.log('[Database] CWD:', process.cwd());
        console.log('[Database] Intentando abrir:', databasePath);
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
export class DatabaseModule { }
