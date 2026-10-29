import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import * as bcrypt from 'bcrypt';
const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
async function main() {
    console.log('Starting seed...');
    // 1. Crear configuraciones base
    const configs = [
        { clave: 'nombre_instituto', valor: 'Escuela de Comando y Estado Mayor Aéreo' },
        { clave: 'nombre_corto', valor: 'ECEMA' },
        { clave: 'color_primario', valor: '#1E3A8A' },
        { clave: 'color_secundario', valor: '#F59E0B' },
    ];
    for (const conf of configs) {
        await prisma.configuracionInstituto.upsert({
            where: { clave: conf.clave },
            update: {},
            create: conf,
        });
    }
    // 2. Crear usuario Admin
    const adminEmail = 'admin@ecema.edu';
    const existingAdmin = await prisma.usuario.findUnique({ where: { email: adminEmail } });
    if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await prisma.usuario.create({
            data: {
                nombre: 'Administrador',
                apellido: 'Sistema',
                email: adminEmail,
                password_hash: hashedPassword,
                rol: 'ADMIN',
            },
        });
        console.log('Admin user created: admin@ecema.edu / admin123');
    }
    // 3. Crear diplomados básicos
    const dcea = await prisma.diplomado.create({
        data: {
            nombre: 'Diplomado de Escuadrón Aéreo (DCEA)',
            tipo: 'SEMESTRAL',
            duracion: '6 meses',
        }
    });
    const dcema = await prisma.diplomado.create({
        data: {
            nombre: 'Diplomado de Comando y Estado Mayor Aéreo (DCEMA)',
            tipo: 'ANUAL',
            duracion: '12 meses',
        }
    });
    console.log('Diplomados created.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map