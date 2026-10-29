import type { Request, Response } from 'express';
import { eventosService } from '../services/eventos.service.js';

export const getEventos = async (req: Request, res: Response) => {
  try {
    const eventos = await eventosService.obtenerEventos();
    res.json(eventos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener eventos' });
  }
};

export const crearEvento = async (req: Request, res: Response) => {
  try {
    const { accion, entidad, detalles } = req.body;
    const usuarioId = (req as any).user?.userId; // asumiendo que el middleware auth.middleware adjunta el user

    if (!usuarioId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    await eventosService.registrarEvento(usuarioId, accion, entidad, detalles);
    res.status(201).json({ message: 'Evento registrado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar evento' });
  }
};
