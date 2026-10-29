const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DCEA_KEYS = ['doctrinario', 'militar', 'seguridad', 'comando', 'juegos', 'preoral', 'oral', 'trabajos', 'fisico', 'disciplina', 'apreciacion'];
const DCEMA_KEYS = ['doctrinario', 'militar', 'seguridad', 'comando', 'ejercicios', 'preoral', 'oral', 'trabajos', 'fisico', 'disciplina', 'apreciacion'];

function getRandomGrade(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

async function main() {
  console.log("Iniciando el llenado de datos (Mock Data)...");

  // 1. Encontrar un docente o admin para asignar la autoría de las notas
  let docente = await prisma.usuario.findFirst({
    where: { rol: 'DOCENTE' }
  });
  
  if (!docente) {
    docente = await prisma.usuario.findFirst({
      where: { rol: 'ADMIN' }
    });
  }

  if (!docente) {
    console.error("No se encontró ningún usuario para actuar como docente. Abortando.");
    process.exit(1);
  }
  console.log(`Usando usuario '${docente.nombre} ${docente.apellido}' (ID: ${docente.id}) como autor de las notas docentes.`);

  // 2. Obtener todas las inscripciones activas
  const inscripciones = await prisma.inscripcion.findMany({
    where: { estado: 'ACTIVO' },
    include: {
      edicion: {
        include: {
          diplomado: true
        }
      },
      materias: {
        include: {
          calificaciones: true
        }
      }
    }
  });

  console.log(`Se encontraron ${inscripciones.length} inscripciones activas.`);

  for (const insc of inscripciones) {
    const diplomadoNombre = insc.edicion.diplomado.nombre.toUpperCase();
    const isDCEMA = diplomadoNombre.includes('DCEMA');
    const keysToUse = isDCEMA ? DCEMA_KEYS : DCEA_KEYS;
    const notaMinima = isDCEMA ? 80 : 75;

    // --- A. Llenar Ponderaciones (Rol Evaluador) ---
    const ponderaciones = {};
    for (const key of keysToUse) {
      // Notas altas aprobatorias
      ponderaciones[key] = getRandomGrade(notaMinima + 5, 100);
    }

    await prisma.inscripcion.update({
      where: { id: insc.id },
      data: { ponderaciones }
    });

    // --- B. Llenar Notas de Materias (Rol Docente) ---
    for (const mat of insc.materias) {
      // Eliminar calificaciones anteriores de esta materia para evitar duplicados
      await prisma.calificacion.deleteMany({
        where: { inscripcion_materia_id: mat.id }
      });

      // Insertar nueva calificación final
      await prisma.calificacion.create({
        data: {
          inscripcion_materia_id: mat.id,
          docente_id: docente.id,
          evaluacion: "Nota Final (Generada)",
          nota: getRandomGrade(notaMinima, 98),
          observaciones: "Nota ingresada automáticamente para demostración"
        }
      });
    }
  }

  console.log("¡Llenado de datos completado con éxito!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
