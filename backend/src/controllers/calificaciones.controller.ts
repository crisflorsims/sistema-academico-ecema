import type { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import type { AuthRequest } from '../middlewares/auth.middleware.js';
import { eventosService } from '../services/eventos.service.js';

// Obtener las materias asignadas a un docente
export const getDocenteMaterias = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const rol = req.user?.rol;

    if (!userId) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    let materiasAsignadas = [];

    if (rol === 'EVALUADOR') {
      const evaluadorMaterias = await prisma.evaluadorMateria.findMany({
        where: { evaluador_id: userId },
        include: {
          materia: {
            include: { diplomado: true, area: true }
          },
          edicion: {
            include: { periodo: true }
          }
        }
      });
      // Normalizamos la salida para que el frontend no note la diferencia
      materiasAsignadas = evaluadorMaterias.map(em => ({
        id: em.id,
        docente_id: em.evaluador_id,
        materia_id: em.materia_id,
        edicion_id: em.edicion_id,
        materia: em.materia,
        edicion: em.edicion
      }));
    } else {
      materiasAsignadas = await prisma.docenteMateria.findMany({
        where: { docente_id: userId },
        include: {
          materia: {
            include: { diplomado: true, area: true }
          },
          edicion: {
            include: { periodo: true }
          }
        }
      });
    }

    res.json(materiasAsignadas);
  } catch (error) {
    console.error('[Error en Controlador]:', error);
    res.status(500).json({ error: 'Error al obtener materias asignadas' });
  }
};

// Obtener cursantes inscritos en una materia específica
export const getCursantesMateria = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { materia_id } = req.params;

    const inscripciones = await prisma.inscripcionMateria.findMany({
      where: { materia_id: parseInt(materia_id as string) },
      include: {
        inscripcion: {
          include: {
            cursante: {
              select: { id: true, nombre: true, apellido: true, email: true, grado: true, cm: true }
            }
          }
        },
        calificaciones: true
      }
    });

    res.json(inscripciones);
  } catch (error) {
    console.error('[Error en Controlador]:', error);
    res.status(500).json({ error: 'Error al obtener cursantes' });
  }
};

// Registrar o actualizar nota
export const registrarNota = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const docenteId = req.user?.userId;
    const rol = req.user?.rol;
    const { inscripcion_materia_id, evaluacion, nota, rubrica, observaciones } = req.body;

    if (!docenteId) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    // Validación de seguridad por roles
    if (rol === 'DOCENTE' && evaluacion !== 'Apreciación Docente') {
      res.status(403).json({ error: 'Como docente, solo tienes permisos para calificar la Apreciación Docente.' });
      return;
    }
    
    if (rol === 'EVALUADOR' && evaluacion === 'Apreciación Docente') {
      res.status(403).json({ error: 'Como evaluador, no tienes permisos para calificar la Apreciación Docente.' });
      return;
    }

    // Validar que la nota esté entre 0 y 100
    if (nota < 0 || nota > 100) {
      res.status(400).json({ error: 'La nota debe estar entre 0 y 100' });
      return;
    }

    // Redondear a máximo 2 decimales para evitar artefactos de coma flotante
    const notaRedondeada = Math.round(parseFloat(nota) * 100) / 100;

    const targetInscMatId = parseInt(inscripcion_materia_id as string);

    // Obtener la nota anterior si existía para registrar auditoría
    const calificacionExistente = await prisma.calificacion.findUnique({
      where: {
        inscripcion_materia_id_evaluacion: {
          inscripcion_materia_id: targetInscMatId,
          evaluacion
        }
      }
    });

    const calificacion = await prisma.calificacion.upsert({
      where: {
        inscripcion_materia_id_evaluacion: {
          inscripcion_materia_id: targetInscMatId,
          evaluacion
        }
      },
      update: {
        nota: notaRedondeada,
        docente_id: docenteId,
        rubrica: rubrica || null,
        observaciones: observaciones || null
      },
      create: {
        inscripcion_materia_id: targetInscMatId,
        docente_id: docenteId,
        evaluacion,
        nota: notaRedondeada,
        rubrica: rubrica || null,
        observaciones: observaciones || null
      }
    });

    // Registrar auditoria si la nota cambió
    if (calificacionExistente && calificacionExistente.nota !== notaRedondeada) {
      await prisma.auditoriaNota.create({
        data: {
          calificacion_id: calificacion.id,
          usuario_id: docenteId,
          nota_anterior: calificacionExistente.nota,
          nota_nueva: notaRedondeada
        }
      });
    }

    // Obtener info adicional para el log
    const inscMateriaInfo = await prisma.inscripcionMateria.findUnique({
      where: { id: parseInt(inscripcion_materia_id as string) },
      include: {
        materia: true,
        inscripcion: {
          include: { cursante: true }
        }
      }
    });

    if (inscMateriaInfo) {
      const cursante = inscMateriaInfo.inscripcion.cursante;
      const materia = inscMateriaInfo.materia;
      const curNom = `${cursante.grado ? cursante.grado + ' ' : ''}${cursante.nombre} ${cursante.apellido}`;
      const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || req.ip || '127.0.0.1';
      const userAgent = (req.headers['user-agent'] as string) || 'Navegador Web';

      await eventosService.registrarEvento(
        docenteId,
        calificacionExistente ? 'EDITAR' : 'CREAR',
        'NOTA',
        {
          detalles: calificacionExistente
            ? `Modificación de nota en ${materia.nombre} (${evaluacion}). Nota anterior: ${calificacionExistente.nota} ➔ Nueva nota: ${nota}. Cursante: ${curNom}`
            : `Registro inicial de nota en ${materia.nombre} (${evaluacion}: ${nota}) para el cursante ${curNom}`,
          severidad: calificacionExistente ? 'CRITICA' : 'BAJA',
          objeto_afectado: curNom,
          valor_anterior: calificacionExistente ? calificacionExistente.nota : null,
          valor_nuevo: parseFloat(nota),
          ip: clientIp,
          dispositivo: userAgent,
          metadata: {
            materia: materia.nombre,
            evaluacion,
            cursante: curNom
          }
        }
      );
    }

    res.json(calificacion);
  } catch (error) {
    console.error('[Error en Controlador]:', error);
    res.status(500).json({ error: 'Error al registrar nota' });
  }
};
