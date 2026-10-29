import type { Request, Response } from 'express';
import { prisma } from '../prisma.js';

export const getPeriodos = async (req: Request, res: Response): Promise<void> => {
  try {
    const periodos = await prisma.periodo.findMany({
      orderBy: [
        { gestion: 'desc' },
        { semestre: 'desc' }
      ]
    });
    res.json(periodos);
  } catch (error) {
    console.error('[Error en Controlador]:', error);
    res.status(500).json({ error: 'Error al obtener periodos' });
  }
};

export const createPeriodo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { gestion, semestre, fecha_inicio, fecha_fin } = req.body;
    
    const gestionVal = gestion;
    const semestreVal = semestre === "" ? null : semestre;
    
    // Validar si ya existe
    const existing = await prisma.periodo.findFirst({
      where: { gestion: gestionVal, semestre: semestreVal }
    });
    
    if (existing) {
      res.status(400).json({ error: 'El periodo ya existe' });
      return;
    }

    const periodo = await prisma.periodo.create({
      data: {
        gestion: gestionVal,
        semestre: semestreVal,
        fecha_inicio: fecha_inicio ? new Date(fecha_inicio) : null,
        fecha_fin: fecha_fin ? new Date(fecha_fin) : null,
      }
    });
    
    res.status(201).json(periodo);
  } catch (error) {
    console.error("Error createPeriodo:", error);
    res.status(500).json({ error: 'Error al crear periodo' });
  }
};

export const deletePeriodo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    await prisma.periodo.delete({
      where: { id: parseInt(id as string) }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('[Error en Controlador]:', error);
    res.status(500).json({ error: 'Error al eliminar periodo' });
  }
};

export const updatePeriodo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { gestion, semestre, fecha_inicio, fecha_fin } = req.body;
    
    const gestionVal = gestion;
    const semestreVal = semestre === "" ? null : semestre;
    
    // Verificar que no se duplique con otro si cambian gestion y semestre
    const existing = await prisma.periodo.findFirst({
      where: { 
        gestion: gestionVal, 
        semestre: semestreVal,
        id: { not: parseInt(id as string) }
      }
    });
    
    if (existing) {
      res.status(400).json({ error: 'Ya existe otro periodo con esta gestión y semestre' });
      return;
    }

    const periodo = await prisma.periodo.update({
      where: { id: parseInt(id as string) },
      data: {
        gestion: gestionVal,
        semestre: semestreVal,
        fecha_inicio: fecha_inicio ? new Date(fecha_inicio) : null,
        fecha_fin: fecha_fin ? new Date(fecha_fin) : null,
      }
    });
    
    res.json(periodo);
  } catch (error) {
    console.error("Error updatePeriodo:", error);
    res.status(500).json({ error: 'Error al actualizar periodo' });
  }
};
