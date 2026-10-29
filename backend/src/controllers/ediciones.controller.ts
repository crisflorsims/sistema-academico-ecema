import type { Request, Response } from 'express';
import { prisma } from '../prisma.js';

export const getEdiciones = async (req: Request, res: Response): Promise<void> => {
  try {
    const ediciones = await prisma.edicionDiplomado.findMany({
      include: {
        diplomado: true,
        periodo: true,
        _count: {
          select: { inscripciones: true }
        }
      },
      orderBy: {
        id: 'desc'
      }
    });
    res.json(ediciones);
  } catch (error) {
    console.error('[Error en Controlador]:', error);
    res.status(500).json({ error: 'Error al obtener ediciones' });
  }
};

export const createEdicion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { diplomado_id, periodo_id, fecha_inicio, fecha_fin, estado } = req.body;
    
    // Validar si ya existe
    const existing = await prisma.edicionDiplomado.findUnique({
      where: {
        diplomado_id_periodo_id: {
          diplomado_id: parseInt(diplomado_id as string),
          periodo_id: parseInt(periodo_id as string)
        }
      }
    });
    
    if (existing) {
      res.status(400).json({ error: 'La edición para este diplomado y periodo ya existe' });
      return;
    }

    const edicion = await prisma.edicionDiplomado.create({
      data: {
        diplomado_id: parseInt(diplomado_id as string),
        periodo_id: parseInt(periodo_id as string),
        fecha_inicio: fecha_inicio ? new Date(fecha_inicio) : null,
        fecha_fin: fecha_fin ? new Date(fecha_fin) : null,
        estado: estado || 'ABIERTO'
      },
      include: {
        diplomado: true,
        periodo: true
      }
    });
    
    res.status(201).json(edicion);
  } catch (error) {
    console.error('[Error en Controlador]:', error);
    res.status(500).json({ error: 'Error al crear edición' });
  }
};

export const updateEdicionEstado = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { estado } = req.body; // ABIERTO, EN_CURSO, CERRADO
    
    const edicion = await prisma.edicionDiplomado.update({
      where: { id: parseInt(id as string) },
      data: { estado },
      include: {
        diplomado: true,
        periodo: true
      }
    });
    
    res.json(edicion);
  } catch (error) {
    console.error('[Error en Controlador]:', error);
    res.status(500).json({ error: 'Error al actualizar estado de la edición' });
  }
};

export const updateEdicion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { diplomado_id, periodo_id, fecha_inicio, fecha_fin, estado } = req.body;
    
    // Verificar que no se duplique
    const existing = await prisma.edicionDiplomado.findFirst({
      where: {
        diplomado_id: parseInt(diplomado_id as string),
        periodo_id: parseInt(periodo_id as string),
        id: { not: parseInt(id as string) }
      }
    });
    
    if (existing) {
      res.status(400).json({ error: 'Ya existe otra edición para este diplomado en ese periodo' });
      return;
    }

    const edicion = await prisma.edicionDiplomado.update({
      where: { id: parseInt(id as string) },
      data: {
        diplomado_id: parseInt(diplomado_id as string),
        periodo_id: parseInt(periodo_id as string),
        fecha_inicio: fecha_inicio ? new Date(fecha_inicio) : null,
        fecha_fin: fecha_fin ? new Date(fecha_fin) : null,
        estado: estado || 'ABIERTO'
      },
      include: {
        diplomado: true,
        periodo: true
      }
    });
    
    res.json(edicion);
  } catch (error) {
    console.error("Error updateEdicion:", error);
    res.status(500).json({ error: 'Error al actualizar edición' });
  }
};

export const deleteEdicion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    await prisma.edicionDiplomado.delete({
      where: { id: parseInt(id as string) }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('[Error en Controlador]:', error);
    res.status(500).json({ error: 'Error al eliminar edición (asegúrese de que no tenga inscritos)' });
  }
};
