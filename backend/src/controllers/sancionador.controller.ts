import type { Request, Response } from 'express';
import { prisma } from '../prisma.js';

export const getSancionadores = async (req: Request, res: Response): Promise<void> => {
  try {
    const sancionadores = await prisma.sancionador.findMany({
      orderBy: { nombre: 'asc' }
    });
    res.json(sancionadores);
  } catch (error) {
    console.error('[Error al obtener sancionadores]:', error);
    res.status(500).json({ error: 'Error al obtener sancionadores' });
  }
};

export const createSancionador = async (req: Request, res: Response): Promise<void> => {
  try {
    const { grado, nombre, apellido, activo } = req.body;
    
    const nuevoSancionador = await prisma.sancionador.create({
      data: {
        grado,
        nombre,
        apellido,
        activo: activo !== undefined ? activo : true
      }
    });

    res.json(nuevoSancionador);
  } catch (error) {
    console.error('[Error al crear sancionador]:', error);
    res.status(500).json({ error: 'Error al crear sancionador' });
  }
};

export const updateSancionador = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { grado, nombre, apellido, activo } = req.body;

    const actualizado = await prisma.sancionador.update({
      where: { id: Number(id) },
      data: {
        grado,
        nombre,
        apellido,
        activo
      }
    });

    res.json(actualizado);
  } catch (error) {
    console.error('[Error al actualizar sancionador]:', error);
    res.status(500).json({ error: 'Error al actualizar sancionador' });
  }
};

export const deleteSancionador = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    await prisma.sancionador.delete({
      where: { id: Number(id) }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('[Error al eliminar sancionador]:', error);
    res.status(500).json({ error: 'Error al eliminar sancionador' });
  }
};
