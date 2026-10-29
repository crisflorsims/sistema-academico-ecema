import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
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
            usuarioId: user.id,
            estado: 'ACTIVO'
        },
        include: {
            edicion: {
                include: {
                    diplomado: true,
                    asignacionesDocentes: {
                        include: {
                            materia: true
                        }
                    }
                }
            }
        }
    });
    if (!inscripcion) {
        console.error('El usuario cristiam no tiene inscripciones activas.');
        return;
    }
    console.log(`Inscripción encontrada en: ${inscripcion.edicion.diplomado.nombre}`);
    let notasInsertadas = 0;
    // Generar notas para cada materia
    for (const asignacion of inscripcion.edicion.asignacionesDocentes) {
        // Generar notas aleatorias razonables
        const primerParcial = Math.floor(Math.random() * (95 - 75 + 1)) + 75;
        const segundoParcial = Math.floor(Math.random() * (98 - 75 + 1)) + 75;
        const examenFinal = Math.floor(Math.random() * (95 - 70 + 1)) + 70;
        const apreciacion = Math.floor(Math.random() * (100 - 85 + 1)) + 85;
        // Calcular promedio según la fórmula (25%, 25%, 40%, 10%)
        const promedio = (primerParcial * 0.25) + (segundoParcial * 0.25) + (examenFinal * 0.40) + (apreciacion * 0.10);
        const data = {
            primer_parcial: primerParcial,
            segundo_parcial: segundoParcial,
            examen_final: examenFinal,
            apreciacion_docente: apreciacion,
            promedio: promedio,
            estado: promedio >= 71 ? 'APROBADO' : 'REPROBADO'
        };
        // Upsert the grade
        await prisma.calificacion.upsert({
            where: {
                inscripcionId_asignacionId: {
                    inscripcionId: inscripcion.id,
                    asignacionId: asignacion.id
                }
            },
            update: data,
            create: {
                inscripcionId: inscripcion.id,
                asignacionId: asignacion.id,
                ...data
            }
        });
        notasInsertadas++;
    }
    console.log(`Se insertaron/actualizaron notas para ${notasInsertadas} materias.`);
    // Rellenar notas de ponderaciones (Trabajo de Grado) para evaluar
    // Evaluaremos los campos del DCEA o DCEMA
    const ponderacionesData = {
        disciplina: 100 // Disciplina was 50 points * 2
    };
    // DCEA columns
    const dceaCols = ['tgi', 'trabajo_grados', 'liderazgo', 'plan_estudios'];
    for (const col of dceaCols) {
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
