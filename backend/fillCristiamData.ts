import { prisma } from './src/prisma.js';

async function main() {
  console.log('Buscando al usuario cristiam...');
  const user = await prisma.usuario.findFirst({
    where: { 
      email: {
        contains: 'cristiam'
      }
    }
  });

  if (!user) {
    console.error('No se encontró al usuario cristiam.');
    return;
  }

  console.log(`Usuario encontrado: ${user.nombre} ${user.apellido} (ID: ${user.id})`);

  const inscripcion = await prisma.inscripcion.findFirst({
    where: {
      cursante_id: user.id,
      estado: 'ACTIVO'
    },
    include: {
      materias: {
        include: {
          materia: true,
          calificaciones: true
        }
      }
    }
  });

  if (!inscripcion) {
    console.error('El usuario cristiam no tiene inscripciones activas.');
    return;
  }

  console.log(`Inscripción encontrada con ${inscripcion.materias.length} materias asignadas.`);

  // Find a generic teacher to assign the grade to
  const docente = await prisma.usuario.findFirst({
    where: { rol: 'DOCENTE' }
  });
  const docenteId = docente ? docente.id : user.id;

  let notasInsertadas = 0;
  
  // Nombres de evaluaciones que usa el frontend
  const evaluaciones = [
    { nombre: '1er Parcial', min: 75, max: 95 },
    { nombre: '2do Parcial', min: 75, max: 98 },
    { nombre: 'Examen Final', min: 70, max: 95 },
    { nombre: 'Apreciación Docente', min: 85, max: 100 }
  ];

  for (const insMateria of inscripcion.materias) {
    for (const ev of evaluaciones) {
      const nota = Math.floor(Math.random() * (ev.max - ev.min + 1)) + ev.min;
      
      // Buscar si ya existe la nota
      const notaExistente = await prisma.calificacion.findFirst({
        where: {
          inscripcion_materia_id: insMateria.id,
          evaluacion: ev.nombre
        }
      });

      if (notaExistente) {
        await prisma.calificacion.update({
          where: { id: notaExistente.id },
          data: { nota }
        });
      } else {
        await prisma.calificacion.create({
          data: {
            inscripcion_materia_id: insMateria.id,
            docente_id: docenteId,
            evaluacion: ev.nombre,
            nota: nota
          }
        });
      }
      notasInsertadas++;
    }
  }

  console.log(`Se insertaron/actualizaron ${notasInsertadas} calificaciones individuales.`);
  
  // Ponderaciones (Trabajo de grado, Liderazgo, etc.)
  const ponderacionesData: any = {
    disciplina: 97 // 100% de la disciplina
  };
  
  const cols = ['tgi', 'trabajo_grados', 'liderazgo', 'plan_estudios', 'don_mando'];
  for (const col of cols) {
    ponderacionesData[col] = Math.floor(Math.random() * (95 - 80 + 1)) + 80;
  }

  await prisma.inscripcion.update({
    where: { id: inscripcion.id },
    data: { ponderaciones: ponderacionesData }
  });
  
  console.log('Se actualizaron las ponderaciones finales.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
