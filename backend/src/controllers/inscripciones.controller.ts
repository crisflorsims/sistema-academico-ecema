import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../prisma.js';
import { eventosService } from '../services/eventos.service.js';
import { procesarPonderacionesDCEA } from '../utils/dceaCalculador.js';
import { procesarPonderacionesDCEMA } from '../utils/dcemaCalculador.js';

export const getInscripciones = async (req: Request, res: Response): Promise<void> => {
  try {
    const inscripciones = await prisma.inscripcion.findMany({
      include: {
        cursante: {
          select: { id: true, nombre: true, apellido: true, email: true, grado: true, cm: true, ci: true, promocion: true }
        },
        edicion: {
          include: {
            diplomado: {
              include: { areas: true }
            },
            periodo: true
          }
        },
        demeritos: true,
        materias: {
          include: {
            materia: {
              include: { area: true }
            },
            calificaciones: true
          }
        },
        _count: {
          select: { materias: true }
        }
      },
      orderBy: {
        fecha_inscripcion: 'desc'
      }
    });

    const result = inscripciones.map(insc => {
      const dipNombre = insc.edicion?.diplomado?.nombre?.toUpperCase() || '';
      const isDCEA = dipNombre.includes('DCEA') || (!dipNombre.includes('DCEMA') && insc.edicion?.diplomado_id === 1);

      if (isDCEA) {
        const { ponderaciones, detallesDCEA } = procesarPonderacionesDCEA(
          insc.materias,
          insc.demeritos,
          insc.ponderaciones
        );
        return {
          ...insc,
          ponderaciones,
          detallesDCEA
        };
      }

      const { ponderaciones, detallesDCEA } = procesarPonderacionesDCEMA(
        insc.materias,
        insc.demeritos,
        insc.ponderaciones
      );

      return {
        ...insc,
        ponderaciones,
        detallesDCEA
      };
    });

    res.json(result);
  } catch (error) {
    console.error('[Error en Controlador]:', error);
    res.status(500).json({ error: 'Error al obtener inscripciones' });
  }
};

export const getMisInscripciones = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const inscripciones = await prisma.inscripcion.findMany({
      where: { cursante_id: userId },
      include: {
        edicion: {
          include: {
            diplomado: {
              include: { areas: true }
            },
            periodo: true
          }
        },
        demeritos: true,
        materias: {
          include: {
            materia: {
              include: { area: true }
            },
            calificaciones: true
          }
        }
      },
      orderBy: {
        fecha_inscripcion: 'desc'
      }
    });

    const result = inscripciones.map(insc => {
      const dipNombre = insc.edicion?.diplomado?.nombre?.toUpperCase() || '';
      const isDCEA = dipNombre.includes('DCEA') || (!dipNombre.includes('DCEMA') && insc.edicion?.diplomado_id === 1);

      if (isDCEA) {
        const { ponderaciones, detallesDCEA } = procesarPonderacionesDCEA(
          insc.materias,
          insc.demeritos,
          insc.ponderaciones
        );
        return {
          ...insc,
          ponderaciones,
          detallesDCEA
        };
      }

      const { ponderaciones, detallesDCEA } = procesarPonderacionesDCEMA(
        insc.materias,
        insc.demeritos,
        insc.ponderaciones
      );

      return {
        ...insc,
        ponderaciones,
        detallesDCEA
      };
    });

    res.json(result);
  } catch (error) {
    console.error('[Error en Controlador]:', error);
    res.status(500).json({ error: 'Error al obtener mis inscripciones' });
  }
};

