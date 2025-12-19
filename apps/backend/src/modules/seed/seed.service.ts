import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { hash } from 'bcrypt';

@Injectable()
export class SeedService {
  constructor(private readonly databaseService: DatabaseService) {}

  async seedDemo() {
    const hashedPassword = await hash('password', 10);

    // Insert demo company
    await this.databaseService.query(
      `INSERT INTO empresas (rfc, razon_social, regimen) VALUES ($1, $2, $3)`,
      ['XAXX010101000', 'Empresa Demo SA de CV', '601']
    );

    // Insert admin user
    await this.databaseService.query(
      `INSERT INTO usuarios (email, password, rol) VALUES ($1, $2, $3)`,
      ['admin@demo.com', hashedPassword, 'admin']
    );

    // Insert demo CFDIs, providers, alerts, and expedientes
    // Placeholder logic for inserting demo data
    // Replace with actual Drizzle ORM or SQL queries

    return { message: 'Demo data seeded successfully' };
  }
}