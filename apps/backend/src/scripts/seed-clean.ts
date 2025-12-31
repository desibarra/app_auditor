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

        // 2. Restaurar Empresas Legítimas (STRICT MODE SAT_ACTIVE)
        const demoEmpresas = [
            {
                id: '1767074265037',
                rfc: 'TVA060209QL6',
                razonSocial: 'TRASLADOS DE VANGUARDIA SA DE CV',
                activa: true,
                satStatus: 'ACTIVE',
                satAuthMode: 'FIEL',
                fielKeyEncrypted: 'V4_ENCRYPTED_DUMMY_KEY',
                fielCerEncrypted: 'V4_ENCRYPTED_DUMMY_CER'
            },
            {
                id: 'empresa-pnk140311qm2',
                rfc: 'PNK140311QM2',
                razonSocial: 'PRODUCTOS NATURALES KOPPARA DEL BAJIO SA DE CV',
                activa: true,
                satStatus: 'DISCONNECTED',
                satAuthMode: 'NONE'
            }
        ];

        for (const e of demoEmpresas) {
            await db.insert(empresas).values(e).onConflictDoUpdate({
                target: empresas.rfc,
                set: {
                    id: e.id,
                    satStatus: e.satStatus,
                    satAuthMode: e.satAuthMode,
                    activa: e.activa,
                    fielKeyEncrypted: (e as any).fielKeyEncrypted,
                    fielCerEncrypted: (e as any).fielCerEncrypted
                }
            });
            console.log(`Empresa registrada/actualizada: ${e.razonSocial} (${e.satStatus})`);
        }

        console.log('✅ Base de datos saneada y preparada.');
    } catch (e) {
        console.error('Error seeding:', e);
    }
}
seed();
