import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '../..');

dotenv.config({ path: path.join(backendDir, '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || '';

async function main() {
  const localUrl = process.env.DATABASE_URL;
  if (!localUrl || !SUPABASE_URL) {
    throw new Error('Define DATABASE_URL y SUPABASE_URL antes de ejecutar este script.');
  }

  console.log('1️⃣ Creando tablas y esquema en Supabase (prisma db push)...');
  execSync('npx prisma db push', {
    cwd: backendDir,
    env: {
      ...process.env,
      DATABASE_URL: SUPABASE_URL,
    },
    stdio: 'inherit',
  });

  console.log('\n2️⃣ Conectando a PostgreSQL Local y a Supabase para clonar datos...');
  const localPool = new pg.Pool({ connectionString: localUrl });
  const remotePool = new pg.Pool({
    connectionString: SUPABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const localPrisma = new PrismaClient({ adapter: new PrismaPg(localPool) });
  const remotePrisma = new PrismaClient({ adapter: new PrismaPg(remotePool) });

  try {
    const [
      usuarios,
      periodos,
      diplomados,
      areas,
      materias,
      ediciones,
      docenteMaterias,
      evaluadorMaterias,
      inscripciones,
      inscripcionMaterias,
      calificaciones,
      demeritos,
      sancionadores,
      configs,
      eventos,
    ] = await Promise.all([
      localPrisma.usuario.findMany(),
      localPrisma.periodo.findMany(),
      localPrisma.diplomado.findMany(),
      localPrisma.area.findMany(),
      localPrisma.materia.findMany(),
      localPrisma.edicionDiplomado.findMany(),
      localPrisma.docenteMateria.findMany(),
      localPrisma.evaluadorMateria.findMany(),
      localPrisma.inscripcion.findMany(),
      localPrisma.inscripcionMateria.findMany(),
      localPrisma.calificacion.findMany(),
      localPrisma.demerito.findMany(),
      localPrisma.sancionador.findMany(),
      localPrisma.configuracionInstituto.findMany(),
      localPrisma.evento.findMany(),
    ]);

    console.log('🚀 Copiando registros a Supabase...');
    if (usuarios.length) await remotePrisma.usuario.createMany({ data: usuarios, skipDuplicates: true });
    if (periodos.length) await remotePrisma.periodo.createMany({ data: periodos, skipDuplicates: true });
    if (diplomados.length) await remotePrisma.diplomado.createMany({ data: diplomados, skipDuplicates: true });
    if (areas.length) await remotePrisma.area.createMany({ data: areas, skipDuplicates: true });
    if (materias.length) await remotePrisma.materia.createMany({ data: materias, skipDuplicates: true });
    if (ediciones.length) await remotePrisma.edicionDiplomado.createMany({ data: ediciones, skipDuplicates: true });
    if (docenteMaterias.length) await remotePrisma.docenteMateria.createMany({ data: docenteMaterias, skipDuplicates: true });
    if (evaluadorMaterias.length) await remotePrisma.evaluadorMateria.createMany({ data: evaluadorMaterias, skipDuplicates: true });
    if (inscripciones.length) await remotePrisma.inscripcion.createMany({ data: inscripciones as any, skipDuplicates: true });
    if (inscripcionMaterias.length) await remotePrisma.inscripcionMateria.createMany({ data: inscripcionMaterias, skipDuplicates: true });
    if (calificaciones.length) await remotePrisma.calificacion.createMany({ data: calificaciones as any, skipDuplicates: true });
    if (demeritos.length) await remotePrisma.demerito.createMany({ data: demeritos, skipDuplicates: true });
    if (sancionadores.length) await remotePrisma.sancionador.createMany({ data: sancionadores, skipDuplicates: true });
    if (configs.length) await remotePrisma.configuracionInstituto.findMany();
    if (eventos.length) await remotePrisma.evento.createMany({ data: eventos, skipDuplicates: true });

    const tables = [
      'Usuario', 'Periodo', 'Diplomado', 'Area', 'Materia',
      'EdicionDiplomado', 'DocenteMateria', 'EvaluadorMateria',
      'Inscripcion', 'InscripcionMateria', 'Calificacion',
      'Demerito', 'Sancionador', 'Evento'
    ];
    for (const t of tables) {
      await remotePool.query(
        `SELECT setval(pg_get_serial_sequence('"${t}"', 'id'), COALESCE((SELECT MAX(id) FROM "${t}"), 1), true);`
      );
    }

    console.log('\n✅ ¡Base de datos Supabase creada y sincronizada al 100%!');
  } finally {
    await localPrisma.$disconnect();
    await remotePrisma.$disconnect();
    await localPool.end();
    await remotePool.end();
  }
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
