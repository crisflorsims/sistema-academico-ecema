import type { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import type { AuthRequest } from '../middlewares/auth.middleware.js';
import { eventosService } from '../services/eventos.service.js';

export const verificarAntecedente = async (req: Request, res: Response): Promise<void> => {
  try {
    const { inscripcion_id, tipo, codigo_falta, fecha_referencia } = req.query;

    if (!inscripcion_id || !tipo || !codigo_falta) {
      res.json({ tiene_antecedente: false, antecedentes: [] });
      return;
    }

    const refDate = fecha_referencia ? new Date(String(fecha_referencia)) : new Date();
    const thirtyDaysAgo = new Date(refDate);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const previas = await prisma.demerito.findMany({
      where: {
        inscripcion_id: Number(inscripcion_id),
        tipo: tipo as any,
        OR: [
          { codigo_falta: String(codigo_falta) },
          { motivo: { startsWith: `${codigo_falta}.` } }
        ],
        AND: [
          {
            OR: [
              { fecha_falta: { gte: thirtyDaysAgo, lte: refDate } },
              { AND: [{ fecha_falta: null }, { fecha: { gte: thirtyDaysAgo, lte: refDate } }] }
            ]
          }
        ]
      },
      orderBy: { fecha: 'desc' }
    });

    res.json({
      tiene_antecedente: previas.length > 0,
      total_previas: previas.length,
      siguiente_nivel: previas.length + 1,
      antecedentes: previas.map(p => ({
        id: p.id,
        numero_boleta: p.numero_boleta,
        fecha: p.fecha,
        fecha_falta: p.fecha_falta,
        motivo: p.motivo,
        sancionador: p.sancionador,
        puntos_descontados: p.puntos_totales_descontados,
        nivel_reincidencia: p.nivel_reincidencia
      }))
    });
  } catch (error) {
    console.error('[Error al verificar antecedentes]:', error);
    res.status(500).json({ error: 'Error al verificar antecedentes' });
  }
};

export const registrarDemerito = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { 
      inscripcion_id, 
      tipo, 
      codigo_falta, 
      motivo, 
      puntos_base, 
      sancionador, 
      numero_boleta, 
      fecha_falta,
      es_reincidencia 
    } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    const inscripcion = await prisma.inscripcion.findUnique({
      where: { id: Number(inscripcion_id) },
      include: { cursante: true, edicion: { include: { diplomado: true } } }
    });

    if (!inscripcion) {
      res.status(404).json({ error: 'Inscripción no encontrada' });
      return;
    }

    // Regla de reincidencia por mismo código confirmada por el usuario
    let nivel_reincidencia = 1;

    if (es_reincidencia) {
      const fechaReferencia = fecha_falta ? new Date(fecha_falta) : new Date();
      const thirtyDaysAgo = new Date(fechaReferencia);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const faltasPrevias = await prisma.demerito.findMany({
        where: {
          inscripcion_id: Number(inscripcion_id),
          tipo: tipo,
          OR: [
            { codigo_falta: String(codigo_falta) },
            { motivo: { startsWith: `${codigo_falta}.` } }
          ],
          AND: [
            {
              OR: [
                { fecha_falta: { gte: thirtyDaysAgo, lte: fechaReferencia } },
                { AND: [{ fecha_falta: null }, { fecha: { gte: thirtyDaysAgo, lte: fechaReferencia } }] }
              ]
            }
          ]
        }
      });

      nivel_reincidencia = Math.max(2, faltasPrevias.length + 1);
    }

    const puntos_totales_descontados = Number(puntos_base) * nivel_reincidencia;

    const demerito = await prisma.demerito.create({
      data: {
        inscripcion_id: Number(inscripcion_id),
        reportador_id: userId,
        tipo,
        codigo_falta: codigo_falta ? String(codigo_falta).trim() : null,
        es_reincidencia: Boolean(es_reincidencia),
        motivo,
        puntos_base: Number(puntos_base),
        nivel_reincidencia,
        puntos_totales_descontados,
        sancionador: sancionador ? String(sancionador).trim() : null,
        numero_boleta: numero_boleta ? String(numero_boleta).trim() : null,
        fecha_falta: fecha_falta ? new Date(fecha_falta) : null
      }
    });

    const curNom = `${inscripcion.cursante.grado ? inscripcion.cursante.grado + ' ' : ''}${inscripcion.cursante.nombre} ${inscripcion.cursante.apellido}`;
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || req.ip || '127.0.0.1';
    const userAgent = (req.headers['user-agent'] as string) || 'Navegador Web';

    await eventosService.registrarEvento(
      userId,
      'CREAR',
      'DISCIPLINA',
      {
        detalles: `Registró demérito (${tipo} - N° ${codigo_falta}) al cursante ${curNom}. Boleta: ${numero_boleta || 'S/N'}. Descuento: -${puntos_totales_descontados} pts (Reincidencia: x${nivel_reincidencia}). Motivo: ${motivo}`,
        severidad: 'CRITICA',
        objeto_afectado: curNom,
        valor_anterior: '0 pts (Sin demérito)',
        valor_nuevo: `-${puntos_totales_descontados} pts (${tipo})`,
        ip: clientIp,
        dispositivo: userAgent,
        metadata: {
          tipo,
          codigo_falta,
          numero_boleta,
          puntos_descontados: puntos_totales_descontados,
          sancionador
        }
      }
    );

    res.json(demerito);
  } catch (error) {
    console.error('[Error en Controlador]:', error);
    res.status(500).json({ error: 'Error al registrar demérito' });
  }
};

