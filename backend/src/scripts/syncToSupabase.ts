import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import 'dotenv/config';

/**
 * Script para copiar todos los datos de tu PostgreSQL local hacia Supabase.
 * Uso:
 *   $env:SUPABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"
 *   npx tsx src/scripts/syncToSupabase.ts
 */
async function main() {
  const localUrl = process.env.DATABASE_URL;
  const remoteUrl = process.env.SUPABASE_URL;

  if (!localUrl) {
    console.error('❌ Falta DATABASE_URL en backend/.env');
    process.exit(1);
  }
  if (!remoteUrl) {
    console.error('❌ Falta definir SUPABASE_URL con la cadena de conexión de Supabase');
    process.exit(1);
  }

  console.log('🔌 Conectando a PostgreSQL Local y a Supabase...');
  const localPool = new pg.Pool({ connectionString: localUrl });
  const remotePool = new pg.Pool({
    connectionString: remoteUrl,
    ssl: { rejectUnauthorized: false },
  });

  const localPrisma = new PrismaClient({ adapter: new PrismaPg(localPool) });
  const remotePrisma = new PrismaClient({ adapter: new PrismaPg(remotePool) });

  try {
    console.log('📥 Leyendo datos locales...');
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

    console.log('🚀 Subiendo datos a Supabase...');

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
    if (configs.length) await remotePrisma.configuracionInstituto.createMany({ data: configs, skipDuplicates: true });
    if (eventos.length) await remotePrisma.evento.createMany({ data: eventos, skipDuplicates: true });

    // Ajustar secuencias de IDs en PostgreSQL remoto
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

    console.log(`✅ ¡Sincronización completada con éxito!`);
    console.log(`   - Usuarios: ${usuarios.length}`);
    console.log(`   - Diplomados: ${diplomados.length} | Materias: ${materias.length}`);
    console.log(`   - Inscripciones: ${inscripciones.length} | Calificaciones: ${calificaciones.length}`);
  } finally {
    await localPrisma.$disconnect();
    await remotePrisma.$disconnect();
    await localPool.end();
    await remotePool.end();
  }
}

main().catch((err) => {
  console.error('❌ Error al sincronizar:', err);
  process.exit(1);
});

