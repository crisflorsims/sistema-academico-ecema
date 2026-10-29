import type { Request, Response } from 'express';
import { prisma } from '../prisma.js';

export const getAsignaciones = async (req: Request, res: Response): Promise<void> => {
  try {
    const asignaciones = await prisma.docenteMateria.findMany({
      include: {
        docente: { select: { id: true, nombre: true, apellido: true, email: true } },
        materia: { include: { diplomado: { select: { nombre: true } }, area: { select: { nombre: true } } } },
        edicion: { include: { periodo: true } }
      },
      orderBy: { id: 'desc' }
    });
    res.json(asignaciones);
  } catch (error) {
    console.error("Error al obtener asignaciones:", error);
    res.status(500).json({ error: 'Error al obtener asignaciones' });
  }
};

export const asignarDocente = async (req: Request, res: Response): Promise<void> => {
  try {
    const { docente_id, materia_id, edicion_id } = req.body;
    
    if (!edicion_id) {
      res.status(400).json({ error: 'La edición/periodo es obligatoria' });
      return;
    }

    const existing = await prisma.docenteMateria.findUnique({
      where: {
        docente_id_materia_id_edicion_id: {
          docente_id: parseInt(docente_id as string),
          materia_id: parseInt(materia_id as string),
          edicion_id: parseInt(edicion_id as string)
        }
      }
    });
    
    if (existing) {
      res.status(400).json({ error: 'El docente ya está asignado a esta materia' });
      return;
    }

    const asignacion = await prisma.docenteMateria.create({
      data: {
        docente_id: parseInt(docente_id as string),
        materia_id: parseInt(materia_id as string),
        edicion_id: parseInt(edicion_id as string)
      },
      include: {
        docente: { select: { nombre: true, apellido: true } },
        materia: { select: { nombre: true } },
        edicion: { include: { periodo: true } }
      }
    });
    
    res.status(201).json(asignacion);
  } catch (error) {
    console.error('[Error en Controlador]:', error);
    res.status(500).json({ error: 'Error al asignar docente' });
  }
};

export const desasignarDocente = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    await prisma.docenteMateria.delete({
      where: { id: parseInt(id as string) }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('[Error en Controlador]:', error);
    res.status(500).json({ error: 'Error al eliminar asignación' });
  }
};
