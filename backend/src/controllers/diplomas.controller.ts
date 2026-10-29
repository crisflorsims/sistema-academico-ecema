import type { Request, Response } from 'express';
import { prisma } from '../prisma.js';

export const getDiplomas = async (req: Request, res: Response): Promise<void> => {
  try {
    const diplomas = await prisma.diplomado.findMany({
      include: {
        materias: true,
        areas: {
          include: {
            materias: true
          }
        }
      }
    });
    res.json(diplomas);
  } catch (error) {
    console.error("GET DIPLOMAS ERROR:", error);
    res.status(500).json({ error: 'Error al obtener diplomados' });
  }
};

export const createDiplomado = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, descripcion, tipo, duracion } = req.body;
    const diplomado = await prisma.diplomado.create({
      data: {
        nombre,
        descripcion,
        tipo,
        duracion
      }
    });
    res.status(201).json(diplomado);
  } catch (error) {
    console.error('[Error en Controlador]:', error);
    res.status(500).json({ error: 'Error al crear diplomado' });
  }
};

export const createArea = async (req: Request, res: Response): Promise<void> => {
  try {
    const { diplomado_id } = req.params;
    const { nombre } = req.body;
    
    const area = await prisma.area.create({
      data: {
        nombre,
        diplomado_id: parseInt(diplomado_id as string)
      }
    });
    res.status(201).json(area);
  } catch (error) {
    console.error('[Error en Controlador]:', error);
    res.status(500).json({ error: 'Error al crear área' });
  }
};

export const createMateria = async (req: Request, res: Response): Promise<void> => {
  try {
    const { diplomado_id } = req.params;
    const { nombre, descripcion, creditos, horas, orden, area_id } = req.body;
    
    const materia = await prisma.materia.create({
      data: {
        nombre,
        descripcion,
        creditos,
        horas,
        orden,
        diplomado_id: parseInt(diplomado_id as string),
        area_id: area_id ? parseInt(area_id as string) : null
      }
    });

    // Sincronizar esta nueva materia con los cursantes que ya estaban inscritos
    const ediciones = await prisma.edicionDiplomado.findMany({
      where: { diplomado_id: parseInt(diplomado_id as string) },
      include: { inscripciones: true }
    });

    const inscripcionesIds = ediciones.flatMap(e => e.inscripciones.map(i => i.id));

    if (inscripcionesIds.length > 0) {
      await prisma.inscripcionMateria.createMany({
        data: inscripcionesIds.map(inscripcion_id => ({
          inscripcion_id,
          materia_id: materia.id
        }))
      });
    }

    res.status(201).json(materia);
  } catch (error) {
    console.error('[Error en Controlador]:', error);
    res.status(500).json({ error: 'Error al crear materia' });
  }
};

export const updateArea = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;
    
    const area = await prisma.area.update({
      where: { id: parseInt(id as string) },
      data: { nombre }
    });
    res.json(area);
  } catch (error) {
    console.error('[Error en Controlador]:', error);
    res.status(500).json({ error: 'Error al actualizar área' });
  }
};

export const updateMateria = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, creditos, horas, orden, area_id } = req.body;
    
    const materia = await prisma.materia.update({
      where: { id: parseInt(id as string) },
      data: {
        nombre,
        descripcion,
        creditos,
        horas,
        orden,
        area_id: area_id ? parseInt(area_id as string) : null
      }
    });
    res.json(materia);
  } catch (error) {
    console.error('[Error en Controlador]:', error);
    res.status(500).json({ error: 'Error al actualizar materia' });
  }
};
