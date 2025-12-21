import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { hash } from 'bcrypt';

@Injectable()
export class SeedService {
  constructor(private readonly databaseService: DatabaseService) { }

  async seedDemo() {
    // PROTECCIÓN DE DATOS REALES
    // El usuario está trabajando con datos reales. Se desactiva el Seed.
    return { message: 'Seed desactivado para proteger datos reales.' };

    /*
    const hashedPassword = await hash('password', 10);
    // ... existing logic ...
    */
  }
}