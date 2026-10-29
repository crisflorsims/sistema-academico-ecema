import type { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import type { AuthRequest } from '../middlewares/auth.middleware.js';

export const getMisNotas = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cursanteId = req.user?.userId;

    if (!cursanteId) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    // Obtener todas las inscripciones del cursante, con sus materias y calificaciones
    const inscripciones = await prisma.inscripcion.findMany({
      where: { cursante_id: cursanteId },
      include: {
        edicion: {
          include: {
            diplomado: true,
            periodo: true
          }
        },
        materias: {
          include: {
            materia: {
              include: { area: true }
            },
            calificaciones: {
              include: {
                docente: {
                  select: { id: true, nombre: true, apellido: true, grado: true }
                },
                auditorias: {
                  orderBy: { fecha: 'desc' },
                  select: { id: true, nota_anterior: true, nota_nueva: true, fecha: true }
                }
              }
            }
          }
        }
      },
      orderBy: { fecha_inscripcion: 'desc' }
    });

    res.json(inscripciones);
  } catch (error) {
    console.error('[Error en Controlador]:', error);
    res.status(500).json({ error: 'Error al obtener las notas' });
  }
};

