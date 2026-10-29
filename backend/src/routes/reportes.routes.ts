import { Router } from 'express';
import { getEstadisticasGlobales, getEstadisticasAprobacion, getReporteCalificacionesRaw } from '../controllers/reportes.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.use(authenticateToken, requireRole(['ADMIN']));

router.get('/global', getEstadisticasGlobales);
router.get('/rendimiento', getEstadisticasAprobacion);
router.get('/calificaciones-raw', getReporteCalificacionesRaw);

export default router;
