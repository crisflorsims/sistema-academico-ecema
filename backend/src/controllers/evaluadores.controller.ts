import type { Request, Response } from 'express';
import { prisma } from '../prisma.js';

export const getAsignaciones = async (req: Request, res: Response): Promise<void> => {
  try {
    const asignaciones = await prisma.evaluadorMateria.findMany({
      include: {
        evaluador: { select: { id: true, nombre: true, apellido: true, email: true, rol: true } },
        materia: { include: { diplomado: { select: { nombre: true } }, area: { select: { nombre: true } } } },
        edicion: { include: { periodo: true } }
      },
      orderBy: { id: 'desc' }
    });
    res.json(asignaciones);
  } catch (error) {
    console.error("Error al obtener asignaciones de evaluadores:", error);
    res.status(500).json({ error: 'Error al obtener asignaciones' });
  }
};

export const asignarEvaluador = async (req: Request, res: Response): Promise<void> => {
  try {
    const { evaluador_id, materia_id, edicion_id } = req.body;
    
    if (!edicion_id) {
      res.status(400).json({ error: 'La edición/periodo es obligatoria' });
      return;
    }

    const existing = await prisma.evaluadorMateria.findUnique({
      where: {
        evaluador_id_materia_id_edicion_id: {
          evaluador_id: parseInt(evaluador_id as string),
          materia_id: parseInt(materia_id as string),
          edicion_id: parseInt(edicion_id as string)
        }
      }
    });
    
    if (existing) {
      res.status(400).json({ error: 'El evaluador ya está asignado a esta materia' });
      return;
    }

    const asignacion = await prisma.evaluadorMateria.create({
      data: {
        evaluador_id: parseInt(evaluador_id as string),
        materia_id: parseInt(materia_id as string),
        edicion_id: parseInt(edicion_id as string)
      },
      include: {
        evaluador: { select: { nombre: true, apellido: true } },
        materia: { select: { nombre: true } },
        edicion: { include: { periodo: true } }
      }
    });
    
    res.status(201).json(asignacion);
  } catch (error) {
    console.error('[Error en Controlador]:', error);
    res.status(500).json({ error: 'Error al asignar evaluador' });
  }
};
export const asignarEvaluadorMasivo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { evaluador_id, edicion_id } = req.body;
    
    if (!evaluador_id || !edicion_id) {
      res.status(400).json({ error: 'El evaluador y la edición son obligatorios' });
      return;
    }

    // Obtener la edición específica con su diplomado y materias
    const edicion = await prisma.edicionDiplomado.findUnique({
      where: { id: parseInt(edicion_id as string) },
      include: {
        diplomado: {
          include: {
            materias: true
          }
        }
      }
    });

    if (!edicion) {
      res.status(404).json({ error: 'Edición no encontrada' });
      return;
    }

    const nuevasAsignaciones: any[] = [];

    // Generar la asignación por cada materia del diplomado
    for (const materia of edicion.diplomado.materias) {
      nuevasAsignaciones.push({
        evaluador_id: parseInt(evaluador_id as string),
        materia_id: materia.id,
        edicion_id: edicion.id
      });
    }

    if (nuevasAsignaciones.length === 0) {
      res.status(400).json({ error: 'No se encontraron materias para esta edición' });
      return;
    }

    // Inserción masiva ignorando duplicados si el evaluador ya estaba asignado a algunas
    const result = await prisma.evaluadorMateria.createMany({
      data: nuevasAsignaciones,
      skipDuplicates: true
    });
    
    res.status(201).json({ message: `Se asignaron ${result.count} materias al evaluador exitosamente.` });
  } catch (error) {
    console.error("Error al asignar masivamente:", error);
    res.status(500).json({ error: 'Error al asignar evaluador masivamente' });
  }
};
export const desasignarEvaluador = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    await prisma.evaluadorMateria.delete({
      where: { id: parseInt(id as string) }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('[Error en Controlador]:', error);
    res.status(500).json({ error: 'Error al eliminar asignación' });
  }
};

export const toggleJurisdiccionEvaluador = async (req: Request, res: Response): Promise<void> => {
  try {
    const { evaluador_id, codigo_diplomado, habilitar } = req.body;
    const targetEvalId = parseInt(evaluador_id as string);
    const cod = (codigo_diplomado || '').toString().toUpperCase();

    if (isNaN(targetEvalId) || (cod !== 'DCEA' && cod !== 'DCEMA')) {
      res.status(400).json({ error: 'Datos de evaluador o diplomado inválidos' });
      return;
    }

    // Buscar el diplomado correspondiente (DCEA o DCEMA)
    const diplomados = await prisma.diplomado.findMany({
      include: {
        materias: true,
        ediciones: {
          orderBy: { id: 'desc' }
        }
      }
    });

    const diplomado = diplomados.find(d => d.nombre.toUpperCase().includes(cod));
    if (!diplomado) {
      res.status(404).json({ error: `No se encontró el diplomado ${cod}` });
      return;
    }

    if (!habilitar) {
      // Revocar todas las asignaciones de este evaluador en este diplomado
      const materiaIds = diplomado.materias.map(m => m.id);
      const deleted = await prisma.evaluadorMateria.deleteMany({
        where: {
          evaluador_id: targetEvalId,
          materia_id: { in: materiaIds }
        }
      });

      res.json({
        message: `Acceso a ${cod} bloqueado/revocado para el evaluador (${deleted.count} asignaturas desvinculadas).`,
        habilitado: false
      });
      return;
    }

    // Habilitar: Buscar la edición activa (EN_CURSO o ABIERTO) o la más reciente
    const edicionActiva =
      diplomado.ediciones.find(e => e.estado === 'EN_CURSO' || e.estado === 'ABIERTO') ||
      diplomado.ediciones[0];

    if (!edicionActiva) {
      res.status(400).json({ error: `No existe ninguna edición creada para ${cod}. Cree primero una edición en Periodos y Ediciones.` });
      return;
    }

    if (diplomado.materias.length === 0) {
      res.status(400).json({ error: `El diplomado ${cod} no tiene materias registradas.` });
      return;
    }

    const nuevasAsignaciones = diplomado.materias.map(m => ({
      evaluador_id: targetEvalId,
      materia_id: m.id,
      edicion_id: edicionActiva.id
    }));

    const result = await prisma.evaluadorMateria.createMany({
      data: nuevasAsignaciones,
      skipDuplicates: true
    });

    res.status(201).json({
      message: `Jurisdicción ${cod} habilitada exitosamente (${result.count} asignaturas vinculadas).`,
      habilitado: true
    });
  } catch (error) {
    console.error('[Error en toggleJurisdiccionEvaluador]:', error);
    res.status(500).json({ error: 'Error al actualizar la jurisdicción del evaluador' });
  }
};