export const createInscripcion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cursante_id, cursante_ids, edicion_id } = req.body;
    const targetEdicionId = parseInt(edicion_id as string);

    if (isNaN(targetEdicionId)) {
      res.status(400).json({ error: 'Debe seleccionar una edición válida' });
      return;
    }

    // Obtener las materias del diplomado asociado a la edición
    const edicion = await prisma.edicionDiplomado.findUnique({
      where: { id: targetEdicionId },
      include: { diplomado: { include: { materias: true } } }
    });

    if (!edicion) {
      res.status(404).json({ error: 'Edición no encontrada' });
      return;
    }

    const idsToEnroll: number[] = Array.isArray(cursante_ids)
      ? cursante_ids.map((id: any) => parseInt(id)).filter(id => !isNaN(id))
      : (cursante_id ? [parseInt(cursante_id as string)] : []);

    if (idsToEnroll.length === 0) {
      res.status(400).json({ error: 'Debe seleccionar al menos un cursante' });
      return;
    }

    // Si es un solo cursante y ya existe, mensaje claro
    if (idsToEnroll.length === 1) {
      const existing = await prisma.inscripcion.findUnique({
        where: {
          cursante_id_edicion_id: {
            cursante_id: idsToEnroll[0] as number,
            edicion_id: targetEdicionId
          }
        }
      });
      if (existing) {
        res.status(400).json({ error: 'El cursante ya está inscrito en esta edición' });
        return;
      }
    }

    const creados: any[] = [];
    const omitidos: number[] = [];

    for (const cId of idsToEnroll) {
      const existing = await prisma.inscripcion.findUnique({
        where: {
          cursante_id_edicion_id: {
            cursante_id: cId,
            edicion_id: targetEdicionId
          }
        }
      });

      if (existing) {
        omitidos.push(cId);
        continue;
      }

      const inscripcion = await prisma.inscripcion.create({
        data: {
          cursante_id: cId,
          edicion_id: targetEdicionId,
          materias: {
            create: edicion.diplomado.materias.map(materia => ({
              materia_id: materia.id
            }))
          }
        },
        include: {
          cursante: { select: { nombre: true, apellido: true } },
          edicion: { include: { diplomado: true } }
        }
      });
      creados.push(inscripcion);
    }

    if (creados.length === 0 && omitidos.length > 0) {
      res.status(400).json({ error: 'Los cursantes seleccionados ya están inscritos en esta edición' });
      return;
    }

    res.status(201).json({
      message: `Se matricularon ${creados.length} cursante(s) exitosamente`,
      total: creados.length,
      creados,
      omitidos
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear inscripción' });
  }
};

export const updateInscripcionEstado = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { estado } = req.body; // ACTIVO, EGRESADO, ABANDONO
    
    const inscripcion = await prisma.inscripcion.update({
      where: { id: parseInt(id as string) },
      data: { estado }
    });
    
    res.json(inscripcion);
  } catch (error) {
    console.error('[Error en Controlador]:', error);
    res.status(500).json({ error: 'Error al actualizar estado de la inscripción' });
  }
};

export const updateInscripcion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { cursante_id, edicion_id, estado } = req.body;
    
    const updateData: any = {};
    if (cursante_id !== undefined) updateData.cursante_id = parseInt(cursante_id as string);
    if (edicion_id !== undefined) updateData.edicion_id = parseInt(edicion_id as string);
    if (estado !== undefined) updateData.estado = estado;

    const inscripcion = await prisma.inscripcion.update({
      where: { id: parseInt(id as string) },
      data: updateData
    });
    
    res.json(inscripcion);
  } catch (error) {
    console.error('[Error en Controlador]:', error);
    res.status(500).json({ error: 'Error al actualizar inscripción' });
  }
};

export const deleteInscripcion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.inscripcion.delete({ where: { id: parseInt(id as string) } });
    res.json({ message: 'Inscripción eliminada correctamente' });
  } catch (error) {
    console.error('[Error en Controlador]:', error);
    res.status(500).json({ error: 'Error al eliminar inscripción' });
  }
};