export const getDisciplinaByInscripcion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const inscripcion = await prisma.inscripcion.findUnique({
      where: { id: Number(id) },
      include: {
        cursante: true,
        edicion: {
          include: {
            diplomado: true,
            periodo: true
          }
        }
      }
    });

    if (!inscripcion) {
      res.status(404).json({ error: 'Inscripción no encontrada' });
      return;
    }

    const demeritos = await prisma.demerito.findMany({
      where: { inscripcion_id: Number(id) },
      include: { reportador: { select: { nombre: true, apellido: true } } },
      orderBy: { fecha: 'desc' }
    });

    const puntosPerdidosTotal = demeritos.reduce((acc, curr) => acc + curr.puntos_totales_descontados, 0);

    const isDCEMA = inscripcion.edicion.diplomado.tipo === 'ANUAL';
    const maxPuntos = isDCEMA ? 100 : 50;
    const valorUnidad = isDCEMA ? 0.4 : 0.8;

    const puntosDisciplina = puntosPerdidosTotal * valorUnidad;

    res.json({
      inscripcion,
      demeritos,
      estadisticas: {
        maxPuntos,
        puntosPerdidosTotal,
        valorUnidad,
        puntosDisciplina,
        alerta: puntosDisciplina >= (isDCEMA ? 60 : 30),
        notificacion: puntosDisciplina >= (isDCEMA ? 80 : 40),
        riesgoSeparacion: puntosDisciplina >= maxPuntos
      }
    });
  } catch (error) {
    console.error('[Error en Controlador]:', error);
    res.status(500).json({ error: 'Error al obtener disciplina' });
  }
};

export const getAlertas = async (req: Request, res: Response): Promise<void> => {
  try {
    const inscripciones = await prisma.inscripcion.findMany({
      where: { estado: 'ACTIVO' },
      include: {
        cursante: true,
        edicion: { include: { diplomado: true } },
        demeritos: true
      }
    });

    const alertas = inscripciones.map(insc => {
      const puntosPerdidosTotal = insc.demeritos.reduce((acc, curr) => acc + curr.puntos_totales_descontados, 0);
      const isDCEMA = insc.edicion.diplomado.tipo === 'ANUAL';
      const maxPuntos = isDCEMA ? 100 : 50;
      const valorUnidad = isDCEMA ? 0.4 : 0.8;
      const puntosDisciplina = puntosPerdidosTotal * valorUnidad;

      return {
        inscripcion_id: insc.id,
        cursante: insc.cursante,
        diplomado: insc.edicion.diplomado.nombre,
        puntosPerdidosTotal,
        calificacionFinal: puntosDisciplina,
        minRequerido: maxPuntos,
        estado: puntosDisciplina >= maxPuntos ? 'SEPARACION' : (puntosDisciplina >= (isDCEMA ? 80 : 40) ? 'CRITICO' : (puntosDisciplina >= (isDCEMA ? 60 : 30) ? 'ALERTA' : 'NORMAL'))
      };
    }).filter(a => a.estado !== 'NORMAL');

    res.json(alertas);
  } catch (error) {
    console.error('[Error en Controlador]:', error);
    res.status(500).json({ error: 'Error al obtener alertas' });
  }
};

