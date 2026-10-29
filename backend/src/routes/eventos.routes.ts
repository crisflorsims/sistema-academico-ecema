import { Router } from 'express';
import { getEventos, crearEvento } from '../controllers/eventos.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

// Endpoint para obtener eventos (solo admin)
router.get('/', authenticateToken, requireRole(['ADMIN']), getEventos);

// Endpoint para registrar evento desde el frontend (cualquier rol autenticado puede registrar eventos propios)
router.post('/', authenticateToken, crearEvento);

export default router;