export const updatePonderaciones = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { ponderaciones } = req.body;
    
    // Evitar que el Evaluador sobreescriba campos calculados automáticamente
    const camposProtegidos = ['disciplina', 'doctrinario', 'militar', 'seguridad', 'comando'];
    if (ponderaciones) {
      for (const campo of camposProtegidos) {
        delete ponderaciones[campo];
      }
    }

    const currentInsc = await prisma.inscripcion.findUnique({
      where: { id: parseInt(id as string) },
      select: { ponderaciones: true }
    });

    const currentPonderaciones = (currentInsc?.ponderaciones as Record<string, any>) || {};
    const merged = { ...currentPonderaciones };

    for (const [k, v] of Object.entries(ponderaciones || {})) {
      if (!camposProtegidos.includes(k)) {
        merged[k] = v;
      }
    }

    const updated = await prisma.inscripcion.update({
      where: { id: parseInt(id as string) },
      data: {
        ponderaciones: merged
      }
    });
    
    res.json(updated);
  } catch (error) {
    console.error("Error al actualizar ponderaciones:", error);
    res.status(500).json({ error: 'Error al actualizar ponderaciones' });
  }
};

export const importarNominaExcel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { edicion_id, cursantes } = req.body;
    const targetEdicionId = parseInt(edicion_id as string);

    if (isNaN(targetEdicionId)) {
      res.status(400).json({ error: 'Debe seleccionar una edición válida' });
      return;
    }

    if (!Array.isArray(cursantes) || cursantes.length === 0) {
      res.status(400).json({ error: 'No se enviaron datos de cursantes para procesar' });
      return;
    }

    const edicion = await prisma.edicionDiplomado.findUnique({
      where: { id: targetEdicionId },
      include: {
        diplomado: {
          include: { materias: true }
        },
        periodo: true
      }
    });

    if (!edicion) {
      res.status(404).json({ error: 'Edición no encontrada' });
      return;
    }

    const nuevosCreados: any[] = [];
    const matriculadosExistentes: any[] = [];
    const omitidos: any[] = [];

    for (let i = 0; i < cursantes.length; i++) {
      const row = cursantes[i];
      const nombre = (row.nombre || '').toString().trim();
      const apellido = (row.apellido || '').toString().trim();
      const ci = row.ci ? row.ci.toString().trim() : null;
      const cm = row.cm ? row.cm.toString().trim() : null;
      let email = row.email ? row.email.toString().trim().toLowerCase() : null;
      const grado = row.grado ? row.grado.toString().trim() : null;
      const promocion = row.promocion ? row.promocion.toString().trim() : null;
      const telefono = row.telefono ? row.telefono.toString().trim() : null;

      if (!nombre && !apellido && !ci) {
        omitidos.push({ fila: i + 1, razon: 'Fila vacía o sin nombre/CI', nombre, ci });
        continue;
      }

      // 1. Buscar si el usuario ya existe en el sistema
      let existingUser = null;
      if (ci) {
        existingUser = await prisma.usuario.findFirst({ where: { ci } });
      }
      if (!existingUser && cm) {
        existingUser = await prisma.usuario.findFirst({ where: { cm } });
      }
      if (!existingUser && email) {
        existingUser = await prisma.usuario.findUnique({ where: { email } });
      }

      let userId: number;

      if (existingUser) {
        userId = existingUser.id;
        // Si al usuario existente le faltaban grado, cm, ci o promocion y en el excel vienen, actualizarlos
        const updates: any = {};
        if (!existingUser.grado && grado) updates.grado = grado;
        if (!existingUser.cm && cm) updates.cm = cm;
        if (!existingUser.ci && ci) updates.ci = ci;
        if (!existingUser.promocion && promocion) updates.promocion = promocion;

        if (Object.keys(updates).length > 0) {
          await prisma.usuario.update({
            where: { id: existingUser.id },
            data: updates
          });
        }
      } else {
        // 2. Crear el nuevo usuario
        if (!email) {
          const cleanCi = ci ? ci.replace(/[^a-zA-Z0-9]/g, '') : '';
          const cleanNom = nombre.toLowerCase().replace(/[^a-z0-9]/g, '');
          const cleanApe = apellido.toLowerCase().replace(/[^a-z0-9]/g, '');
          email = cleanCi ? `${cleanCi}@estudiante.mil.bo` : `${cleanNom}.${cleanApe}@estudiante.mil.bo`;
        }

        // Asegurar que el email sea único
        let finalEmail = email;
        let emailCounter = 1;
        while (await prisma.usuario.findUnique({ where: { email: finalEmail } })) {
          const [prefix, domain] = email.split('@');
          finalEmail = `${prefix}${emailCounter}@${domain || 'estudiante.mil.bo'}`;
          emailCounter++;
        }

        // Clave inicial: CI si existe y tiene al menos 4 caracteres, caso contrario 'Cursante.2026'
        const initialPass = ci && ci.length >= 4 ? ci : 'Cursante.2026';
        const hashedPassword = await bcrypt.hash(initialPass, 10);

        const createdUser = await prisma.usuario.create({
          data: {
            nombre: nombre || 'Cursante',
            apellido: apellido || 'Sin Apellido',
            email: finalEmail,
            password_hash: hashedPassword,
            grado,
            ci,
            cm,
            telefono,
            promocion,
            rol: 'CURSANTE',
            activo: true
          }
        });

        userId = createdUser.id;
        nuevosCreados.push({
          id: createdUser.id,
          nombre: createdUser.nombre,
          apellido: createdUser.apellido,
          grado: createdUser.grado,
          ci: createdUser.ci,
          email: createdUser.email
        });
      }

      // 3. Verificar si ya está matriculado en esta edición
      const existingInscripcion = await prisma.inscripcion.findUnique({
        where: {
          cursante_id_edicion_id: {
            cursante_id: userId,
            edicion_id: targetEdicionId
          }
        }
      });

      if (existingInscripcion) {
        omitidos.push({
          fila: i + 1,
          razon: 'Ya matriculado en este diplomado',
          nombre: `${grado || ''} ${nombre} ${apellido}`.trim(),
          ci
        });
        continue;
      }

      // 4. Matricular creando automáticamente sus materias
      await prisma.inscripcion.create({
        data: {
          cursante_id: userId,
          edicion_id: targetEdicionId,
          materias: {
            create: edicion.diplomado.materias.map(materia => ({
              materia_id: materia.id
            }))
          }
        }
      });

      if (existingUser) {
        matriculadosExistentes.push({
          id: existingUser.id,
          nombre: existingUser.nombre,
          apellido: existingUser.apellido,
          grado: existingUser.grado || grado,
          ci: existingUser.ci || ci
        });
      }
    }

    const totalInscritosNuevos = nuevosCreados.length + matriculadosExistentes.length;

    // Registrar en auditoría
    // @ts-ignore
    await eventosService.registrarEvento(
      (req as any).user?.userId || null,
      'CREAR',
      'INSCRIPCION',
      `Importación masiva Excel: ${totalInscritosNuevos} cursantes matriculados (${nuevosCreados.length} usuarios nuevos creados) en ${edicion.diplomado.nombre}`
    );

    res.status(201).json({
      message: `Proceso completado: ${totalInscritosNuevos} cursantes matriculados (${nuevosCreados.length} nuevos creados, ${matriculadosExistentes.length} existentes).`,
      totalProcesados: cursantes.length,
      nuevosCreados: nuevosCreados.length,
      matriculadosExistentes: matriculadosExistentes.length,
      omitidos: omitidos.length,
      detalles: {
        nuevos: nuevosCreados,
        existentes: matriculadosExistentes,
        omitidos
      }
    });
  } catch (error) {
    console.error('[Error en importarNominaExcel]:', error);
    res.status(500).json({ error: 'Error al procesar la nómina de Excel' });
  }
};