export const getHistorial = async (req: Request, res: Response): Promise<void> => {
  try {
    const historial = await prisma.demerito.findMany({
      include: {
        inscripcion: {
          include: {
            cursante: true,
            edicion: {
              include: { diplomado: true }
            }
          }
        },
        reportador: {
          select: { nombre: true, apellido: true }
        }
      },
      orderBy: { fecha: 'desc' },
      take: 50 // limit to last 50 for performance
    });

    const formatted = historial.map(d => ({
      id: d.id,
      inscripcion_id: d.inscripcion_id,
      fecha: d.fecha,
      fecha_falta: d.fecha_falta,
      numero_boleta: d.numero_boleta,
      codigo_falta: d.codigo_falta,
      es_reincidencia: d.es_reincidencia,
      cursante: `${d.inscripcion.cursante.grado} ${d.inscripcion.cursante.nombre} ${d.inscripcion.cursante.apellido}`,
      diplomado: d.inscripcion.edicion.diplomado.nombre,
      tipo: d.tipo,
      motivo: d.motivo,
      puntos_base: d.puntos_base,
      reincidencia: d.nivel_reincidencia,
      total_descontado: d.puntos_totales_descontados,
      reportador: d.reportador ? `${d.reportador.nombre} ${d.reportador.apellido}` : 'Sistema',
      sancionador: d.sancionador
    }));

    res.json(formatted);
  } catch (error) {
    console.error('[Error en Controlador Historial]:', error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
};

export const updateDemerito = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { 
      tipo, 
      codigo_falta, 
      motivo, 
      puntos_base, 
      sancionador, 
      numero_boleta, 
      fecha_falta, 
      es_reincidencia 
    } = req.body;
    
    const existing = await prisma.demerito.findUnique({ where: { id: Number(id) } });
    if (!existing) {
      res.status(404).json({ error: 'Demérito no encontrado' });
      return;
    }

    const reincidenciaConfirmada = es_reincidencia !== undefined ? Boolean(es_reincidencia) : existing.es_reincidencia;
    const nivel_reincidencia = reincidenciaConfirmada ? Math.max(2, existing.nivel_reincidencia) : 1;
    const puntos_totales_descontados = Number(puntos_base) * nivel_reincidencia;

    const updated = await prisma.demerito.update({
      where: { id: Number(id) },
      data: {
        tipo,
        codigo_falta: codigo_falta !== undefined ? (codigo_falta ? String(codigo_falta).trim() : null) : existing.codigo_falta,
        es_reincidencia: reincidenciaConfirmada,
        motivo,
        puntos_base: Number(puntos_base),
        nivel_reincidencia,
        puntos_totales_descontados,
        sancionador: sancionador !== undefined ? (sancionador ? String(sancionador).trim() : null) : existing.sancionador,
        numero_boleta: numero_boleta !== undefined ? (numero_boleta ? String(numero_boleta).trim() : null) : existing.numero_boleta,
        fecha_falta: fecha_falta !== undefined ? (fecha_falta ? new Date(fecha_falta) : null) : existing.fecha_falta
      }
    });
    
    await eventosService.registrarEvento(
      req.user?.userId!,
      'ACTUALIZAR',
      'DISCIPLINA',
      `Actualizó demérito ID ${id}`
    );

    res.json(updated);
  } catch (error) {
    console.error('[Error al actualizar demérito]:', error);
    res.status(500).json({ error: 'Error al actualizar demérito' });
  }
};

export const deleteDemerito = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const demeritoToDelete = await prisma.demerito.findUnique({
      where: { id: Number(id) },
      include: { inscripcion: { include: { cursante: true } } }
    });

    await prisma.demerito.delete({
      where: { id: Number(id) }
    });
    
    const curNom = demeritoToDelete?.inscripcion?.cursante 
      ? `${demeritoToDelete.inscripcion.cursante.grado ? demeritoToDelete.inscripcion.cursante.grado + ' ' : ''}${demeritoToDelete.inscripcion.cursante.nombre} ${demeritoToDelete.inscripcion.cursante.apellido}`
      : 'Cursante';

    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || req.ip || '127.0.0.1';
    const userAgent = (req.headers['user-agent'] as string) || 'Navegador Web';

    await eventosService.registrarEvento(
      req.user?.userId!,
      'ELIMINAR',
      'DISCIPLINA',
      {
        detalles: `Eliminó sanción disciplinaria (${demeritoToDelete?.tipo || 'Falta'} - Boleta: ${demeritoToDelete?.numero_boleta || 'S/N'}) del cursante ${curNom}. Puntos descontados restaurados: ${demeritoToDelete?.puntos_totales_descontados || 0} pts.`,
        severidad: 'CRITICA',
        objeto_afectado: curNom,
        valor_anterior: `${demeritoToDelete?.puntos_totales_descontados || 0} pts sanción`,
        valor_nuevo: '0 pts (Sanción Eliminada)',
        ip: clientIp,
        dispositivo: userAgent
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('[Error al eliminar demérito]:', error);
    res.status(500).json({ error: 'Error al eliminar demérito' });
  }
};
