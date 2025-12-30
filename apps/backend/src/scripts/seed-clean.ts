import { db } from '../database/db'; // Wait, I need to check how they instantiate db in scripts
import { empresas, usuarios } from '../database/schema';
import { hash } from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
    console.log('--- SEEDING CLEAN DATABASE ---');
    try {
        // 1. Crear Usuario Admin
        const pass = await hash('admin123', 10);
        await db.insert(usuarios).values({
            id: 'admin-01',
            email: 'admin@sentinel.com',
            nombreCompleto: 'Admin Sentinel',
            passwordHash: pass,
            rolGlobal: 'admin'
        }).onConflictDoNothing();

        // 2. Restaurar Empresas Legítimas
        const demoEmpresas = [
            {
                id: '1767074265037',
                rfc: 'TVA060209QL6',
                razonSocial: 'TRASLADOS DE VANGUARDIA SA DE CV',
                activa: true
            },
            {
                id: 'empresa-pnk140311qm2',
                rfc: 'PNK140311QM2',
                razonSocial: 'PRODUCTOS NATURALES KOPPARA DEL BAJIO SA DE CV',
                activa: true
            },
            {
                id: 'empresa-tva060209ql6',
                rfc: 'TVA060209QL6',
                razonSocial: 'TRASLADOS DE VANGUARDIA SA DE CV',
                activa: true
            }
        ];

        for (const e of demoEmpresas) {
            await db.insert(empresas).values(e).onConflictDoNothing();
            console.log(`Empresa registrada: ${e.razonSocial}`);
        }

        console.log('✅ Base de datos saneada y preparada.');
    } catch (e) {
        console.error('Error seeding:', e);
    }
}
seed();
