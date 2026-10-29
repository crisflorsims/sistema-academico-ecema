import type { Request, Response } from 'express';
import { prisma } from '../prisma.js';

export const getEstadisticasGlobales = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarios = await prisma.usuario.groupBy({ by: ['rol'], _count: { id: true } });
    const usuariosStats = {
      ADMIN: usuarios.find(u => u.rol === 'ADMIN')?._count.id || 0,
      DOCENTE: usuarios.find(u => u.rol === 'DOCENTE')?._count.id || 0,
      CURSANTE: usuarios.find(u => u.rol === 'CURSANTE')?._count.id || 0,
      total: 0
    };
    usuariosStats.total = usuariosStats.ADMIN + usuariosStats.DOCENTE + usuariosStats.CURSANTE;

    const totalDiplomados = await prisma.diplomado.count();
    const totalMaterias = await prisma.materia.count();

    const inscripciones = await prisma.inscripcion.groupBy({ by: ['estado'], _count: { id: true } });
    const inscripcionesStats = {
      ACTIVO: inscripciones.find(i => i.estado === 'ACTIVO')?._count.id || 0,
      EGRESADO: inscripciones.find(i => i.estado === 'EGRESADO')?._count.id || 0,
      ABANDONO: inscripciones.find(i => i.estado === 'ABANDONO')?._count.id || 0,
      total: 0
    };
    inscripcionesStats.total = inscripcionesStats.ACTIVO + inscripcionesStats.EGRESADO + inscripcionesStats.ABANDONO;

    const recientes = await prisma.inscripcion.findMany({
      take: 5,
      orderBy: { fecha_inscripcion: 'desc' },
      include: {
        cursante: { select: { nombre: true, apellido: true } },
        edicion: { include: { diplomado: { select: { nombre: true } } } }
      }
    });

    res.json({
      usuarios: usuariosStats,
      academicos: { diplomados: totalDiplomados, materias: totalMaterias },
      inscripciones: inscripcionesStats,
      actividadReciente: recientes
    });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({ error: 'Error interno al generar estadísticas' });
  }
};

export const getEstadisticasAprobacion = async (req: Request, res: Response): Promise<void> => {
  try {
    const inscripciones = await prisma.inscripcionMateria.findMany({
      include: {
        calificaciones: true,
        materia: {
          include: { diplomado: true, area: true }
        },
        inscripcion: {
          include: { edicion: { include: { periodo: true } } }
        }
      }
    });

    const statsDiplomados: Record<string, { gestion: string, nombre: string, aprobados: number, reprobados: number }> = {};
    const statsAreas: Record<string, { gestion: string, nombre: string, aprobados: number, reprobados: number }> = {};

    for (const insc of inscripciones) {
      if (insc.calificaciones.length === 0) continue; // Ignorar si no tiene notas

      const totalNota = insc.calificaciones.reduce((sum, cal) => sum + cal.nota, 0);
      const diplomadoNombre = insc.materia.diplomado.nombre;
      const areaNombre = insc.materia.area?.nombre || 'Sin Área';
      const gestion = insc.inscripcion.edicion.periodo.gestion || 'Sin Gestión';

      let notaMinima = 71;
      const dNombreUpper = diplomadoNombre.toUpperCase();
      if (dNombreUpper.includes('DCEMA')) {
        notaMinima = 80;
      } else if (dNombreUpper.includes('DCEA')) {
        notaMinima = 75;
      }

      const esAprobado = totalNota >= notaMinima;

      const keyDiplomado = `${gestion}-${diplomadoNombre}`;
      const keyArea = `${gestion}-${areaNombre}`;

      if (!statsDiplomados[keyDiplomado]) {
        statsDiplomados[keyDiplomado] = { gestion, nombre: diplomadoNombre, aprobados: 0, reprobados: 0 };
      }
      if (!statsAreas[keyArea]) {
        statsAreas[keyArea] = { gestion, nombre: areaNombre, aprobados: 0, reprobados: 0 };
      }

      if (esAprobado) {
        statsDiplomados[keyDiplomado].aprobados++;
        statsAreas[keyArea].aprobados++;
      } else {
        statsDiplomados[keyDiplomado].reprobados++;
        statsAreas[keyArea].reprobados++;
      }
    }

    res.json({ diplomados: Object.values(statsDiplomados), areas: Object.values(statsAreas) });
  } catch (error) {
    console.error("Error al obtener estadísticas de aprobación:", error);
    res.status(500).json({ error: 'Error interno al generar estadísticas de aprobación' });
  }
};

export const getReporteCalificacionesRaw = async (req: Request, res: Response): Promise<void> => {
  try {
    const { edicion_id } = req.query;

    const whereClause = edicion_id ? { edicion_id: parseInt(edicion_id as string) } : {};

    const inscripciones = await prisma.inscripcion.findMany({
      where: whereClause,
      include: {
        cursante: { select: { nombre: true, apellido: true, ci: true, cm: true, grado: true, email: true } },
        edicion: { include: { diplomado: true, periodo: true } },
        materias: {
          include: {
            materia: {
              include: { area: true }
            },
            calificaciones: true
          }
        }
      },
      orderBy: { cursante: { apellido: 'asc' } }
    });

    // Formatear los datos para consumo plano del frontend (ideal para Excel/PDF)
    const reportData = inscripciones.map(insc => {
      const notas = insc.materias.map(im => {
        // Asumiendo que 4 evaluaciones componen la nota final
        const p1 = im.calificaciones.find(c => c.evaluacion === '1er Parcial')?.nota || 0;
        const p2 = im.calificaciones.find(c => c.evaluacion === '2do Parcial')?.nota || 0;
        const ex = im.calificaciones.find(c => c.evaluacion === 'Examen Final')?.nota || 0;
        const ap = im.calificaciones.find(c => c.evaluacion === 'Apreciación Docente')?.nota || 0;
        
        let hasAll = im.calificaciones.length >= 4; // Simplificado, mejor verificar presencia real
        // Para ser más precisos:
        const hasP1 = im.calificaciones.some(c => c.evaluacion === '1er Parcial');
        const hasP2 = im.calificaciones.some(c => c.evaluacion === '2do Parcial');
        const hasEx = im.calificaciones.some(c => c.evaluacion === 'Examen Final');
        const hasAp = im.calificaciones.some(c => c.evaluacion === 'Apreciación Docente');
        
        hasAll = hasP1 && hasP2 && hasEx && hasAp;
        const final = hasAll ? (p1 * 0.25) + (p2 * 0.25) + (ex * 0.40) + (ap * 0.10) : null;

        return {
          materia: im.materia.nombre,
          area: im.materia.area?.nombre || 'General',
          creditos: im.materia.creditos,
          p1, p2, ex, ap,
          final: final ? final.toFixed(2) : 'S/N' // Sin Nota
        };
      });

      return {
        id: insc.id,
        grado: insc.cursante.grado,
        nombre: `${insc.cursante.nombre} ${insc.cursante.apellido}`,
        ci: insc.cursante.ci,
        cm: insc.cursante.cm,
        email: insc.cursante.email,
        diplomado: insc.edicion.diplomado.nombre,
        gestion: insc.edicion.periodo.gestion,
        semestre: insc.edicion.periodo.semestre,
        estado: insc.estado,
        notas
      };
    });

    res.json(reportData);
  } catch (error) {
    console.error("Error al generar reporte crudo:", error);
    res.status(500).json({ error: 'Error al generar reporte crudo' });
  }
};
