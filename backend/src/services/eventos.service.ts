import { prisma } from '../prisma.js';

export interface EventoDataExtra {
  detalles?: string;
  ip?: string;
  severidad?: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA';
  dispositivo?: string;
  objeto_afectado?: string;
  valor_anterior?: any;
  valor_nuevo?: any;
  metadata?: any;
}

export const eventosService = {
  async registrarEvento(
    usuario_id: number | null,
    accion: string,
    entidad: string,
    detallesOpciones?: string | EventoDataExtra,
    opcionesExtra?: EventoDataExtra
  ) {
    try {
      let mensajeTexto = '';
      let extra: EventoDataExtra = {};

      if (typeof detallesOpciones === 'string') {
        mensajeTexto = detallesOpciones;
        if (opcionesExtra) extra = opcionesExtra;
      } else if (typeof detallesOpciones === 'object' && detallesOpciones !== null) {
        mensajeTexto = detallesOpciones.detalles || '';
        extra = detallesOpciones;
      }

      // Determinar severidad automática si no se especifica
      let severidad: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA' = extra.severidad || 'BAJA';
      const accionNorm = (accion || '').toUpperCase();
      const entidadNorm = (entidad || '').toUpperCase();

      if (!extra.severidad) {
        if (accionNorm === 'ELIMINAR' || entidadNorm === 'DISCIPLINA' || (entidadNorm === 'NOTA' && accionNorm === 'EDITAR')) {
          severidad = 'CRITICA';
        } else if (accionNorm === 'EDITAR' || accionNorm === 'IMPORTAR' || accionNorm === 'PASSWORD') {
          severidad = 'MEDIA';
        } else {
          severidad = 'BAJA';
        }
      }

      // Limpiar User-Agent largo para que sea legible
      let cleanDispositivo = extra.dispositivo || null;
      if (cleanDispositivo && cleanDispositivo.length > 70) {
        if (cleanDispositivo.includes('Windows')) cleanDispositivo = 'PC Windows / Navegador Web';
        else if (cleanDispositivo.includes('Android')) cleanDispositivo = 'Móvil Android';
        else if (cleanDispositivo.includes('iPhone') || cleanDispositivo.includes('iPad')) cleanDispositivo = 'Dispositivo iOS / Safari';
        else if (cleanDispositivo.includes('Macintosh')) cleanDispositivo = 'Mac OS / Navegador Web';
        else cleanDispositivo = cleanDispositivo.substring(0, 50) + '...';
      }

      const payloadDetalles = {
        mensaje: mensajeTexto,
        severidad,
        ip: extra.ip || null,
        dispositivo: cleanDispositivo,
        objeto_afectado: extra.objeto_afectado || null,
        valor_anterior: extra.valor_anterior !== undefined ? extra.valor_anterior : null,
        valor_nuevo: extra.valor_nuevo !== undefined ? extra.valor_nuevo : null,
        metadata: extra.metadata || null
      };

      await prisma.evento.create({
        data: {
          usuario_id,
          accion: accionNorm,
          entidad: entidadNorm,
          detalles: JSON.stringify(payloadDetalles)
        }
      });
    } catch (error) {
      console.error('Error al registrar evento:', error);
    }
  },

  async obtenerEventos() {
    const raw = await prisma.evento.findMany({
      orderBy: { fecha: 'desc' },
      include: {
        usuario: {
          select: { id: true, nombre: true, apellido: true, rol: true, grado: true, ci: true, cm: true }
        }
      },
      take: 350
    });

    return raw.map((ev) => {
      let parsedDetalles: any = null;
      let severidad: 'CRITICA' | 'MEDIA' | 'BAJA' = 'BAJA';
      let mensaje = ev.detalles || '-';
      let ip = null;
      let dispositivo = null;
      let objeto_afectado = null;
      let valor_anterior = null;
      let valor_nuevo = null;

      if (ev.detalles && ev.detalles.startsWith('{') && ev.detalles.endsWith('}')) {
        try {
          parsedDetalles = JSON.parse(ev.detalles);
          mensaje = parsedDetalles.mensaje || mensaje;
          severidad = parsedDetalles.severidad || severidad;
          ip = parsedDetalles.ip || null;
          dispositivo = parsedDetalles.dispositivo || null;
          objeto_afectado = parsedDetalles.objeto_afectado || null;
          valor_anterior = parsedDetalles.valor_anterior !== undefined ? parsedDetalles.valor_anterior : null;
          valor_nuevo = parsedDetalles.valor_nuevo !== undefined ? parsedDetalles.valor_nuevo : null;
        } catch {
          // Fallback a texto plano
        }
      } else {
        const accionNorm = (ev.accion || '').toUpperCase();
        const entidadNorm = (ev.entidad || '').toUpperCase();
        if (accionNorm === 'ELIMINAR' || entidadNorm === 'DISCIPLINA' || (entidadNorm === 'NOTA' && accionNorm === 'EDITAR')) {
          severidad = 'CRITICA';
        } else if (accionNorm === 'EDITAR' || accionNorm === 'IMPORTAR') {
          severidad = 'MEDIA';
        }
      }

      return {
        id: ev.id,
        fecha: ev.fecha,
        accion: ev.accion,
        entidad: ev.entidad,
        usuario: ev.usuario,
        mensaje,
        detalles_raw: ev.detalles,
        severidad,
        ip,
        dispositivo,
        objeto_afectado,
        valor_anterior,
        valor_nuevo
      };
    });
  }
};

